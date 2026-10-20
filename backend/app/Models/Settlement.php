<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Settlement extends Model
{
    protected $fillable = [
        'name',
        'slug',
    ];

    public function businesses(): HasMany
    {
        return $this->hasMany(Business::class);
    }
}
