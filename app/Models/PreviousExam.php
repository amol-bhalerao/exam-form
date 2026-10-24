<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PreviousExam extends Model
{
    public $timestamps = false;

    protected $fillable = ['student_id', 'exam', 'seat_no', 'month', 'year', 'percentage', 'board_or_college'];
}
