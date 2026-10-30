@php $landscape = $f['orientation'] === 'landscape'; $site = \App\Models\Setting::get('site_name', config('app.name')); @endphp
<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>{{ $cover['title'] ?: __('Panel list') }}</title>
    @vite(['resources/css/app.css'])
    <style>
        @page { size: A4 {{ $landscape ? 'landscape' : 'portrait' }}; margin: 10mm 10mm 12mm; }
        body { background: #e9edf3; margin: 0; color: #111; }
        .toolbar { position: sticky; top: 0; z-index: 10; display: flex; gap: 8px; justify-content: center; padding: 10px; background: #1d1846; }
        .pl-page { background: #fff; width: {{ $landscape ? '297mm' : '210mm' }}; min-height: {{ $landscape ? '210mm' : '297mm' }}; margin: 12px auto; padding: 10mm; box-shadow: 0 4px 24px -12px rgba(21,35,63,.35); font-size: 9.6pt; line-height: 1.35; }
        .pl-page + .pl-page { break-before: page; page-break-before: always; }
        .pl-head { text-align: center; border-bottom: 1.4px solid #111; padding-bottom: 3mm; }
        .pl-site { font-size: 8pt; letter-spacing: .06em; text-transform: uppercase; color: #444; }
        .pl-title { font-family: var(--font-display); font-weight: 700; font-size: 13pt; margin-top: 1mm; letter-spacing: .02em; }
        .pl-sub { margin-top: 1.5mm; font-weight: 600; text-transform: uppercase; font-size: 9pt; }
        .pl-note { margin-top: 1.5mm; font-size: 9pt; }
        .pl-meta { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 2mm 6mm; margin: 3mm 0 2.5mm; font-weight: 700; font-size: 9.5pt; text-transform: uppercase; }
        .pl-table { width: 100%; border-collapse: collapse; }
        .pl-table th, .pl-table td { border: .7px solid #777; padding: 1.6mm 2mm; text-align: left; vertical-align: top; }
        .pl-table th { background: #eef1f8; font-size: 8pt; text-transform: uppercase; letter-spacing: .03em; }
        .pl-table thead { display: table-header-group; }
        .pl-table tr { break-inside: avoid; page-break-inside: avoid; }
        .pl-table td.num, .pl-table th.num { text-align: center; width: 1%; white-space: nowrap; }
        .pl-table td.code { white-space: nowrap; font-variant-numeric: tabular-nums; }
        .pl-table td.nm { font-weight: 600; white-space: nowrap; }
        .pl-table td.col { max-width: 45mm; }
        .pl-table .sig { width: 32mm; }
        .pl-table td.sig { height: 10mm; }
        .pl-table .sub { display: block; font-size: 8pt; color: #555; }
        .pl-foot { display: flex; justify-content: space-between; align-items: flex-end; gap: 10mm; margin-top: 16mm; }
        .pl-foot .line { min-width: 70mm; border-top: 1px solid #111; padding-top: 1.5mm; text-align: center; font-weight: 600; }
        .pl-small { font-size: 8pt; color: #555; }
        @media print { body { background: #fff; } .pl-page { margin: 0; box-shadow: none; width: auto; min-height: auto; padding: 0; } .toolbar { display: none; } }
    </style>
</head>
<body>
    <div class="toolbar no-print">
        <button type="button" onclick="window.print()" class="btn-gold btn-sm"><x-icon name="printer" />{{ __('Print') }}</button>
        <button type="button" onclick="history.length > 1 ? history.back() : window.close()" class="btn-secondary btn-sm">{{ __('Close') }}</button>
    </div>
    @foreach ($groups as $g)
        <article class="pl-page">
            <header class="pl-head">
                <p class="pl-site">{{ $cover['division']?->label ?? $site }}</p>
                @if ($cover['title'])<p class="pl-title">{{ $cover['title'] }}</p>@endif
                @if ($cover['subtitle'])<p class="pl-sub">{{ $cover['subtitle'] }}</p>@endif
                @if ($cover['note'])<p class="pl-note">{{ $cover['note_text'] }}</p>@endif
            </header>
            <div class="pl-meta">
                @if ($g['institute'])
                    <span>{{ __('College / school') }}: {{ $g['institute']->college_no }} &nbsp; {{ $g['institute']->name }}@if ($g['institute']->district), {{ $g['institute']->district }}@endif</span>
                @else
                    <span>{{ __('All colleges and schools') }}</span>
                @endif
                <span>{{ trans_choice(':count teacher|:count teachers', $g['rows']->count(), ['count' => $g['rows']->count()]) }}</span>
            </div>
            @include('panel._table', ['rows' => $g['rows'], 'perPage' => (bool) $g['institute']])
            <footer class="pl-foot">
                <p class="pl-small">{{ __('Printed on :date', ['date' => now()->format('d-m-Y h:i A')]) }} · {{ $site }}</p>
                @if ($cover['footer'])<div><p class="line">{{ $cover['footer'] }}</p><p class="pl-small mt-2">{{ __('Mobile no.') }} ____________________</p></div>@endif
            </footer>
        </article>
    @endforeach
    <script>
        (function () {
            const pages = () => document.querySelectorAll('.pl-page');
            const width = {{ $landscape ? 1123 : 794 }} + 24;
            const fit = () => { const w = document.documentElement.clientWidth; pages().forEach(p => p.style.zoom = w < width ? (w / width).toFixed(3) : ''); };
            fit(); addEventListener('resize', fit);
            addEventListener('beforeprint', () => pages().forEach(p => p.style.zoom = ''));
            addEventListener('afterprint', fit);
        })();
    </script>
</body>
</html>
