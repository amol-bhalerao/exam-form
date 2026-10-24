<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExamFee extends Model
{
    public $timestamps = false;

    protected $fillable = ['exam_id', 'candidate_type', 'fee', 'late_fee'];
}
