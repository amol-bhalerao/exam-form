import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminStatusService, ApiStatusResponse } from '../services/admin-status.service';
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
  `,
  styles: [`
    .admin-dashboard {
      padding: 20px;
      background: #f5f5f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .header {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      color: #333;
    }

    .meta {
      display: flex;
      gap: 15px;
      align-items: center;
      flex-wrap: wrap;
      font-size: 12px;
      color: #666;
    }

    .env {
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: bold;
      &.env-production { background: #fee; color: #c33; }
      &.env-development { background: #efe; color: #3c3; }
    }

    .btn-refresh {
      padding: 6px 12px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      &:hover { background: #0056b3; }
    }

    .summary-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }

    .card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      text-align: center;
      
      &.healthy {
        border-left: 4px solid #28a745;
      }
      
      &.degraded {
        border-left: 4px solid #ffc107;
      }

      h3 {
        margin: 0 0 10px 0;
        font-size: 14px;
        color: #666;
        text-transform: uppercase;
      }

      .big-status {
        margin: 0;
        font-size: 32px;
        font-weight: bold;
        color: #333;
      }

      small {
        display: block;
        color: #999;
        font-size: 12px;
      }
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 4px;
      font-weight: bold;
      &.pass { background: #d4edda; color: #155724; }
      &.fail { background: #f8d7da; color: #721c24; }
    }

    .section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);

      h2 {
        margin: 0 0 15px 0;
        font-size: 20px;
        color: #333;
        border-bottom: 2px solid #f0f0f0;
        padding-bottom: 10px;
      }
    }

    .db-status {
      padding: 15px;
      border-radius: 4px;
      
      &.success {
        background: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;

        .status-header { color: #155724; }
      }

      &.error {
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        color: #721c24;

        .status-header { color: #721c24; }
      }

      .status-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: bold;
        font-size: 16px;
      }

      p {
        margin: 8px 0;
      }

      small {
        display: block;
        opacity: 0.8;
      }

      .error-details {
        margin-top: 10px;
        padding: 10px;
        background: rgba(0,0,0,0.1);
        border-radius: 4px;
        font-family: monospace;
        font-size: 12px;
      }
    }

    .table-list {
      display: grid;
      gap: 10px;
    }

    .table-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f9f9f9;
      border-radius: 4px;
      border-left: 3px solid #ddd;

      &.success {
        border-left-color: #28a745;
        background: #f0f9f6;
      }

      &.error {
        border-left-color: #dc3545;
        background: #fdf6f6;
      }

      .icon { font-size: 18px; }
      .name { font-weight: 600; color: #333; flex: 1; }
      .count { color: #666; font-size: 12px; }
      .error { color: #dc3545; font-size: 12px; }
    }

    .system-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
    }

    .sys-item {
      padding: 12px;
      background: #f9f9f9;
      border-radius: 4px;

      label {
        display: block;
        font-size: 12px;
        color: #666;
        text-transform: uppercase;
        margin-bottom: 5px;
      }

      value {
        display: block;
        font-size: 16px;
        font-weight: bold;
        color: #333;
        font-family: monospace;
      }
    }

    .logs-section {
      .logs-container {
        background: #1e1e1e;
        padding: 12px;
        border-radius: 4px;
        font-family: 'Monaco', 'Courier New', monospace;
        font-size: 12px;
        max-height: 400px;
        overflow-y: auto;
      }

      .log-entry {
        display: flex;
        gap: 10px;
        padding: 4px 0;
        border-bottom: 1px solid #333;
        color: #0f0;

        .time {
          color: #999;
          min-width: 100px;
        }

        .level {
          min-width: 60px;
          font-weight: bold;
        }

        &.log-success { .level { color: #0f0; } }
        &.log-error { 
          color: #f00;
          .level { color: #f00; }
          .error-log { color: #f44; }
        }
        &.log-info { .level { color: #0af; } }
      }
    }

    .config-list {
      display: grid;
      gap: 12px;
    }

    .config-item {
      display: flex;
      justify-content: space-between;
      padding: 10px;
      background: #f9f9f9;
      border-radius: 4px;

      label {
        font-weight: 600;
        color: #666;
      }

      value {
        color: #333;
        font-family: monospace;
        max-width: 60%;
        text-align: right;
        word-break: break-word;
      }
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .error-screen {
      background: white;
      padding: 40px;
      border-radius: 8px;
      text-align: center;
      color: #721c24;

      h2 { color: #721c24; }

      button {
        margin-top: 20px;
        padding: 10px 20px;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        &:hover { background: #c82333; }
      }
    }
  `]
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
