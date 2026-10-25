<?php

use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\AdminBusinessController;
use App\Http\Controllers\AdminDashboardController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['name' => config('app.name')]);
});

Route::prefix('api/admin')->group(function () {
    Route::post('/login', [AdminAuthController::class, 'login'])->middleware('throttle:5,1');

    Route::middleware(['auth:sanctum', 'admin'])->group(function () {
        Route::get('/me', [AdminAuthController::class, 'current']);
        Route::post('/logout', [AdminAuthController::class, 'logout']);
        Route::get('/dashboard', AdminDashboardController::class);
        Route::get('/businesses', [AdminBusinessController::class, 'index']);
        Route::get('/businesses/{business}', [AdminBusinessController::class, 'show']);
        Route::post('/businesses', [AdminBusinessController::class, 'store']);
        Route::put('/businesses/{business}', [AdminBusinessController::class, 'update']);
        Route::patch('/businesses/{business}/publish', [AdminBusinessController::class, 'publish']);
        Route::patch('/businesses/{business}/archive', [AdminBusinessController::class, 'archive']);
        Route::post('/businesses/{business}/images', [AdminBusinessController::class, 'uploadImage']);
        Route::delete('/businesses/{business}/images/{image}', [AdminBusinessController::class, 'deleteImage']);
    });
});
