<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\Exam;
use App\Models\Institute;
use App\Models\Notice;
use App\Models\Page;
use Illuminate\Http\Request;

class HomeController extends Controller
{
    public function index()
    {
        $openExams = Exam::open()->with(['board', 'stream', 'fees'])->orderBy('closes_at')->get();
        $upcoming = Exam::where('is_published', true)->where('opens_at', '>', now())->with('board')->orderBy('opens_at')->limit(3)->get();
        $notices = Notice::live()->with('board')->orderByDesc('is_pinned')->latest('published_at')->limit(6)->get();
        $guides = Page::published()->where('in_header', true)->orderBy('menu_order')->limit(4)->get(['title', 'slug', 'summary']);
        $boards = Board::orderBy('sort')->withCount('institutes')->get();

        return view('site.home', compact('openExams', 'upcoming', 'notices', 'guides', 'boards'));
    }

    public function exams()
    {
        $exams = Exam::where('is_published', true)->with(['board', 'stream', 'fees'])->orderByDesc('opens_at')->get()
            ->groupBy(fn ($e) => $e->board->short_name);

        return view('site.exams', compact('exams'));
    }

    public function language(Request $request, string $locale)
    {
        if (array_key_exists($locale, config('portal.locales'))) {
            $request->session()->put('locale', $locale);
            if ($user = $request->user()) {
                $user->forceFill(['locale' => $locale])->save();
            }
        }
        return back();
    }
}
