<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->string('path');
            $table->string('alt_text');
            $table->enum('kind', ['logo', 'gallery'])->default('gallery');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->unique(['business_id', 'sort_order']);
            $table->timestamps();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('business_images');
    }
};
