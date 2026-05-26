<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Jobs\LeadScoreDecayJob;
use App\Jobs\RepurchaseCheckJob;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::job(new LeadScoreDecayJob)->daily();
Schedule::job(new RepurchaseCheckJob)->daily();
