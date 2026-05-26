<?php

namespace App\Models;

use App\Events\PurchaseCreated;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Purchase extends Model
{
    use BelongsToTenant;

    public $timestamps = false;

    protected $fillable = [
        'tenant_id', 'contact_id', 'product_id', 'booking_id',
        'amount', 'purchased_at', 'next_repurchase_at',
        'repurchase_status', 'metadata', 'created_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'metadata' => 'array',
        'purchased_at' => 'datetime',
        'next_repurchase_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    protected $dispatchesEvents = [
        'created' => PurchaseCreated::class,
    ];

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    /**
     * Calculate and set the next repurchase date based on product frequency.
     */
    public function calculateNextRepurchase(): void
    {
        if ($this->product && $this->product->repurchase_frequency_days) {
            $this->next_repurchase_at = $this->purchased_at
                ->addDays($this->product->repurchase_frequency_days);
            $this->save();
        }
    }

    public function scopeRepurchaseDue($query)
    {
        return $query->where('repurchase_status', 'pending')
            ->whereNotNull('next_repurchase_at')
            ->where('next_repurchase_at', '<=', now());
    }
}
