<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\DemoAccountsSeeder;
use Tests\Concerns\PortalData;
use Tests\TestCase;

class DemoLoginTest extends TestCase
{
    use PortalData;

    private function enable(): void
    {
        config(['portal.demo_logins' => true, 'portal.allow_demo_student_login' => true]);
        $this->seed(DemoAccountsSeeder::class);
    }

    public function test_demo_page_is_hidden_when_testing_mode_is_off(): void
    {
        $this->get('/demo')->assertNotFound();
        $this->get('/')->assertDontSee('/demo"', false);
    }

    public function test_every_role_can_sign_in_with_the_shown_demo_account(): void
    {
        $this->enable();
        $this->get('/demo')->assertOk()->assertSee('demo.teacher')->assertSee('Demo@1234');
        foreach (DemoAccountsSeeder::ACCOUNTS as $role => [$username]) {
            $this->get(route("staff.login.$role"))->assertOk()->assertSee($username);
            $this->post(route("staff.login.$role"), ['username' => $username, 'password' => 'Demo@1234'])
                ->assertRedirect(route(User::where('username', $username)->first()->homeRoute()));
            $this->post(route('logout'));
        }
        $this->post(route('auth.demo'))->assertRedirect(route('student.dashboard'));
        $this->get('/learn/tests')->assertOk()->assertSee('Demo Unit Test');
    }

    public function test_guests_opening_a_portal_go_to_its_sign_in_page(): void
    {
        $this->get('/board')->assertRedirect(route('staff.login.board'));
        $this->get('/teacher')->assertRedirect(route('staff.login.teacher'));
        $this->get('/admin/users')->assertRedirect(route('staff.login.super_admin'));
        $this->get('/student')->assertRedirect(route('login'));
    }

    public function test_demo_admin_cannot_touch_real_accounts_or_change_password(): void
    {
        $this->enable();
        $demo = User::where('username', 'demo.admin')->first();
        $real = $this->superAdmin();
        $this->actingAs($demo)->get(route('admin.users.edit', $real))->assertForbidden();
        $this->actingAs($demo)->delete(route('admin.users.destroy', $real))->assertForbidden();
        $this->actingAs($demo)->put(route('password.update'), ['current_password' => 'Demo@1234', 'password' => 'NewPass1234X', 'password_confirmation' => 'NewPass1234X'])
            ->assertSessionHas('warning');
        $this->assertTrue(\Hash::check('Demo@1234', $demo->fresh()->password));
    }

    public function test_turning_testing_mode_off_disables_demo_accounts(): void
    {
        $this->enable();
        config(['portal.demo_logins' => false]);
        $this->seed(DemoAccountsSeeder::class);
        $this->assertSame(0, User::where('is_demo', true)->where('is_active', true)->count());
    }

    public function test_demo_sign_in_works_even_if_apply_update_was_not_pressed(): void
    {
        config(['portal.demo_logins' => true, 'portal.allow_demo_student_login' => true]);
        $this->assertFalse(User::where('username', 'demo.board')->exists());
        $this->post(route('staff.login.board'), ['username' => 'demo.board', 'password' => 'Demo@1234'])->assertRedirect(route('board.dashboard'));
        $this->post(route('logout'));
        $this->get('/auth/demo-student')->assertRedirect(route('demo'));
        $this->post(route('auth.demo'))->assertRedirect(route('student.dashboard'));
    }
}
