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

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    Route::get('/contacts', [ContactController::class, 'index'])->name('contacts.index');
    Route::get('/bookings', [BookingController::class, 'index'])->name('bookings.index');
    Route::patch('/bookings/{booking}', [BookingController::class, 'update'])->name('bookings.update');
    Route::get('/settings/automations', [AutomationController::class, 'index'])->name('settings.automations');
    
    // Nuevas rutas CRUD en React/Inertia
    Route::resource('products', ProductController::class)->except(['create', 'show', 'edit']);
    Route::resource('resources', ResourceController::class)->except(['create', 'show', 'edit']);
    Route::resource('campaigns', CampaignController::class)->except(['create', 'show', 'edit']);
    Route::post('campaigns/{campaign}/send', [CampaignController::class, 'send'])->name('campaigns.send');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';

