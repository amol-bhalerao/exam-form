<?php

namespace App\Http\Controllers\Board;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Exam;
use App\Support\Codes;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/** Exam sessions with their form-filling window and the fee for each candidate type. */
class ExamController extends Controller
{
    public function index(Request $request)
    {
        $exams = Exam::where('board_id', $request->user()->board_id)
            ->when($request->user()->division_id, fn ($q, $d) => $q->forDivision($d))
            ->with('fees', 'stream', 'division')
            ->withCount(['applications as paid_count' => fn ($q) => $q->whereNotNull('paid_at')])
            ->latest('opens_at')->get();
        return view('board.exams.index', ['exams' => $exams]);
    }

    public function create(Request $request)
    {
        $year = (int) now()->addYear()->format('Y');
        return view('board.exams.form', $this->formData($request, new Exam([
            'session' => 'FEB-MAR', 'year' => $year, 'academic_year' => ($year - 1) . '-' . substr((string) $year, 2),
            'candidate_types' => array_keys(Codes::CANDIDATE_TYPES),
            'opens_at' => now()->startOfDay(), 'closes_at' => now()->addMonth()->endOfDay(),
        ])));
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $exam = DB::transaction(function () use ($request, $data) {
            $exam = Exam::create($data['exam'] + ['board_id' => $request->user()->board_id, 'created_by' => $request->user()->id]);
            $this->syncFees($exam, $data['fees']);
            return $exam;
        });
        AuditLog::record('exam.created', $exam);
        return redirect()->route('board.exams.index')->with('status', __(':name created.', ['name' => $exam->name]));
    }

    public function edit(Request $request, Exam $exam)
    {
        $this->authorizeExam($request, $exam);
        return view('board.exams.form', $this->formData($request, $exam->load('fees')));
    }

    public function update(Request $request, Exam $exam)
    {
        $this->authorizeExam($request, $exam);
        $data = $this->validated($request, $exam);
        DB::transaction(function () use ($exam, $data) {
            $exam->update($data['exam']);
            $this->syncFees($exam, $data['fees']);
        });
        AuditLog::record('exam.updated', $exam);
        return redirect()->route('board.exams.index')->with('status', __('Details saved for :name.', ['name' => $exam->name]));
    }

    public function destroy(Request $request, Exam $exam)
    {
        $this->authorizeExam($request, $exam);
        if ($exam->applications()->exists()) {
            return back()->with('warning', __('Students have already started forms for this exam. Unpublish it instead of deleting.'));
        }
        $exam->delete();
        AuditLog::record('exam.deleted', null, ['code' => $exam->code]);
        return redirect()->route('board.exams.index')->with('status', __(':name has been removed.', ['name' => $exam->name]));
    }

    private function authorizeExam(Request $request, Exam $exam): void
    {
        $division = $request->user()->division_id;
        // A divisional officer manages only their division's exams; a state-level officer (no division) manages all.
        abort_unless($exam->board_id === $request->user()->board_id && (! $division || $exam->division_id === $division), 404);
    }

    private function formData(Request $request, Exam $exam): array
    {
        return [
            'exam' => $exam,
            'streams' => $request->user()->board->streams()->orderBy('sort')->get(),
            'fees' => collect(Codes::CANDIDATE_TYPES)->mapWithKeys(fn ($l, $k) => [$k => $exam->exists ? $exam->fees->firstWhere('candidate_type', $k) : null]),
            'hasForms' => $exam->exists && $exam->applications()->exists(),
            'divisions' => $request->user()->division_id ? null : \App\Models\Division::options(),
        ];
    }

    private function validated(Request $request, ?Exam $exam = null): array
    {
        $types = array_keys(Codes::CANDIDATE_TYPES);
        $v = $request->validate([
            'code' => ['required', 'string', 'max:20', 'regex:/^[A-Z0-9-]+$/', Rule::unique('exams', 'code')->ignore($exam?->id)],
            'name' => ['required', 'string', 'max:150'],
            'session' => ['required', Rule::in(['FEB-MAR', 'JUL-AUG'])],
            'year' => ['required', 'integer', 'between:2020,2100'],
            'academic_year' => ['required', 'regex:/^\d{4}-\d{2}$/'],
            'stream_id' => ['nullable', Rule::exists('streams', 'id')->where('board_id', $request->user()->board_id)],
            'division_id' => ['nullable', 'exists:divisions,id'],
            'candidate_types' => ['required', 'array', 'min:1'],
            'candidate_types.*' => [Rule::in($types)],
            'opens_at' => ['required', 'date'],
            'closes_at' => ['required', 'date', 'after:opens_at'],
            'late_closes_at' => ['nullable', 'date', 'after:closes_at'],
            'exam_starts_on' => ['nullable', 'date'],
            'exam_ends_on' => ['nullable', 'date', 'after_or_equal:exam_starts_on'],
            'instructions' => ['nullable', 'string', 'max:5000'],
            'is_published' => ['nullable', 'boolean'],
            'fee' => ['array'],
            'fee.*' => ['nullable', 'integer', 'between:0,100000'],
            'late_fee' => ['array'],
            'late_fee.*' => ['nullable', 'integer', 'between:0,100000'],
        ], ['code.regex' => __('Use capital letters, numbers and dashes, e.g. HSC27FEB.')]);

        foreach ($v['candidate_types'] as $t) {
            if (! isset($v['fee'][$t]) || $v['fee'][$t] === null) {
                throw \Illuminate\Validation\ValidationException::withMessages(["fee.{$t}" => __('Enter the fee for :type.', ['type' => Codes::label(Codes::CANDIDATE_TYPES, $t)])]);
            }
        }
        $fees = collect($v['candidate_types'])->mapWithKeys(fn ($t) => [$t => ['fee' => (int) $v['fee'][$t], 'late_fee' => (int) ($v['late_fee'][$t] ?? 0)]])->all();
        $examData = collect($v)->except(['fee', 'late_fee'])->all();
        $examData['is_published'] = $request->boolean('is_published');
        $examData['division_id'] = $request->user()->division_id ?? ($v['division_id'] ?? null);
        $examData['candidate_types'] = array_values(array_intersect($types, $v['candidate_types']));
        $examData['closes_at'] = \Illuminate\Support\Carbon::parse($v['closes_at'])->endOfDay();
        if (! empty($v['late_closes_at'])) {
            $examData['late_closes_at'] = \Illuminate\Support\Carbon::parse($v['late_closes_at'])->endOfDay();
        }
        return ['exam' => $examData, 'fees' => $fees];
    }

    private function syncFees(Exam $exam, array $fees): void
    {
        $exam->fees()->whereNotIn('candidate_type', array_keys($fees))->delete();
        foreach ($fees as $type => $f) {
            $exam->fees()->updateOrCreate(['candidate_type' => $type], $f);
        }
    }
}
