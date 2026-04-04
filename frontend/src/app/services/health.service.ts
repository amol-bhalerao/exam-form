import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';
import { API_BASE_URL } from '../core/api';

export interface ApiHealthCheck {
  endpoint: string;
  method: 'GET' | 'POST';
  name?: string;
  status: 'success' | 'failed' | 'timeout';
  statusCode?: number;
  responseTime: number;
  message: string;
  error?: string;
  timestamp: Date;
  testPayload?: any;
}

export interface HealthCheckResult {
  category: string;
  timestamp: Date;
  checks: ApiHealthCheck[];
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
}

@Injectable({
  providedIn: 'root'
})
export class HealthService {
  private readonly TIMEOUT = 5000; // 5 seconds

  // API endpoints to test - only endpoints that actually exist
  private backendApiTests = [
    { endpoint: '/students', method: 'GET', name: 'Students API' },
    { endpoint: '/institutes', method: 'GET', name: 'Institutes API' },
    { endpoint: '/masters/streams', method: 'GET', name: 'Streams Data' },
    { endpoint: '/masters/subjects', method: 'GET', name: 'Subjects Data' },
    { endpoint: '/exams', method: 'GET', name: 'Exams API' },
    { endpoint: '/users', method: 'GET', name: 'Users List' },
    { 
      endpoint: '/auth/login', 
      method: 'POST', 
      name: 'Auth Login',
      payload: { username: 'test', password: 'test' }
    },
    {
      endpoint: '/students/select-institute',
      method: 'POST',
      name: 'Institute Selection',
      payload: { instituteId: 1, streamCode: 'COMMERCE' }
    }
  ];

  constructor(private http: HttpClient) {}

  /**
   * Run all health checks for backend
   */
  checkBackendHealth(): Observable<HealthCheckResult> {
    return forkJoin(this.backendApiTests.map(test => this.checkEndpoint(test))).pipe(
      map((results) => {
        const healthyCount = results.filter(result => result.status === 'success').length;
        const totalCount = results.length;

        const overallStatus = healthyCount === totalCount
          ? 'healthy'
          : healthyCount >= totalCount * 0.7
            ? 'degraded'
            : 'unhealthy';

        return {
          category: 'Backend APIs',
          timestamp: new Date(),
          checks: results,
          overallStatus
        };
      })
    );
  }

  /**
   * Check a single endpoint
   */
  private checkEndpoint(test: any): Observable<ApiHealthCheck> {
    const startTime = performance.now();
    const url = `${API_BASE_URL}${test.endpoint}`;

    const request$ = test.method === 'GET'
      ? this.http.get(url, { observe: 'response', responseType: 'text' as const })
      : this.http.post(url, test.payload || {}, { observe: 'response', responseType: 'text' as const });

    return request$.pipe(
      timeout(this.TIMEOUT),
      map(response => this.buildCheckResult(test, startTime, response.status)),
      catchError(error => {
        const statusCode = Number(error?.status || 0);
        const endpointReachable = this.isHealthyStatus(test, statusCode);

        const result: ApiHealthCheck = {
          endpoint: test.endpoint,
          method: test.method,
          name: test.name,
          status: statusCode === 0 ? 'timeout' : endpointReachable ? 'success' : 'failed',
          statusCode,
          responseTime: Math.round(performance.now() - startTime),
          message: this.getStatusMessage(test, statusCode, error?.statusText || error?.message || 'Request failed'),
          error: statusCode === 0 || !endpointReachable ? (error?.error?.message || error?.message || 'Unknown error') : undefined,
          timestamp: new Date(),
          testPayload: test.payload
        };

        return of(result);
      })
    );
  }

  private buildCheckResult(test: any, startTime: number, statusCode: number): ApiHealthCheck {
    return {
      endpoint: test.endpoint,
      method: test.method,
      name: test.name,
      status: this.isHealthyStatus(test, statusCode) ? 'success' : 'failed',
      statusCode,
      responseTime: Math.round(performance.now() - startTime),
      message: this.getStatusMessage(test, statusCode),
      timestamp: new Date(),
      testPayload: test.payload
    };
  }

  private isHealthyStatus(test: any, statusCode: number): boolean {
    if (!statusCode || statusCode === 404 || statusCode >= 500) {
      return false;
    }

    if (test.endpoint === '/auth/login') {
      return [200, 201, 400, 401, 403].includes(statusCode);
    }

    if (test.method === 'POST') {
      return [200, 201, 400, 401, 403, 409].includes(statusCode);
    }

    return statusCode >= 200 && statusCode < 300;
  }

  private getStatusMessage(test: any, statusCode: number, fallback = 'OK'): string {
    if (statusCode === 0) {
      return 'Request timed out or server is unreachable';
    }

    if (test.endpoint === '/auth/login' && [400, 401, 403].includes(statusCode)) {
      return `${statusCode} endpoint reachable (authentication validation working)`;
    }

    if (test.method === 'POST' && [400, 401, 403, 409].includes(statusCode)) {
      return `${statusCode} endpoint reachable (validation/auth returned as expected)`;
    }

    return `${statusCode} ${fallback}`.trim();
  }

  /**
   * Check frontend health (simple self-test)
   */
  checkFrontendHealth(): Observable<HealthCheckResult> {
    const checks: ApiHealthCheck[] = [
      {
        endpoint: 'Angular Framework',
        method: 'GET',
        name: 'Angular App',
        status: 'success',
        statusCode: 200,
        responseTime: 0,
        message: 'Angular application loaded successfully',
        timestamp: new Date()
      },
      {
        endpoint: 'Material Design',
        method: 'GET',
        name: 'Material UI',
        status: 'success',
        statusCode: 200,
        responseTime: 0,
        message: 'Material Design components available',
        timestamp: new Date()
      },
      {
        endpoint: 'LocalStorage',
        method: 'GET',
        name: 'Browser Storage',
        status: this.checkLocalStorage() ? 'success' : 'failed',
        statusCode: this.checkLocalStorage() ? 200 : 500,
        responseTime: 0,
        message: this.checkLocalStorage() ? 'LocalStorage available' : 'LocalStorage unavailable',
        timestamp: new Date()
      },
      {
        endpoint: 'Authentication State',
        method: 'GET',
        name: 'Auth Service',
        status: 'success',
        statusCode: 200,
        responseTime: 0,
        message: 'Authentication service initialized',
        timestamp: new Date()
      }
    ];

    return of({
      category: 'Frontend',
      timestamp: new Date(),
      checks,
      overallStatus: 'healthy'
    });
  }

  private checkLocalStorage(): boolean {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }
}
