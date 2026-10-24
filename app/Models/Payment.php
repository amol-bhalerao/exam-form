<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'application_id', 'user_id', 'gateway', 'order_id', 'payment_session_id', 'amount', 'status',
        'gateway_payment_id', 'method', 'payload', 'paid_at',
    ];

    protected $casts = ['payload' => 'array', 'paid_at' => 'datetime'];

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
