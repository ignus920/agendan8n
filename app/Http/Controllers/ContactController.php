<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use Inertia\Inertia;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function index(Request $request)
    {
        $contacts = Contact::with(['assignedUser', 'lastProduct', 'automationLogs'])
            ->orderByDesc('lead_score')
            ->get();

        return Inertia::render('Contacts/Index', [
            'contacts' => $contacts
        ]);
    }

    public function update(Request $request, Contact $contact)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'whatsapp_phone' => 'nullable|string|max:20',
            'funnel_stage' => 'required|string|in:new,interested,qualified,negotiation,customer,lost',
            'interest_level' => 'required|string|in:unknown,low,medium,high,hot',
            'tags' => 'nullable|array',
            'tags.*' => 'string',
        ]);

        $contact->update($validated);

        return redirect()->back()->with('success', 'Contacto actualizado exitosamente.');
    }
}
