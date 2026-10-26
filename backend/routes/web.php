<?php

use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\AdminBusinessController;
use App\Http\Controllers\AdminDashboardController;
use App\Http\Controllers\AdminTaxonomyController;
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

        Route::get('/categories', [AdminTaxonomyController::class, 'categories']);
        Route::post('/categories', [AdminTaxonomyController::class, 'storeCategory']);
        Route::put('/categories/{category}', [AdminTaxonomyController::class, 'updateCategory']);
        Route::delete('/categories/{category}', [AdminTaxonomyController::class, 'deleteCategory']);

        Route::get('/settlements', [AdminTaxonomyController::class, 'settlements']);
        Route::post('/settlements', [AdminTaxonomyController::class, 'storeSettlement']);
        Route::put('/settlements/{settlement}', [AdminTaxonomyController::class, 'updateSettlement']);
        Route::delete('/settlements/{settlement}', [AdminTaxonomyController::class, 'deleteSettlement']);

        Route::get('/services', [AdminTaxonomyController::class, 'services']);
        Route::post('/services', [AdminTaxonomyController::class, 'storeService']);
        Route::put('/services/{service}', [AdminTaxonomyController::class, 'updateService']);
        Route::delete('/services/{service}', [AdminTaxonomyController::class, 'deleteService']);
    });
});
