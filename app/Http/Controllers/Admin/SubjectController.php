<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Board;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SubjectController extends Controller
{
    public function index(Request $request)
    {
        $boards = Board::orderBy('sort')->get();
        $board = $boards->firstWhere('id', $request->integer('board')) ?? $boards->first();
        $subjects = Subject::where('board_id', $board?->id)->with('streams')
            ->when($request->query('kind'), fn ($q, $k) => $q->where('kind', $k))
            ->when(trim((string) $request->query('q')), fn ($q, $t) => $q->where(fn ($w) => $w->where('code', 'like', "{$t}%")->orWhere('name', 'like', "%{$t}%")->orWhere('name_mr', 'like', "%{$t}%")))
            ->orderBy('sort')->orderBy('code')->get();
        return view('admin.subjects.index', compact('boards', 'board', 'subjects'));
    }

    public function create(Request $request)
    {
        return $this->form(new Subject(['board_id' => $request->integer('board') ?: Board::orderBy('sort')->value('id'), 'kind' => 'ELECTIVE', 'theory_marks' => 80, 'internal_marks' => 20, 'papers' => 1, 'is_active' => true]));
    }

    public function store(Request $request)
    {
        [$data, $streams] = $this->validated($request);
        $subject = Subject::create($data);
        $subject->streams()->sync($streams);
        AuditLog::record('subject.created', $subject);
        return redirect()->route('admin.subjects.index', ['board' => $subject->board_id])->with('status', __(':name added.', ['name' => $subject->name]));
    }

    public function edit(Subject $subject)
    {
        return $this->form($subject->load('streams'));
    }

    public function update(Request $request, Subject $subject)
    {
        [$data, $streams] = $this->validated($request, $subject);
        $subject->update($data);
        $subject->streams()->sync($streams);
        AuditLog::record('subject.updated', $subject);
        return redirect()->route('admin.subjects.index', ['board' => $subject->board_id])->with('status', __('Details saved for :name.', ['name' => $subject->name]));
    }

    public function destroy(Subject $subject)
    {
        if (\App\Models\ApplicationSubject::where('subject_id', $subject->id)->exists()) {
            $subject->update(['is_active' => false]);
            return redirect()->route('admin.subjects.index', ['board' => $subject->board_id])->with('status', __('This subject is used in exam forms, so it was hidden instead of deleted.'));
        }
        $subject->delete();
        AuditLog::record('subject.deleted', null, ['code' => $subject->code]);
        return redirect()->route('admin.subjects.index', ['board' => $subject->board_id])->with('status', __(':name has been removed.', ['name' => $subject->name]));
    }

    private function form(Subject $subject)
    {
        return view('admin.subjects.form', ['subject' => $subject, 'boards' => Board::orderBy('sort')->with(['streams' => fn ($q) => $q->orderBy('sort')])->get()]);
    }

    private function validated(Request $request, ?Subject $subject = null): array
    {
        $v = $request->validate([
            'board_id' => ['required', 'exists:boards,id'],
            'code' => ['required', 'string', 'max:12', Rule::unique('subjects')->where('board_id', $request->input('board_id'))->ignore($subject?->id)],
            'name' => ['required', 'string', 'max:150'],
            'name_mr' => ['nullable', 'string', 'max:150'],
            'name_hi' => ['nullable', 'string', 'max:150'],
            'kind' => ['required', Rule::in(array_keys(Subject::KINDS))],
            'theory_marks' => ['nullable', 'integer', 'between:0,200'],
            'internal_marks' => ['nullable', 'integer', 'between:0,200'],
            'papers' => ['nullable', 'integer', 'between:1,4'],
            'sort' => ['nullable', 'integer', 'between:0,9999'],
            'streams' => ['array'],
            'streams.*' => [Rule::exists('streams', 'id')->where('board_id', $request->input('board_id'))],
        ]);
        $streams = $v['streams'] ?? [];
        unset($v['streams']);
        $v['graded'] = $request->boolean('graded');
        $v['is_active'] = $request->boolean('is_active');
        $v['code'] = strtoupper($v['code']);
        return [$v, $streams];
    }
}
