<?php

namespace App\Providers;

use App\Events\BookingCreated;
use App\Services\AutomationEngine;
use App\Services\LeadScoringService;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Listen for booking created events to trigger automations and lead scoring
        Event::listen(BookingCreated::class, function (BookingCreated $event) {
            $booking = $event->booking;
            $contact = $booking->contact;

            if ($contact) {
                // Run lead scoring
                $leadScoring = app(LeadScoringService::class);
                $leadScoring->processEvent('booking_created', $contact, ['booking' => $booking]);
            }

            // Run automation engine
            $automationEngine = app(AutomationEngine::class);
            $automationEngine->processEvent('booking_created', [
                'tenant_id' => $booking->tenant_id,
                'event_type' => 'booking_created',
                'booking' => $booking,
            ], $contact);
        });
    }
}
