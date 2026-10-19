<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\DB;
use RuntimeException;
use Tests\TestCase;

class HealthTest extends TestCase
{
    public function test_health_checks_the_database_connection(): void
    {
        $this->getJson('/api/health')
            ->assertOk()
            ->assertExactJson(['status' => 'ok', 'database' => 'connected']);
    }

    public function test_database_failures_return_503_without_connection_details(): void
    {
        DB::shouldReceive('select')->once()->with('SELECT 1')
            ->andThrow(new RuntimeException('Private connection details'));

        $this->getJson('/api/health')
            ->assertStatus(503)
            ->assertExactJson(['status' => 'unavailable', 'database' => 'unavailable']);
    }
}
