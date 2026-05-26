<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactMemory extends Model
{
    use BelongsToTenant;

    protected $table = 'contact_memory';
    public $timestamps = false;

    protected $fillable = ['contact_id', 'tenant_id', 'key', 'value', 'updated_at'];

    protected $casts = ['updated_at' => 'datetime'];

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }
}
