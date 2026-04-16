import { Routes } from '@angular/router';

import { authGuard, formGuard, studentGuard, profileGuard, applicationGuard } from './core/auth.guard';
import { roleGuard } from './core/role.guard';
import { LoginComponent } from './pages/login/login.component';
import { GoogleLoginComponent } from './pages/login/google-login.component';
import { UserTypeLoginComponent } from './pages/login/user-type-login.component';
import { InstituteLoginComponent } from './pages/login/institute-login.component';
import { AdminLoginComponent } from './pages/login/admin-login.component';
import { LandingEnhancedComponent } from './pages/landing/landing-enhanced.component';

import { InstituteRegisterComponent } from './pages/institute-register/institute-register.component';
import { InstituteActivateComponent } from './pages/institute-activate/institute-activate.component';
import { InstituteSettingsComponent } from './pages/institute/institute-settings/institute-settings.component';
import { InstituteExamCapacityPageComponent } from './pages/institute/institute-exam-capacity/institute-exam-capacity.component';
import { InstituteAddTeacherComponent } from './pages/institute/institute-add-teacher/institute-add-teacher.component';
import { InstituteStreamSubjectsComponent } from './pages/institute/institute-stream-subjects/institute-stream-subjects.component';
import { AppShellComponent } from './layouts/app-shell/app-shell.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { StudentApplicationsComponent } from './pages/student/student-applications/student-applications.component';
import { StudentApplicationEditComponent } from './pages/student/student-application-edit/student-application-edit.component';
import { StudentApplicationPaymentComponent } from './pages/student/student-application-payment/student-application-payment.component';
import { StudentFormPrintComponent } from './pages/student/student-form-print/student-form-print.component';
import { StudentProfileComponent } from './pages/profile/student-profile.component';
import { StudentExamScheduleComponent } from './pages/student/student-exam-schedule/student-exam-schedule.component';
import { ContactUsComponent } from './pages/public/contact-us/contact-us.component';
import { TermsAndConditionsComponent } from './pages/public/terms-and-conditions/terms-and-conditions.component';
import { RefundPolicyComponent } from './pages/public/refund-policy/refund-policy.component';
import { SuperInstitutesComponent } from './pages/super/super-institutes/super-institutes.component';
import { SuperInstituteUsersComponent } from './pages/super/super-institute-users/super-institute-users.component';
import { SuperMastersComponent } from './pages/super/super-masters/super-masters.component';
import { SuperUsersComponent } from './pages/super/super-users/super-users.component';
import { SuperHealthDashboardComponent } from './pages/super/super-health-dashboard/super-health-dashboard.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { BoardApplicationsComponent } from './pages/board/board-applications/board-applications.component';
import { BoardSubjectsComponent } from './pages/board/board-subjects/board-subjects.component';
import { BoardTeachersComponent } from './pages/board/board-teachers/board-teachers.component';
import { BoardStudentsComponent } from './pages/board/board-students/board-students.component';
import { BoardStreamsComponent } from './pages/board/board-streams/board-streams.component';
import { InstituteApplicationsComponent } from './pages/institute/institute-applications/institute-applications.component';
import { BoardExamsComponent } from './pages/board/board-exams/board-exams.component';
import { BoardNewsComponent } from './pages/board/board-news/board-news.component';
import { AdminStatusDashboardComponent } from './components/admin-status-dashboard/admin-status-dashboard.component';
import { HealthCheckComponent } from './pages/health/health-check.component';

export const routes: Routes = [
  { path: '', component: LandingEnhancedComponent },
  
  // Public Health Check (no auth required)
  { path: 'health', component: HealthCheckComponent, data: { title: 'System Health Monitor' } },
  { path: 'contact-us', component: ContactUsComponent, data: { title: 'Contact Us' } },
  { path: 'terms-and-conditions', component: TermsAndConditionsComponent, data: { title: 'Terms and Conditions' } },
  { path: 'refund-policy', component: RefundPolicyComponent, data: { title: 'Refund Policy' } },
  
  // Admin Status Dashboard (MUST come before catch-all)
  { path: 'admin/status', component: AdminStatusDashboardComponent, data: { title: 'API Status Dashboard' } },
  
  // Student Login (Google OAuth)
  { path: 'auth', component: GoogleLoginComponent, data: { title: 'Student Login' } },
  
  
  
  // Separate login routes for different user types
  { path: 'student-login', component: GoogleLoginComponent, data: { title: 'Student Login' } },
  { path: 'google-login', component: GoogleLoginComponent, data: { title: 'Student Login' } },
  
  // Admin & Board Portal Login
  { path: 'admin-login', component: AdminLoginComponent, data: { title: 'Admin & Board Login' } },
  { path: 'board-login', component: AdminLoginComponent, data: { title: 'Board Portal Login' } },
  
  // Institute Portal Login
  { path: 'institute-login', component: InstituteLoginComponent, data: { title: 'Institute Portal Login' } },
  
  // Root login - User Type Selection (shows options for all login types)
  { path: 'login', component: UserTypeLoginComponent, data: { title: 'Login' } },
  
  { path: 'institute/register', component: InstituteRegisterComponent },
  { path: 'institute/activate', component: InstituteActivateComponent },

  {
    path: 'app',
    canActivate: [authGuard],
    component: AppShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent, canActivate: [profileGuard] },

      // SUPER ADMIN
      { path: 'super/institutes', component: SuperInstitutesComponent, canActivate: [roleGuard(['SUPER_ADMIN'])] },
      { path: 'super/institute-users', component: SuperInstituteUsersComponent, canActivate: [roleGuard(['SUPER_ADMIN'])] },
      { path: 'super/users', component: SuperUsersComponent, canActivate: [roleGuard(['SUPER_ADMIN'])] },
      { path: 'super/masters', component: SuperMastersComponent, canActivate: [roleGuard(['SUPER_ADMIN'])] },
      { path: 'super/health', component: SuperHealthDashboardComponent, canActivate: [roleGuard(['SUPER_ADMIN'])] },
      { path: 'profile', component: ProfileComponent },

      // BOARD
      { path: 'board/exams', component: BoardExamsComponent, canActivate: [roleGuard(['BOARD'])] },
      { path: 'board/applications', component: BoardApplicationsComponent, canActivate: [roleGuard(['BOARD'])] },
      { path: 'board/students', component: BoardStudentsComponent, canActivate: [roleGuard(['BOARD'])] },
      { path: 'board/news', component: BoardNewsComponent, canActivate: [roleGuard(['BOARD'])] },
      { path: 'board/teachers', component: BoardTeachersComponent, canActivate: [roleGuard(['BOARD'])] },
      { path: 'board/subjects', component: BoardSubjectsComponent, canActivate: [roleGuard(['BOARD'])] },
      { path: 'board/streams', component: BoardStreamsComponent, canActivate: [roleGuard(['BOARD'])] },

      // INSTITUTE
      { path: 'institute/applications', component: InstituteApplicationsComponent, canActivate: [roleGuard(['INSTITUTE'])] },
      { path: 'institute/settings', component: InstituteSettingsComponent, canActivate: [roleGuard(['INSTITUTE'])] },
      { path: 'institute/exam-capacity', component: InstituteExamCapacityPageComponent, canActivate: [roleGuard(['INSTITUTE'])] },
      { path: 'institute/teachers', component: InstituteAddTeacherComponent, canActivate: [roleGuard(['INSTITUTE'])] },
      { path: 'institute/stream-subjects', component: InstituteStreamSubjectsComponent, canActivate: [roleGuard(['INSTITUTE'])] },

      // STUDENT - Require Google authentication + complete profile (institute + stream)
      { path: 'student/profile', component: StudentProfileComponent, canActivate: [roleGuard(['STUDENT']), profileGuard] },
      // Allow exam form at 70% profile completion
      { path: 'student/applications', component: StudentApplicationsComponent, canActivate: [roleGuard(['STUDENT']), applicationGuard] },
      { path: 'student/applications/:id', component: StudentApplicationEditComponent, canActivate: [roleGuard(['STUDENT']), applicationGuard] },
      { path: 'student/applications/:id/payment', component: StudentApplicationPaymentComponent, canActivate: [roleGuard(['STUDENT']), applicationGuard] },
      { path: 'student/exam-schedule', component: StudentExamScheduleComponent, canActivate: [roleGuard(['STUDENT'])] },
      { path: 'student/forms/:id/print', component: StudentFormPrintComponent, canActivate: [roleGuard(['STUDENT', 'INSTITUTE', 'BOARD', 'SUPER_ADMIN'])] }
    ]
  },

  { path: '**', redirectTo: '' }
];
