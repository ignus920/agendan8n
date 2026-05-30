<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Concerns\BelongsToTenant;

class VisualFlow extends Model
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'name',
        'description',
        'flow_data',
        'is_active',
    ];

    protected $casts = [
        'flow_data' => 'array',
        'is_active' => 'boolean',
    ];
}
