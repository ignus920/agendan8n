<?php

namespace App\Jobs;

use App\Models\Contact;
use App\Services\LeadScoringService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class LeadScoreDecayJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Execute the job.
     */
    public function handle(LeadScoringService $scoringService): void
    {
        Log::info("Running LeadScoreDecayJob...");

        // Get contacts that are not customer and have been inactive (no updates in 3 days) and have some score
        $inactiveContacts = Contact::where('funnel_stage', '!=', 'customer')
            ->where('updated_at', '<', now()->subDays(3))
            ->where('lead_score', '>', 0)
            ->get();

        foreach ($inactiveContacts as $contact) {
            $previousScore = $contact->lead_score;
            // Decay by 10% or a minimum of 5 points
            $decayAmount = max(5, intval(round($previousScore * 0.1)));
            $newScore = max(0, $previousScore - $decayAmount);

            if ($previousScore !== $newScore) {
                $contact->update([
                    'lead_score' => $newScore
                ]);
                
                $level = match (true) {
                    $newScore >= 80 => 'hot',
                    $newScore >= 60 => 'high',
                    $newScore >= 40 => 'medium',
                    $newScore >= 20 => 'low',
                    default => 'unknown',
                };
                
                $contact->update(['interest_level' => $level]);

                event(new \App\Events\ContactScoreChanged($contact, $previousScore, $newScore));
                
                try {
                    // Trigger the lead_inactive event on the AutomationEngine to trigger any matching automations
                    app(\App\Services\AutomationEngine::class)->processEvent('lead_inactive', [
                        'tenant_id' => $contact->tenant_id,
                        'contact_id' => $contact->id,
                        'previous_score' => $previousScore,
                        'new_score' => $newScore
                    ], $contact);
                } catch (\Throwable $e) {
                    Log::error("Failed to run automation engine for contact decay {$contact->id}: {$e->getMessage()}");
                }
            }
        }
    }
}
