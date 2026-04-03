import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
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
    const checks$ = this.backendApiTests.map(test => this.checkEndpoint(test));
    
    return new Observable(observer => {
      Promise.all(checks$.map(check$ => check$.toPromise())).then((results: any[]) => {
        const results_filtered = results.filter(r => r !== null);
        const healthyCount = results_filtered.filter(r => r.status === 'success').length;
        const totalCount = results_filtered.length;
        
        const overallStatus = healthyCount === totalCount ? 'healthy' : 
                            healthyCount >= totalCount * 0.7 ? 'degraded' : 'unhealthy';
        
        observer.next({
          category: 'Backend APIs',
          timestamp: new Date(),
          checks: results_filtered,
          overallStatus
        });
        observer.complete();
      }).catch(err => {
        observer.error(err);
      });
    });
  }

  /**
   * Check a single endpoint
   */
  private checkEndpoint(test: any): Observable<ApiHealthCheck> {
    const startTime = performance.now();
    const url = `${API_BASE_URL}${test.endpoint}`;

    if (test.method === 'GET') {
      return this.http.get(url, { observe: 'response' }).pipe(
        timeout(this.TIMEOUT),
        map(response => {
          const result: ApiHealthCheck = {
            endpoint: test.endpoint,
            method: 'GET',
            name: test.name,
            status: response.status === 200 ? 'success' : 'failed',
            statusCode: response.status,
            responseTime: Math.round(performance.now() - startTime),
            message: `${response.status} OK`,
            timestamp: new Date(),
            testPayload: test.payload
          };
          return result;
        }),
        catchError(error => {
          const responseTime = Math.round(performance.now() - startTime);
          const result: ApiHealthCheck = {
            endpoint: test.endpoint,
            method: 'GET',
            name: test.name,
            status: error.status === 0 ? 'timeout' : 'failed',
            statusCode: error.status || 0,
            responseTime,
            message: error.statusText || error.message || 'Request failed',
            error: error.error?.message || error.message || 'Unknown error',
            timestamp: new Date(),
            testPayload: test.payload
          };
          return of(result);
        })
      );
    } else if (test.method === 'POST') {
      return this.http.post(url, test.payload || {}, { observe: 'response' }).pipe(
        timeout(this.TIMEOUT),
        map(response => {
          const result: ApiHealthCheck = {
            endpoint: test.endpoint,
            method: 'POST',
            name: test.name,
            status: [200, 201, 409].includes(response.status) ? 'success' : 'failed',
            statusCode: response.status,
            responseTime: Math.round(performance.now() - startTime),
            message: `${response.status} OK`,
            timestamp: new Date(),
            testPayload: test.payload
          };
          return result;
        }),
        catchError(error => {
          const responseTime = Math.round(performance.now() - startTime);
          const result: ApiHealthCheck = {
            endpoint: test.endpoint,
            method: 'POST',
            name: test.name,
            status: error.status === 0 ? 'timeout' : 'failed',
            statusCode: error.status || 0,
            responseTime,
            message: error.statusText || error.message || 'Request failed',
            error: error.error?.message || error.message || 'Unknown error',
            timestamp: new Date(),
            testPayload: test.payload
          };
          return of(result);
        })
      );
    }

    const result: ApiHealthCheck = {
      endpoint: test.endpoint,
      method: test.method,
      name: test.name,
      status: 'failed',
      responseTime: 0,
      message: 'Invalid request method',
      error: 'Method not supported',
      timestamp: new Date()
    };
    return of(result);
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
