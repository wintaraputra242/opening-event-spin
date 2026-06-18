<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LotteryResult extends Model
{
    protected $fillable = ['guest_id', 'prize_id'];

    public function guest()
    {
        return $this->belongsTo(Guest::class);
    }
    public function prize()
    {
        return $this->belongsTo(Prize::class);
    }
}
