import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, switchMap, startWith } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ApiStatusResponse {
  timestamp: string;
  environment: string;
  buildId: string;
  checks: {
    database: any;
    apis: Record<string, any>;
    system: any;
  };
  logs: Array<{
    timestamp: string;
    level: string;
    message: string;
    [key: string]: any;
  }>;
  summary: {
    database: string;
    apis: {
      passed: number;
      total: number;
      percentage: string;
    };
    overall: string;
    responseTime: string;
    totalLogs: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AdminStatusService {
  private apiUrl = `${environment.apiBaseUrl}/admin`;

  constructor(private http: HttpClient) {}

  /**
   * Get current system status
   */
  getStatus(): Observable<ApiStatusResponse> {
    return this.http.get<ApiStatusResponse>(`${this.apiUrl}/status`);
  }

  /**
   * Auto-refresh status every 5 seconds
   */
  getStatusStream(intervalMs = 5000): Observable<ApiStatusResponse> {
    return interval(intervalMs).pipe(
      startWith(0),
      switchMap(() => this.getStatus())
    );
  }

  /**
   * Get application logs
   */
  getLogs(): Observable<any> {
    return this.http.get(`${this.apiUrl}/logs`);
  }

  /**
   * Get configuration info (non-sensitive)
   */
  getConfig(): Observable<any> {
    return this.http.get(`${this.apiUrl}/config`);
  }
}
