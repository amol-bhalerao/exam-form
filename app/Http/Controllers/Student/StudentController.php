<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\AuditLog;
use App\Models\Board;
use App\Models\Institute;
use App\Models\Student;
use App\Support\Codes;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

/**
 * One Google account can add and manage several students (parents, guardians,
 * cyber-cafe helpers filling forms for others). Every student belongs to the account owner.
 */
class StudentController extends Controller
{
    private const PREVIOUS_EXAMS = ['SSC', 'XI', 'HSC'];

    public function create(Request $request)
    {
        return view('student.students.form', $this->formData(new Student([
            'board_id' => Board::where('code', $request->query('board', 'HSC'))->value('id'),
            'email' => $request->user()->email,
        ])));
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $student = DB::transaction(function () use ($request, $data) {
            $student = new Student($data['student']);
            $student->owner_id = $request->user()->id;
            $this->storeUploads($request, $student);
            $student->save();
            $this->syncPreviousExams($student, $data['previous']);
            return $student;
        });
        AuditLog::record('student.created', $student);

        $next = $request->input('after') === 'apply' ? route('student.applications.create', $student) : route('student.dashboard');
        return redirect($next)->with('status', __(':name has been added.', ['name' => $student->full_name]));
    }

    public function edit(Request $request, Student $student)
    {
        $this->authorizeOwner($request, $student);
        return view('student.students.form', $this->formData($student->load('previousExams')));
    }

    public function update(Request $request, Student $student)
    {
        $this->authorizeOwner($request, $student);
        $data = $this->validated($request, $student);

        DB::transaction(function () use ($request, $student, $data) {
            // A student already linked to a submitted form cannot silently move to another board.
            if ($student->applications()->whereNotIn('status', [Application::DRAFT])->exists()) {
                unset($data['student']['board_id']);
            }
            $student->fill($data['student']);
            $this->storeUploads($request, $student);
            $student->save();
            $this->syncPreviousExams($student, $data['previous']);
        });
        AuditLog::record('student.updated', $student);

        $next = $request->input('after') === 'apply' ? route('student.applications.create', $student) : route('student.dashboard');
        return redirect($next)->with('status', __('Details saved for :name.', ['name' => $student->full_name]));
    }

    public function destroy(Request $request, Student $student)
    {
        $this->authorizeOwner($request, $student);
        if ($student->applications()->where('status', '!=', Application::DRAFT)->exists()) {
            return back()->with('warning', __('This student has a submitted exam form and cannot be removed.'));
        }
        DB::transaction(function () use ($student) {
            $student->applications()->delete();
            foreach ([$student->photo_path, $student->signature_path] as $path) {
                if ($path) {
                    Storage::disk('public')->delete($path);
                }
            }
            $student->delete();
        });
        AuditLog::record('student.deleted', null, ['name' => $student->full_name]);
        return redirect()->route('student.dashboard')->with('status', __(':name has been removed.', ['name' => $student->full_name]));
    }

    private function authorizeOwner(Request $request, Student $student): void
    {
        abort_unless($student->owner_id === $request->user()->id, 404);
    }

    private function formData(Student $student): array
    {
        $boards = Board::orderBy('sort')->get();
        return [
            'student' => $student,
            'boards' => $boards,
            'streamsByBoard' => $boards->mapWithKeys(fn ($b) => [$b->id => $b->streams()->orderBy('sort')->get()->map(fn ($s) => ['id' => $s->id, 'label' => $s->label])]),
            'institute' => $student->institute_id ? Institute::find($student->institute_id) : null,
            'previous' => collect(self::PREVIOUS_EXAMS)->mapWithKeys(fn ($exam) => [$exam => $student->exists ? $student->previousExams->firstWhere('exam', $exam) : null]),
            'locked' => $student->exists && $student->applications()->where('status', '!=', Application::DRAFT)->exists(),
        ];
    }

    private function validated(Request $request, ?Student $student = null): array
    {
        $year = (int) now()->format('Y');
        $rules = [
            'board_id' => ['required', 'exists:boards,id'],
            'institute_id' => ['required', Rule::exists('institutes', 'id')->where('board_id', $request->input('board_id'))->where('is_active', true)],
            'stream_id' => ['nullable', Rule::exists('streams', 'id')->where('board_id', $request->input('board_id'))],
            'surname' => ['required', 'string', 'max:80', 'regex:/^[A-Za-z .\'-]+$/'],
            'first_name' => ['required', 'string', 'max:80', 'regex:/^[A-Za-z .\'-]+$/'],
            'middle_name' => ['nullable', 'string', 'max:80', 'regex:/^[A-Za-z .\'-]+$/'],
            'mother_name' => ['required', 'string', 'max:80', 'regex:/^[A-Za-z .\'-]+$/'],
            'gender' => ['required', Rule::in(array_keys(Codes::GENDERS))],
            'dob' => ['required', 'date', 'before:-10 years', 'after:-60 years'],
            'aadhaar' => ['nullable', 'regex:/^\d{4}\s?\d{4}\s?\d{4}$/'],
            'apaar_id' => ['nullable', 'regex:/^\d{12}$/'],
            'pen_id' => ['nullable', 'string', 'max:30'],
            'saral_id' => ['nullable', 'string', 'max:30'],
            'mobile' => ['required', 'regex:/^[6-9]\d{9}$/'],
            'email' => ['nullable', 'email', 'max:150'],
            'address' => ['required', 'string', 'max:300'],
            'village' => ['nullable', 'string', 'max:80'],
            'taluka' => ['nullable', 'string', 'max:80'],
            'district' => ['nullable', 'string', 'max:80'],
            'pincode' => ['nullable', 'regex:/^\d{6}$/'],
            'category' => ['required', Rule::in(array_keys(Codes::CATEGORIES))],
            'minority_religion' => ['nullable', Rule::in(array_keys(Codes::RELIGIONS))],
            'medium' => ['required', Rule::in(array_keys(Codes::MEDIUMS))],
            'divyang' => ['nullable', Rule::in(array_keys(Codes::DIVYANG))],
            'ssc_from_maharashtra' => ['nullable', 'boolean'],
            'eligibility_cert_issued' => ['nullable', 'boolean'],
            'eligibility_cert_no' => ['nullable', 'string', 'max:50'],
            'revenue_circle_village' => ['nullable', 'string', 'max:150'],
            'bank_account_no' => ['nullable', 'regex:/^\d{9,18}$/'],
            'bank_ifsc' => ['nullable', 'regex:/^[A-Za-z]{4}0[A-Za-z0-9]{6}$/'],
            'bank_account_holder' => ['nullable', Rule::in(array_keys(Codes::ACCOUNT_HOLDERS))],
            'photo' => [$student?->photo_path ? 'nullable' : 'required', 'image', 'mimes:jpg,jpeg,png', 'max:300', 'dimensions:min_width=100,min_height=120'],
            'signature' => [$student?->signature_path ? 'nullable' : 'required', 'image', 'mimes:jpg,jpeg,png', 'max:200', 'dimensions:min_width=120,min_height=40'],
            'previous' => ['array'],
            'previous.*.seat_no' => ['nullable', 'string', 'max:30'],
            'previous.*.month' => ['nullable', Rule::in(array_keys(Codes::MONTHS))],
            'previous.*.year' => ['nullable', 'integer', 'between:1980,' . $year],
            'previous.*.percentage' => ['nullable', 'numeric', 'between:0,100'],
            'previous.*.board_or_college' => ['nullable', 'string', 'max:150'],
        ];
        $board = Board::find($request->input('board_id'));
        if ($board?->has_streams) {
            $rules['stream_id'][0] = 'required';
        }

        $messages = [
            'surname.regex' => __('Write the name in English capital letters, as on the school leaving certificate.'),
            'first_name.regex' => __('Write the name in English capital letters, as on the school leaving certificate.'),
            'middle_name.regex' => __('Write the name in English capital letters, as on the school leaving certificate.'),
            'mother_name.regex' => __('Write the name in English capital letters, as on the school leaving certificate.'),
            'mobile.regex' => __('Enter a 10-digit mobile number.'),
            'aadhaar.regex' => __('Aadhaar number has 12 digits.'),
            'apaar_id.regex' => __('APAAR ID has 12 digits.'),
            'bank_ifsc.regex' => __('IFSC looks like SBIN0001234.'),
            'dob.before' => __('Check the date of birth.'),
            'photo.max' => __('Photo must be smaller than 300 KB.'),
            'signature.max' => __('Signature must be smaller than 200 KB.'),
        ];

        $v = $request->validate($rules, $messages);

        $student = collect($v)->except(['photo', 'signature', 'previous'])->all();
        foreach (['surname', 'first_name', 'middle_name', 'mother_name'] as $f) {
            $student[$f] = isset($student[$f]) ? mb_strtoupper(trim(preg_replace('/\s+/', ' ', $student[$f]))) : null;
        }
        $student['bank_ifsc'] = isset($student['bank_ifsc']) ? strtoupper($student['bank_ifsc']) : null;
        if (! $board?->has_streams) {
            $student['stream_id'] = $board?->streams()->value('id');
        }
        if (array_key_exists('aadhaar', $student) && blank($student['aadhaar'])) {
            unset($student['aadhaar']); // keep the stored number when the field is left empty on edit
        }

        return ['student' => $student, 'previous' => $v['previous'] ?? []];
    }

    private function storeUploads(Request $request, Student $student): void
    {
        foreach (['photo' => 'photo_path', 'signature' => 'signature_path'] as $input => $column) {
            if ($file = $request->file($input)) {
                if ($student->{$column}) {
                    Storage::disk('public')->delete($student->{$column});
                }
                $student->{$column} = $file->store("students/{$input}s", 'public');
            }
        }
    }

    private function syncPreviousExams(Student $student, array $previous): void
    {
        foreach (self::PREVIOUS_EXAMS as $exam) {
            $row = array_filter($previous[$exam] ?? [], fn ($v) => filled($v));
            if (isset($row['seat_no'])) {
                $row['seat_no'] = strtoupper(trim($row['seat_no']));
            }
            if ($row === []) {
                $student->previousExams()->where('exam', $exam)->delete();
                continue;
            }
            $student->previousExams()->updateOrCreate(['exam' => $exam], $row + ['seat_no' => null, 'month' => null, 'year' => null, 'percentage' => null, 'board_or_college' => null]);
        }
    }
}
