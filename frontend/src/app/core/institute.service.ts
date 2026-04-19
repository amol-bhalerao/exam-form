import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { API_BASE_URL } from './api';

export interface Institute {
  id: number;
  name: string;
  code: string;
  collegeNo?: string;
  udiseNo?: string;
  address?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactMobile?: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class InstituteService {
  private http = inject(HttpClient);

  // Get list of approved institutes
  getApprovedInstitutes(): Observable<Institute[]> {
    return this.http.get<{ institutes: Institute[] }>(`${API_BASE_URL}/institutes/list`)
      .pipe(map(response => response.institutes));
  }
}
