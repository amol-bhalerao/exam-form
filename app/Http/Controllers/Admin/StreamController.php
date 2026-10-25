<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Board;
use App\Models\Stream;
use Illuminate\Http\Request;

class StreamController extends Controller
{
    public function index()
    {
        return view('admin.streams.index', ['boards' => Board::orderBy('sort')->with(['streams' => fn ($q) => $q->orderBy('sort')->withCount('subjects')])->get()]);
    }

    public function store(Request $request)
    {
        $v = $request->validate([
            'board_id' => ['required', 'exists:boards,id'],
            'code' => ['required', 'string', 'max:10', 'regex:/^[A-Z0-9]+$/', \Illuminate\Validation\Rule::unique('streams')->where('board_id', $request->input('board_id'))],
            'name' => ['required', 'string', 'max:80'],
            'name_mr' => ['nullable', 'string', 'max:80'],
            'name_hi' => ['nullable', 'string', 'max:80'],
            'number' => ['nullable', 'integer', 'between:0,99'],
        ], ['code.regex' => __('Use capital letters and numbers only, e.g. SCI.')]);
        $stream = Stream::create($v + ['sort' => (Stream::where('board_id', $v['board_id'])->max('sort') ?? 0) + 1]);
        AuditLog::record('stream.created', $stream);
        return back()->with('status', __(':name created.', ['name' => $stream->name]));
    }

    public function update(Request $request, Stream $stream)
    {
        $stream->update($request->validate([
            'name' => ['required', 'string', 'max:80'],
            'name_mr' => ['nullable', 'string', 'max:80'],
            'name_hi' => ['nullable', 'string', 'max:80'],
            'number' => ['nullable', 'integer', 'between:0,99'],
            'sort' => ['nullable', 'integer', 'between:0,999'],
        ]));
        AuditLog::record('stream.updated', $stream);
        return back()->with('status', __('Details saved for :name.', ['name' => $stream->name]));
    }
}
