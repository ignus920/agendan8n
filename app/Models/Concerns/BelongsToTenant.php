<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Trait BelongsToTenant
 *
 * Automatically scopes all queries to the current tenant.
 * Also auto-assigns tenant_id on model creation.
 */
trait BelongsToTenant
{
    protected static function bootBelongsToTenant(): void
    {
        // Global scope: filter all queries by tenant_id
        static::addGlobalScope('tenant', function (Builder $builder) {
            $tenantId = static::resolveCurrentTenantId();

            if ($tenantId) {
                $builder->where(
                    $builder->getModel()->getTable() . '.tenant_id',
                    $tenantId
                );
            }
        });

        // Auto-assign tenant_id on creation
        static::creating(function (Model $model) {
            if (empty($model->tenant_id)) {
                $tenantId = static::resolveCurrentTenantId();
                if ($tenantId) {
                    $model->tenant_id = $tenantId;
                }
            }
        });
    }

    /**
     * Resolve the current tenant ID from auth context or app binding.
     */
    protected static function resolveCurrentTenantId(): ?string
    {
        // First check app-level binding (set by middleware for API/webhook requests)
        if (app()->bound('current_tenant_id')) {
            return app('current_tenant_id');
        }

        // Fall back to authenticated user's tenant (only if user is already resolved to prevent infinite recursion)
        if (auth()->hasUser()) {
            return auth()->user()->tenant_id;
        }

        return null;
    }

    /**
     * Scope to a specific tenant (for admin/cross-tenant operations).
     */
    public function scopeForTenant(Builder $query, string $tenantId): Builder
    {
        return $query->withoutGlobalScope('tenant')
            ->where($this->getTable() . '.tenant_id', $tenantId);
    }

    /**
     * Remove tenant scope (for super-admin operations).
     */
    public function scopeWithoutTenantScope(Builder $query): Builder
    {
        return $query->withoutGlobalScope('tenant');
    }

    /**
     * Relationship to tenant.
     */
    public function tenant()
    {
        return $this->belongsTo(\App\Models\Tenant::class);
    }
}
