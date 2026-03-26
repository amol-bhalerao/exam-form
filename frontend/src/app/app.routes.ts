import { Routes } from '@angular/router';

import { authGuard, formGuard, studentGuard } from './core/auth.guard';
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
import { InstituteAddTeacherComponent } from './pages/institute/institute-add-teacher/institute-add-teacher.component';
import { InstituteStreamSubjectsComponent } from './pages/institute/institute-stream-subjects/institute-stream-subjects.component';
import { AppShellComponent } from './layouts/app-shell/app-shell.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { StudentApplicationsComponent } from './pages/student/student-applications/student-applications.component';
import { StudentApplicationEditComponent } from './pages/student/student-application-edit/student-application-edit.component';
import { StudentFormPrintComponent } from './pages/student/student-form-print/student-form-print.component';
import { StudentProfileComponent } from './pages/profile/student-profile.component';
import { SuperInstitutesComponent } from './pages/super/super-institutes/super-institutes.component';
import { SuperInstituteUsersComponent } from './pages/super/super-institute-users/super-institute-users.component';
import { SuperMastersComponent } from './pages/super/super-masters/super-masters.component';
import { SuperUsersComponent } from './pages/super/super-users/super-users.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { BoardApplicationsComponent } from './pages/board/board-applications/board-applications.component';
import { BoardSubjectsComponent } from './pages/board/board-subjects/board-subjects.component';
import { BoardTeachersComponent } from './pages/board/board-teachers/board-teachers.component';
import { BoardStreamsComponent } from './pages/board/board-streams/board-streams.component';
import { InstituteApplicationsComponent } from './pages/institute/institute-applications/institute-applications.component';
import { BoardExamsComponent } from './pages/board/board-exams/board-exams.component';
import { BoardNewsComponent } from './pages/board/board-news/board-news.component';

export const routes: Routes = [
  { path: '', component: LandingEnhancedComponent },
  
  // Unified login route for all user types
  { path: 'auth', component: UserTypeLoginComponent },
  
  // Legacy routes (kept for backward compatibility)
  { path: 'login', redirectTo: 'auth', pathMatch: 'full' },
  { path: 'student-login', component: GoogleLoginComponent },
  { path: 'google-login', component: GoogleLoginComponent },
  { path: 'institute-login', redirectTo: 'auth', pathMatch: 'full' },
  { path: 'admin-login', redirectTo: 'auth', pathMatch: 'full' },
  
  { path: 'institute/register', component: InstituteRegisterComponent },
  { path: 'institute/activate', component: InstituteActivateComponent },

  {
    path: 'app',
    canActivate: [authGuard],
    component: AppShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent },

      // SUPER ADMIN
      { path: 'super/institutes', component: SuperInstitutesComponent, canActivate: [roleGuard(['SUPER_ADMIN'])] },
      { path: 'super/institute-users', component: SuperInstituteUsersComponent, canActivate: [roleGuard(['SUPER_ADMIN'])] },
      { path: 'super/users', component: SuperUsersComponent, canActivate: [roleGuard(['SUPER_ADMIN'])] },
      { path: 'super/masters', component: SuperMastersComponent, canActivate: [roleGuard(['SUPER_ADMIN'])] },
      { path: 'profile', component: ProfileComponent },

      // BOARD
      { path: 'board/exams', component: BoardExamsComponent, canActivate: [roleGuard(['BOARD'])] },
      { path: 'board/applications', component: BoardApplicationsComponent, canActivate: [roleGuard(['BOARD'])] },
      { path: 'board/news', component: BoardNewsComponent, canActivate: [roleGuard(['BOARD'])] },
      { path: 'board/teachers', component: BoardTeachersComponent, canActivate: [roleGuard(['BOARD'])] },
      { path: 'board/subjects', component: BoardSubjectsComponent, canActivate: [roleGuard(['BOARD'])] },
      { path: 'board/streams', component: BoardStreamsComponent, canActivate: [roleGuard(['BOARD'])] },

      // INSTITUTE
      { path: 'institute/applications', component: InstituteApplicationsComponent, canActivate: [roleGuard(['INSTITUTE'])] },
      { path: 'institute/settings', component: InstituteSettingsComponent, canActivate: [roleGuard(['INSTITUTE'])] },
      { path: 'institute/teachers', component: InstituteAddTeacherComponent, canActivate: [roleGuard(['INSTITUTE'])] },
      { path: 'institute/stream-subjects', component: InstituteStreamSubjectsComponent, canActivate: [roleGuard(['INSTITUTE'])] },

      // STUDENT - Require Google authentication for exam forms
      { path: 'student/profile', component: StudentProfileComponent, canActivate: [roleGuard(['STUDENT'])] },
      { path: 'student/applications', component: StudentApplicationsComponent, canActivate: [roleGuard(['STUDENT']), formGuard] },
      { path: 'student/applications/:id', component: StudentApplicationEditComponent, canActivate: [roleGuard(['STUDENT']), formGuard] },
      { path: 'student/forms/:id/print', component: StudentFormPrintComponent, canActivate: [roleGuard(['STUDENT', 'INSTITUTE', 'BOARD', 'SUPER_ADMIN'])] }
    ]
  },

  { path: '**', redirectTo: '' }
];
