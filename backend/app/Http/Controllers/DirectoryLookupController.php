<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Service;
use App\Models\Settlement;
use Illuminate\Http\JsonResponse;

class DirectoryLookupController extends Controller
{
    public function categories(): JsonResponse
    {
        return response()->json(['data' => Category::orderBy('name')->orderBy('id')->get(['id', 'name', 'slug'])]);
    }

    public function settlements(): JsonResponse
    {
        return response()->json(['data' => Settlement::orderBy('name')->orderBy('id')->get(['id', 'name', 'slug'])]);
    }

    public function services(): JsonResponse
    {
        return response()->json(['data' => Service::orderBy('name')->orderBy('id')->get(['id', 'name', 'slug'])]);
    }
}
