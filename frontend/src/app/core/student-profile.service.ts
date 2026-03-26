import { Injectable, signal, effect, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from './api';

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
  rollNumber?: string;
  
  // College Information
  collegeId?: number;
  collegeName?: string;
  collegeBranch?: string;
  admissionYear?: number;
  stream?: string; // Science, Commerce, Arts
  board?: string;
  
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
  private studentProfile = signal<StudentProfile | null>(null);
  private isLoading = signal(false);
  private error = signal<string | null>(null);

  readonly profile$ = this.studentProfile.asReadonly();
  readonly isLoading$ = this.isLoading.asReadonly();
  readonly error$ = this.error.asReadonly();

  constructor() {
    // Load profile on service init
    this.loadProfile();
  }

  /**
   * Load student profile from backend
   * Uses modern RxJS patterns with proper error handling
   */
  loadProfile() {
    this.isLoading.set(true);
    this.error.set(null);

    this.http.get<{ student: StudentProfile }>(`${API_BASE_URL}/students/me`).subscribe({
      next: (response: any) => {
        const profile = response.student;
        this.studentProfile.set(profile);
        this.isLoading.set(false);
      },
      error: (err: any) => {
        const errorMsg = err?.error?.error || err?.error?.message || 'Failed to load profile. Please try again.';
        console.error('Failed to load student profile:', err);
        this.error.set(errorMsg);
        this.isLoading.set(false);
      }
    });
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

    this.http.patch<{ ok: boolean; student: StudentProfile }>(`${API_BASE_URL}/students/${current.userId}`, profile).subscribe({
      next: (response: any) => {
        const updatedProfile = response.student;
        this.studentProfile.set(updatedProfile);
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
