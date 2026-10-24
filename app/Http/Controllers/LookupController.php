<?php

namespace App\Http\Controllers;

use App\Models\Institute;
use Illuminate\Http\Request;

class LookupController extends Controller
{
    /** Typeahead search for colleges / schools. */
    public function institutes(Request $request)
    {
        $q = trim((string) $request->query('q'));
        if (mb_strlen($q) < 2) {
            return response()->json(['data' => []]);
        }
        // Students only see colleges currently accepting forms; the super admin can search every institute.
        $all = $request->boolean('all') && $request->user()?->isRole('super_admin');
        $rows = Institute::query()
            ->unless($all, fn ($w) => $w->where('is_active', true)->where('accepting_forms', true))
            ->when($request->query('board'), fn ($w, $b) => $w->where('board_id', $b))
            ->search($q)->with('board:id,short_name')->orderBy('college_no')->limit(15)
            ->get(['id', 'board_id', 'college_no', 'name', 'district']);

        return response()->json(['data' => $rows->map(fn ($i) => [
            'id' => $i->id,
            'label' => "{$i->name} ({$i->college_no})",
            'meta' => trim($i->board->short_name . ' · ' . $i->district, ' ·'),
        ])]);
    }
}
