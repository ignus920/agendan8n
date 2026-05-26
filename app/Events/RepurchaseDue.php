<?php

namespace App\Events;

use App\Models\Contact;
use App\Models\Purchase;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RepurchaseDue
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Contact $contact,
        public Purchase $purchase
    ) {}
}
