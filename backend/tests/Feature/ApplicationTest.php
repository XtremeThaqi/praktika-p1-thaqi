<?php

namespace Tests\Feature;

use Tests\TestCase;

class ApplicationTest extends TestCase
{
    public function test_the_root_identifies_the_api_without_frontend_assets(): void
    {
        $this->getJson('/')
            ->assertOk()
            ->assertExactJson(['name' => config('app.name')]);
    }
}
