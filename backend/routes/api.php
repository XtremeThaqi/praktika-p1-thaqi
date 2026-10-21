<?php

use App\Http\Controllers\AdvertisementController;
use App\Http\Controllers\BusinessController;
use App\Http\Controllers\DirectoryLookupController;
use App\Http\Controllers\HealthController;
use Illuminate\Support\Facades\Route;

Route::get('/health', HealthController::class);
Route::get('/businesses', [BusinessController::class, 'index'])->name('businesses.index');
Route::get('/businesses/{slug}', [BusinessController::class, 'show'])->name('businesses.show');
Route::get('/categories', [DirectoryLookupController::class, 'categories']);
Route::get('/settlements', [DirectoryLookupController::class, 'settlements']);
Route::get('/services', [DirectoryLookupController::class, 'services']);
Route::get('/advertisements', [AdvertisementController::class, 'index']);
