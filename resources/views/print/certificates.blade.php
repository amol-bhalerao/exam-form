@php
    use SimpleSoftwareIO\QrCode\Facades\QrCode;
    $site = \App\Models\Setting::get('site_name', config('app.name'));
@endphp
<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>{{ __('Certificates') }} · {{ $quiz->title }}</title>
    @vite(['resources/css/app.css'])
    <style>
        @page { size: A4 landscape; margin: 0; }
        body { background: #e6e8f0; margin: 0; }
        .toolbar { position: sticky; top: 0; z-index: 10; display: flex; gap: 8px; justify-content: center; padding: 10px; background: #1d1846; }
        .cert { position: relative; width: 297mm; height: 210mm; margin: 14px auto; background: #fff; box-shadow: 0 8px 30px -14px rgba(20,17,74,.45); overflow: hidden; color: #1d1846; page-break-after: always; break-after: page; }
        .cert:last-child { page-break-after: auto; break-after: auto; }
        .cert-in { position: absolute; inset: 14mm; display: flex; flex-direction: column; align-items: center; text-align: center; }
        .c-inst { font-weight: 700; letter-spacing: .06em; text-transform: uppercase; font-size: 11pt; }
        .c-site { font-size: 9pt; opacity: .7; margin-top: 1mm; }
        .c-title { font-family: var(--font-display); font-size: 34pt; font-weight: 800; line-height: 1.05; margin-top: 9mm; font-stretch: 112%; }
        .c-sub { font-size: 12pt; letter-spacing: .3em; text-transform: uppercase; margin-top: 2mm; }
        .c-lead { font-size: 12pt; margin-top: 9mm; }
        .c-name { font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 30pt; font-weight: 700; margin-top: 3mm; padding: 0 10mm 1.5mm; border-bottom: 1.2px solid currentColor; min-width: 150mm; }
        .c-body { font-size: 12.5pt; line-height: 1.6; max-width: 205mm; margin-top: 6mm; }
        .c-score { display: inline-block; font-weight: 800; }
        .c-foot { margin-top: auto; width: 100%; display: grid; grid-template-columns: 1fr 34mm 1fr; align-items: end; gap: 8mm; }
        .c-sign { border-top: 1px solid currentColor; padding-top: 2mm; font-size: 10pt; }
        .c-sign b { display: block; font-size: 11pt; }
        .c-qr svg { width: 26mm; height: 26mm; margin: 0 auto; display: block; }
        .c-serial { font-size: 7.5pt; margin-top: 1mm; font-family: ui-monospace, monospace; }

        /* 1. Paithani — gold zari frame, peacock corners */
        .t-paithani { background: radial-gradient(60% 60% at 50% 40%, #fffaf0, #fff4dc); }
        .t-paithani::before { content: ''; position: absolute; inset: 6mm; border: 5mm solid transparent; border-image: repeating-linear-gradient(45deg, #c8175d 0 6mm, #e7a10b 6mm 9mm, #5b2a86 9mm 15mm, #e7a10b 15mm 18mm) 30; }
        .t-paithani::after { content: ''; position: absolute; inset: 13mm; border: 1px solid #b8860b; }
        .t-paithani .c-title { background: linear-gradient(90deg, #c8175d, #5b2a86); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .t-paithani .c-sub { color: #0f8c87; }
        .t-paithani .corner { position: absolute; width: 22mm; height: 22mm; border-radius: 50%; background: radial-gradient(circle, #0b5cad 0 18%, #0f8c87 19% 38%, #e7a10b 39% 46%, transparent 47%); opacity: .9; }

        /* 2. Classic — formal double rule, serif */
        .t-classic { background: #fdfcf8; font-family: Georgia, 'Times New Roman', serif; }
        .t-classic::before { content: ''; position: absolute; inset: 7mm; border: 2.5px solid #1d1846; }
        .t-classic::after { content: ''; position: absolute; inset: 10mm; border: 1px solid #1d1846; }
        .t-classic .c-title { font-family: Georgia, serif; font-weight: 700; letter-spacing: .04em; font-size: 32pt; }
        .t-classic .c-sub { color: #6b6890; }

        /* 3. Merit — gold seal and ribbon */
        .t-merit { background: linear-gradient(135deg, #fffdf6, #fff3d3); }
        .t-merit::before { content: ''; position: absolute; inset: 8mm; border: 2px solid #b8860b; border-radius: 4mm; }
        .t-merit .c-title { color: #7a1236; }
        .t-merit .c-sub { color: #b8860b; }
        .t-merit .seal { position: absolute; right: 26mm; top: 22mm; width: 34mm; height: 34mm; border-radius: 50%; display: grid; place-items: center; color: #fff; font-weight: 800; font-size: 10pt; letter-spacing: .08em; text-transform: uppercase;
            background: radial-gradient(circle, #f3c94b 0 55%, #d79c12 56% 62%, #f3c94b 63% 100%); box-shadow: 0 0 0 2mm #fff3d3, 0 0 0 2.6mm #d79c12; color: #6b4600; }
        .t-merit .seal::before, .t-merit .seal::after { content: ''; position: absolute; top: 28mm; width: 9mm; height: 18mm; background: #c8175d; z-index: -1; }
        .t-merit .seal::before { left: 7mm; transform: rotate(14deg); clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%); }
        .t-merit .seal::after { right: 7mm; transform: rotate(-14deg); clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%); }

        /* 4. Modern — clean, colour band */
        .t-modern { background: #fff; }
        .t-modern::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 18mm; background: linear-gradient(180deg, #0b5cad, #0f8c87 40%, #e7a10b 70%, #c8175d); }
        .t-modern .cert-in { left: 32mm; align-items: flex-start; text-align: left; }
        .t-modern .c-title { color: #0b5cad; font-size: 38pt; }
        .t-modern .c-sub { color: #c8175d; letter-spacing: .2em; }
        .t-modern .c-name { font-family: var(--font-display); font-style: normal; padding-left: 0; }

        html:not([lang='en']) .c-sub, html:not([lang='en']) .t-modern .c-sub { letter-spacing: .04em; font-size: 15pt; font-weight: 700; }
        @media print { body { background: #fff; } .cert { margin: 0; box-shadow: none; } .toolbar { display: none; } }
    </style>
</head>
<body>
    <div class="toolbar no-print">
        <button type="button" onclick="window.print()" class="btn-gold btn-sm"><x-icon name="printer" />{{ __('Print :n certificate(s)', ['n' => $certificates->count()]) }}</button>
        <button type="button" onclick="history.length > 1 ? history.back() : window.close()" class="btn-secondary btn-sm">{{ __('Close') }}</button>
    </div>
    @foreach ($certificates as $c)
        @php
            $passed = $c->attempt->percent() >= $quiz->pass_percent;
            $qr = (string) QrCode::format('svg')->size(100)->margin(0)->errorCorrection('M')->generate(route('certificate.verify', $c->serial));
            $date = ($c->attempt->submitted_at ?? $c->created_at)->format('d M Y');
        @endphp
        <article class="cert t-{{ $c->template }}">
            @if ($c->template === 'paithani')
                <span class="corner" style="left:16mm;top:16mm"></span><span class="corner" style="right:16mm;top:16mm"></span>
                <span class="corner" style="left:16mm;bottom:16mm"></span><span class="corner" style="right:16mm;bottom:16mm"></span>
            @endif
            @if ($c->template === 'merit')<span class="seal">{{ $passed ? __('Merit') : __('Award') }}</span>@endif
            <div class="cert-in">
                <p class="c-inst">{{ $quiz->institute->display_name ?? $quiz->institute->name }}</p>
                <p class="c-site">{{ $site }}</p>
                <p class="c-title">{{ __('Certificate') }}</p>
                <p class="c-sub">{{ $passed ? __('of Achievement') : __('of Participation') }}</p>
                <p class="c-lead">{{ __('This is proudly presented to') }}</p>
                <p class="c-name">{{ $c->student->full_name }}</p>
                <p class="c-body">
                    @if ($passed)
                        {!! __('for successfully completing the test :test in :subject held on :date, scoring :score.', [
                            'test' => '<b>' . e($quiz->title) . '</b>', 'subject' => '<b>' . e($quiz->subject->label) . '</b>', 'date' => e($date),
                            'score' => '<span class="c-score">' . $c->attempt->percent() . '% (' . rtrim(rtrim(number_format($c->attempt->score, 2), '0'), '.') . '/' . rtrim(rtrim(number_format($c->attempt->max_score, 2), '0'), '.') . ')</span>',
                        ]) !!}
                    @else
                        {!! __('for taking part in the test :test in :subject held on :date.', [
                            'test' => '<b>' . e($quiz->title) . '</b>', 'subject' => '<b>' . e($quiz->subject->label) . '</b>', 'date' => e($date),
                        ]) !!}
                    @endif
                </p>
                <div class="c-foot">
                    <div class="c-sign"><b>{{ $teacher?->name ?? $quiz->author?->name }}</b>{{ __('Subject teacher') }}</div>
                    <div class="c-qr">{!! $qr !!}<p class="c-serial">{{ $c->serial }}</p></div>
                    <div class="c-sign"><b>&nbsp;</b>{{ __('Principal / Head') }}</div>
                </div>
            </div>
        </article>
    @endforeach
<script>
    (function () {
        const certs = () => document.querySelectorAll('.cert');
        const fit = () => { const w = document.documentElement.clientWidth, a4 = 1123 + 28; certs().forEach(p => p.style.zoom = w < a4 ? (w / a4).toFixed(3) : ''); };
        fit(); addEventListener('resize', fit);
        addEventListener('beforeprint', () => certs().forEach(p => p.style.zoom = ''));
        addEventListener('afterprint', fit);
    })();
</script>
</body>
</html>
