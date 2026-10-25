<?php

namespace App\Http\Controllers;

use App\Models\Advertisement;
use App\Models\Business;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return response()->json(['data' => [
            'published_businesses' => Business::where('status', 'published')->count(),
            'draft_businesses' => Business::where('status', 'draft')->count(),
            'archived_businesses' => Business::where('status', 'archived')->count(),
            'active_advertisements' => Advertisement::active()->count(),
        ]])->header('Cache-Control', 'no-store');
    }
}
