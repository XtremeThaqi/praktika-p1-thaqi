<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CreateAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_users_are_not_administrators(): void
    {
        $user = User::factory()->create();

        $this->assertFalse($user->refresh()->is_admin);
    }

    public function test_command_creates_an_administrator_with_a_hashed_password(): void
    {
        $password = bin2hex(random_bytes(12));

        $this->artisan('admin:create')
            ->expectsQuestion('Name', 'Local administrator')
            ->expectsQuestion('Email', 'admin@example.test')
            ->expectsQuestion('Password', $password)
            ->expectsQuestion('Confirm password', $password)
            ->assertExitCode(0);

        $admin = User::where('email', 'admin@example.test')->firstOrFail();
        $this->assertTrue($admin->is_admin);
        $this->assertTrue(Hash::check($password, $admin->password));
        $this->assertNotSame($password, $admin->password);
    }
}
