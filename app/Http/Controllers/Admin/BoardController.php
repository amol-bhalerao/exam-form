<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Board;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Exam boards / exam levels (HSC, SSC, or any other examination body using the portal).
 * Each has its own streams, subjects, colleges, exams and form numbers.
 */
class BoardController extends Controller
{
    public function index()
    {
        return view('admin.boards.index', [
            'boards' => Board::withCount(['institutes', 'streams', 'subjects', 'exams'])->orderBy('sort')->get(),
        ]);
    }

    public function create()
    {
        return view('admin.boards.form', ['board' => new Board(['has_streams' => true, 'sort' => (Board::max('sort') ?? 0) + 1])]);
    }

    public function store(Request $request)
    {
        $board = Board::create($this->validated($request));
        AuditLog::record('board.created', $board);
        return redirect()->route('admin.boards.index')->with('status', __(':name created. Add its streams and subjects next.', ['name' => $board->short_name]));
    }

    public function edit(Board $board)
    {
        return view('admin.boards.form', ['board' => $board]);
    }

    public function update(Request $request, Board $board)
    {
        $board->update($this->validated($request, $board));
        AuditLog::record('board.updated', $board);
        return redirect()->route('admin.boards.index')->with('status', __('Details saved for :name.', ['name' => $board->short_name]));
    }

    public function destroy(Board $board)
    {
        if ($board->institutes()->exists() || $board->exams()->exists() || $board->subjects()->exists()) {
            return back()->with('warning', __('This board already has colleges, subjects or exams, so it cannot be deleted.'));
        }
        $board->streams()->delete();
        $board->delete();
        AuditLog::record('board.deleted', null, ['code' => $board->code]);
        return redirect()->route('admin.boards.index')->with('status', __(':name has been removed.', ['name' => $board->short_name]));
    }

    private function validated(Request $request, ?Board $board = null): array
    {
        $v = $request->validate([
            'code' => ['required', 'string', 'max:10', 'regex:/^[A-Z0-9]+$/', Rule::unique('boards')->ignore($board?->id)],
            'name' => ['required', 'string', 'max:150'],
            'name_mr' => ['nullable', 'string', 'max:150'],
            'name_hi' => ['nullable', 'string', 'max:150'],
            'short_name' => ['required', 'string', 'max:40'],
            'sort' => ['nullable', 'integer', 'between:0,999'],
        ], ['code.regex' => __('Use capital letters and numbers only, e.g. HSC.')]);
        $v['has_streams'] = $request->boolean('has_streams');
        $v['sort'] = (int) ($v['sort'] ?? 0);
        return $v;
    }
}
