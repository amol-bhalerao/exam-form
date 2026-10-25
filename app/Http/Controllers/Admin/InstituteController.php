<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Board;
use App\Models\Institute;
use App\Models\Stream;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/** Master list of colleges (HSC) and schools (SSC): add, edit, deactivate, and bulk import from CSV. */
class InstituteController extends Controller
{
    public function index(Request $request)
    {
        $institutes = Institute::query()->with('board', 'division')
            ->search($request->query('q'))
            ->when($request->query('board'), fn ($q, $b) => $q->where('board_id', $b))
            ->when($request->query('division'), fn ($q, $d) => $q->where('division_id', $d))
            ->when($request->query('district'), fn ($q, $d) => $q->where('district', $d))
            ->when($request->query('active') === 'no', fn ($q) => $q->where('is_active', false))
            ->when($request->query('active') === 'yes', fn ($q) => $q->where('is_active', true))
            ->withCount(['users', 'applications as forms_count' => fn ($q) => $q->whereNotNull('paid_at')])
            ->orderBy('board_id')->orderBy('college_no')
            ->paginate(50)->withQueryString();

        return view('admin.institutes.index', [
            'institutes' => $institutes,
            'boards' => Board::orderBy('sort')->withCount('institutes')->get(),
            'divisions' => \App\Models\Division::options(),
            'districts' => Institute::whereNotNull('district')->distinct()->orderBy('district')->pluck('district'),
        ]);
    }

    public function create(Request $request)
    {
        return view('admin.institutes.form', $this->formData(new Institute([
            'board_id' => $request->integer('board') ?: Board::orderBy('sort')->value('id'), 'is_active' => true, 'accepting_forms' => true,
            'division_id' => $request->integer('division') ?: Institute::whereNotNull('division_id')->groupBy('division_id')->orderByRaw('count(*) desc')->value('division_id'),
        ])));
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $institute = DB::transaction(function () use ($data) {
            $institute = Institute::create($data['institute']);
            $institute->streams()->sync($data['streams']);
            return $institute;
        });
        AuditLog::record('institute.created', $institute);
        return redirect()->route('admin.institutes.edit', $institute)->with('status', __(':name added.', ['name' => $institute->name]));
    }

    public function edit(Institute $institute)
    {
        return view('admin.institutes.form', $this->formData($institute->load('streams', 'users')));
    }

    public function update(Request $request, Institute $institute)
    {
        $data = $this->validated($request, $institute);
        DB::transaction(function () use ($institute, $data) {
            $institute->update($data['institute']);
            $institute->streams()->sync($data['streams']);
        });
        AuditLog::record('institute.updated', $institute);
        return redirect()->route('admin.institutes.index', ['q' => $institute->college_no])->with('status', __('Details saved for :name.', ['name' => $institute->name]));
    }

    public function destroy(Institute $institute)
    {
        if ($institute->applications()->exists() || $institute->teachers()->exists()) {
            $institute->update(['is_active' => false, 'accepting_forms' => false]);
            $institute->users()->update(['is_active' => false]);
            AuditLog::record('institute.deactivated', $institute);
            return redirect()->route('admin.institutes.index')->with('status', __(':name has exam forms on record, so it was deactivated instead of deleted.', ['name' => $institute->name]));
        }
        $institute->users()->delete();
        $institute->delete();
        AuditLog::record('institute.deleted', null, ['college_no' => $institute->college_no]);
        return redirect()->route('admin.institutes.index')->with('status', __(':name has been removed.', ['name' => $institute->name]));
    }

    public function importForm()
    {
        return view('admin.institutes.import', ['boards' => Board::orderBy('sort')->get(), 'divisions' => \App\Models\Division::options()]);
    }

    /** CSV columns: college_no, name (required); division (code), udise_no, district, taluka, address, pincode, principal_name, contact_email, contact_mobile, streams (codes split by |). */
    public function import(Request $request)
    {
        $request->validate([
            'board_id' => ['required', 'exists:boards,id'],
            'division_id' => ['nullable', 'exists:divisions,id'],
            'file' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
        ]);
        $board = Board::findOrFail($request->integer('board_id'));
        $streams = Stream::where('board_id', $board->id)->pluck('id', 'code');
        $divisionCodes = \App\Models\Division::pluck('id', 'code');
        $defaultDivision = $request->integer('division_id') ?: null;

        $fh = fopen($request->file('file')->getRealPath(), 'r');
        $header = array_map(fn ($h) => strtolower(trim(preg_replace('/^\xEF\xBB\xBF/', '', (string) $h))), fgetcsv($fh) ?: []);
        if (! in_array('college_no', $header, true) || ! in_array('name', $header, true)) {
            return back()->withErrors(['file' => __('The first row must contain the column names college_no and name.')]);
        }
        $allowed = ['college_no', 'name', 'udise_no', 'district', 'taluka', 'address', 'pincode', 'principal_name', 'contact_email', 'contact_mobile'];
        $created = $updated = $skipped = 0;
        $errors = [];
        $line = 1;
        DB::transaction(function () use ($fh, $header, $allowed, $board, $streams, $request, $divisionCodes, $defaultDivision, &$created, &$updated, &$skipped, &$errors, &$line) {
            while (($row = fgetcsv($fh)) !== false) {
                $line++;
                if (count(array_filter($row, fn ($v) => trim((string) $v) !== '')) === 0) {
                    continue;
                }
                $r = array_combine($header, array_pad(array_slice($row, 0, count($header)), count($header), null));
                $no = trim((string) ($r['college_no'] ?? ''));
                $name = trim((string) ($r['name'] ?? ''));
                if ($no === '' || $name === '') {
                    $skipped++;
                    $errors[] = __('Row :n: college_no and name are required.', ['n' => $line]);
                    continue;
                }
                $values = collect($r)->only($allowed)->map(fn ($v) => ($v = trim((string) $v)) === '' ? null : $v)->filter(fn ($v) => $v !== null)->all();
                $existing = Institute::where('board_id', $board->id)->where('college_no', $no)->first();
                if ($existing && ! $request->boolean('update_existing')) {
                    $skipped++;
                    continue;
                }
                $institute = $existing ?? new Institute(['board_id' => $board->id, 'is_active' => true, 'accepting_forms' => true]);
                $division = ! empty($r['division']) ? ($divisionCodes[trim($r['division'])] ?? null) : null;
                $institute->fill($values + array_filter(['division_id' => $division ?? ($existing ? null : $defaultDivision)]))->save();
                $existing ? $updated++ : $created++;
                if (! empty($r['streams'])) {
                    $ids = collect(preg_split('/[|,;\s]+/', strtoupper($r['streams'])))->map(fn ($c) => $streams[$c] ?? null)->filter()->all();
                    $institute->streams()->sync($ids);
                } elseif (! $board->has_streams && $streams->isNotEmpty()) {
                    $institute->streams()->syncWithoutDetaching($streams->values()->all());
                }
            }
        });
        fclose($fh);
        AuditLog::record('institute.import', null, compact('created', 'updated', 'skipped') + ['board' => $board->code]);

        return redirect()->route('admin.institutes.index', ['board' => $board->id])
            ->with('status', __('Import finished: :c added, :u updated, :s skipped.', ['c' => $created, 'u' => $updated, 's' => $skipped]))
            ->with('warning', $errors ? implode(' ', array_slice($errors, 0, 5)) . (count($errors) > 5 ? ' …' : '') : null);
    }

    private function formData(Institute $institute): array
    {
        $boards = Board::orderBy('sort')->with(['streams' => fn ($q) => $q->orderBy('sort')])->get();
        return ['institute' => $institute, 'boards' => $boards, 'divisions' => \App\Models\Division::options()];
    }

    private function validated(Request $request, ?Institute $institute = null): array
    {
        $v = $request->validate([
            'board_id' => ['required', 'exists:boards,id'],
            'division_id' => ['nullable', 'exists:divisions,id'],
            'college_no' => ['required', 'string', 'max:20', Rule::unique('institutes')->where('board_id', $request->input('board_id'))->ignore($institute?->id)],
            'udise_no' => ['nullable', 'regex:/^\d{11}$/'],
            'name' => ['required', 'string', 'max:255'],
            'district' => ['nullable', 'string', 'max:80'],
            'taluka' => ['nullable', 'string', 'max:80'],
            'address' => ['nullable', 'string', 'max:300'],
            'pincode' => ['nullable', 'regex:/^\d{6}$/'],
            'principal_name' => ['nullable', 'string', 'max:150'],
            'contact_email' => ['nullable', 'email', 'max:150'],
            'contact_mobile' => ['nullable', 'regex:/^[6-9]\d{9}$/'],
            'streams' => ['array'],
            'streams.*' => [Rule::exists('streams', 'id')->where('board_id', $request->input('board_id'))],
        ], ['udise_no.regex' => __('UDISE number has 11 digits.')]);
        $streams = $v['streams'] ?? [];
        unset($v['streams']);
        $v['name'] = mb_strtoupper($v['name']);
        $v['is_active'] = $request->boolean('is_active');
        $v['accepting_forms'] = $request->boolean('accepting_forms');
        return ['institute' => $v, 'streams' => $streams];
    }
}
