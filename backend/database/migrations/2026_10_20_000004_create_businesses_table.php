<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('businesses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->nullable()->constrained()->restrictOnDelete();
            $table->foreignId('settlement_id')->nullable()->constrained()->restrictOnDelete();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->string('address')->nullable();
            $table->string('phone', 40)->nullable();
            $table->string('email')->nullable();
            $table->string('website', 2048)->nullable();
            $table->json('social_links')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->boolean('location_verified')->default(false);
            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_demo')->default(false);
            $table->timestamps();

            $table->index(['status', 'name']);
            $table->index(['category_id', 'status']);
            $table->index(['settlement_id', 'status']);
        });
        // SQLite tests cover relationships; the MySQL suite also exercises these checks.
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE businesses ADD CONSTRAINT businesses_coordinates_check CHECK (
                (latitude IS NULL AND longitude IS NULL)
                OR (latitude IS NOT NULL AND longitude IS NOT NULL
                    AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
            )');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('businesses');
    }
};
