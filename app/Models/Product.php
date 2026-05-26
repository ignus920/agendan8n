<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'description', 'price', 'duration_minutes',
        'repurchase_frequency_days', 'tags', 'images', 'is_featured',
        'status', 'sort_order', 'metadata',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'tags' => 'array',
        'images' => 'array',
        'metadata' => 'array',
        'is_featured' => 'boolean',
    ];

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    // Relationships
    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }

    // Helpers
    public function getFormattedPriceAttribute(): string
    {
        return '$' . number_format($this->price, 0, ',', '.');
    }

    public function getFirstImageAttribute(): ?string
    {
        return $this->images[0] ?? null;
    }
}
