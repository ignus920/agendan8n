<?php

namespace App\Services;

use App\Events\ContactScoreChanged;
use App\Models\Contact;
use App\Models\LeadScoringRule;
use Illuminate\Support\Facades\Log;

/**
 * LeadScoringService
 *
 * Hybrid scoring system combining configurable rules with optional AI analysis.
 */
class LeadScoringService
{
    public function __construct(protected AiService $aiService) {}

    /**
     * Process lead scoring based on an event.
     */
    public function processEvent(string $eventType, Contact $contact, array $payload = []): int
    {
        $previousScore = $contact->lead_score;
        $scoreDelta = 0;

        // 1. Apply rule-based scoring
        $rules = LeadScoringRule::withoutGlobalScope('tenant')
            ->where('tenant_id', $contact->tenant_id)
            ->forEvent($eventType)
            ->get();

        foreach ($rules as $rule) {
            if ($this->evaluateCondition($rule->condition, $payload, $contact)) {
                $scoreDelta += $rule->score_delta;
            }
        }

        // 2. Optional AI-based scoring adjustment
        if ($contact->tenant->ai_api_token && in_array($eventType, ['message_received', 'booking_created'])) {
            try {
                $aiScore = $this->aiService->scoreLeadContext($contact);
                $scoreDelta += $aiScore;
            } catch (\Throwable $e) {
                Log::warning("AI scoring failed for contact {$contact->id}: {$e->getMessage()}");
            }
        }

        // Apply score change
        if ($scoreDelta !== 0) {
            $newScore = max(0, min(100, $contact->lead_score + $scoreDelta));
            $contact->update(['lead_score' => $newScore]);

            // Update interest level based on score
            $this->updateInterestLevel($contact);

            event(new ContactScoreChanged($contact, $previousScore, $newScore));
        }

        return $contact->lead_score;
    }

    /**
     * Evaluate a scoring rule condition.
     */
    protected function evaluateCondition(array $condition, array $payload, Contact $contact): bool
    {
        if (empty($condition)) {
            return true;
        }

        foreach ($condition as $field => $expected) {
            $actual = data_get($payload, $field) ?? $contact->getAttribute($field);

            if (is_array($expected)) {
                if (!in_array($actual, $expected)) return false;
            } else {
                if ($actual != $expected) return false;
            }
        }

        return true;
    }

    /**
     * Auto-update interest level based on lead score thresholds.
     */
    protected function updateInterestLevel(Contact $contact): void
    {
        $score = $contact->lead_score;

        $level = match (true) {
            $score >= 80 => 'hot',
            $score >= 60 => 'high',
            $score >= 40 => 'medium',
            $score >= 20 => 'low',
            default => 'unknown',
        };

        if ($contact->interest_level !== $level) {
            $contact->update(['interest_level' => $level]);
        }
    }

    /**
     * Create default scoring rules for a new tenant.
     */
    public static function createDefaultRules(string $tenantId): void
    {
        $defaults = [
            ['name' => 'Solicita precio', 'event_type' => 'message_received', 'condition' => ['intent' => 'price_inquiry'], 'score_delta' => 10],
            ['name' => 'Agenda cita', 'event_type' => 'booking_created', 'condition' => [], 'score_delta' => 20],
            ['name' => 'Realiza compra', 'event_type' => 'purchase_created', 'condition' => [], 'score_delta' => 30],
            ['name' => 'Responde rápido', 'event_type' => 'message_received', 'condition' => ['response_time_minutes_lt' => 5], 'score_delta' => 5],
            ['name' => 'No responde en 7 días', 'event_type' => 'lead_inactive', 'condition' => [], 'score_delta' => -10],
            ['name' => 'Cancela cita', 'event_type' => 'booking_cancelled', 'condition' => [], 'score_delta' => -15],
        ];

        foreach ($defaults as $rule) {
            LeadScoringRule::create(array_merge($rule, ['tenant_id' => $tenantId]));
        }
    }
}
