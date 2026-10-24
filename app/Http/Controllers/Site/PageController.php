<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Models\Page;

class PageController extends Controller
{
    public function show(Page $page)
    {
        $preview = auth()->user()?->isRole('super_admin');
        abort_unless($preview || Page::published()->whereKey($page->id)->exists(), 404);
        $children = $page->children()->published()->get(['title', 'slug', 'summary']);

        return view('site.page', compact('page', 'children'));
    }
}
