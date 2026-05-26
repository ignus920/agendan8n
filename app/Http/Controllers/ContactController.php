<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use Inertia\Inertia;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    public function index(Request $request)
    {
        $contacts = Contact::with(['assignedUser', 'lastProduct'])
            ->orderByDesc('lead_score')
            ->get();

        return Inertia::render('Contacts/Index', [
            'contacts' => $contacts
        ]);
    }
}
