<?php

namespace Database\Seeders;

use App\Models\Notice;
use App\Models\Page;
use App\Models\Setting;
use Illuminate\Database\Seeder;

/** Default website settings, pages and a first notice. Existing content is never overwritten. */
class SiteContentSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            'site_name' => 'Board Exam',
            'site_name_mr' => 'बोर्ड परीक्षा',
            'tagline' => 'Fill, pay and track your board exam form online — in Marathi, Hindi or English.',
            'tagline_mr' => 'बोर्ड परीक्षेचा अर्ज ऑनलाइन भरा, शुल्क भरा आणि स्थिती पहा — मराठी, हिंदी किंवा इंग्रजीत.',
            'tagline_hi' => 'बोर्ड परीक्षा का आवेदन ऑनलाइन भरें, शुल्क भरें और स्थिति देखें — मराठी, हिंदी या अंग्रेज़ी में।',
            'division' => 'Chh. Sambhajinagar Division',
            'helpline_phone' => '',
            'helpline_email' => 'mail.hscinfo@gmail.com',
            'helpline_hours' => 'Monday to Saturday, 10:00 am – 6:00 pm',
            'address' => '',
            'footer_note' => 'Exam form portal for HSC and SSC candidates. Developed by Hisoft IT Solutions.',
            'seo_description' => 'Online HSC (Std XII) and SSC (Std X) board exam form portal: apply, pay the exam fee, print your form and follow board notices.',
            'seo_keywords' => 'HSC exam form, SSC exam form, board exam form online, 12th exam form, 10th exam form, Maharashtra board',
            'ticker_enabled' => '1',
        ];
        foreach ($defaults as $key => $value) {
            Setting::firstOrCreate(['key' => $key], ['value' => $value]);
        }

        $pages = [
            ['how-to-apply', 'How to apply', 'Five steps from sign-in to a printed exam form.', true, false, 1, <<<'HTML'
<h2>Before you start</h2>
<p>Keep these ready: Aadhaar number, APAAR ID (if issued), previous exam seat number and marks, a recent passport-size photo and a signature on white paper (JPG or PNG, under 300 KB each).</p>
<h2>Steps</h2>
<ol>
<li><strong>Sign in with Google.</strong> Use an email you check. One account can add more than one student — useful for parents and helpers.</li>
<li><strong>Add the student.</strong> Choose the board (HSC or SSC), the college or school, and the stream. Fill personal details once; every future form reuses them.</li>
<li><strong>Fill the exam form.</strong> Pick the exam and candidate type (regular, repeater, improvement, isolated or private), then choose subjects. Only subjects your college offers are shown.</li>
<li><strong>Pay the exam fee</strong> online by UPI, card or net banking. The receipt is saved in your account.</li>
<li><strong>Track and print.</strong> Your college checks the form and forwards it to the board. You can print the form at any stage after payment.</li>
</ol>
HTML],
            ['fees-and-refunds', 'Fees and refunds', 'Exam fees, late fees and when a refund is possible.', true, true, 2, <<<'HTML'
<p>The exam fee depends on the exam and candidate type and is shown before you pay. A late fee applies only after the normal last date, during the late window announced by the board.</p>
<h2>Refunds</h2>
<p>Fees are not refundable once a form is submitted, except for duplicate or failed payments where the amount was debited. Such amounts are returned to the same account within 7–10 working days after verification.</p>
HTML],
            ['about', 'About this portal', 'What the portal does and who runs it.', false, true, 3, <<<'HTML'
<p>This portal lets HSC (Std XII) and SSC (Std X) candidates fill their board exam forms online, pay the fee and follow the form until the board approves it. Colleges and schools verify the forms and forward them to the board; the board publishes exams and notices here.</p>
HTML],
            ['contact', 'Contact and help', 'Who to contact for form, payment or login problems.', true, true, 4, <<<'HTML'
<p>For questions about your form, contact your college or school first — they can correct and verify your form.</p>
<p>For payment or login problems write to the helpline with your application number.</p>
HTML],
            ['terms', 'Terms of use', 'Rules for using the portal.', false, true, 5, '<p>By using this portal you confirm that the information you submit is true. False information can lead to cancellation of the form or result.</p>'],
            ['privacy', 'Privacy policy', 'How student data is collected and protected.', false, true, 6, '<p>We collect only the details required by the board for the exam form. Aadhaar numbers are stored encrypted and shown masked. Data is shared only with your college or school and the board.</p>'],
        ];
        foreach ($pages as [$slug, $title, $summary, $header, $footer, $order, $body]) {
            Page::firstOrCreate(['slug' => $slug], [
                'title' => $title, 'summary' => $summary, 'body' => $body, 'status' => 'published',
                'in_header' => $header, 'in_footer' => $footer, 'menu_order' => $order, 'published_at' => now(),
                'seo_description' => $summary,
            ]);
        }

        Notice::firstOrCreate(['slug' => 'online-exam-forms-open'], [
            'title' => 'Online exam forms are now accepted through this portal',
            'category' => 'notice',
            'body' => '<p>Candidates can now sign in with Google, add student details and fill the exam form online. Colleges and schools verify the forms before they reach the board.</p>',
            'is_pinned' => true, 'in_ticker' => true, 'published_at' => now(), 'status' => 'published',
        ]);
    }
}
