<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use App\Models\Booking;
use App\Models\Automation;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        // Total contacts
        $totalContacts = Contact::count();

        // Hot contacts
        $hotContacts = Contact::where(function ($query) {
            $query->where('interest_level', 'hot')
                  ->orWhere('lead_score', '>=', 80);
        })->count();

        // Active bookings
        $activeBookingsCount = Booking::whereIn('status', ['pending', 'confirmed'])->count();

        // Bookings today
        $todayBookingsCount = Booking::whereDate('starts_at', today())->count();

        // Active automations
        $activeAutomationsCount = Automation::where('is_active', true)->count();

        // Average lead score
        $averageLeadScore = round(Contact::avg('lead_score') ?? 0);

        // Group contacts by funnel stage
        $funnelStats = Contact::select('funnel_stage', DB::raw('count(*) as count'))
            ->groupBy('funnel_stage')
            ->get()
            ->pluck('count', 'funnel_stage')
            ->toArray();

        // Fill in missing stages with 0
        $stages = ['new', 'interested', 'qualified', 'negotiation', 'customer', 'lost'];
        $funnelData = [];
        foreach ($stages as $stage) {
            $funnelData[$stage] = $funnelStats[$stage] ?? 0;
        }

        // Recent bookings (upcoming or recent)
        $recentBookings = Booking::with(['contact', 'resource', 'product'])
            ->orderBy('starts_at', 'asc')
            ->take(5)
            ->get();

        return Inertia::render('Dashboard', [
            'stats' => [
                'total_contacts' => $totalContacts,
                'hot_contacts' => $hotContacts,
                'active_bookings_count' => $activeBookingsCount,
                'today_bookings_count' => $todayBookingsCount,
                'active_automations_count' => $activeAutomationsCount,
                'average_lead_score' => $averageLeadScore,
            ],
            'funnelData' => $funnelData,
            'recentBookings' => $recentBookings,
        ]);
    }
}
