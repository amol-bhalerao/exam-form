import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminStatusService, ApiStatusResponse } from '../../services/admin-status.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-admin-status-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-dashboard" *ngIf="status">
      <div class="header">
        <h1>🔧 API Status Dashboard</h1>
        <div class="meta">
          <span class="env" [class]="'env-' + status.environment">{{ status.environment.toUpperCase() }}</span>
          <span class="build">Build: {{ status.buildId }}</span>
          <span class="time">{{ status.timestamp | date: 'HH:mm:ss' }}</span>
          <button (click)="refresh()" class="btn-refresh">🔄 Refresh</button>
        </div>
      </div>

      <!-- SUMMARY CARDS -->
      <div class="summary-section">
        <div class="card" [class.healthy]="status.summary.overall === 'HEALTHY'" [class.degraded]="status.summary.overall === 'DEGRADED'">
          <h3>Overall Status</h3>
          <p class="big-status">{{ status.summary.overall }}</p>
        </div>
        
        <div class="card">
          <h3>Database</h3>
          <p class="status-badge" [class]="status.summary.database === 'PASS' ? 'pass' : 'fail'">
            {{ status.summary.database }}
          </p>
          <small *ngIf="status.checks.database">{{ status.checks.database.message }}</small>
        </div>

        <div class="card">
          <h3>API Endpoints</h3>
          <p class="big-status">{{ status.summary.apis.passed }}/{{ status.summary.apis.total }}</p>
          <small>{{ status.summary.apis.percentage }} passing</small>
        </div>

        <div class="card">
          <h3>Response Time</h3>
          <p class="big-status">{{ status.summary.responseTime }}</p>
        </div>
      </div>

      <!-- DATABASE CHECK -->
      <div class="section">
        <h2>📊 Database Check</h2>
        <div class="db-status" [class]="status.checks.database.status === 'OK' ? 'success' : 'error'">
          <div class="status-header">
            <span class="icon">{{ status.checks.database.status === 'OK' ? '✅' : '❌' }}</span>
            <span class="status-text">{{ status.checks.database.status }}</span>
          </div>
          <p>{{ status.checks.database.message }}</p>
          <small *ngIf="status.checks.database.responseTime">{{ status.checks.database.responseTime }}</small>
          <div *ngIf="status.checks.database.error" class="error-details">
            <strong>Error:</strong> {{ status.checks.database.error }}
          </div>
        </div>
      </div>

      <!-- TABLE CHECKS -->
      <div class="section">
        <h2>📋 Database Tables</h2>
        <div class="table-list">
          <div 
            *ngFor="let api of getTableChecks()" 
            class="table-item"
            [class.success]="api.status === 'OK'"
            [class.error]="api.status === 'FAILED'"
          >
            <span class="icon">{{ api.status === 'OK' ? '✅' : '❌' }}</span>
            <span class="name">{{ api.table }}</span>
            <span class="count" *ngIf="api.recordCount !== undefined">{{ api.recordCount }} records</span>
            <span class="error" *ngIf="api.error">{{ api.error }}</span>
          </div>
        </div>
      </div>

      <!-- SYSTEM INFO -->
      <div class="section" *ngIf="status.checks.system">
        <h2>⚙️ System Information</h2>
        <div class="system-grid">
          <div class="sys-item">
            <label>Node Version</label>
            <value>{{ status.checks.system.nodeVersion }}</value>
          </div>
          <div class="sys-item">
            <label>Platform</label>
            <value>{{ status.checks.system.platform }}</value>
          </div>
          <div class="sys-item">
            <label>Uptime</label>
            <value>{{ formatUptime(status.checks.system.uptime) }}</value>
          </div>
          <div class="sys-item">
            <label>Memory (Heap)</label>
            <value>{{ status.checks.system.memory.heapUsed }}/{{ status.checks.system.memory.heapTotal }} MB</value>
          </div>
        </div>
      </div>

      <!-- LOGS -->
      <div class="section logs-section">
        <h2>📝 Logs ({{ status.logs.length }} entries)</h2>
        <div class="logs-container">
          <div 
            *ngFor="let log of status.logs | slice: -10" 
            class="log-entry"
            [class]="'log-' + log.level.toLowerCase()"
          >
            <span class="time">{{ log.timestamp | date: 'HH:mm:ss.SSS' }}</span>
            <span class="level">{{ log.level }}</span>
            <span class="message">{{ log.message }}</span>
            <span *ngIf="log.recordCount !== undefined" class="data">{{ log.recordCount }} records</span>
            <span *ngIf="log.error" class="error-log">{{ log.error }}</span>
          </div>
        </div>
      </div>

      <!-- ENVIRONMENT CONFIG -->
      <div class="section" *ngIf="config">
        <h2>🔐 Configuration</h2>
        <div class="config-list">
          <div class="config-item">
            <label>Environment</label>
            <value>{{ config.environment }}</value>
          </div>
          <div class="config-item">
            <label>Build ID</label>
            <value>{{ config.buildId }}</value>
          </div>
          <div class="config-item">
            <label>Database</label>
            <value>{{ config.databaseUrl }}</value>
          </div>
          <div class="config-item">
            <label>CORS Origin</label>
            <value>{{ config.corsOrigin }}</value>
          </div>
        </div>
      </div>
    </div>

    <div *ngIf="loading" class="loading">
      <p>⏳ Loading status...</p>
    </div>

    <div *ngIf="error" class="error-screen">
      <h2>❌ Error Loading Status</h2>
      <p>{{ error }}</p>
      <button (click)="refresh()">Try Again</button>
    </div>
  `
})
export class AdminStatusDashboardComponent implements OnInit, OnDestroy {
  status: ApiStatusResponse | null = null;
  config: any | null = null;
  loading = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(private adminStatusService: AdminStatusService) {}

  ngOnInit() {
    this.refresh();
    
    // Auto-refresh every 5 seconds
    this.adminStatusService.getStatusStream(5000)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (status) => {
          this.status = status;
          this.loading = false;
          this.error = null;
        },
        error: (err) => {
          this.error = err.message || 'Failed to load status';
          this.loading = false;
        }
      });

    // Load config once
    this.adminStatusService.getConfig()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (config) => {
          this.config = config;
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refresh() {
    this.loading = true;
    this.adminStatusService.getStatus().subscribe({
      next: (status) => {
        this.status = status;
        this.loading = false;
        this.error = null;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load status';
        this.loading = false;
      }
    });
  }

  getTableChecks() {
    if (!this.status) return [];
    return Object.values(this.status.checks.apis).filter(
      api => typeof api === 'object' && 'table' in api
    );
  }

  formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours}h ${minutes}m ${secs}s`;
  }
}
