<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Division;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Divisional boards (Pune, Mumbai …): colleges, board officers and exams can belong to one. */
class DivisionController extends Controller
{
    public function index()
    {
        return view('admin.divisions.index', [
            'divisions' => Division::withCount(['institutes', 'users' => fn ($q) => $q->where('role', 'board')])->orderBy('sort')->orderBy('code')->get(),
        ]);
    }

    public function create()
    {
        return view('admin.divisions.form', ['division' => new Division(['is_active' => true, 'sort' => (Division::max('sort') ?? 0) + 1])]);
    }

    public function store(Request $request)
    {
        $d = Division::create($this->validated($request));
        AuditLog::record('division.created', $d);
        return redirect()->route('admin.divisions.index')->with('status', __(':name created.', ['name' => $d->name]));
    }

    public function edit(Division $division)
    {
        return view('admin.divisions.form', ['division' => $division]);
    }

    public function update(Request $request, Division $division)
    {
        $division->update($this->validated($request, $division));
        AuditLog::record('division.updated', $division);
        return redirect()->route('admin.divisions.index')->with('status', __('Details saved for :name.', ['name' => $division->name]));
    }

    public function destroy(Division $division)
    {
        if ($division->institutes()->exists() || $division->users()->exists()) {
            return back()->with('warning', __('This division has colleges or officers. Mark it inactive instead of deleting.'));
        }
        $division->delete();
        AuditLog::record('division.deleted', null, ['code' => $division->code]);
        return redirect()->route('admin.divisions.index')->with('status', __(':name has been removed.', ['name' => $division->name]));
    }

    private function validated(Request $request, ?Division $division = null): array
    {
        $v = $request->validate([
            'code' => ['required', 'string', 'max:10', 'regex:/^[A-Za-z0-9-]+$/', Rule::unique('divisions')->ignore($division?->id)],
            'name' => ['required', 'string', 'max:150'],
            'name_mr' => ['nullable', 'string', 'max:150'],
            'name_hi' => ['nullable', 'string', 'max:150'],
            'short_name' => ['required', 'string', 'max:60'],
            'address' => ['nullable', 'string', 'max:500'],
            'email' => ['nullable', 'email', 'max:150'],
            'phone' => ['nullable', 'string', 'max:40'],
            'website' => ['nullable', 'url', 'max:200'],
            'sort' => ['nullable', 'integer', 'between:0,999'],
        ]);
        $v['is_active'] = $request->boolean('is_active');
        $v['sort'] = (int) ($v['sort'] ?? 0);
        return $v;
    }
}
