import { Injectable, signal, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from './api';
import { AuthService } from './auth.service';

export interface SubjectMarks {
  subjectId: number;
  subjectName: string;
  maxMarks: number;
  obtainedMarks: number;
  grade?: string;
  isBacklog: boolean;
  percentage?: number;
}

export interface StudentProfile {
  id?: number; // Add id field
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  aadharNumber?: string;
  apaarId?: string; // Automated Permanent Academic Account Registry
  rollNumber?: string;
  
  // College Information
  collegeId?: number;
  collegeName?: string;
  collegeBranch?: string;
  admissionYear?: number;
  stream?: string; // Science, Commerce, Arts
  streamCode?: string; // Code for stream selection
  board?: string;
  instituteId?: number; // Institute selection
  
  // Subject Marks
  subjects: SubjectMarks[];
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StudentProfileService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private studentProfile = signal<StudentProfile | null>(null);
  private isLoading = signal(false);
  private error = signal<string | null>(null);
  private profileCompletionPercentage = signal<number>(0);

  readonly profile$ = this.studentProfile.asReadonly();
  readonly isLoading$ = this.isLoading.asReadonly();
  readonly error$ = this.error.asReadonly();
  readonly completionPercentage$ = this.profileCompletionPercentage.asReadonly();

  constructor() {
    // Load profile on service init only if user is a STUDENT
    const currentUser = this.authService.user();
    if (currentUser?.role === 'STUDENT') {
      this.loadProfile().catch(err => {
        console.error('Failed to load profile during service init:', err);
      });
    }
  }

  /**
   * Calculate profile completion percentage based on filled fields
   * Required fields: firstName, lastName, dob, gender, aadhaar, address, pinCode, mobile, email, sscYear, xithYear (11 total)
   */
  private calculateCompletionPercentage(profile: any): number {
    const requiredFields = [
      'firstName',
      'lastName',
      'dob',
      'gender',
      'aadhaar',
      'address',
      'pinCode',
      'mobile',
      'email'
    ];

    let completedCount = 0;

    // Check required fields
    requiredFields.forEach(field => {
      const value = profile[field];
      if (value && value !== null && value !== '') {
        completedCount++;
      }
    });

    // Check previous exams (at least two years)
    const previousExams = profile.previousExams || [];
    const hasSSCYear = previousExams.some((e: any) => e.examType === 'SSC' && e.year);
    const hasXIIYear = previousExams.some((e: any) => e.examType === 'XII' && e.year);
    
    if (hasSSCYear) completedCount++;
    if (hasXIIYear) completedCount++;

    const TOTAL_FIELDS = 11;
    const percentage = Math.round((completedCount / TOTAL_FIELDS) * 100);
    return percentage;
  }

  /**
   * Check if profile completion is at least the specified percentage
   */
  isProfileCompletionAt(percentage: number): boolean {
    return this.profileCompletionPercentage() >= percentage;
  }

  /**
   * Check if profile is fully complete (100%)
   */
  isProfileComplete(): boolean {
    return this.profileCompletionPercentage() === 100;
  }

  /**
   * Check if basic profile (institute + stream selection) exists
   * This is required BEFORE students can access other features
   */
  hasBasicProfile(): boolean {
    const profile = this.studentProfile();
    return !!(profile?.instituteId && profile?.streamCode);
  }

  /**
   * Load student profile from backend
   * If profile is missing, returns specific error for redirect
   * Returns an observable for use in guards
   * Only works for STUDENT role - returns error for other roles
   */
  loadProfile() {
    // Check if user is a student - if not, return error
    const currentUser = this.authService.user();
    if (!currentUser || currentUser.role !== 'STUDENT') {
      return Promise.reject(new Error('USER_NOT_STUDENT'));
    }

    this.isLoading.set(true);
    this.error.set(null);

    return new Promise((resolve, reject) => {
      this.http.get<{ user: any; student: StudentProfile }>(`${API_BASE_URL}/me`).subscribe({
        next: (response: any) => {
          // The /me endpoint returns { user: {...}, student: {...} }
          const user = response.user;
          const student = response.student;
          
          // Institute selection is now optional - students can select it within the profile page
          // No longer checking if institute is selected before allowing profile access
          
          // Student record exists or create a new profile structure
          if (student && student.id) {
            // Student profile exists in database - use it  
            this.studentProfile.set(student);
            const completionPercentage = this.calculateCompletionPercentage(student);
            this.profileCompletionPercentage.set(completionPercentage);
            this.isLoading.set(false);
            console.log('Resolved student profile:', { instituteId: student.instituteId, streamCode: student.streamCode });
            resolve(student);
          } else {
            // Student record doesn't exist yet - create empty profile for student to fill
            const emptyProfile: any = {
              userId: currentUser?.userId,
              instituteId: null,  // Will be set when student selects institute
              streamCode: '',      // Will be set when student selects stream
              firstName: '',
              lastName: '',
              email: user.email || '',
              mobile: '',
              dob: '',
              gender: '',
              aadhaar: '',
              address: '',
              pinCode: '',
              district: '',
              taluka: '',
              village: '',
              categoryCode: '',
              minorityReligionCode: '',
              mediumCode: '',
              previousExams: [],
              bankDetails: {}
            };
            this.studentProfile.set(emptyProfile);
            this.profileCompletionPercentage.set(0);
            this.isLoading.set(false);
            console.log('Created empty profile - student will fill institute and other details');
            resolve(emptyProfile);
          }
        },
        error: (err: any) => {
          const errorCode = err?.error?.error;
          const errorMsg = err?.error?.message || err?.error?.error || 'Failed to load profile. Please try again.';
          
          // If profile doesn't exist yet, allow student to create it
          if (err.status === 404 || err?.error?.error === 'STUDENT_PROFILE_MISSING' || err?.error?.error === 'INSTITUTE_NOT_SELECTED') {
            console.warn('Student profile does not exist yet - will be created on first institute selection');
            
            // Create new empty profile object for the student to fill
            const emptyProfile: any = {
              userId: currentUser?.userId,
              firstName: '',
              lastName: '',
              email: currentUser?.username || '',
              mobile: '',
              dob: '',
              gender: '',
              aadhaar: '',
              address: '',
              pinCode: '',
              district: '',
              taluka: '',
              village: '',
              categoryCode: '',
              minorityReligionCode: '',
              mediumCode: '',
              previousExams: [],
              bankDetails: {}
            };
            
            this.studentProfile.set(emptyProfile);
            this.profileCompletionPercentage.set(0);
            this.isLoading.set(false);
            
            // Reject with specific error about institute selection
            const instituteNotSelectedError = new Error('INSTITUTE_NOT_SELECTED');
            (instituteNotSelectedError as any).error = { error: 'INSTITUTE_NOT_SELECTED', message: 'Please select an institute first' };
            reject(instituteNotSelectedError);
          } else {
            console.error('Failed to load student profile:', err);
            this.error.set(errorMsg);
            this.isLoading.set(false);
            
            // Reject with error for guards to handle
            reject(err);
          }
        }
      });
    });
  }

  /**
   * Transform frontend field names to backend field names
   * Frontend: dateOfBirth, aadharNumber, addressLineOne, etc.
   * Backend: dob, aadhaar, address, pinCode, etc.
   */
  private transformProfileToBackendFormat(data: any): any {
    const transformed: any = {};
    
    // Map frontend field names to backend field names
    const fieldMap: { [key: string]: string | null } = {
      'firstName': 'firstName',
      'lastName': 'lastName',
      'middleName': 'middleName',
      'motherName': 'motherName',
      'dateOfBirth': 'dob',
      'dob': 'dob',
      'gender': 'gender',
      'aadharNumber': 'aadhaar',
      'aadhaar': 'aadhaar',
      'apaarId': 'apaarId',
      'addressLineOne': 'address',
      'address': 'address',
      'addressLineTwo': null,
      'addressLineThree': null,
      'pincode': 'pinCode',
      'pinCode': 'pinCode',
      'district': 'district',
      'taluka': 'taluka',
      'revenueCircle': null,
      'village': 'village',
      'mobile': 'mobile',
      'email': null,
      'streamCode': 'streamCode',
      'categoryCode': 'categoryCode',
      'minorityReligionCode': 'minorityReligionCode',
      'divyangCode': 'divyangCode',
      'mediumCode': 'mediumCode'
    };
    
    for (const [key, value] of Object.entries(data)) {
      const backendKey = fieldMap[key];
      
      // Skip if field not in map or mapped to null
      if (!fieldMap.hasOwnProperty(key) || backendKey === null) {
        continue;
      }
      
      // Skip null/undefined/empty string values
      if (value === null || value === undefined || value === '') {
        continue;
      }
      
      // Skip NaN values
      if (typeof value === 'number' && isNaN(value)) {
        continue;
      }
      
      // Skip objects that aren't dates
      if (typeof value === 'object' && !(value instanceof Date)) {
        continue;
      }
      
      // Only send valid values
      transformed[backendKey] = value;
    }
    
    return transformed;
  }

  /**
   * Save or update complete student profile
   * Uses modern RxJS patterns with proper error handling
   */
  saveProfile(profile: Partial<StudentProfile>) {
    const current = this.studentProfile();
    if (!current) {
      console.error('No current profile loaded');
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);

    // Transform field names to match backend schema
    const transformedData = this.transformProfileToBackendFormat(profile);

    this.http.patch<{ ok: boolean; student: StudentProfile }>(`${API_BASE_URL}/students/me`, transformedData).subscribe({
      next: (response: any) => {
        const updatedProfile = response.student;
        this.studentProfile.set(updatedProfile);
        // Recalculate completion percentage after save
        const completionPercentage = this.calculateCompletionPercentage(updatedProfile);
        this.profileCompletionPercentage.set(completionPercentage);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        const errorMsg = err?.error?.error || err?.error?.message || 'Failed to save profile. Please try again.';
        console.error('Failed to save profile:', err);
        this.error.set(errorMsg);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Update personal details only
   */
  updatePersonalDetails(details: Partial<StudentProfile>) {
    const current = this.studentProfile();
    if (!current) return;

    const updated = {
      ...current,
      ...details,
      subjects: current.subjects // Preserve subjects
    };
    this.saveProfile(updated);
  }

  /**
   * Update college information
   */
  updateCollegeInfo(collegeInfo: {
    collegeId?: number;
    collegeName?: string;
    collegeBranch?: string;
    admissionYear?: number;
    stream?: string;
  }) {
    const current = this.studentProfile();
    if (!current) return;

    const updated = {
      ...current,
      ...collegeInfo,
      subjects: current.subjects
    };
    this.saveProfile(updated);
  }

  /**
   * Update previous exam details
   * Calls dedicated PATCH /students/me/previous-exams endpoint
   */
  updatePreviousExams(examData: any) {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.patch<{ ok: boolean; previousExams: any[] }>(`${API_BASE_URL}/students/me/previous-exams`, examData).subscribe({
      next: (response: any) => {
        console.log('Previous exams saved:', response);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        const errorMsg = err?.error?.error || err?.error?.message || 'Failed to save previous exams. Please try again.';
        console.error('Failed to save previous exams:', err);
        this.error.set(errorMsg);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Update bank details
   * Calls dedicated PATCH /students/me/bank-details endpoint
   */
  updateBankDetails(bankData: any) {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.patch<{ ok: boolean; bankDetails: any }>(`${API_BASE_URL}/students/me/bank-details`, bankData).subscribe({
      next: (response: any) => {
        console.log('Bank details saved:', response);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        const errorMsg = err?.error?.error || err?.error?.message || 'Failed to save bank details. Please try again.';
        console.error('Failed to save bank details:', err);
        this.error.set(errorMsg);
        this.isLoading.set(false);
      }
    });
  }

  /**
   * Add or update subject marks
   */
  addSubjectMarks(subject: SubjectMarks) {
    const current = this.studentProfile();
    if (!current) return;

    const existingIndex = current.subjects.findIndex(s => s.subjectId === subject.subjectId);
    const updated = { ...current };

    if (existingIndex >= 0) {
      updated.subjects = [...current.subjects];
      updated.subjects[existingIndex] = subject;
    } else {
      updated.subjects = [...current.subjects, subject];
    }

    this.saveProfile(updated);
  }

  /**
   * Remove subject marks
   */
  removeSubjectMarks(subjectId: number) {
    const current = this.studentProfile();
    if (!current) return;

    const updated = {
      ...current,
      subjects: current.subjects.filter(s => s.subjectId !== subjectId)
    };

    this.saveProfile(updated);
  }

  /**
   * Get profile for auto-filling forms
   */
  getProfileForAutoFill() {
    return this.studentProfile();
  }

  /**
   * Get subject marks by type (fresh or backlog)
   */
  getSubjectsByType(isBacklog: boolean) {
    const profile = this.studentProfile();
    return profile?.subjects.filter(s => s.isBacklog === isBacklog) ?? [];
  }

  /**
   * Calculate average percentage
   */
  getAveragePercentage() {
    const profile = this.studentProfile();
    if (!profile?.subjects || profile.subjects.length === 0) return 0;

    const total = profile.subjects.reduce((sum, s) => sum + (s.percentage || 0), 0);
    return total / profile.subjects.length;
  }

  /**
   * Clear profile (on logout)
   */
  clearProfile() {
    this.studentProfile.set(null);
    this.error.set(null);
  }
}
