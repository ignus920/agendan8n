<?php

namespace App\Jobs;

use App\Models\Contact;
use App\Services\AutomationEngine;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class RepurchaseCheckJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Execute the job.
     */
    public function handle(AutomationEngine $automationEngine): void
    {
        Log::info("Running RepurchaseCheckJob...");

        // Select contacts where next_repurchase_at is in the past
        $contacts = Contact::whereNotNull('next_repurchase_at')
            ->where('next_repurchase_at', '<=', now())
            ->get();

        foreach ($contacts as $contact) {
            try {
                // Trigger repurchase_due event for the contact
                $automationEngine->processEvent('repurchase_due', [
                    'tenant_id' => $contact->tenant_id,
                    'contact_id' => $contact->id,
                    'whatsapp_phone' => $contact->whatsapp_phone,
                    'last_purchase_at' => $contact->last_purchase_at,
                    'next_repurchase_at' => $contact->next_repurchase_at,
                ], $contact);

                // Clear next_repurchase_at so it doesn't keep triggering every day
                $contact->update(['next_repurchase_at' => null]);

            } catch (\Throwable $e) {
                Log::error("Failed to process repurchase for contact {$contact->id}: {$e->getMessage()}");
            }
        }
    }
}
