<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Resource;
use App\Models\Product;
use Inertia\Inertia;
use Illuminate\Http\Request;

class BookingController extends Controller
{
    public function index(Request $request)
    {
        $bookings = Booking::with(['contact', 'resource', 'product', 'assignedUser'])
            ->orderBy('starts_at')
            ->get();

        $resources = Resource::where('is_active', true)->get();
        $products = Product::where('status', 'active')->get();

        return Inertia::render('Bookings/Index', [
            'bookings' => $bookings,
            'resources' => $resources,
            'products' => $products
        ]);
    }

    public function update(Request $request, Booking $booking)
    {
        $validated = $request->validate([
            'starts_at' => 'required|date',
            'ends_at' => 'required|date|after:starts_at',
        ]);

        $booking->update($validated);

        return redirect()->back()->with('success', 'Reserva actualizada con éxito.');
    }
}
