<?php

namespace App\Http\Controllers\Student\Learn;

use App\Models\MemoryTip;
use App\Models\Question;
use App\Models\StudyMaterial;
use App\Models\Topic;
use App\Support\QuestionForm;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** Students add questions and memory tips; both wait for a teacher of their college. */
class ContributeController extends LearnController
{
    public function index(Request $request)
    {
        $student = $this->learner($request);
        $uid = $request->user()->id;
        return view('learn.contribute', [
            'questions' => Question::where('created_by', $uid)->where('source', 'student')->with('subject', 'topic')->latest()->limit(30)->get(),
            'tips' => MemoryTip::where('student_id', $student->id)->with('question')->latest()->limit(30)->get(),
            'materials' => StudyMaterial::where('student_id', $student->id)->with('subject')->latest()->limit(30)->get(),
        ]);
    }

    public function create(Request $request)
    {
        $student = $this->learner($request);
        $subjects = $this->subjects($student);
        return view('learn.question-form', [
            'question' => new Question(['subject_id' => $request->integer('subject') ?: null, 'type' => 'single', 'difficulty' => 'medium']),
            'subjects' => $subjects,
            'topics' => Topic::whereIn('subject_id', $subjects->pluck('id'))->orderBy('sort')->get()->groupBy('subject_id')->map(fn ($g) => $g->map(fn ($t) => ['id' => $t->id, 'label' => $t->label])->values()),
            'tip' => null,
        ]);
    }

    public function store(Request $request)
    {
        $student = $this->learner($request);
        if (! $student->institute_id) {
            return back()->withInput()->with('warning', __('Choose the student\'s college first, so a teacher there can review the question.'));
        }
        $v = QuestionForm::validate($request, $this->subjects($student)->pluck('id')->all());
        $q = QuestionForm::save(null, $v, ['status' => 'pending', 'source' => 'student', 'created_by' => $request->user()->id, 'institute_id' => $student->institute_id]);
        MemoryTip::where('question_id', $q->id)->update(['student_id' => $student->id]);
        return redirect()->route('learn.contribute.index')->with('status', __('Thank you! Your question was sent to your teachers for review.'));
    }

    /** A memory tip for a question (from the result page). */
    public function tip(Request $request, Question $question)
    {
        $student = $this->learner($request);
        abort_unless($question->status === 'approved', 404);
        $v = $request->validate(['text' => ['required', 'string', 'min:5', 'max:500']]);
        if (! $student->institute_id) {
            return back()->with('warning', __('Choose the student\'s college first, so a teacher there can review the tip.'));
        }
        MemoryTip::create([
            'question_id' => $question->id, 'topic_id' => $question->topic_id, 'text' => trim($v['text']),
            'user_id' => $request->user()->id, 'student_id' => $student->id, 'institute_id' => $student->institute_id, 'status' => 'pending',
        ]);
        return back()->with('status', __('Nice idea! Your memory tip will be shown to everyone once a teacher approves it.'));
    }

    public function like(Request $request, MemoryTip $tip)
    {
        abort_unless($tip->status === 'approved', 404);
        $uid = $request->user()->id;
        $exists = DB::table('memory_tip_likes')->where(['memory_tip_id' => $tip->id, 'user_id' => $uid])->exists();
        if ($exists) {
            DB::table('memory_tip_likes')->where(['memory_tip_id' => $tip->id, 'user_id' => $uid])->delete();
            $tip->decrement('likes');
        } else {
            DB::table('memory_tip_likes')->insert(['memory_tip_id' => $tip->id, 'user_id' => $uid]);
            $tip->increment('likes');
        }
        return $request->expectsJson() ? response()->json(['liked' => ! $exists, 'likes' => $tip->likes]) : back();
    }
}
