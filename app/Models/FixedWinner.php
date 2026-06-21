<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FixedWinner extends Model
{
    protected $fillable = [
        'guest_id',
        'prize_id',
        'is_used',
    ];

    protected $casts = [
        'is_used' => 'boolean',
    ];

    public function guest(): BelongsTo
    {
        return $this->belongsTo(Guest::class);
    }

    public function prize(): BelongsTo
    {
        return $this->belongsTo(Prize::class);
    }
}