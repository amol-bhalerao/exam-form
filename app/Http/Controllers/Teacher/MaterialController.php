<?php

namespace App\Http\Controllers\Teacher;

use App\Models\AuditLog;
use App\Models\StudyMaterial;
use App\Models\Topic;
use App\Support\Html;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class MaterialController extends TeacherController
{
    public function index(Request $request)
    {
        $subjects = $this->subjects($request);
        $materials = StudyMaterial::approved()->whereIn('subject_id', $subjects->pluck('id'))
            ->when($request->query('subject'), fn ($q, $s) => $q->where('subject_id', $s))
            ->when($request->query('mine'), fn ($q) => $q->where('uploaded_by', $request->user()->id))
            ->with('subject', 'topic', 'uploader', 'student')->latest()->paginate(20)->withQueryString();
        return view('teacher.materials.index', compact('subjects', 'materials'));
    }

    public function create(Request $request)
    {
        return $this->form($request, new StudyMaterial(['subject_id' => $request->integer('subject') ?: $this->defaultSubjectId($request)]));
    }

    public function store(Request $request)
    {
        $m = new StudyMaterial($this->validated($request) + ['uploaded_by' => $request->user()->id, 'institute_id' => $this->instituteId($request), 'status' => 'approved']);
        $this->storeFile($request, $m);
        $m->save();
        AuditLog::record('material.created', $m);
        return redirect()->route('teacher.materials.index', ['subject' => $m->subject_id])->with('status', __('Study material published.'));
    }

    public function edit(Request $request, StudyMaterial $material)
    {
        abort_unless($material->uploaded_by === $request->user()->id, 403);
        return $this->form($request, $material);
    }

    public function update(Request $request, StudyMaterial $material)
    {
        abort_unless($material->uploaded_by === $request->user()->id, 403);
        $material->fill($this->validated($request));
        $this->storeFile($request, $material);
        $material->save();
        return redirect()->route('teacher.materials.index', ['subject' => $material->subject_id])->with('status', __('Study material saved.'));
    }

    public function destroy(Request $request, StudyMaterial $material)
    {
        abort_unless($material->uploaded_by === $request->user()->id, 403);
        if ($material->file_path) {
            Storage::disk('public')->delete($material->file_path);
        }
        $material->delete();
        return back()->with('status', __('Study material removed.'));
    }

    private function form(Request $request, StudyMaterial $material)
    {
        $subjects = $this->subjects($request);
        return view('teacher.materials.form', [
            'material' => $material, 'subjects' => $subjects,
            'topics' => Topic::whereIn('subject_id', $subjects->pluck('id'))->orderBy('sort')->get()->groupBy('subject_id')->map(fn ($g) => $g->map(fn ($t) => ['id' => $t->id, 'label' => $t->label])->values()),
        ]);
    }

    private function validated(Request $request): array
    {
        $v = $request->validate([
            'subject_id' => ['required', Rule::in($this->subjects($request)->pluck('id')->all())],
            'topic_id' => ['nullable', Rule::exists('topics', 'id')->where('subject_id', $request->input('subject_id'))],
            'title' => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:1000'],
            'body' => ['nullable', 'string', 'max:100000'],
            'link_url' => ['nullable', 'url', 'max:255'],
            'file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png,doc,docx,ppt,pptx', 'max:10240'],
        ]);
        unset($v['file']);
        $v['body'] = Html::clean($v['body'] ?? null);
        return $v;
    }

    private function storeFile(Request $request, StudyMaterial $m): void
    {
        if ($file = $request->file('file')) {
            if ($m->file_path) {
                Storage::disk('public')->delete($m->file_path);
            }
            $m->file_path = $file->store('materials', 'public');
            $m->file_name = mb_substr($file->getClientOriginalName(), 0, 250);
        }
    }
}
