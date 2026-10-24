<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Page;
use App\Support\Html;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** Website pages: create as many as needed, place them in the header or footer menu, and set SEO details. */
class PageController extends Controller
{
    public function index(Request $request)
    {
        $pages = Page::query()->with('parent')
            ->when($request->query('status'), fn ($q, $s) => $q->where('status', $s))
            ->when(trim((string) $request->query('q')), fn ($q, $t) => $q->where(fn ($w) => $w->where('title', 'like', "%{$t}%")->orWhere('slug', 'like', "%{$t}%")))
            ->orderByDesc('in_header')->orderBy('menu_order')->orderBy('title')->get();
        return view('admin.pages.index', ['pages' => $pages]);
    }

    public function create()
    {
        return $this->form(new Page(['status' => 'draft', 'layout' => 'default']));
    }

    public function store(Request $request)
    {
        $page = new Page($this->validated($request));
        $this->storeHero($request, $page);
        $page->updated_by = $request->user()->id;
        $page->save();
        AuditLog::record('page.created', $page);
        return redirect()->route('admin.pages.edit', $page)->with('status', __('Page saved.'));
    }

    public function edit(Page $page)
    {
        return $this->form($page);
    }

    public function update(Request $request, Page $page)
    {
        $page->fill($this->validated($request, $page));
        if ($request->boolean('remove_hero') && $page->hero_image) {
            $page->hero_image = null;
        }
        $this->storeHero($request, $page);
        $page->updated_by = $request->user()->id;
        $page->save();
        AuditLog::record('page.updated', $page);
        return redirect()->route('admin.pages.edit', $page)->with('status', __('Page saved.'));
    }

    public function destroy(Page $page)
    {
        $page->children()->update(['parent_id' => null]);
        $page->delete();
        AuditLog::record('page.deleted', null, ['slug' => $page->slug]);
        return redirect()->route('admin.pages.index')->with('status', __('Page deleted.'));
    }

    private function form(Page $page)
    {
        return view('admin.pages.form', [
            'page' => $page,
            'parents' => Page::where('id', '!=', $page->id ?? 0)->whereNull('parent_id')->orderBy('title')->pluck('title', 'id'),
        ]);
    }

    /** First URL segments already used by the application, which a page slug must not take. */
    public static function reservedSlugs(): array
    {
        $reserved = ['admin', 'board', 'institute', 'student', 'login', 'logout', 'auth', 'api', 'storage', 'build', 'notices', 'exams', 'verify', 'forms', 'payments', 'password', 'sitemap.xml', 'robots.txt', 'lang', 'up'];
        foreach (Route::getRoutes() as $route) {
            $first = explode('/', trim($route->uri(), '/'))[0] ?? '';
            if ($first !== '' && ! str_contains($first, '{')) {
                $reserved[] = $first;
            }
        }
        return array_values(array_unique(array_merge($reserved, array_values(config('portal.login_paths', [])))));
    }

    private function validated(Request $request, ?Page $page = null): array
    {
        $request->merge(['slug' => Str::slug($request->input('slug') ?: Str::limit((string) $request->input('title'), 60, '')) ?: 'page-' . now()->format('His')]);
        $v = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'slug' => ['required', 'string', 'max:120', 'regex:/^[a-z0-9-]+$/', Rule::unique('pages')->ignore($page?->id), Rule::notIn(self::reservedSlugs())],
            'summary' => ['nullable', 'string', 'max:300'],
            'body' => ['nullable', 'string', 'max:500000'],
            'layout' => ['required', Rule::in(['default', 'wide', 'landing'])],
            'hero' => ['nullable', 'image', 'max:2048'],
            'seo_title' => ['nullable', 'string', 'max:70'],
            'seo_description' => ['nullable', 'string', 'max:300'],
            'seo_keywords' => ['nullable', 'string', 'max:255'],
            'status' => ['required', Rule::in(['draft', 'published'])],
            'menu_order' => ['nullable', 'integer', 'between:0,999'],
            'parent_id' => ['nullable', 'exists:pages,id'],
            'published_at' => ['nullable', 'date'],
        ], ['slug.not_in' => __('This web address is used by the portal. Choose another.')]);
        unset($v['hero']);
        $v['body'] = Html::clean($v['body'] ?? null);
        foreach (['noindex', 'in_header', 'in_footer'] as $flag) {
            $v[$flag] = $request->boolean($flag);
        }
        $v['menu_order'] = (int) ($v['menu_order'] ?? 0);
        if ($v['status'] === 'published' && empty($v['published_at'])) {
            $v['published_at'] = $page?->published_at ?? now();
        }
        return $v;
    }

    private function storeHero(Request $request, Page $page): void
    {
        if ($file = $request->file('hero')) {
            $page->hero_image = $file->store('pages', 'public');
        }
    }
}
