<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Settlement;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AdminTaxonomyController extends Controller
{
    public function categories(Request $request): JsonResponse
    {
        return $this->listing($request, Category::class);
    }

    public function storeCategory(Request $request): JsonResponse
    {
        return $this->create($request, Category::class);
    }

    public function updateCategory(Request $request, Category $category): JsonResponse
    {
        return $this->rename($request, $category);
    }

    public function deleteCategory(Category $category): JsonResponse
    {
        return $this->deleteUnused($category);
    }

    public function settlements(Request $request): JsonResponse
    {
        return $this->listing($request, Settlement::class);
    }

    public function storeSettlement(Request $request): JsonResponse
    {
        return $this->create($request, Settlement::class);
    }

    public function updateSettlement(Request $request, Settlement $settlement): JsonResponse
    {
        return $this->rename($request, $settlement);
    }

    public function deleteSettlement(Settlement $settlement): JsonResponse
    {
        return $this->deleteUnused($settlement);
    }

    private function listing(Request $request, string $model): JsonResponse
    {
        $filters = $request->validate(['q' => ['sometimes', 'string', 'max:120']]);
        $query = $model::withCount('businesses');
        if (filled($filters['q'] ?? null)) {
            $term = '%'.str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower(trim($filters['q']))).'%';
            $query->whereRaw("LOWER(name) LIKE ? ESCAPE '!'", [$term]);
        }

        return response()->json(['data' => $query->orderBy('name')->orderBy('id')->get(['id', 'name', 'slug'])])
            ->header('Cache-Control', 'no-store');
    }

    private function create(Request $request, string $model): JsonResponse
    {
        $name = $this->validatedName($request, $model);
        $base = Str::slug($name);
        $slug = $base;
        $number = 2;
        while ($model::where('slug', $slug)->exists()) {
            $slug = $base.'-'.$number++;
        }

        try {
            $item = $model::create(['name' => $name, 'slug' => $slug]);
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages(['name' => 'Ky emër ose adresë URL është tashmë në përdorim.']);
        }

        return $this->itemResponse($item, 201);
    }

    private function rename(Request $request, Model $item): JsonResponse
    {
        $name = $this->validatedName($request, $item::class, $item->id);
        try {
            $item->update(['name' => $name]);
        } catch (UniqueConstraintViolationException) {
            throw ValidationException::withMessages(['name' => 'Ky emër është tashmë në përdorim.']);
        }

        return $this->itemResponse($item);
    }

    private function deleteUnused(Model $item): JsonResponse
    {
        if ($item->businesses()->exists()) {
            return response()->json(['message' => 'Ky zë nuk mund të fshihet sepse përdoret nga biznese.'], 409);
        }

        try {
            $item->delete();
        } catch (QueryException $exception) {
            if ($item->businesses()->exists()) {
                return response()->json(['message' => 'Ky zë nuk mund të fshihet sepse përdoret nga biznese.'], 409);
            }
            throw $exception;
        }

        return response()->json(['message' => 'Zëri u fshi.'])->header('Cache-Control', 'no-store');
    }

    private function validatedName(Request $request, string $model, ?int $exceptId = null): string
    {
        $data = $request->validate(['name' => ['required', 'string', 'min:2', 'max:120']]);
        $name = Str::squish($data['name']);
        if (mb_strlen($name) < 2 || mb_strlen($name) > 120 || ! Str::slug($name)) {
            throw ValidationException::withMessages(['name' => 'Shkruani një emër të vlefshëm me të paktën dy karaktere.']);
        }

        $duplicate = $model::whereRaw('LOWER(name) = ?', [mb_strtolower($name)]);
        if ($exceptId) {
            $duplicate->where('id', '!=', $exceptId);
        }
        if ($duplicate->exists()) {
            throw ValidationException::withMessages(['name' => 'Ky emër është tashmë në përdorim.']);
        }

        return $name;
    }

    private function itemResponse(Model $item, int $status = 200): JsonResponse
    {
        $item->loadCount('businesses');

        return response()->json(['data' => $item->only('id', 'name', 'slug', 'businesses_count')], $status)
            ->header('Cache-Control', 'no-store');
    }
}
