<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Student extends Model
{
    protected $fillable = [
        'owner_id', 'board_id', 'institute_id', 'stream_id', 'surname', 'first_name', 'middle_name', 'mother_name',
        'gender', 'dob', 'aadhaar', 'apaar_id', 'pen_id', 'saral_id', 'mobile', 'email', 'address', 'village',
        'taluka', 'district', 'pincode', 'category', 'minority_religion', 'medium', 'divyang', 'ssc_from_maharashtra',
        'eligibility_cert_issued', 'eligibility_cert_no', 'photo_path', 'signature_path', 'revenue_circle_village',
        'bank_account_no', 'bank_ifsc', 'bank_account_holder',
    ];

    protected $hidden = ['aadhaar'];

    protected $casts = [
        'dob' => 'date',
        'aadhaar' => 'encrypted',
        'ssc_from_maharashtra' => 'boolean',
        'eligibility_cert_issued' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::saving(function (Student $s) {
            if ($s->isDirty('aadhaar')) {
                $digits = preg_replace('/\D/', '', (string) $s->aadhaar);
                $s->aadhaar_last4 = $digits !== '' ? substr($digits, -4) : null;
            }
        });
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function board(): BelongsTo
    {
        return $this->belongsTo(Board::class);
    }

    public function institute(): BelongsTo
    {
        return $this->belongsTo(Institute::class);
    }

    public function stream(): BelongsTo
    {
        return $this->belongsTo(Stream::class);
    }

    public function previousExams(): HasMany
    {
        return $this->hasMany(PreviousExam::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    /** "SURNAME FIRST MIDDLE" as printed on board forms. */
    public function getFullNameAttribute(): string
    {
        return trim(preg_replace('/\s+/', ' ', "{$this->surname} {$this->first_name} {$this->middle_name}"));
    }

    public function getMaskedAadhaarAttribute(): ?string
    {
        return $this->aadhaar_last4 ? 'XXXX XXXX ' . $this->aadhaar_last4 : null;
    }

    public function photoUrl(): ?string
    {
        return $this->photo_path ? Storage::disk('public')->url($this->photo_path) : null;
    }

    public function signatureUrl(): ?string
    {
        return $this->signature_path ? Storage::disk('public')->url($this->signature_path) : null;
    }

    /** Fields still needed before a form can be submitted. */
    public function missingFields(): array
    {
        $required = [
            'surname' => 'Surname', 'first_name' => 'First name', 'mother_name' => "Mother's name", 'gender' => 'Gender',
            'dob' => 'Date of birth', 'mobile' => 'Mobile number', 'address' => 'Address', 'category' => 'Category',
            'medium' => 'Medium of instruction', 'institute_id' => 'Institute', 'photo_path' => 'Photo', 'signature_path' => 'Signature',
        ];
        if ($this->board?->has_streams) {
            $required['stream_id'] = 'Stream';
        }
        return collect($required)->filter(fn ($label, $field) => blank($this->{$field}))->map(fn ($l) => __($l))->all();
    }
}
