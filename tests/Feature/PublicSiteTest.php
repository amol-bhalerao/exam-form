<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Notice;
use App\Models\Page;
use Tests\Concerns\PortalData;
use Tests\TestCase;

class PublicSiteTest extends TestCase
{
    use PortalData;

    public function test_public_pages_render(): void
    {
        foreach (['/', '/notices', '/exams', '/verify', '/login', '/sitemap.xml', '/robots.txt'] as $url) {
            $this->get($url)->assertOk();
        }
    }

    public function test_staff_sign_in_addresses_are_never_linked_from_the_website(): void
    {
        $html = $this->get('/')->getContent() . $this->get('/login')->getContent() . $this->get('/notices')->getContent();
        foreach (config('portal.login_paths') as $path) {
            $this->assertStringNotContainsString($path, $html);
        }
        $sitemap = $this->get('/sitemap.xml')->getContent();
        foreach (config('portal.login_paths') as $path) {
            $this->assertStringNotContainsString($path, $sitemap);
        }
        $this->get('/' . config('portal.login_paths.super_admin'))->assertOk()->assertSee('noindex', false);
    }

    public function test_switching_language_changes_the_interface(): void
    {
        $this->get('/language/en')->assertRedirect();
        $this->get('/')->assertSee('Student sign in');
        $this->get('/language/hi');
        $this->get('/')->assertSee('विद्यार्थी साइन इन');
        $this->get('/language/mr');
        $this->get('/')->assertSee('विद्यार्थी लॉगिन');
    }

    public function test_published_cms_page_is_public_and_draft_is_hidden(): void
    {
        Page::create(['title' => 'Exam centres', 'slug' => 'exam-centres', 'body' => '<p>List</p>', 'status' => 'published', 'seo_description' => 'Find your centre']);
        Page::create(['title' => 'Secret', 'slug' => 'secret-draft', 'status' => 'draft']);
        $this->get('/exam-centres')->assertOk()->assertSee('Find your centre', false);
        $this->get('/secret-draft')->assertNotFound();
    }

    public function test_notices_listing_shows_only_live_notices(): void
    {
        Notice::create(['title' => 'Timetable out', 'slug' => 'tt', 'category' => 'timetable', 'status' => 'published', 'published_at' => now()->subHour()]);
        Notice::create(['title' => 'Old notice', 'slug' => 'old', 'category' => 'notice', 'status' => 'published', 'published_at' => now()->subMonth(), 'expires_at' => now()->subDay()]);
        $this->get('/notices')->assertSee('Timetable out')->assertDontSee('Old notice');
        $this->get('/notices/tt')->assertOk();
    }

    public function test_verify_page_confirms_a_submitted_form_without_personal_details(): void
    {
        $form = $this->makeForm(Application::VERIFIED);
        $this->get('/verify/' . $form->application_no)->assertOk()->assertSee($form->application_no)->assertDontSee('9876543210');
        $this->makeForm(Application::DRAFT, $this->makeStudent(attrs: ['first_name' => 'DRAFTY']));
        $draft = Application::where('status', 'draft')->first();
        $this->get('/verify/' . $draft->application_no)->assertSee(__('No submitted form has the number :number. Check the number and try again.', ['number' => $draft->application_no]));
    }

    public function test_portals_require_sign_in(): void
    {
        foreach (['/student', '/institute', '/board', '/admin'] as $url) {
            $this->get($url)->assertRedirect();
        }
    }
}
