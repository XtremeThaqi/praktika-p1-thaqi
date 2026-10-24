<?php

namespace Tests\Feature;

use App\Models\Advertisement;
use App\Models\Business;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    private string $adminPassword;

    private function administrator(): User
    {
        $this->adminPassword = bin2hex(random_bytes(12));
        $user = User::factory()->create(['password' => $this->adminPassword]);
        $user->is_admin = true;
        $user->save();

        return $user;
    }

    public function test_administrator_login_regenerates_session_and_logout_removes_access(): void
    {
        $admin = $this->administrator();
        $oldSession = $this->app['session']->getId();

        $this->postJson('/api/admin/login', ['email' => $admin->email, 'password' => $this->adminPassword])
            ->assertOk()->assertJsonPath('user.email', $admin->email)
            ->assertDontSee('password');
        $this->assertNotSame($oldSession, $this->app['session']->getId());
        $this->assertTrue(Auth::check());

        $this->getJson('/api/admin/me')->assertOk()->assertJsonPath('user.name', $admin->name);
        $this->postJson('/api/admin/logout')->assertOk();
        $this->assertFalse(Auth::guard('web')->check());
        $this->getJson('/api/admin/me')->assertUnauthorized();
        $this->getJson('/api/admin/dashboard')->assertUnauthorized();
    }

    public function test_invalid_credentials_and_missing_fields_do_not_authenticate(): void
    {
        $admin = $this->administrator();

        $this->postJson('/api/admin/login', [])->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);
        $this->postJson('/api/admin/login', ['email' => $admin->email, 'password' => 'incorrect'])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Emaili ose fjalëkalimi nuk është i saktë.');
        $this->assertGuest();

        $normalPassword = bin2hex(random_bytes(12));
        $normalUser = User::factory()->create(['password' => $normalPassword]);
        $this->postJson('/api/admin/login', ['email' => $normalUser->email, 'password' => $normalPassword])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Emaili ose fjalëkalimi nuk është i saktë.');
        $this->assertGuest();
    }

    public function test_login_is_rate_limited(): void
    {
        for ($attempt = 0; $attempt < 5; $attempt++) {
            $this->postJson('/api/admin/login', [
                'email' => 'unknown@example.test', 'password' => 'incorrect',
            ])->assertUnprocessable();
        }

        $this->postJson('/api/admin/login', [
            'email' => 'unknown@example.test', 'password' => 'incorrect',
        ])->assertStatus(429);
    }

    public function test_guests_and_non_administrators_cannot_read_dashboard_data(): void
    {
        $this->getJson('/api/admin/dashboard')->assertUnauthorized();
        $this->getJson('/api/admin/me')->assertUnauthorized();
        $this->postJson('/api/admin/logout')->assertUnauthorized();

        $user = User::factory()->create();
        $this->actingAs($user);
        $this->getJson('/api/admin/dashboard')->assertForbidden();
        $this->getJson('/api/admin/me')->assertForbidden();
        $this->postJson('/api/admin/logout')->assertForbidden();
        $this->assertDatabaseHas('users', ['id' => $user->id, 'is_admin' => false]);
    }

    public function test_dashboard_reports_stored_statuses_and_eligible_advertisements(): void
    {
        $this->seed();
        $this->actingAs($this->administrator());

        $this->getJson('/api/admin/dashboard')->assertOk()
            ->assertJsonPath('data.published_businesses', 26)
            ->assertJsonPath('data.draft_businesses', 2)
            ->assertJsonPath('data.archived_businesses', 2)
            ->assertJsonPath('data.active_advertisements', 3);

        $activeAd = Advertisement::active()->firstOrFail();
        $activeAd->update(['is_active' => false]);
        $this->getJson('/api/admin/dashboard')->assertJsonPath('data.active_advertisements', 2);

        Business::where('status', 'published')->firstOrFail()->update(['status' => 'archived']);
        $this->getJson('/api/admin/dashboard')->assertJsonPath('data.published_businesses', 25)
            ->assertJsonPath('data.archived_businesses', 3);
    }
}
