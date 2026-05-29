<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\AutomationController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ResourceController;
use App\Http\Controllers\CampaignController;
use App\Http\Controllers\SuperAdminController;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Tenant-scoped routes: require auth + tenant context (auto-resolved from user or impersonation)
Route::middleware(['auth', 'verified', 'tenant'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    Route::get('/contacts', [ContactController::class, 'index'])->name('contacts.index');
    Route::put('/contacts/{contact}', [ContactController::class, 'update'])->name('contacts.update');
    Route::get('/bookings', [BookingController::class, 'index'])->name('bookings.index');
    Route::patch('/bookings/{booking}', [BookingController::class, 'update'])->name('bookings.update');
    Route::get('/settings/automations', [AutomationController::class, 'index'])->name('settings.automations');
    Route::post('/settings/automations/simulate', [AutomationController::class, 'simulate'])->name('settings.automations.simulate');
    Route::post('/settings/automations', [AutomationController::class, 'store'])->name('settings.automations.store');
    Route::put('/settings/automations/{id}', [AutomationController::class, 'update'])->name('settings.automations.update');
    Route::delete('/settings/automations/{id}', [AutomationController::class, 'destroy'])->name('settings.automations.destroy');
    
    // CRUD en React/Inertia
    Route::resource('products', ProductController::class)->except(['create', 'show', 'edit']);
    Route::resource('resources', ResourceController::class)->except(['create', 'show', 'edit']);
    Route::resource('campaigns', CampaignController::class)->except(['create', 'show', 'edit']);
    Route::post('campaigns/{campaign}/send', [CampaignController::class, 'send'])->name('campaigns.send');
});

// Super Admin Routes (no tenant middleware - super_admin operates across tenants)
Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/ticsia/tenants', [SuperAdminController::class, 'index'])->name('ticsia.tenants.index');
    Route::post('/ticsia/tenants', [SuperAdminController::class, 'store'])->name('ticsia.tenants.store');
    Route::patch('/ticsia/tenants/{tenant}', [SuperAdminController::class, 'update'])->name('ticsia.tenants.update');
    Route::post('/ticsia/impersonate/{tenant}', [SuperAdminController::class, 'impersonate'])->name('ticsia.impersonate');
    Route::post('/ticsia/stop-impersonating', [SuperAdminController::class, 'stopImpersonating'])->name('ticsia.stop-impersonating');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
