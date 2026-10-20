<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_hours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('business_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('day_of_week')->comment('0 = Sunday, 6 = Saturday');
            $table->time('opens_at')->nullable();
            $table->time('closes_at')->nullable();
            $table->boolean('is_closed')->default(false);
            $table->unique(['business_id', 'day_of_week']);
            $table->timestamps();
        });
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE business_hours
                ADD CONSTRAINT business_hours_day_check CHECK (day_of_week BETWEEN 0 AND 6),
                ADD CONSTRAINT business_hours_times_check CHECK (
                    (is_closed = 1 AND opens_at IS NULL AND closes_at IS NULL)
                    OR (is_closed = 0 AND opens_at IS NOT NULL AND closes_at IS NOT NULL
                        AND opens_at <> closes_at)
                )');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('business_hours');
    }
};
