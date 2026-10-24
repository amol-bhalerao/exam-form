<?php

namespace Tests\Feature;

use App\Models\Board;
use App\Models\Institute;
use App\Models\Page;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\PortalData;
use Tests\TestCase;

class AdminPortalTest extends TestCase
{
    use PortalData;

    public function test_admin_pages_render(): void
    {
        $u = $this->superAdmin();
        $inst = Institute::first();
        foreach (['/admin', '/admin/institutes', '/admin/institutes/create', "/admin/institutes/{$inst->id}/edit", '/admin/institutes/import',
            '/admin/users', '/admin/users/create', '/admin/subjects', '/admin/subjects/create', '/admin/streams', '/admin/pages', '/admin/pages/create',
            '/admin/notices', '/admin/notices/create', '/admin/media', '/admin/settings', '/admin/payments', '/admin/audit'] as $url) {
            $this->actingAs($u)->get($url)->assertOk();
        }
    }

    public function test_all_seeded_institutes_are_listed(): void
    {
        $this->assertSame(10, Institute::count()); // 5 per board in tests; the full list (4,073) is seeded outside tests
        $this->actingAs($this->superAdmin())->get('/admin/institutes')->assertSee(Institute::first()->name);
    }

    public function test_unlimited_pages_with_menu_and_seo(): void
    {
        for ($i = 1; $i <= 3; $i++) {
            $this->actingAs($this->superAdmin())->post(route('admin.pages.store'), [
                'title' => "Guide part $i", 'layout' => 'default', 'status' => 'published', 'in_header' => '1',
                'body' => "<h2>Part $i</h2><p>Text</p>", 'seo_title' => "Guide $i", 'seo_description' => "About part $i",
            ])->assertSessionHasNoErrors();
        }
        $this->assertSame(3, Page::where('slug', 'like', 'guide-part-%')->count());
        $this->get('/guide-part-2')->assertOk()->assertSee('About part 2', false)->assertSee('<h2>Part 2</h2>', false);
        $this->get('/')->assertSee('Guide part 1');
    }

    public function test_page_cannot_take_a_portal_address(): void
    {
        foreach (['login', 'admin', 'notices', config('portal.login_paths.board')] as $slug) {
            $this->actingAs($this->superAdmin())->post(route('admin.pages.store'), ['title' => 'X', 'slug' => $slug, 'layout' => 'default', 'status' => 'draft'])
                ->assertSessionHasErrors('slug');
        }
    }

    public function test_create_institute_login_and_it_can_sign_in(): void
    {
        $inst = Institute::where('board_id', $this->hsc()->id)->skip(1)->first();
        $this->actingAs($this->superAdmin())->post(route('admin.users.store'), [
            'role' => 'institute', 'name' => 'Principal', 'username' => 'COLLEGE2', 'institute_id' => $inst->id,
            'password' => 'Lotus@2027ab', 'is_active' => '1',
        ])->assertSessionHasNoErrors();
        $u = User::where('username', 'COLLEGE2')->firstOrFail();
        $this->assertSame($inst->board_id, $u->board_id);
        $this->assertTrue(Hash::check('Lotus@2027ab', $u->password));
        auth()->logout();
        $this->post('/' . config('portal.login_paths.institute'), ['username' => 'COLLEGE2', 'password' => 'Lotus@2027ab'])->assertRedirect(route('institute.dashboard'));
    }

    public function test_admin_cannot_lock_themselves_out(): void
    {
        $me = $this->superAdmin();
        $this->actingAs($me)->put(route('admin.users.update', $me), ['role' => 'student', 'name' => $me->name, 'username' => $me->username])->assertSessionHasNoErrors();
        $this->assertSame('super_admin', $me->refresh()->role);
        $this->assertTrue($me->is_active);
        $this->actingAs($me)->delete(route('admin.users.destroy', $me))->assertForbidden();
    }

    public function test_import_institutes_from_csv(): void
    {
        $csv = "college_no,name,district,streams\n99.01.001,New Test College,Jalna,SCI|COM\n99.01.002,\"Second, College\",Beed,ART\n,missing no,,\n";
        $file = UploadedFile::fake()->createWithContent('colleges.csv', $csv);
        $this->actingAs($this->superAdmin())->post(route('admin.institutes.import'), ['board_id' => $this->hsc()->id, 'file' => $file])->assertSessionHas('status');
        $i = Institute::where('college_no', '99.01.001')->firstOrFail();
        $this->assertSame(['COM', 'SCI'], $i->streams->pluck('code')->sort()->values()->all());
        $this->assertSame('Second, College', Institute::where('college_no', '99.01.002')->value('name'));
    }

    public function test_settings_update_the_public_site(): void
    {
        $this->actingAs($this->superAdmin())->put(route('admin.settings.update'), ['site_name' => 'Divisional Board Portal', 'helpline_phone' => '0240-2334228', 'ticker_enabled' => '1'])->assertSessionHasNoErrors();
        $this->assertSame('0240-2334228', Setting::get('helpline_phone'));
        $this->get('/language/en');
        $this->get('/')->assertSee('Divisional Board Portal')->assertSee('0240-2334228');
    }

    public function test_media_upload_and_delete(): void
    {
        Storage::fake('public');
        $this->actingAs($this->superAdmin())->post(route('admin.media.store'), ['files' => [UploadedFile::fake()->image('banner.jpg'), UploadedFile::fake()->create('circular.pdf', 100, 'application/pdf')]])->assertSessionHas('status');
        $m = \App\Models\Media::firstOrFail();
        Storage::disk('public')->assertExists($m->path);
        $this->actingAs($this->superAdmin())->delete(route('admin.media.destroy', $m));
        Storage::disk('public')->assertMissing($m->path);
    }

    public function test_subject_admin(): void
    {
        $board = Board::where('code', 'HSC')->first();
        $stream = $board->streams()->first();
        $this->actingAs($this->superAdmin())->post(route('admin.subjects.store'), ['board_id' => $board->id, 'code' => 'z1', 'name' => 'Robotics', 'kind' => 'ELECTIVE', 'streams' => [$stream->id], 'is_active' => '1'])->assertSessionHasNoErrors();
        $this->assertTrue($stream->subjects()->where('code', 'Z1')->exists());
    }
}
