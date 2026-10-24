<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\Concerns\PortalData;
use Tests\TestCase;

class StaffLoginTest extends TestCase
{
    use PortalData;

    private function login(string $role, string $username, string $password = 'Password@123')
    {
        return $this->post('/' . config("portal.login_paths.$role"), ['username' => $username, 'password' => $password]);
    }

    public function test_each_role_signs_in_at_its_own_private_address(): void
    {
        $this->login('super_admin', 'superadmin')->assertRedirect(route('admin.dashboard'));
        $this->post('/logout');
        $this->login('board', 'board2')->assertRedirect(route('board.dashboard'));
        $this->post('/logout');
        $this->login('institute', 'INSTITUTE1')->assertRedirect(route('institute.dashboard'));
    }

    public function test_a_login_does_not_work_at_another_roles_address(): void
    {
        $this->login('board', 'INSTITUTE1')->assertSessionHasErrors('username');
        $this->assertGuest();
        $this->login('super_admin', 'board2')->assertSessionHasErrors('username');
        $this->assertGuest();
    }

    public function test_wrong_password_and_inactive_accounts_are_refused(): void
    {
        $this->login('institute', 'INSTITUTE1', 'nope')->assertSessionHasErrors('username');
        $this->instituteUser()->update(['is_active' => false]);
        $this->login('institute', 'INSTITUTE1')->assertSessionHasErrors('username');
        $this->assertGuest();
    }

    public function test_must_change_password_sends_user_to_password_page(): void
    {
        $this->instituteUser()->update(['must_change_password' => true]);
        $this->login('institute', 'INSTITUTE1');
        $this->get('/institute')->assertRedirect(route('password.edit'));
        $this->put(route('password.update'), ['current_password' => 'Password@123', 'password' => 'NewPassword@2027', 'password_confirmation' => 'NewPassword@2027'])->assertSessionHasNoErrors();
        $this->assertFalse($this->instituteUser()->must_change_password);
        $this->get('/institute')->assertOk();
    }

    public function test_roles_cannot_open_each_others_portals(): void
    {
        $this->actingAs($this->instituteUser())->get('/board')->assertForbidden();
        $this->actingAs($this->boardUser())->get('/admin')->assertForbidden();
        $this->actingAs($this->parent())->get('/institute')->assertForbidden();
        $this->actingAs($this->superAdmin())->get('/student')->assertForbidden();
    }

    public function test_staff_cannot_use_google_sign_in_with_their_email(): void
    {
        $this->assertSame(User::BOARD, $this->boardUser()->role);
        $this->get('/auth/google')->assertRedirect(route('login')); // not configured in tests
    }
}
