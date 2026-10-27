<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            Schema::table('advertisements', function (Blueprint $table) {
                $table->string('destination', 2048)->nullable()->change();
            });
        } elseif (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF');
            Schema::create('advertisements_new', function (Blueprint $table) {
                $table->id();
                $table->foreignId('business_id')->constrained()->cascadeOnDelete();
                $table->string('image_path');
                $table->string('alt_text');
                $table->string('destination', 2048)->nullable();
                $table->enum('placement', ['home_banner', 'results_sidebar']);
                $table->dateTime('starts_at');
                $table->dateTime('ends_at');
                $table->unsignedSmallInteger('priority')->default(0);
                $table->boolean('is_active')->default(false);
                $table->timestamps();
                $table->index(['placement', 'is_active', 'starts_at', 'ends_at'], 'advertisements_day10_schedule_index');
            });
            DB::statement('INSERT INTO advertisements_new (id, business_id, image_path, alt_text, destination, placement, starts_at, ends_at, priority, is_active, created_at, updated_at) SELECT id, business_id, image_path, alt_text, destination, placement, starts_at, ends_at, priority, is_active, created_at, updated_at FROM advertisements');
            Schema::drop('advertisements');
            Schema::rename('advertisements_new', 'advertisements');
            Schema::table('advertisements', function (Blueprint $table) {
                $table->dropIndex('advertisements_day10_schedule_index');
                $table->index(['placement', 'is_active', 'starts_at', 'ends_at'], 'advertisements_schedule_index');
            });
            DB::statement('PRAGMA foreign_keys = ON');
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            Schema::table('advertisements', function (Blueprint $table) {
                $table->string('destination', 2048)->nullable(false)->change();
            });
        } elseif (DB::getDriverName() === 'sqlite') {
            if (DB::table('advertisements')->whereNull('destination')->exists()) {
                throw new RuntimeException('Cannot roll back nullable advertisement destinations while null values exist.');
            }
            $this->rebuildSqlite(false);
        }
    }

    private function rebuildSqlite(bool $nullable): void
    {
        DB::statement('PRAGMA foreign_keys = OFF');
        try {
            Schema::create('advertisements_new', function (Blueprint $table) use ($nullable) {
                $table->id();
                $table->foreignId('business_id')->constrained()->cascadeOnDelete();
                $table->string('image_path');
                $table->string('alt_text');
                $table->string('destination', 2048)->nullable($nullable);
                $table->enum('placement', ['home_banner', 'results_sidebar']);
                $table->dateTime('starts_at');
                $table->dateTime('ends_at');
                $table->unsignedSmallInteger('priority')->default(0);
                $table->boolean('is_active')->default(false);
                $table->timestamps();
                $table->index(['placement', 'is_active', 'starts_at', 'ends_at'], 'advertisements_day10_schedule_index');
            });
            DB::statement('INSERT INTO advertisements_new (id, business_id, image_path, alt_text, destination, placement, starts_at, ends_at, priority, is_active, created_at, updated_at) SELECT id, business_id, image_path, alt_text, destination, placement, starts_at, ends_at, priority, is_active, created_at, updated_at FROM advertisements');
            Schema::drop('advertisements');
            Schema::rename('advertisements_new', 'advertisements');
            Schema::table('advertisements', function (Blueprint $table) {
                $table->dropIndex('advertisements_day10_schedule_index');
                $table->index(['placement', 'is_active', 'starts_at', 'ends_at'], 'advertisements_schedule_index');
            });
        } finally {
            DB::statement('PRAGMA foreign_keys = ON');
        }
    }
};
