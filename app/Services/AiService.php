<?php

namespace App\Services;

use App\Models\Contact;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * AiService
 *
 * AI integration via OpenRouter for lead scoring, intent classification,
 * conversation summaries, and response suggestions.
 * Each tenant configures their own API token and preferred model.
 */
class AiService
{
    protected string $apiKey;
    protected string $model;
    protected string $baseUrl;

    public function __construct(?string $apiKey = null, ?string $model = null)
    {
        $this->apiKey = $apiKey ?? config('services.openrouter.api_key', '');
        $this->model = $model ?? config('services.openrouter.model', 'google/gemini-2.0-flash');
        $this->baseUrl = config('services.openrouter.base_url', 'https://openrouter.ai/api/v1');
    }

    /**
     * Classify the commercial intent of a message.
     */
    public function classifyIntent(Contact $contact, string $message): array
    {
        $prompt = <<<PROMPT
        Eres un asistente de clasificación comercial. Analiza el siguiente mensaje de un cliente
        y clasifica su intención comercial.

        Contexto del contacto:
        - Nombre: {$contact->name}
        - Estado embudo: {$contact->funnel_stage}
        - Score: {$contact->lead_score}
        - Último producto: {$contact->lastProduct?->name}

        Mensaje: "{$message}"

        Responde SOLO en JSON con este formato:
        {
            "intent": "price_inquiry|booking_request|complaint|support|general|purchase_intent|objection|reactivation",
            "confidence": 0.0-1.0,
            "sentiment": "positive|neutral|negative",
            "suggested_action": "breve descripción de la acción sugerida",
            "keywords": ["palabras clave detectadas"]
        }
        PROMPT;

        $response = $this->chat($prompt);
        return $this->parseJsonResponse($response);
    }

    /**
     * Score a lead based on conversational context.
     */
    public function scoreLeadContext(Contact $contact): int
    {
        $memory = $contact->memory()->pluck('value', 'key')->toArray();
        $recentInteractions = $contact->interactions()
            ->latest()
            ->take(5)
            ->get()
            ->map(fn ($i) => "{$i->direction}: {$i->content}")
            ->join("\n");

        $prompt = <<<PROMPT
        Eres un sistema de lead scoring. Evalúa el potencial comercial de este contacto.

        Datos:
        - Nombre: {$contact->name}
        - Estado: {$contact->funnel_stage}
        - Score actual: {$contact->lead_score}
        - Memoria: {$this->formatArray($memory)}

        Últimas interacciones:
        {$recentInteractions}

        Responde SOLO con un número entero entre -10 y +10 representando el ajuste de score sugerido.
        Positivo = más probable que compre. Negativo = menos probable.
        PROMPT;

        $response = $this->chat($prompt);
        $score = (int) trim($response);
        return max(-10, min(10, $score));
    }

    /**
     * Generate a conversation summary for a contact.
     */
    public function summarizeConversation(Contact $contact): string
    {
        $interactions = $contact->interactions()
            ->latest()
            ->take(20)
            ->get()
            ->reverse()
            ->map(fn ($i) => "[{$i->direction}] {$i->content}")
            ->join("\n");

        if (empty($interactions)) {
            return 'Sin conversaciones recientes.';
        }

        $prompt = <<<PROMPT
        Resume la siguiente conversación comercial en máximo 3 oraciones.
        Incluye: interés del cliente, productos mencionados, objeciones y estado general.

        Conversación:
        {$interactions}
        PROMPT;

        return $this->chat($prompt);
    }

    /**
     * Suggest a response for an advisor.
     */
    public function suggestResponse(Contact $contact, string $lastMessage): string
    {
        $prompt = <<<PROMPT
        Eres un asesor comercial experto. Sugiere una respuesta profesional y amigable
        para el siguiente mensaje de un cliente.

        Cliente: {$contact->name} (Estado: {$contact->funnel_stage})
        Mensaje del cliente: "{$lastMessage}"

        La respuesta debe ser concisa, natural y orientada a avanzar en el proceso comercial.
        Máximo 2 oraciones.
        PROMPT;

        return $this->chat($prompt);
    }

    /**
     * Make a chat completion request to OpenRouter.
     */
    protected function chat(string $prompt): string
    {
        if (empty($this->apiKey)) {
            throw new \RuntimeException('AI API key not configured');
        }

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$this->apiKey}",
            'Content-Type' => 'application/json',
        ])->timeout(30)->post("{$this->baseUrl}/chat/completions", [
            'model' => $this->model,
            'messages' => [
                ['role' => 'user', 'content' => $prompt],
            ],
            'temperature' => 0.3,
            'max_tokens' => 500,
        ]);

        if ($response->failed()) {
            Log::error('AI request failed', ['status' => $response->status(), 'body' => $response->body()]);
            throw new \RuntimeException("AI request failed: {$response->status()}");
        }

        return $response->json('choices.0.message.content', '');
    }

    protected function parseJsonResponse(string $response): array
    {
        // Extract JSON from response (may have markdown code blocks)
        if (preg_match('/\{[\s\S]*\}/', $response, $matches)) {
            return json_decode($matches[0], true) ?? [];
        }
        return [];
    }

    protected function formatArray(array $data): string
    {
        return collect($data)->map(fn ($v, $k) => "{$k}: {$v}")->join(', ');
    }
}
