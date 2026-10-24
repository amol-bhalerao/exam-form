<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/** Uploaded images and PDFs that pages and notices can link to. */
class MediaController extends Controller
{
    public function index(Request $request)
    {
        $media = Media::query()
            ->when($request->query('type') === 'image', fn ($q) => $q->where('mime', 'like', 'image/%'))
            ->when($request->query('type') === 'pdf', fn ($q) => $q->where('mime', 'application/pdf'))
            ->when(trim((string) $request->query('q')), fn ($q, $t) => $q->where('original_name', 'like', "%{$t}%"))
            ->latest()->paginate(36)->withQueryString();
        return view('admin.media.index', ['media' => $media]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'files' => ['required', 'array', 'max:10'],
            'files.*' => ['file', 'mimes:jpg,jpeg,png,webp,gif,pdf', 'max:5120'],
        ]);
        foreach ($request->file('files') as $file) {
            $media = Media::create([
                'path' => $file->store('media/' . now()->format('Y/m'), 'public'),
                'original_name' => mb_substr($file->getClientOriginalName(), 0, 250),
                'mime' => $file->getMimeType(),
                'size' => $file->getSize(),
                'uploaded_by' => $request->user()->id,
            ]);
            AuditLog::record('media.uploaded', $media);
        }
        return back()->with('status', trans_choice(':count file uploaded.|:count files uploaded.', count($request->file('files')), ['count' => count($request->file('files'))]));
    }

    public function destroy(Media $media)
    {
        Storage::disk('public')->delete($media->path);
        $media->delete();
        AuditLog::record('media.deleted', null, ['name' => $media->original_name]);
        return back()->with('status', __('File deleted.'));
    }
}
