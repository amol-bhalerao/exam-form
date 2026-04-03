import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { interval, Subject } from 'rxjs';
import { takeUntil, switchMap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface HealthStatus {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  database: { healthy: boolean; latency: string };
  sessions: {
    activeConnections: number;
    totalUsers: number;
    totalStudents: number;
    memory: any;
    cpu: any;
  };
  performance: { responseTime: string; uptime: string };
  version: string;
  environment: string;
  warnings: string[];
  timestamp: string;
}

interface SessionStats {
  activeUsers: number;
  totalActiveSessions: number;
  averageSessionsPerUser: string;
  lastHourLogins: number;
  sessionsByRole: Record<string, number>;
  timestamp: string;
}

@Component({
  selector: 'app-health-check',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="health-container">
      <div class="health-header">
        <h1>🏥 System Health Monitor</h1>
        <p class="subtitle">Real-time API & Frontend Status</p>
        <div class="refresh-info">
          Auto-refreshing every 10 seconds • Last updated: {{ lastUpdated | date:'medium' }}
        </div>
      </div>

      <!-- Overall Status Card -->
      <div class="status-card" [ngClass]="'status-' + (apiHealth?.status | lowercase)">
        <div class="status-header">
          <span class="status-icon" [ngClass]="getStatusIcon(apiHealth?.status)">
            {{ getStatusEmoji(apiHealth?.status) }}
          </span>
          <div>
            <h2>API Status: {{ apiHealth?.status || 'CHECKING...' }}</h2>
            <p>{{ getStatusMessage(apiHealth?.status) }}</p>
          </div>
        </div>
      </div>

      <!-- Critical Metrics -->
      <div class="metrics-grid">
        <!-- Database Health -->
        <div class="metric-card" [class.healthy]="apiHealth?.database?.healthy">
          <div class="metric-title">Database</div>
          <div class="metric-value">
            {{ apiHealth?.database?.healthy ? '✓ Connected' : '✗ Offline' }}
          </div>
          <div class="metric-detail">
            Latency: {{ apiHealth?.database?.latency || 'N/A' }}
          </div>
        </div>

        <!-- Active Connections -->
        <div class="metric-card">
          <div class="metric-title">Active Sessions</div>
          <div class="metric-value">{{ apiHealth?.sessions?.activeConnections || 0 }}</div>
          <div class="metric-detail">
            {{ sessionStats?.activeUsers || 0 }} users online
          </div>
        </div>

        <!-- Memory Usage -->
        <div class="metric-card" [class.warning]="memoryPercent > 80">
          <div class="metric-title">Memory Usage</div>
          <div class="metric-value">{{ memoryPercent }}%</div>
          <div class="metric-detail">
            {{ apiHealth?.sessions?.memory?.heapUsed }} / {{ apiHealth?.sessions?.memory?.heapTotal }}
          </div>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="memoryPercent"></div>
          </div>
        </div>

        <!-- API Response Time -->
        <div class="metric-card">
          <div class="metric-title">Response Time</div>
          <div class="metric-value">{{ apiHealth?.performance?.responseTime || 'N/A' }}</div>
          <div class="metric-detail">
            Uptime: {{ apiHealth?.performance?.uptime || 'N/A' }}
          </div>
        </div>
      </div>

      <!-- Detailed Session Stats -->
      <div class="section">
        <h3>📊 Session Statistics</h3>
        <div class="details-grid">
          <div class="detail-item">
            <label>Total Users</label>
            <span class="detail-value">{{ apiHealth?.sessions?.totalUsers || 0 }}</span>
          </div>
          <div class="detail-item">
            <label>Total Students</label>
            <span class="detail-value">{{ apiHealth?.sessions?.totalStudents || 0 }}</span>
          </div>
          <div class="detail-item">
            <label>Active Users (Last Hour)</label>
            <span class="detail-value">{{ sessionStats?.lastHourLogins || 0 }}</span>
          </div>
          <div class="detail-item">
            <label>Avg Sessions/User</label>
            <span class="detail-value">{{ sessionStats?.averageSessionsPerUser || '0' }}</span>
          </div>
        </div>

        <!-- Sessions by Role -->
        <div *ngIf="sessionStats?.sessionsByRole" class="role-breakdown">
          <h4>Sessions by User Role</h4>
          <div class="role-grid">
            <div *ngFor="let role of objectKeys(sessionStats.sessionsByRole)" class="role-item">
              <span class="role-name">{{ role }}</span>
              <span class="role-count">{{ sessionStats.sessionsByRole[role] }} users</span>
            </div>
          </div>
        </div>
      </div>

      <!-- System Resources -->
      <div class="section">
        <h3>⚙️ System Resources</h3>
        <div class="resource-grid">
          <div class="resource-item">
            <label>Heap Memory</label>
            <div class="resource-detail">
              {{ apiHealth?.sessions?.memory?.heapUsed }} / {{ apiHealth?.sessions?.memory?.heapTotal }}
            </div>
          </div>
          <div class="resource-item">
            <label>System Memory</label>
            <div class="resource-detail">
              {{ apiHealth?.sessions?.memory?.systemFree }} free / {{ apiHealth?.sessions?.memory?.systemTotal }} total
            </div>
          </div>
          <div class="resource-item">
            <label>CPU Cores</label>
            <div class="resource-detail">{{ apiHealth?.sessions?.cpu?.cores }} cores</div>
          </div>
          <div class="resource-item">
            <label>Load Average</label>
            <div class="resource-detail">
              {{ formatLoadAverage(apiHealth?.sessions?.cpu?.loadAverage) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Version & Environment -->
      <div class="section">
        <h3>ℹ️ System Information</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>Version</label>
            <span>{{ apiHealth?.version || 'unknown' }}</span>
          </div>
          <div class="info-item">
            <label>Environment</label>
            <span [class]="'env-' + (apiHealth?.environment | lowercase)">
              {{ apiHealth?.environment | uppercase }}
            </span>
          </div>
          <div class="info-item">
            <label>Timestamp</label>
            <span>{{ apiHealth?.timestamp | date:'medium' }}</span>
          </div>
        </div>
      </div>

      <!-- Warnings -->
      <div *ngIf="apiHealth?.warnings?.length" class="warnings-section">
        <h3>⚠️ System Warnings</h3>
        <div class="warning-list">
          <div *ngFor="let warning of apiHealth?.warnings" class="warning-item">
            {{ warning }}
          </div>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-banner">
        <h3>❌ Error Loading Health Status</h3>
        <p>{{ error }}</p>
        <button (click)="refreshHealth()">Retry</button>
      </div>
    </div>
  `,
  styles: [`
    .health-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
      font-family: 'Segoe UI', Arial, sans-serif;
    }

    .health-header {
      text-align: center;
      color: white;
      margin-bottom: 2rem;
    }

    .health-header h1 {
      font-size: 2.5rem;
      margin: 0 0 0.5rem 0;
    }

    .subtitle {
      font-size: 1.1rem;
      opacity: 0.9;
      margin: 0;
    }

    .refresh-info {
      font-size: 0.9rem;
      opacity: 0.8;
      margin-top: 1rem;
    }

    .status-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
      border-left: 5px solid;
    }

    .status-card.status-healthy {
      border-left-color: #4caf50;
      background: #f1f8f6;
    }

    .status-card.status-degraded {
      border-left-color: #ff9800;
      background: #fff8f0;
    }

    .status-card.status-unhealthy {
      border-left-color: #f44336;
      background: #fff0f0;
    }

    .status-header {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .status-icon {
      font-size: 2rem;
      line-height: 1;
    }

    .status-card h2 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .status-card p {
      margin: 0;
      color: #666;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .metric-card {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border: 2px solid #e0e0e0;
    }

    .metric-card.healthy {
      border-color: #4caf50;
      background: #f9fff9;
    }

    .metric-card.warning {
      border-color: #ff9800;
      background: #fffaf0;
    }

    .metric-title {
      font-size: 0.9rem;
      color: #666;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .metric-value {
      font-size: 2rem;
      font-weight: 700;
      color: #667eea;
      margin: 0.5rem 0;
    }

    .metric-detail {
      font-size: 0.85rem;
      color: #999;
    }

    .progress-bar {
      height: 4px;
      background: #e0e0e0;
      border-radius: 2px;
      margin-top: 0.5rem;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4caf50, #ff9800);
      transition: width 0.3s ease;
    }

    .section {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .section h3 {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.2rem;
    }

    .section h4 {
      margin: 1rem 0 0.5rem 0;
      color: #666;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      padding: 1rem;
      background: #f9f9f9;
      border-radius: 6px;
    }

    .detail-item label {
      font-size: 0.85rem;
      color: #999;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }

    .detail-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #667eea;
    }

    .role-breakdown {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e0e0e0;
    }

    .role-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 1rem;
    }

    .role-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem;
      background: #f0f7ff;
      border-radius: 6px;
      border: 1px solid #e0e8ff;
    }

    .role-name {
      font-weight: 600;
      color: #667eea;
      margin-bottom: 0.3rem;
    }

    .role-count {
      font-size: 0.9rem;
      color: #999;
    }

    .resource-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .resource-item {
      padding: 1rem;
      background: #f9f9f9;
      border-radius: 6px;
    }

    .resource-item label {
      display: block;
      font-size: 0.85rem;
      color: #999;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }

    .resource-detail {
      font-size: 0.95rem;
      color: #333;
      font-weight: 500;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .info-item {
      padding: 1rem;
      background: #f9f9f9;
      border-radius: 6px;
    }

    .info-item label {
      display: block;
      font-size: 0.85rem;
      color: #999;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 0.5rem;
    }

    .info-item span {
      font-size: 1rem;
      color: #333;
      font-weight: 500;
    }

    .env-production {
      background: #ffebee;
      color: #c62828;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
    }

    .env-development {
      background: #e3f2fd;
      color: #1565c0;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
    }

    .warnings-section {
      background: #fff3e0;
      border: 2px solid #ff9800;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .warnings-section h3 {
      margin: 0 0 1rem 0;
      color: #e65100;
    }

    .warning-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .warning-item {
      padding: 0.75rem 1rem;
      background: white;
      border-left: 4px solid #ff9800;
      color: #666;
      border-radius: 4px;
    }

    .error-banner {
      background: #ffebee;
      border: 2px solid #f44336;
      border-radius: 8px;
      padding: 1.5rem;
      color: #c62828;
    }

    .error-banner h3 {
      margin: 0 0 0.5rem 0;
    }

    .error-banner p {
      margin: 0 0 1rem 0;
    }

    .error-banner button {
      background: #f44336;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
    }

    .error-banner button:hover {
      background: #d32f2f;
    }

    @media (max-width: 600px) {
      .health-container {
        padding: 1rem;
      }

      .health-header h1 {
        font-size: 1.8rem;
      }

      .metrics-grid {
        grid-template-columns: 1fr;
      }

      .details-grid,
      .resource-grid,
      .info-grid,
      .role-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HealthCheckComponent implements OnInit, OnDestroy {
  apiHealth: HealthStatus | null = null;
  sessionStats: SessionStats | null = null;
  error: string | null = null;
  lastUpdated: Date = new Date();
  memoryPercent = 0;

  private destroy$ = new Subject<void>();
  private refreshInterval = interval(10000); // Refresh every 10 seconds

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.refreshHealth();
    
    // Auto-refresh health status
    this.refreshInterval
      .pipe(
        switchMap(() => this.getHealth()),
        takeUntil(this.destroy$)
      )
      .subscribe(
        (health) => {
          this.apiHealth = health;
          this.lastUpdated = new Date();
          this.updateMemoryPercent();
        },
        (err) => {
          this.error = `Failed to fetch health: ${err.message}`;
        }
      );

    // Refresh session stats
    this.getSessionStats();
    interval(30000)
      .pipe(
        switchMap(() => this.getSessionStats()),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  refreshHealth() {
    this.getHealth().subscribe(
      (health) => {
        this.apiHealth = health;
        this.error = null;
        this.lastUpdated = new Date();
        this.updateMemoryPercent();
        this.getSessionStats();
      },
      (err) => {
        this.error = `API Error: ${err.message}. Server may be offline.`;
      }
    );
  }

  private getHealth() {
    return this.http.get<HealthStatus>('/api/health/metrics/status').pipe(
      catchError(err => {
        throw err;
      })
    );
  }

  private getSessionStats() {
    return this.http.get<SessionStats>('/api/health/metrics/sessions').pipe(
      catchError(() => of(null))
    ).pipe(
      switchMap(stats => {
        if (stats) {
          this.sessionStats = stats;
        }
        return of(null);
      })
    );
  }

  private updateMemoryPercent() {
    if (this.apiHealth?.sessions?.memory?.heapUsagePercent) {
      this.memoryPercent = this.apiHealth.sessions.memory.heapUsagePercent;
    }
  }

  getStatusMessage(status?: string): string {
    switch (status) {
      case 'HEALTHY':
        return 'System is running normally';
      case 'DEGRADED':
        return 'System is functional but experiencing issues';
      case 'UNHEALTHY':
        return 'System is offline or experiencing critical issues';
      default:
        return 'Checking system status...';
    }
  }

  getStatusEmoji(status?: string): string {
    switch (status) {
      case 'HEALTHY':
        return '✅';
      case 'DEGRADED':
        return '⚠️';
      case 'UNHEALTHY':
        return '❌';
      default:
        return '⏳';
    }
  }

  getStatusIcon(status?: string): string {
    return status ? status.toLowerCase() : 'checking';
  }

  formatLoadAverage(loadAvg?: number[]): string {
    if (!loadAvg || loadAvg.length === 0) return 'N/A';
    return loadAvg.map(l => l.toFixed(2)).join(', ');
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj || {});
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
