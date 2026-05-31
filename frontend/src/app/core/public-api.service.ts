import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from './api';

export interface Exam {
  id: number;
  name: string;
  board: string;
  stream: string;
  class: string;
  startDate: string;
  endDate: string;
  applicationDeadline: string;
  description?: string;
  status: string;
  totalApplications?: number;
}

export interface PublicNewsItem {
  id: number;
  title: string;
  content: string;
  type: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class PublicApiService {
  private http = inject(HttpClient);

  // Get active exams that students can apply to
  getActiveExams(): Observable<{ exams: Exam[] }> {
    return this.http.get<{ exams: Exam[] }>(`${API_BASE_URL}/public/exams`);
  }

  getNews(): Observable<{ news: PublicNewsItem[] }> {
    return this.http.get<{ news: PublicNewsItem[] }>(`${API_BASE_URL}/public/news`);
  }

  // Get platform statistics
  getStats(): Observable<any> {
    return this.http.get(`${API_BASE_URL}/public/stats`);
  }
}
