<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

Artisan::command('demo:seed-if-empty', function () {
    if (! DB::table('businesses')->exists()) {
        $this->call('db:seed', ['--force' => true]);
    }
})->purpose('Load demo data only into an empty catalogue');

Artisan::command('admin:bootstrap-if-missing', function () {
    $name = trim((string) getenv('BOOTSTRAP_ADMIN_NAME'));
    $email = trim((string) getenv('BOOTSTRAP_ADMIN_EMAIL'));
    $password = (string) getenv('BOOTSTRAP_ADMIN_PASSWORD');

    if ($name === '' && $email === '' && $password === '') {
        return;
    }

    if ($name === '' || $email === '' || $password === '') {
        throw new RuntimeException('Administrator bootstrap variables are incomplete.');
    }

    if (User::query()->where('is_admin', true)->exists()) {
        return;
    }

    $data = compact('name', 'email', 'password');
    $validator = Validator::make($data, [
        'name' => ['required', 'string', 'max:255'],
        'email' => ['required', 'email', 'max:255', 'unique:users,email'],
        'password' => ['required', 'string', 'min:12'],
    ]);

    if ($validator->fails()) {
        // Report only field names, never credentials or supplied values.
        $fields = implode(', ', array_keys($validator->errors()->messages()));
        throw new RuntimeException('Administrator bootstrap validation failed for: '.$fields);
    }

    $admin = new User($data);
    $admin->is_admin = true;
    $admin->save();

    $this->info('Initial administrator created.');
})->purpose('Create the first administrator from Render-only environment variables');
