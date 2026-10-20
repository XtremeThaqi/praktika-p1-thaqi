<?php

namespace Tests;

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    public function createApplication(): Application
    {
        $app = parent::createApplication();
        $connection = $app['db']->connection();

        if ($connection->getDriverName() === 'mysql'
            && $connection->getDatabaseName() !== 'lipjan_directory_test') {
            throw new RuntimeException('Database tests may only use lipjan_directory_test.');
        }

        return $app;
    }
}
