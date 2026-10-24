@props(['title' => null])
<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>{{ $title }}</title>
    @vite(['resources/css/app.css'])
    <style>
        @page { size: A4; margin: 9mm; }
        body { background: #e9edf3; }
        .page { background: #fff; width: 210mm; min-height: 297mm; margin: 12px auto; padding: 9mm; box-shadow: 0 4px 24px -12px rgba(21,35,63,.35); color: #111; font-size: 9.3pt; line-height: 1.35; }
        .page + .page { page-break-before: always; }
        .pf-head { display: grid; grid-template-columns: 1fr 58mm; border: 1.4px solid #111; }
        .pf-head > div { padding: 2.5mm 3mm; }
        .pf-title { text-align: center; border-right: 1.4px solid #111; }
        .pf-title .t1 { font-size: 8pt; letter-spacing: .08em; font-weight: 700; text-transform: uppercase; }
        .pf-title .t2 { font-family: var(--font-display); font-size: 12.5pt; font-weight: 700; font-stretch: 108%; margin-top: 1mm; }
        .pf-meta { display: flex; flex-wrap: wrap; gap: 1mm 5mm; justify-content: center; margin-top: 1.5mm; font-weight: 600; }
        .pf-ids div { display: flex; justify-content: space-between; gap: 2mm; padding: 1.2mm 0; border-bottom: .8px solid #bbb; }
        .pf-ids div:last-child { border-bottom: 0; }
        .pf-ids span { color: #555; }
        .pf-ids b { font-variant-numeric: tabular-nums; text-align: right; }
        .pf-sec { margin-top: 2.5mm; border: 1px solid #111; }
        .pf-sec > h3 { margin: 0; padding: 1mm 2.5mm; font-family: var(--font-sans); font-size: 8pt; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #fff; background: #15233f; }
        .pf-grid { display: grid; grid-template-columns: 1fr 1fr; }
        .pf-row { display: grid; grid-template-columns: 34mm 1fr; border-bottom: .6px solid #ccc; }
        .pf-row:nth-last-child(-n+2) { border-bottom: 0; }
        .pf-row > span { padding: 1.1mm 2.5mm; }
        .pf-row > span:first-child { color: #444; }
        .pf-row > span:last-child { font-weight: 700; text-transform: uppercase; }
        .pf-grid .pf-row:nth-child(odd) { border-right: .6px solid #ccc; }
        .pf-table { width: 100%; border-collapse: collapse; }
        .pf-table th, .pf-table td { border: .6px solid #999; padding: .9mm 2mm; text-align: left; }
        .pf-table th { background: #eef2f8; font-size: 8pt; text-transform: uppercase; letter-spacing: .03em; }
        .pf-table td { font-weight: 600; }
        .pf-foot { display: grid; grid-template-columns: minmax(0,1fr) 31mm 33mm; gap: 2.5mm; margin-top: 2.5mm; }
        .pf-foot > * { min-width: 0; overflow: hidden; }
        .pf-box { border: 1px solid #111; padding: 2mm; }
        .pf-photo { display: grid; place-items: center; height: 36mm; border: 1px dashed #999; }
        .pf-photo img { max-height: 34mm; max-width: 27mm; object-fit: cover; }
        .pf-sign { height: 12mm; display: grid; place-items: center; margin-top: 1.5mm; border-top: .6px solid #ccc; }
        .pf-sign img { max-height: 11mm; max-width: 100%; object-fit: contain; }
        .pf-status { display: inline-block; border: 1px solid #111; padding: 0 1.5mm; font-size: 7.5pt; text-transform: uppercase; font-weight: 700; }
        .pf-note { margin-top: 2mm; display: flex; justify-content: space-between; font-size: 7.5pt; color: #555; }
        .toolbar { position: sticky; top: 0; z-index: 10; display: flex; gap: 8px; justify-content: center; padding: 10px; background: #15233f; }
        @media print { body { background: #fff; } .page { margin: 0; box-shadow: none; width: auto; min-height: auto; padding: 0; } .toolbar { display: none; } }
    </style>
</head>
<body>
    <div class="toolbar no-print">
        <button type="button" onclick="window.print()" class="btn-primary btn-sm"><x-icon name="printer" />{{ __('Print') }}</button>
        <button type="button" onclick="history.length > 1 ? history.back() : window.close()" class="btn-secondary btn-sm">{{ __('Close') }}</button>
    </div>
    {{ $slot }}
<script>
    // On phones, shrink the A4 sheets to fit the screen (printing is unaffected).
    (function () {
        const pages = () => document.querySelectorAll('.page');
        const fit = () => { const w = document.documentElement.clientWidth, a4 = 794 + 24; pages().forEach(p => p.style.zoom = w < a4 ? (w / a4).toFixed(3) : ''); };
        fit(); addEventListener('resize', fit);
        addEventListener('beforeprint', () => pages().forEach(p => p.style.zoom = ''));
        addEventListener('afterprint', fit);
    })();
</script>
</body>
</html>
