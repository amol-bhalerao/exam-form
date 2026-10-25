<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    public const SUPER_ADMIN = 'super_admin';
    public const BOARD = 'board';
    public const INSTITUTE = 'institute';
    public const STUDENT = 'student';
    public const TEACHER = 'teacher';

    public const ROLES = [
        self::SUPER_ADMIN => 'Super admin',
        self::BOARD => 'Board',
        self::INSTITUTE => 'Institute',
        self::TEACHER => 'Teacher',
        self::STUDENT => 'Student account',
    ];

    protected $fillable = [
        'name', 'username', 'email', 'mobile', 'password', 'role', 'board_id', 'institute_id',
        'google_id', 'avatar', 'locale', 'is_active', 'is_demo', 'must_change_password', 'last_login_at',
    ];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'last_login_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'is_demo' => 'boolean',
            'must_change_password' => 'boolean',
        ];
    }

    public function board(): BelongsTo
    {
        return $this->belongsTo(Board::class);
    }

    public function institute(): BelongsTo
    {
        return $this->belongsTo(Institute::class);
    }

    /** Students managed by this (Google) account. */
    public function students(): HasMany
    {
        return $this->hasMany(Student::class, 'owner_id');
    }

    public function teacher(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Teacher::class);
    }

    public function isRole(string ...$roles): bool
    {
        return in_array($this->role, $roles, true);
    }

    public function homeRoute(): string
    {
        return match ($this->role) {
            self::SUPER_ADMIN => 'admin.dashboard',
            self::BOARD => 'board.dashboard',
            self::INSTITUTE => 'institute.dashboard',
            self::TEACHER => 'teacher.dashboard',
            default => 'student.dashboard',
        };
    }

    public function initials(): string
    {
        $parts = preg_split('/[\s._@-]+/', trim($this->name)) ?: [];
        $first = mb_substr($parts[0] ?? '?', 0, 1);
        $second = isset($parts[1]) ? mb_substr($parts[1], 0, 1) : '';
        return mb_strtoupper($first . $second);
    }
}
