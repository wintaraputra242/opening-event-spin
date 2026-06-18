<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Prize extends Model
{
    protected $fillable = ['name', 'description', 'stock', 'initial_stock', 'is_claimed'];
}
