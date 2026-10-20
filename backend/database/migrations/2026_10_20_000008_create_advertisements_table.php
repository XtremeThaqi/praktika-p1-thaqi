<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('advertisements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->string('image_path');
            $table->string('alt_text');
            $table->string('destination', 2048);
            $table->enum('placement', ['home_banner', 'results_sidebar']);
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->unsignedSmallInteger('priority')->default(0);
            $table->boolean('is_active')->default(false);
            $table->timestamps();

            $table->index(['placement', 'is_active', 'starts_at', 'ends_at'], 'advertisements_schedule_index');
        });
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE advertisements
                ADD CONSTRAINT advertisements_dates_check CHECK (ends_at > starts_at)');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('advertisements');
    }
};
