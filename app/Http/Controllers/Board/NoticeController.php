<?php

namespace App\Http\Controllers\Board;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Notice;
use App\Support\Codes;
use App\Support\Html;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** Notices, circulars and timetables published on the public website by the board. */
class NoticeController extends Controller
{
    public function index(Request $request)
    {
        $notices = $this->scope($request)
            ->when($request->query('category'), fn ($q, $c) => $q->where('category', $c))
            ->when(trim((string) $request->query('q')), fn ($q, $t) => $q->where('title', 'like', "%{$t}%"))
            ->orderByDesc('is_pinned')->latest('published_at')->latest('id')->paginate(25)->withQueryString();
        return view('notices.manage.index', ['notices' => $notices, 'routePrefix' => $this->prefix()]);
    }

    public function create()
    {
        return view('notices.manage.form', ['notice' => new Notice(['category' => 'notice', 'status' => 'published', 'published_at' => now()]), 'routePrefix' => $this->prefix()]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $notice = new Notice($data);
        $notice->board_id = $this->boardId($request);
        $notice->created_by = $request->user()->id;
        $notice->slug = $this->slug($data['title']);
        $this->storeAttachment($request, $notice);
        $notice->save();
        AuditLog::record('notice.created', $notice);
        return redirect()->route($this->prefix() . '.notices.index')->with('status', __('Notice published.'));
    }

    public function edit(Request $request, Notice $notice)
    {
        $this->authorizeNotice($request, $notice);
        return view('notices.manage.form', ['notice' => $notice, 'routePrefix' => $this->prefix()]);
    }

    public function update(Request $request, Notice $notice)
    {
        $this->authorizeNotice($request, $notice);
        $notice->fill($this->validated($request));
        if ($this->prefix() === 'admin') {
            $notice->board_id = $this->boardId($request);
        }
        if ($request->boolean('remove_attachment') && $notice->attachment_path) {
            Storage::disk('public')->delete($notice->attachment_path);
            $notice->attachment_path = null;
        }
        $this->storeAttachment($request, $notice);
        $notice->save();
        AuditLog::record('notice.updated', $notice);
        return redirect()->route($this->prefix() . '.notices.index')->with('status', __('Notice saved.'));
    }

    public function destroy(Request $request, Notice $notice)
    {
        $this->authorizeNotice($request, $notice);
        if ($notice->attachment_path) {
            Storage::disk('public')->delete($notice->attachment_path);
        }
        $notice->delete();
        AuditLog::record('notice.deleted', null, ['title' => $notice->title]);
        return redirect()->route($this->prefix() . '.notices.index')->with('status', __('Notice removed.'));
    }

    /** Board staff see their board's notices; the super admin (subclass) sees all. */
    protected function scope(Request $request)
    {
        return Notice::where('board_id', $request->user()->board_id);
    }

    protected function boardId(Request $request): ?int
    {
        return $request->user()->board_id;
    }

    protected function prefix(): string
    {
        return 'board';
    }

    protected function authorizeNotice(Request $request, Notice $notice): void
    {
        abort_unless($notice->board_id === $request->user()->board_id, 404);
    }

    private function validated(Request $request): array
    {
        $v = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'category' => ['required', Rule::in(array_keys(Codes::NOTICE_CATEGORIES))],
            'body' => ['nullable', 'string', 'max:200000'],
            'link_url' => ['nullable', 'url', 'max:255'],
            'attachment' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'published_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after:published_at'],
            'status' => ['required', Rule::in(['published', 'draft'])],
            'board_id' => ['nullable', 'exists:boards,id'],
        ]);
        unset($v['attachment'], $v['board_id']);
        $v['body'] = Html::clean($v['body'] ?? null);
        $v['is_pinned'] = $request->boolean('is_pinned');
        $v['in_ticker'] = $request->boolean('in_ticker');
        $v['published_at'] ??= now();
        return $v;
    }

    private function storeAttachment(Request $request, Notice $notice): void
    {
        if ($file = $request->file('attachment')) {
            if ($notice->attachment_path) {
                Storage::disk('public')->delete($notice->attachment_path);
            }
            $notice->attachment_path = $file->store('notices', 'public');
        }
    }

    private function slug(string $title): string
    {
        $base = Str::slug(Str::limit($title, 60, '')) ?: 'notice';
        $slug = $base . '-' . now()->format('Ymd');
        $i = 2;
        while (Notice::where('slug', $slug)->exists()) {
            $slug = $base . '-' . now()->format('Ymd') . '-' . $i++;
        }
        return $slug;
    }
}
