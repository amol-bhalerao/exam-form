import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { HealthService, HealthCheckResult, ApiHealthCheck } from '../../../services/health.service';

@Component({
  selector: 'app-super-health-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatExpansionModule
  ],
  template: `
    <div class="health-container">
      <!-- Header -->
      <div class="health-header">
        <div class="header-left">
          <h1><mat-icon class="header-icon">health_and_safety</mat-icon>Application Health Monitor</h1>
          <p class="subtitle">Real-time system health and API availability monitoring</p>
        </div>
        <button mat-raised-button color="primary" (click)="runAllChecks()" [disabled]="isLoading()">
          <mat-icon *ngIf="!isLoading()">refresh</mat-icon>
          <mat-spinner *ngIf="isLoading()" diameter="20" style="margin-right: 8px;"></mat-spinner>
          {{ isLoading() ? 'Checking...' : 'Run Health Check' }}
        </button>
      </div>

      <!-- Overall Status -->
      <div class="overall-status" [ngClass]="getOverallStatusClass()">
        <div class="status-indicator">
          <mat-icon [ngClass]="'status-icon ' + getOverallStatusClass()">
            {{ getOverallStatusIcon() }}
          </mat-icon>
        </div>
        <div class="status-info">
          <h2>{{ getOverallStatus() }}</h2>
          <p>{{ getStatusMessage() }}</p>
        </div>
        <div class="status-time">
          Last checked: {{ lastCheckTime() | date: 'short' ?? 'Never' }}
        </div>
      </div>

      <!-- Tabs -->
      <mat-tab-group class="health-tabs" (selectedIndexChange)="onTabChange($event)">
        <!-- Backend Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon" [ngClass]="backendStatus() === 'healthy' ? 'status-healthy' : backendStatus() === 'degraded' ? 'status-degraded' : 'status-unhealthy'">
              storage
            </mat-icon>
            <span>Backend APIs</span>
          </ng-template>

          <div class="tab-content">
            <!-- Backend Status Summary -->
            <div class="status-summary" *ngIf="backendHealth()">
              <div class="summary-item">
                <span class="label">Total Endpoints:</span>
                <span class="value">{{ backendHealth()!.checks.length }}</span>
              </div>
              <div class="summary-item" [ngClass]="'healthy'">
                <span class="label">✓ Healthy:</span>
                <span class="value">{{ countHealthy(backendHealth()!.checks) }}</span>
              </div>
              <div class="summary-item" *ngIf="countFailed(backendHealth()!.checks) > 0" [ngClass]="'failed'">
                <span class="label">✗ Failed:</span>
                <span class="value">{{ countFailed(backendHealth()!.checks) }}</span>
              </div>
            </div>

            <!-- Backend Checks -->
            <div class="checks-container">
              <mat-expansion-panel *ngFor="let check of backendHealth()?.checks; trackBy: trackByEndpoint" [ngClass]="check.status">
                <mat-expansion-panel-header class="panel-header">
                  <mat-icon [ngClass]="'check-icon ' + check.status">
                    {{ check.status === 'success' ? 'check_circle' : check.status === 'timeout' ? 'schedule' : 'error' }}
                  </mat-icon>
                  <div class="header-content">
                    <div class="endpoint-name">{{ check.endpoint }}</div>
                    <div class="endpoint-method">{{ check.method }}</div>
                  </div>
                  <span class="spacer"></span>
                  <div class="response-time" *ngIf="check.status === 'success'">{{ check.responseTime }}ms</div>
                  <mat-icon *ngIf="check.status === 'success'" class="status-icon-success">check_circle</mat-icon>
                  <mat-icon *ngIf="check.status === 'failed'" class="status-icon-failed">error_circle</mat-icon>
                  <mat-icon *ngIf="check.status === 'timeout'" class="status-icon-timeout">schedule</mat-icon>
                </mat-expansion-panel-header>

                <mat-expansion-panel-body class="panel-body">
                  <div class="check-details">
                    <div class="detail-row">
                      <span class="label">Status Code:</span>
                      <span class="value" [ngClass]="'status-' + (check.statusCode ?? 'unknown')">
                        {{ check.statusCode ?? 'N/A' }}
                      </span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Response Time:</span>
                      <span class="value">{{ check.responseTime }}ms</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Message:</span>
                      <span class="value">{{ check.message }}</span>
                    </div>
                    <div class="detail-row" *ngIf="check.error">
                      <span class="label">Error:</span>
                      <span class="value error">{{ check.error }}</span>
                    </div>
                    <div class="detail-row" *ngIf="check.testPayload">
                      <span class="label">Test Payload:</span>
                      <pre class="payload">{{ check.testPayload | json }}</pre>
                    </div>
                  </div>
                </mat-expansion-panel-body>
              </mat-expansion-panel>
            </div>
          </div>
        </mat-tab>

        <!-- Frontend Tab -->
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon class="tab-icon status-healthy">computer</mat-icon>
            <span>Frontend</span>
          </ng-template>

          <div class="tab-content">
            <!-- Frontend Status Summary -->
            <div class="status-summary" *ngIf="frontendHealth()">
              <div class="summary-item">
                <span class="label">Total Checks:</span>
                <span class="value">{{ frontendHealth()!.checks.length }}</span>
              </div>
              <div class="summary-item healthy">
                <span class="label">✓ Healthy:</span>
                <span class="value">{{ frontendHealth()!.checks.length }}</span>
              </div>
            </div>

            <!-- Frontend Checks -->
            <div class="checks-container">
              <mat-expansion-panel *ngFor="let check of frontendHealth()?.checks; trackBy: trackByEndpoint" [ngClass]="check.status">
                <mat-expansion-panel-header class="panel-header">
                  <mat-icon class="check-icon success">check_circle</mat-icon>
                  <div class="header-content">
                    <div class="endpoint-name">{{ check.name || check.endpoint }}</div>
                  </div>
                  <span class="spacer"></span>
                  <mat-icon class="status-icon-success">check_circle</mat-icon>
                </mat-expansion-panel-header>

                <mat-expansion-panel-body class="panel-body">
                  <div class="check-details">
                    <div class="detail-row">
                      <span class="label">Component:</span>
                      <span class="value">{{ check.endpoint }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Status:</span>
                      <span class="value" [ngClass]="'status-200'">{{ check.message }}</span>
                    </div>
                  </div>
                </mat-expansion-panel-body>
              </mat-expansion-panel>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>

      <!-- Legend -->
      <div class="legend">
        <div class="legend-item">
          <mat-icon class="legend-icon status-success">check_circle</mat-icon>
          <span>Healthy / Running</span>
        </div>
        <div class="legend-item">
          <mat-icon class="legend-icon status-failed">error_circle</mat-icon>
          <span>Failed / Error</span>
        </div>
        <div class="legend-item">
          <mat-icon class="legend-icon status-timeout">schedule</mat-icon>
          <span>Timeout / Slow</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .health-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .health-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      gap: 2rem;
    }

    .header-left h1 {
      margin: 0;
      font-size: 2rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      color: #333;
    }

    .header-icon {
      font-size: 2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      color: #667eea;
    }

    .subtitle {
      margin: 0.5rem 0 0;
      color: #666;
      font-size: 0.95rem;
    }

    /* Overall Status */
    .overall-status {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 2rem;
      border-left: 4px solid;
    }

    .overall-status.healthy {
      background: #e8f5e9;
      border-color: #4caf50;
    }

    .overall-status.degraded {
      background: #fff3e0;
      border-color: #ff9800;
    }

    .overall-status.unhealthy {
      background: #ffebee;
      border-color: #f44336;
    }

    .status-indicator {
      flex-shrink: 0;
    }

    .status-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
    }

    .status-icon.healthy {
      color: #4caf50;
    }

    .status-icon.degraded {
      color: #ff9800;
    }

    .status-icon.unhealthy {
      color: #f44336;
    }

    .status-info {
      flex: 1;
    }

    .status-info h2 {
      margin: 0 0 0.5rem;
      font-size: 1.5rem;
      text-transform: capitalize;
    }

    .status-info p {
      margin: 0;
      color: #666;
    }

    .status-time {
      font-size: 0.85rem;
      color: #999;
      white-space: nowrap;
    }

    /* Tabs */
    .health-tabs {
      margin-bottom: 2rem;
    }

    .tab-icon {
      margin-right: 0.5rem;
    }

    .tab-content {
      padding: 1.5rem 0;
    }

    /* Status Summary */
    .status-summary {
      display: flex;
      gap: 2rem;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .summary-item .label {
      font-size: 0.85rem;
      color: #999;
      font-weight: 500;
    }

    .summary-item .value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #333;
    }

    .summary-item.healthy .value {
      color: #4caf50;
    }

    .summary-item.failed .value {
      color: #f44336;
    }

    /* Checks Container */
    .checks-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    mat-expansion-panel {
      margin-bottom: 0.5rem;
    }

    mat-expansion-panel.success {
      border-left: 4px solid #4caf50;
    }

    mat-expansion-panel.failed {
      border-left: 4px solid #f44336;
    }

    mat-expansion-panel.timeout {
      border-left: 4px solid #ff9800;
    }

    .panel-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0 1rem;
    }

    .check-icon {
      flex-shrink: 0;
      font-size: 1.5rem;
      width: 1.5rem;
      height: 1.5rem;
    }

    .check-icon.success {
      color: #4caf50;
    }

    .check-icon.failed {
      color: #f44336;
    }

    .check-icon.timeout {
      color: #ff9800;
    }

    .header-content {
      flex: 1;
      min-width: 0;
    }

    .endpoint-name {
      font-weight: 600;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .endpoint-method {
      font-size: 0.8rem;
      color: #999;
      margin-top: 0.2rem;
    }

    .spacer {
      flex: 1;
    }

    .response-time {
      font-size: 0.85rem;
      color: #999;
      min-width: 60px;
      text-align: right;
    }

    .status-icon-success {
      color: #4caf50;
      font-size: 1.25rem;
    }

    .status-icon-failed {
      color: #f44336;
      font-size: 1.25rem;
    }

    .status-icon-timeout {
      color: #ff9800;
      font-size: 1.25rem;
    }

    /* Panel Body */
    .panel-body {
      padding: 1rem 0;
    }

    .check-details {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .detail-row {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .detail-row .label {
      min-width: 120px;
      font-weight: 600;
      color: #666;
    }

    .detail-row .value {
      flex: 1;
      color: #333;
      word-break: break-word;
    }

    .detail-row .value.error {
      color: #f44336;
      font-family: monospace;
    }

    .detail-row .value.status-200,
    .detail-row .value.status-201,
    .detail-row .value.status-409 {
      color: #4caf50;
    }

    .detail-row .value.status-404,
    .detail-row .value.status-500 {
      color: #f44336;
    }

    .payload {
      background: #f5f5f5;
      padding: 0.75rem;
      border-radius: 4px;
      font-size: 0.8rem;
      overflow-x: auto;
      margin: 0;
      line-height: 1.4;
    }

    /* Legend */
    .legend {
      display: flex;
      justify-content: center;
      gap: 2rem;
      padding: 1.5rem;
      background: #f5f5f5;
      border-radius: 8px;
      margin-top: 2rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.9rem;
    }

    .legend-icon {
      font-size: 1.25rem;
      width: 1.25rem;
      height: 1.25rem;
    }

    .status-success {
      color: #4caf50;
    }

    .status-failed {
      color: #f44336;
    }

    .status-timeout {
      color: #ff9800;
    }

    @media (max-width: 768px) {
      .health-container {
        padding: 1rem;
      }

      .health-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .header-left h1 {
        font-size: 1.5rem;
      }

      .overall-status {
        flex-direction: column;
        text-align: center;
      }

      .status-summary {
        flex-wrap: wrap;
      }

      .legend {
        flex-wrap: wrap;
      }
    }
  `]
})
export class SuperHealthDashboardComponent implements OnInit {
  readonly isLoading = signal(false);
  readonly selectedTab = signal(0);
  
  readonly backendHealth = signal<HealthCheckResult | null>(null);
  readonly frontendHealth = signal<HealthCheckResult | null>(null);
  readonly lastCheckTime = signal<Date | null>(null);

  readonly backendStatus = computed(() => this.backendHealth()?.overallStatus ?? 'unknown');
  readonly frontendStatus = computed(() => this.frontendHealth()?.overallStatus ?? 'unknown');

  constructor(
    private healthService: HealthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.runAllChecks();
  }

  runAllChecks(): void {
    this.isLoading.set(true);
    this.lastCheckTime.set(new Date());

    Promise.all([
      this.healthService.checkBackendHealth().toPromise(),
      this.healthService.checkFrontendHealth().toPromise()
    ]).then(([backend, frontend]) => {
      this.backendHealth.set(backend!);
      this.frontendHealth.set(frontend!);
      this.isLoading.set(false);

      const backendFailed = this.countFailed(backend!.checks);
      const frontendFailed = this.countFailed(frontend!.checks);

      if (backendFailed > 0 || frontendFailed > 0) {
        this.snackBar.open(
          `⚠️ Health check complete: ${backendFailed} backend failures, ${frontendFailed} frontend failures`,
          'Close',
          { duration: 5000, panelClass: 'error-snackbar' }
        );
      } else {
        this.snackBar.open('✓ All systems healthy!', 'Close', { duration: 3000 });
      }
    }).catch(error => {
      this.isLoading.set(false);
      this.snackBar.open('❌ Health check failed: ' + (error.message || 'Unknown error'), 'Close', {
        duration: 5000,
        panelClass: 'error-snackbar'
      });
    });
  }

  onTabChange(index: number): void {
    this.selectedTab.set(index);
  }

  countHealthy(checks: ApiHealthCheck[]): number {
    return checks.filter(c => c.status === 'success').length;
  }

  countFailed(checks: ApiHealthCheck[]): number {
    return checks.filter(c => c.status !== 'success').length;
  }

  trackByEndpoint(index: number, check: ApiHealthCheck): string {
    return check.endpoint;
  }

  getOverallStatus(): string {
    const backend = this.backendHealth();
    const frontend = this.frontendHealth();
    
    if (!backend || !frontend) return 'Checking...';

    if (backend.overallStatus === 'healthy' && frontend.overallStatus === 'healthy') {
      return 'Healthy';
    } else if (backend.overallStatus === 'unhealthy' || frontend.overallStatus === 'unhealthy') {
      return 'Unhealthy';
    } else {
      return 'Degraded';
    }
  }

  getOverallStatusClass(): string {
    const backend = this.backendHealth();
    const frontend = this.frontendHealth();
    
    if (!backend || !frontend) return 'checking';

    if (backend.overallStatus === 'healthy' && frontend.overallStatus === 'healthy') {
      return 'healthy';
    } else if (backend.overallStatus === 'unhealthy' || frontend.overallStatus === 'unhealthy') {
      return 'unhealthy';
    } else {
      return 'degraded';
    }
  }

  getOverallStatusIcon(): string {
    const status = this.getOverallStatusClass();
    if (status === 'healthy') return 'check_circle';
    if (status === 'unhealthy') return 'error';
    return 'warning';
  }

  getStatusMessage(): string {
    const backend = this.backendHealth();
    const frontend = this.frontendHealth();
    
    if (!backend || !frontend) return 'Running health checks...';

    const backendFailed = this.countFailed(backend.checks);
    const frontendFailed = this.countFailed(frontend.checks);
    const totalFailed = backendFailed + frontendFailed;

    if (totalFailed === 0) {
      return 'All systems operational. No issues detected.';
    } else if (totalFailed <= 2) {
      return `Minor issues detected: ${totalFailed} endpoint(s) not responding properly.`;
    } else {
      return `Critical issues detected: ${totalFailed} endpoint(s) are failing. Check logs for details.`;
    }
  }
}
