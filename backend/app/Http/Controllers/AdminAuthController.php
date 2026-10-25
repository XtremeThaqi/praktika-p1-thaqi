<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminAuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt([...$credentials, 'is_admin' => true])) {
            return response()->json(['message' => 'Emaili ose fjalëkalimi nuk është i saktë.'], 422);
        }

        $request->session()->regenerate();

        return response()->json(['user' => $request->user()->only('name', 'email')])
            ->header('Cache-Control', 'no-store');
    }

    public function current(Request $request): JsonResponse
    {
        return response()->json(['user' => $request->user()->only('name', 'email')])
            ->header('Cache-Control', 'no-store');
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        Auth::guard('sanctum')->forgetUser();

        return response()->json(['message' => 'Dola nga paneli.'])
            ->header('Cache-Control', 'no-store');
    }
}
