<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\Notice;
use App\Support\Codes;
use Illuminate\Http\Request;

class NoticeController extends Controller
{
    public function index(Request $request)
    {
        $category = $request->query('category');
        $board = $request->query('board');
        $notices = Notice::live()->with('board')
            ->when(isset(Codes::NOTICE_CATEGORIES[$category]), fn ($q) => $q->where('category', $category))
            ->when($board, fn ($q) => $q->whereHas('board', fn ($b) => $b->where('code', $board)))
            ->orderByDesc('is_pinned')->latest('published_at')->paginate(15)->withQueryString();

        return view('site.notices.index', [
            'notices' => $notices,
            'category' => $category,
            'board' => $board,
            'boards' => Board::orderBy('sort')->get(),
        ]);
    }

    public function show(Notice $notice)
    {
        abort_unless(Notice::live()->whereKey($notice->id)->exists(), 404);
        $related = Notice::live()->where('id', '!=', $notice->id)->latest('published_at')->limit(4)->get();

        return view('site.notices.show', compact('notice', 'related'));
    }
}
