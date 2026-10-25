<?php

namespace App\Http\Controllers\Student\Learn;

use App\Models\StudyMaterial;
use App\Models\Topic;
use App\Support\Html;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Study material: everything approved, plus the student's own notes (live after a teacher approves). */
class MaterialController extends LearnController
{
    public function index(Request $request)
    {
        $student = $this->learner($request);
        $subjects = $this->subjects($student);
        $subjectId = $request->integer('subject') ?: null;
        $materials = StudyMaterial::approved()->whereIn('subject_id', $subjects->pluck('id'))
            ->when($subjectId, fn ($q, $s) => $q->where('subject_id', $s))
            ->when($request->integer('topic'), fn ($q, $t) => $q->where('topic_id', $t))
            ->when(trim((string) $request->query('q')), fn ($q, $t) => $q->where(fn ($w) => $w->where('title', 'like', "%{$t}%")->orWhere('description', 'like', "%{$t}%")))
            ->with('subject', 'topic', 'uploader', 'student')->latest()->paginate(18)->withQueryString();
        return view('learn.materials.index', [
            'subjects' => $subjects, 'subjectId' => $subjectId, 'materials' => $materials,
            'topics' => $subjectId ? Topic::where('subject_id', $subjectId)->orderBy('sort')->get() : collect(),
            'mine' => StudyMaterial::where('student_id', $student->id)->latest()->limit(10)->get(),
        ]);
    }

    public function show(Request $request, StudyMaterial $material)
    {
        $student = $this->learner($request);
        abort_unless($material->status === 'approved' || $material->student_id === $student->id, 404);
        $material->increment('views');
        return view('learn.materials.show', ['material' => $material->load('subject', 'topic', 'uploader', 'student')]);
    }

    public function create(Request $request)
    {
        $student = $this->learner($request);
        $subjects = $this->subjects($student);
        return view('learn.materials.form', [
            'subjects' => $subjects, 'subjectId' => $request->integer('subject') ?: null,
            'topics' => Topic::whereIn('subject_id', $subjects->pluck('id'))->orderBy('sort')->get()->groupBy('subject_id')->map(fn ($g) => $g->map(fn ($t) => ['id' => $t->id, 'label' => $t->label])->values()),
        ]);
    }

    public function store(Request $request)
    {
        $student = $this->learner($request);
        abort_unless($student->institute_id, 403, __('Choose the student\'s college first, so a teacher there can review the notes.'));
        $v = $request->validate([
            'subject_id' => ['required', Rule::in($this->subjects($student)->pluck('id')->all())],
            'topic_id' => ['nullable', Rule::exists('topics', 'id')->where('subject_id', $request->input('subject_id'))],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:1000'],
            'body' => ['nullable', 'string', 'max:50000'],
            'file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:8192'],
        ]);
        if (! $request->hasFile('file') && blank(strip_tags((string) ($v['body'] ?? '')))) {
            return back()->withInput()->withErrors(['body' => __('Write your notes or attach a PDF / photo.')]);
        }
        $m = new StudyMaterial(collect($v)->except('file')->all() + [
            'uploaded_by' => $request->user()->id, 'student_id' => $student->id, 'institute_id' => $student->institute_id, 'status' => 'pending',
        ]);
        $m->body = Html::clean($v['body'] ?? null);
        if ($file = $request->file('file')) {
            $m->file_path = $file->store('materials', 'public');
            $m->file_name = mb_substr($file->getClientOriginalName(), 0, 250);
        }
        $m->save();
        return redirect()->route('learn.materials.index')->with('status', __('Thank you! Your notes were sent to your teachers. They go live for everyone after a teacher approves them.'));
    }
}
