import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, timeout } from 'rxjs/operators';
import { API_BASE_URL } from './api';

export interface PostalLocation {
  pincode: string;
  district: string;
  taluka: string;
  village: string;
  state?: string;
  officeType?: string;
  officeName?: string;
}

export interface PincodeResponse {
  success: boolean;
  pincode: string;
  locations: PostalLocation[];
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PincodeService {
  private readonly http = inject(HttpClient);
  // Use API_BASE_URL to ensure proper proxying through backend
  private readonly API_URL = `${API_BASE_URL}/pincodes`;

  /**
   * Fetch address details from pincode via backend proxy
   * Backend calls external API to avoid CORS issues
   */
  getPincodeDetails(pincode: string): Observable<PostalLocation[]> {
    if (!pincode || pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      return of([]);
    }

    return this.http.get<PincodeResponse>(`${this.API_URL}/${pincode}`).pipe(
      timeout(8000), // 8 second timeout for external API call
      map((response: PincodeResponse) => {
        if (response.success && response.locations && response.locations.length > 0) {
          return response.locations;
        }
        return [];
      }),
      catchError((error) => {
        // Error fetching pincode details
        return of([]);
      })
    );
  }

  /**
   * Get pincode suggestions with debounce and distinct
   */
  searchPincodes(pincode: string): Observable<PostalLocation[]> {
    return this.getPincodeDetails(pincode);
  }
}

