<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Board\NoticeController as BoardNotices;
use App\Models\Notice;
use Illuminate\Http\Request;

/** Same notice editor as the board, but across all boards (or site-wide with no board). */
class NoticeController extends BoardNotices
{
    protected function scope(Request $request)
    {
        return Notice::query()->with('board')->when($request->query('board'), fn ($q, $b) => $q->where('board_id', $b));
    }

    protected function boardId(Request $request): ?int
    {
        return $request->integer('board_id') ?: null;
    }

    protected function prefix(): string
    {
        return 'admin';
    }

    protected function authorizeNotice(Request $request, Notice $notice): void
    {
    }
}
