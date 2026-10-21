<?php

use App\Http\Controllers\BusinessController;
use App\Http\Controllers\HealthController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);
Route::get('/businesses', [BusinessController::class, 'index'])->name('businesses.index');
Route::get('/businesses/{slug}', [BusinessController::class, 'show'])->name('businesses.show');
