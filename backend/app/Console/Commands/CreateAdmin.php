<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

class CreateAdmin extends Command
{
    protected $signature = 'admin:create';

    protected $description = 'Create a local administrator account';

    public function handle(): int
    {
        $name = trim((string) $this->ask('Name'));
        $email = trim((string) $this->ask('Email'));
        $password = (string) $this->secret('Password');
        $confirmation = (string) $this->secret('Confirm password');

        $validator = Validator::make(compact('name', 'email', 'password'), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:12'],
        ]);

        if ($validator->fails() || $password !== $confirmation) {
            $this->error('Check the name, unique email, and matching password of at least 12 characters.');

            return self::FAILURE;
        }

        $admin = new User(['name' => $name, 'email' => $email, 'password' => $password]);
        $admin->is_admin = true;
        $admin->save();

        $this->info('Administrator created.');

        return self::SUCCESS;
    }
}
