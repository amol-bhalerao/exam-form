<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Models\Notice;
use App\Models\Page;

class SeoController extends Controller
{
    public function sitemap()
    {
        $urls = [
            ['loc' => route('home'), 'lastmod' => now(), 'priority' => '1.0'],
            ['loc' => route('notices.index'), 'lastmod' => Notice::live()->max('updated_at') ?? now(), 'priority' => '0.9'],
            ['loc' => route('exams.calendar'), 'lastmod' => now(), 'priority' => '0.8'],
        ];
        foreach (Page::published()->where('noindex', false)->get(['slug', 'updated_at']) as $p) {
            $urls[] = ['loc' => route('page.show', $p->slug), 'lastmod' => $p->updated_at, 'priority' => '0.7'];
        }
        foreach (Notice::live()->latest('published_at')->limit(500)->get(['slug', 'updated_at']) as $n) {
            $urls[] = ['loc' => route('notices.show', $n->slug), 'lastmod' => $n->updated_at, 'priority' => '0.6'];
        }

        return response()->view('site.sitemap', compact('urls'))->header('Content-Type', 'application/xml');
    }

    public function robots()
    {
        // Staff sign-in paths are deliberately NOT listed here (that would reveal them); those pages send noindex instead.
        $body = "User-agent: *\nDisallow: /student\nDisallow: /institute\nDisallow: /board\nDisallow: /admin\nDisallow: /forms\nDisallow: /account\nDisallow: /payments\nDisallow: /lookup\n\nSitemap: " . route('sitemap') . "\n";
        return response($body)->header('Content-Type', 'text/plain');
    }
}
