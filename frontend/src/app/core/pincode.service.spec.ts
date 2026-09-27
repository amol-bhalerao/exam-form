import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PincodeService } from './pincode.service';
import { API_BASE_URL } from './api';

describe('PincodeService', () => {
  let service: PincodeService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PincodeService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('does not call the API for invalid pincodes', () => {
    for (const p of ['', '4310', '43100a', '4310051']) {
      let result: any;
      service.getPincodeDetails(p).subscribe((r) => (result = r));
      expect(result).toEqual([]);
    }
    http.expectNone(() => true);
  });

  it('returns locations for a valid pincode', () => {
    let result: any;
    service.getPincodeDetails('431005').subscribe((r) => (result = r));
    http.expectOne(`${API_BASE_URL}/pincodes/431005`).flush({ success: true, locations: [{ name: 'Garkheda', district: 'Aurangabad' }] });
    expect(result.length).toBe(1);
  });

  it('returns an empty list when the lookup fails', () => {
    let result: any;
    service.searchPincodes('431005').subscribe((r) => (result = r));
    http.expectOne(`${API_BASE_URL}/pincodes/431005`).flush({}, { status: 502, statusText: 'Bad Gateway' });
    expect(result).toEqual([]);
  });
});
