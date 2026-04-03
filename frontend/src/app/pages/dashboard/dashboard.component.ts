import {
  Component, computed, OnInit, OnDestroy, signal, AfterViewInit, ViewChild, ElementRef, PLATFORM_ID, inject
} from '@angular/core';
import { isPlatformBrowser, NgClass, TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../core/auth.service';
import { API_BASE_URL } from '../../core/api';

// Chart.js tree-shakable imports
import {
  Chart, CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend, DoughnutController, BarController,
  LineController, LineElement, PointElement, Filler
} from 'chart.js';

Chart.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  Title, Tooltip, Legend, DoughnutController, BarController,
  LineController, LineElement, PointElement, Filler
);

interface StatCard {
  label: string;
  value: number;
  icon: string;
  gradient: string;
  link: string;
  delta?: string;
  deltaPos?: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgClass, MatCardModule, MatButtonModule, MatIconModule, MatProgressBarModule, RouterLink, TitleCasePipe],
  template: `
    <div class="dash-page fade-in-up">

      <!-- Welcome Banner -->
      <div class="welcome-banner">
        <div class="welcome-left">
          <div class="avatar">{{ initials() }}</div>
          <div>
            <h1 class="welcome-title">Welcome back, {{ (user()?.username ?? 'User') | titlecase }}!</h1>
            <p class="welcome-sub">{{ roleLabel() }} • {{ today() }}</p>
          </div>
        </div>
        <div class="welcome-actions">
          <a mat-stroked-button routerLink="/app/student/profile" class="profile-btn">
            <mat-icon>person</mat-icon> My Profile
          </a>
        </div>
      </div>

      @if (loading()) {
        <!-- Skeleton loading cards -->
        <div class="stat-grid">
          @for (i of [1,2,3,4]; track i) {
            <div class="stat-skeleton skeleton"></div>
          }
        </div>
      } @else {
        <!-- Stat Cards -->
        <div class="stat-grid">
          @for (card of statCards(); track card.label) {
            <a class="stat-card" [routerLink]="card.link" [attr.aria-label]="card.label">
              <div class="stat-icon-wrap" [ngClass]="card.gradient">
                <mat-icon>{{ card.icon }}</mat-icon>
              </div>
              <div class="stat-body">
                <div class="stat-value counter" [attr.data-target]="card.value">{{ card.value.toLocaleString() }}</div>
                <div class="stat-label">{{ card.label }}</div>
                @if (card.delta) {
                  <div class="stat-delta" [class.pos]="card.deltaPos" [class.neg]="!card.deltaPos">
                    <mat-icon>{{ card.deltaPos ? 'trending_up' : 'trending_down' }}</mat-icon>
                    {{ card.delta }}
                  </div>
                }
              </div>
            </a>
          }
        </div>
      }

      <!-- Charts row -->
      <div class="charts-row">
        <!-- Applications status doughnut -->
        <mat-card class="chart-card">
          <div class="chart-header">
            <mat-icon class="chart-icon">donut_large</mat-icon>
            <div>
              <div class="chart-title">Application Status</div>
              <div class="chart-sub">Breakdown of submissions</div>
            </div>
          </div>
          <div class="chart-wrap">
            <canvas #doughnutCanvas width="280" height="280"></canvas>
          </div>
          <div class="chart-legend">
            @for (l of doughnutLegend(); track l.label) {
              <div class="legend-item">
                <span class="legend-dot" [style.background]="l.color"></span>
                <span class="legend-label">{{ l.label }}</span>
                <span class="legend-value">{{ l.value }}</span>
              </div>
            }
          </div>
        </mat-card>

        <!-- Applications bar chart -->
        <mat-card class="chart-card wide">
          <div class="chart-header">
            <mat-icon class="chart-icon">bar_chart</mat-icon>
            <div>
              <div class="chart-title">Institute Overview</div>
              <div class="chart-sub">Status breakdown by category</div>
            </div>
          </div>
          <div class="chart-wrap tall">
            <canvas #barCanvas></canvas>
          </div>
        </mat-card>
      </div>

      <!-- Quick Actions -->
      <mat-card class="actions-card">
        <div class="actions-header">
          <mat-icon>flash_on</mat-icon>
          <div class="chart-title">Quick Actions</div>
        </div>
        <div class="actions-grid">
          @if (user()?.role === 'SUPER_ADMIN') {
            <a mat-stroked-button routerLink="/app/super/institutes" class="action-btn">
              <mat-icon>account_balance</mat-icon> Manage Institutes
            </a>
            <a mat-stroked-button routerLink="/app/super/institute-users" class="action-btn">
              <mat-icon>manage_accounts</mat-icon> Institute Users
            </a>
            <a mat-stroked-button routerLink="/app/super/users" class="action-btn">
              <mat-icon>admin_panel_settings</mat-icon> Board Users
            </a>
            <a mat-stroked-button routerLink="/app/super/masters" class="action-btn">
              <mat-icon>settings</mat-icon> Master Data
            </a>
          }
          @if (user()?.role === 'BOARD') {
            <a mat-stroked-button routerLink="/app/board/exams" class="action-btn">
              <mat-icon>event_note</mat-icon> Manage Exams
            </a>
            <a mat-stroked-button routerLink="/app/board/applications" class="action-btn">
              <mat-icon>assignment</mat-icon> Review Applications
            </a>
            <a mat-stroked-button routerLink="/app/board/subjects" class="action-btn">
              <mat-icon>subject</mat-icon> Subjects
            </a>
            <a mat-stroked-button routerLink="/app/board/news" class="action-btn">
              <mat-icon>announcement</mat-icon> News & Updates
            </a>
          }
          @if (user()?.role === 'INSTITUTE') {
            <a mat-stroked-button routerLink="/app/institute/applications" class="action-btn">
              <mat-icon>fact_check</mat-icon> Student Applications
            </a>
            <a mat-stroked-button routerLink="/app/institute/settings" class="action-btn">
              <mat-icon>corporate_fare</mat-icon> Institute Details
            </a>
            <a mat-stroked-button routerLink="/app/institute/teachers" class="action-btn">
              <mat-icon>people</mat-icon> Teachers
            </a>
          }
          @if (user()?.role === 'STUDENT') {
            <a mat-stroked-button routerLink="/app/student/applications" class="action-btn">
              <mat-icon>assignment_ind</mat-icon> My Applications
            </a>
            <a mat-flat-button color="primary" routerLink="/app/student/applications" class="action-btn primary-action">
              <mat-icon>add</mat-icon> New Application
            </a>
          }
          <a mat-stroked-button routerLink="/app/profile" class="action-btn">
            <mat-icon>person</mat-icon> Edit Profile
          </a>
        </div>
      </mat-card>

    </div>
  `,
  styles: [`
    /* ============================================================
       CSS VARIABLES - Responsive dashboard design
       ============================================================ */
    :host {
      --spacing-xs: 0.5rem;
      --spacing-sm: 1rem;
      --spacing-md: 1.5rem;
      --spacing-lg: 2rem;
      --font-size-base: 1rem;
      --font-size-sm: 0.95rem;
      --font-size-xs: 0.85rem;
      --border-radius: 16px;
      --border-radius-sm: 10px;
    }

    * {
      box-sizing: border-box;
    }

    /* ============================================================
       MAIN DASHBOARD LAYOUT
       ============================================================ */
    .dash-page {
      padding: var(--spacing-xs) 0 var(--spacing-lg);
      display: grid;
      gap: var(--spacing-md);
      width: 100%;
    }

    /* ============================================================
       WELCOME BANNER - Responsive hero section
       ============================================================ */
    .welcome-banner {
      background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%);
      border-radius: var(--border-radius);
      padding: clamp(1.2rem, 3vw, 1.75rem);
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: #fff;
      gap: var(--spacing-md);
      flex-wrap: wrap;
      min-height: 100px;
    }

    @media (max-width: 640px) {
      .welcome-banner {
        padding: var(--spacing-sm) var(--spacing-sm);
        gap: var(--spacing-sm);
      }
    }

    .welcome-left {
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      flex: 1;
      min-width: 0;
    }

    .avatar {
      width: clamp(44px, 8vw, 52px);
      height: clamp(44px, 8vw, 52px);
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      display: grid;
      place-items: center;
      font-size: 1.1rem;
      font-weight: 700;
      flex-shrink: 0;
      backdrop-filter: blur(8px);
    }

    .welcome-title {
      font-size: clamp(1.1rem, 3vw, 1.4rem);
      font-weight: 700;
      margin: 0 0 4px;
      line-height: 1.3;
      word-break: break-word;
    }

    .welcome-sub {
      margin: 0;
      font-size: clamp(0.75rem, 2vw, 0.85rem);
      opacity: 0.75;
      line-height: 1.4;
    }

    .profile-btn {
      border-color: rgba(255, 255, 255, 0.4) !important;
      color: #fff !important;
      padding: 6px 16px !important;
      font-size: 0.875rem !important;
      white-space: nowrap;
      flex-shrink: 0;
    }

    @media (max-width: 640px) {
      .profile-btn {
        width: 100%;
        flex-shrink: 1;
      }
    }

    /* ============================================================
       STAT CARDS - Responsive grid
       ============================================================ */
    .stat-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
      width: 100%;
    }

    @media (min-width: 480px) {
      .stat-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 768px) {
      .stat-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (min-width: 1024px) {
      .stat-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      }
    }

    .stat-skeleton {
      height: clamp(100px, 20vw, 120px);
      border-radius: var(--border-radius);
      background: #f1f5f9;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .stat-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: var(--border-radius);
      padding: var(--spacing-md);
      display: flex;
      align-items: center;
      gap: var(--spacing-md);
      text-decoration: none;
      color: inherit;
      transition: all 0.2s ease;
      animation: fadeInUp 0.4s ease both;
      cursor: pointer;
      flex-direction: column;
      text-align: center;
      min-height: 120px;
      justify-content: space-between;
    }

    @media (min-width: 768px) {
      .stat-card {
        flex-direction: row;
        text-align: left;
      }
    }

    .stat-card:hover {
      box-shadow: 0 8px 32px rgba(15, 23, 42, 0.12);
      transform: translateY(-2px);
    }

    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes countUp {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .stat-icon-wrap {
      width: clamp(40px, 8vw, 52px);
      height: clamp(40px, 8vw, 52px);
      border-radius: var(--border-radius-sm);
      display: grid;
      place-items: center;
      flex-shrink: 0;
    }

    .stat-icon-wrap mat-icon {
      color: #fff;
      font-size: clamp(20px, 4vw, 24px);
    }

    .gradient-blue { background: linear-gradient(135deg, #2563eb, #7c3aed); }
    .gradient-green { background: linear-gradient(135deg, #059669, #10b981); }
    .gradient-amber { background: linear-gradient(135deg, #d97706, #f59e0b); }
    .gradient-rose { background: linear-gradient(135deg, #dc2626, #f43f5e); }
    .gradient-cyan { background: linear-gradient(135deg, #0891b2, #06b6d4); }
    .gradient-indigo { background: linear-gradient(135deg, #4f46e5, #818cf8); }

    .stat-value {
      font-size: clamp(1.5rem, 4vw, 1.8rem);
      font-weight: 800;
      color: #0f172a;
      line-height: 1;
      animation: countUp 0.5s ease both;
    }

    .stat-label {
      font-size: var(--font-size-xs);
      color: #64748b;
      margin-top: var(--spacing-xs);
      font-weight: 500;
      line-height: 1.3;
    }

    .stat-delta {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 0.7rem;
      margin-top: var(--spacing-xs);
      font-weight: 600;
    }

    .stat-delta mat-icon {
      font-size: 12px;
      width: 12px;
      height: 12px;
    }

    .stat-delta.pos { color: #059669; }
    .stat-delta.neg { color: #dc2626; }

    /* ============================================================
       CHARTS SECTION - Responsive layout
       ============================================================ */
    .charts-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
    }

    @media (min-width: 1024px) {
      .charts-row {
        grid-template-columns: minmax(280px, 320px) 1fr;
      }
    }

    .chart-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: var(--border-radius);
      padding: var(--spacing-md);
      display: flex;
      flex-direction: column;
      min-height: 300px;
    }

    .chart-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md);
      flex-wrap: wrap;
    }

    .chart-icon {
      color: #2563eb;
      background: #dbeafe;
      border-radius: var(--border-radius-sm);
      padding: 6px;
      width: 36px;
      height: 36px;
      display: grid;
      place-items: center;
      font-size: 18px;
      flex-shrink: 0;
    }

    .chart-title {
      font-weight: 700;
      font-size: var(--font-size-sm);
      color: #0f172a;
    }

    .chart-sub {
      font-size: var(--font-size-xs);
      color: #64748b;
      line-height: 1.3;
    }

    .chart-wrap {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: var(--spacing-md) 0;
      flex: 1;
      min-height: 200px;
      width: 100%;
      overflow-x: auto;
    }

    .chart-wrap.tall {
      height: clamp(200px, 50vh, 280px);
    }

    .chart-wrap canvas {
      max-width: 100%;
      max-height: 100%;
    }

    .chart-legend {
      display: grid;
      gap: var(--spacing-xs);
      margin-top: var(--spacing-md);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-size: var(--font-size-xs);
      flex-wrap: wrap;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .legend-label {
      flex: 1;
      color: #475569;
      min-width: 100px;
    }

    .legend-value {
      font-weight: 700;
      color: #0f172a;
      min-width: auto;
    }

    /* ============================================================
       QUICK ACTIONS - Responsive button grid
       ============================================================ */
    .actions-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: var(--border-radius);
      padding: var(--spacing-md);
    }

    .actions-header {
      display: flex;
      align-items: center;
      gap: var(--spacing-sm);
      margin-bottom: var(--spacing-md);
      color: #0f172a;
      flex-wrap: wrap;
    }

    .actions-header mat-icon {
      color: #f59e0b;
      font-size: 20px;
    }

    .actions-grid {
      display: flex;
      flex-wrap: wrap;
      gap: var(--spacing-sm);
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: var(--border-radius-sm) !important;
      font-weight: 500;
      font-size: var(--font-size-xs) !important;
      padding: 6px 16px !important;
      white-space: nowrap;
      transition: all 0.2s ease;
    }

    @media (max-width: 640px) {
      .action-btn {
        flex: 1 1 calc(50% - var(--spacing-xs));
        min-width: 120px;
        justify-content: center;
      }
    }

    .primary-action {
      background: linear-gradient(135deg, #1d4ed8, #7c3aed) !important;
      color: #fff !important;
      box-shadow: 0 2px 8px rgba(29, 78, 216, 0.3);
    }

    .primary-action:hover {
      box-shadow: 0 4px 12px rgba(29, 78, 216, 0.4);
      transform: translateY(-1px);
    }

    /* ============================================================
       RESPONSIVE MOBILE OPTIMIZATIONS
       ============================================================ */
    @media (max-width: 640px) {
      :host {
        --spacing-xs: 0.4rem;
        --spacing-sm: 0.8rem;
        --spacing-md: 1.2rem;
      }

      .dash-page {
        padding: 0 0 var(--spacing-lg);
      }

      .welcome-banner {
        border-radius: 0;
        margin: 0;
        gap: var(--spacing-sm);
      }

      .chart-card {
        border-radius: var(--border-radius-sm);
        min-height: 280px;
      }

      .actions-card {
        border-radius: var(--border-radius-sm);
      }

      .stat-card {
        border-radius: var(--border-radius-sm);
      }
    }

    @media (max-width: 480px) {
      .welcome-title {
        font-size: 1.1rem;
      }

      .welcome-sub {
        font-size: 0.75rem;
      }

      .stat-grid {
        grid-template-columns: 1fr;
      }

      .action-btn {
        flex: 1;
        min-width: auto;
      }

      .chart-wrap.tall {
        height: 220px;
      }
    }

    @media (min-width: 768px) {
      .chart-card {
        min-height: 350px;
      }
    }

    /* Landscape mode */
    @media (max-height: 600px) and (min-width: 768px) {
      .chart-wrap.tall {
        height: 200px;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  @ViewChild('doughnutCanvas') doughnutCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barCanvas') barCanvasRef!: ElementRef<HTMLCanvasElement>;

  readonly user = computed(() => this.auth.user());
  readonly loading = signal(true);

  readonly statCards = signal<StatCard[]>([]);
  readonly doughnutLegend = signal<{ label: string; value: number; color: string }[]>([]);

  private doughnutChart?: Chart;
  private barChart?: Chart;

  // Raw data
  private appDraft = 0;
  private appSubmitted = 0;
  private appVerified = 0;
  private appApproved = 0;
  private appRejected = 0;

  constructor(private readonly auth: AuthService, private readonly http: HttpClient) {}

  initials() {
    const u = this.user()?.username ?? '';
    return u.slice(0, 2).toUpperCase();
  }

  roleLabel() {
    const map: Record<string, string> = {
      SUPER_ADMIN: 'Super Administrator',
      BOARD: 'Board Official',
      INSTITUTE: 'Institute Admin',
      STUDENT: 'Student'
    };
    return map[this.user()?.role ?? ''] ?? this.user()?.role ?? '';
  }

  today() {
    return new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  ngOnInit() { this.loadData(); }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      // Charts render after data loads; initCharts is called from loadData()
    }
  }

  ngOnDestroy() {
    this.doughnutChart?.destroy();
    this.barChart?.destroy();
  }

  private loadData() {
    const role = this.user()?.role;

    const done = () => {
      this.loading.set(false);
      // Use requestAnimationFrame for better performance than setTimeout
      if (isPlatformBrowser(this.platformId)) {
        requestAnimationFrame(() => this.initCharts());
      }
    };

    // Early exit if no role
    if (!role) {
      done();
      return;
    }

    if (role === 'SUPER_ADMIN') {
      let p1done = false, p2done = false, p3done = false;
      const check = () => { if (p1done && p2done && p3done) done(); };

      this.http.get<{ institutes: any[] }>(`${API_BASE_URL}/institutes`).subscribe({
        next: (r) => {
          const all = r.institutes ?? [];
          const approved = all.filter((i) => i.status === 'APPROVED').length;
          const pending = all.filter((i) => i.status === 'PENDING').length;
          const disabled = all.filter((i) => i.status === 'DISABLED').length;
          this.statCards.update((c) => [...c,
            { label: 'Total Institutes', value: all.length, icon: 'account_balance', gradient: 'gradient-blue', link: '/app/super/institutes', delta: `${approved} active`, deltaPos: true },
            { label: 'Pending Approval', value: pending, icon: 'pending_actions', gradient: 'gradient-amber', link: '/app/super/institute-users' }
          ]);
          this.initBarData([all.length, approved, pending, disabled], ['Total', 'Approved', 'Pending', 'Disabled']);
          p1done = true; check();
        },
        error: (err) => {
          console.error('Failed to load institutes:', err?.error?.message || err?.message);
          p1done = true;
          check();
        }
      });

      this.http.get<{ users: any[] }>(`${API_BASE_URL}/institutes/users/all`).subscribe({
        next: (r) => {
          const all = r.users ?? [];
          this.statCards.update((c) => [...c,
            { label: 'Institute Users', value: all.length, icon: 'people', gradient: 'gradient-cyan', link: '/app/super/institute-users' }
          ]);
          p2done = true; check();
        },
        error: (err) => {
          console.error('Failed to load institute users:', err?.error?.message || err?.message);
          p2done = true;
          check();
        }
      });

      this.http.get<{ applications: any[]; metadata?: any }>(`${API_BASE_URL}/applications/board/list`, { params: { limit: '500', examId: '1' } }).subscribe({
        next: (r) => {
          const all = r.applications ?? [];
          this.setAppCounts(all);
          p3done = true; check();
        },
        error: (err) => {
          console.error('Failed to load applications:', err?.error?.message || err?.message);
          p3done = true;
          check();
        }
      });
    } else if (role === 'BOARD') {
      this.http.get<{ applications: any[] }>(`${API_BASE_URL}/applications/board/list`, { params: { limit: '500', examId: '1' } }).subscribe({
        next: (r) => { this.setAppCounts(r.applications ?? []); done(); },
        error: (err) => {
          console.error('Failed to load board applications:', err?.error?.message || err?.message);
          done();
        }
      });
    } else if (role === 'INSTITUTE') {
      this.http.get<{ applications: any[] }>(`${API_BASE_URL}/applications/institute/list`).subscribe({
        next: (r) => { this.setAppCounts(r.applications ?? []); done(); },
        error: (err) => {
          console.error('Failed to load institute applications:', err?.error?.message || err?.message);
          done();
        }
      });
      this.http.get<{ teachers: any[] }>(`${API_BASE_URL}/institutes/me/teachers`).subscribe({
        next: (r) => {
          this.statCards.update((c) => [...c,
            { label: 'Teachers', value: r.teachers?.length ?? 0, icon: 'people', gradient: 'gradient-indigo', link: '/app/institute/teachers' }
          ]);
        },
        error: (err) => {
          console.error('Failed to load teachers:', err?.error?.message || err?.message);
        }
      });
    } else if (role === 'STUDENT') {
      // FIX: Proper error handling for student dashboard
      this.http.get<{ applications: any[] }>(`${API_BASE_URL}/applications/my`).subscribe({
        next: (r) => {
          const all = r.applications ?? [];
          this.statCards.set([
            { label: 'My Applications', value: all.length, icon: 'assignment_ind', gradient: 'gradient-blue', link: '/app/student/applications' },
            { label: 'Draft', value: all.filter((a) => a.status === 'DRAFT').length, icon: 'edit_note', gradient: 'gradient-amber', link: '/app/student/applications' },
            { label: 'Submitted', value: all.filter((a) => a.status === 'SUBMITTED').length, icon: 'send', gradient: 'gradient-cyan', link: '/app/student/applications' },
            { label: 'Approved', value: all.filter((a) => a.status === 'BOARD_APPROVED').length, icon: 'verified', gradient: 'gradient-green', link: '/app/student/applications' }
          ]);
          this.setAppCounts(all);
          done();
        },
        error: (err) => {
          console.error('Failed to load student applications:', err?.error?.message || err?.message);
          // Show empty state instead of breaking
          this.statCards.set([
            { label: 'My Applications', value: 0, icon: 'assignment_ind', gradient: 'gradient-blue', link: '/app/student/applications' },
            { label: 'Draft', value: 0, icon: 'edit_note', gradient: 'gradient-amber', link: '/app/student/applications' },
            { label: 'Submitted', value: 0, icon: 'send', gradient: 'gradient-cyan', link: '/app/student/applications' },
            { label: 'Approved', value: 0, icon: 'verified', gradient: 'gradient-green', link: '/app/student/applications' }
          ]);
          done();
        }
      });
    } else {
      done();
    }
  }

  private setAppCounts(apps: any[]) {
    this.appDraft = apps.filter((a) => a.status === 'DRAFT').length;
    this.appSubmitted = apps.filter((a) => a.status === 'SUBMITTED').length;
    this.appVerified = apps.filter((a) => a.status === 'INSTITUTE_VERIFIED').length;
    this.appApproved = apps.filter((a) => a.status === 'BOARD_APPROVED').length;
    this.appRejected = apps.filter((a) => a.status?.startsWith('REJECTED')).length;

    if (this.user()?.role !== 'STUDENT') {
      this.statCards.update((c) => {
        const hasApps = c.some((x) => x.label === 'Total Applications');
        if (hasApps) return c;
        return [...c,
          { label: 'Total Applications', value: apps.length, icon: 'assignment', gradient: 'gradient-blue', link: '/app/board/applications' },
          { label: 'Submitted', value: this.appSubmitted, icon: 'send', gradient: 'gradient-cyan', link: '/app/board/applications' },
          { label: 'Institute Verified', value: this.appVerified, icon: 'verified', gradient: 'gradient-green', link: '/app/board/applications' },
          { label: 'Board Approved', value: this.appApproved, icon: 'check_circle', gradient: 'gradient-indigo', link: '/app/board/applications' }
        ];
      });
    }
  }

  private barLabels: string[] = [];
  private barValues: number[] = [];

  private initBarData(values: number[], labels: string[]) {
    this.barLabels = labels;
    this.barValues = values;
  }

  private initCharts() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initDoughnutChart();
    this.initBarChart();
  }

  private initDoughnutChart() {
    const canvas = this.doughnutCanvasRef?.nativeElement;
    if (!canvas) return;

    const labels = ['Draft', 'Submitted', 'Verified', 'Approved', 'Rejected'];
    const values = [this.appDraft, this.appSubmitted, this.appVerified, this.appApproved, this.appRejected];
    const colors = ['#94a3b8', '#3b82f6', '#10b981', '#059669', '#ef4444'];

    this.doughnutChart?.destroy();
    this.doughnutChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: values, backgroundColor: colors, borderWidth: 3, borderColor: '#fff', hoverBorderWidth: 4 }]
      },
      options: {
        responsive: true,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => ` ${ctx.label}: ${ctx.parsed}` } }
        },
        animation: { animateScale: true, duration: 800 }
      }
    });

    this.doughnutLegend.set(labels.map((l, i) => ({ label: l, value: values[i], color: colors[i] })));
  }

  private initBarChart() {
    const canvas = this.barCanvasRef?.nativeElement;
    if (!canvas) return;

    const labels = this.barLabels.length ? this.barLabels : ['Draft', 'Submitted', 'Verified', 'Approved', 'Rejected'];
    const values = this.barValues.length ? this.barValues : [this.appDraft, this.appSubmitted, this.appVerified, this.appApproved, this.appRejected];

    this.barChart?.destroy();
    this.barChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Count',
          data: values,
          backgroundColor: ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'].slice(0, labels.length),
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } }
        },
        animation: { duration: 800 }
      }
    });
  }
}

