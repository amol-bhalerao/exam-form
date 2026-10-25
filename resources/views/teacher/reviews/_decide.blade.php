<form method="POST" action="{{ $action }}" class="mt-4 flex flex-wrap items-center gap-2 border-t border-rule pt-4">
    @csrf
    @empty($noNote)<input name="note" class="input !min-h-10 flex-1 basis-60" maxlength="300" placeholder="{{ __('Note to the student (optional)') }}">@endempty
    <button name="decision" value="approved" class="btn-ok btn-sm"><x-icon name="check" />{{ __('Approve') }}</button>
    @if ($edit)<a href="{{ $edit }}" class="btn-secondary btn-sm"><x-icon name="pencil" />{{ __('Correct and approve') }}</a>@endif
    <button name="decision" value="rejected" class="btn-quiet btn-sm text-omr"><x-icon name="x" />{{ __('Not approve') }}</button>
</form>
