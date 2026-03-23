import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { API_BASE_URL } from '../../core/api';

interface News {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  type: 'news' | 'event' | 'notification';
}

interface Exam {
  id: number;
  name: string;
  session: string;
  academicYear: string;
  applicationDeadline: string;
  _count: { applications: number };
}

interface LoginCredentials {
  username: string;
  password: string;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTabsModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <!-- Navigation Bar -->
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-brand">
          <img src="assets/images/exam-icon.svg" alt="MSBSHSE Logo" class="nav-logo">
          <div class="nav-title">
            <h3>महाराष्ट्र राज्य माध्यमिक व उच्च माध्यमिक शिक्षण मंडळ</h3>
            <p>Maharashtra State Board of Secondary & Higher Secondary Education</p>
          </div>
        </div>
        <div class="nav-menu">
          <a href="#home" class="nav-link">Home</a>
          <a href="#about" class="nav-link">About Board</a>
          <a href="#exams" class="nav-link">Examinations</a>
          <a href="#news" class="nav-link">News & Updates</a>
          <a href="#instructions" class="nav-link">Exam Instructions</a>
          <a href="#auth" class="nav-link login-btn">Student Portal</a>
        </div>
        <div class="nav-toggle" (click)="toggleMenu()">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </nav>

    <!-- Hero Carousel Section -->
    <section class="hero-carousel" id="home">
      <div class="carousel-container">
        <div class="carousel-slide active">
          <div class="hero-overlay"></div>
          <div class="hero-bg">
            <img src="assets/images/hero-bg.svg" alt="Hero Background" class="hero-bg-image">
          </div>
          <div class="hero-content">
            <div class="hero-text">
              <h1 class="hero-title">Welcome to Maharashtra HSC Portal</h1>
              <p class="hero-subtitle">Your gateway to academic excellence and career opportunities in Maharashtra</p>
              <div class="hero-buttons">
                <button mat-raised-button color="primary" class="hero-btn" (click)="scrollToSection('exams')">
                  <mat-icon>school</mat-icon>
                  Apply for Exams
                </button>
                <button mat-stroked-button class="hero-btn-outline" (click)="scrollToSection('auth')">
                  <mat-icon>login</mat-icon>
                  Student Login
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="carousel-indicators">
        <span class="indicator active" (click)="setActiveSlide(0)"></span>
        <span class="indicator" (click)="setActiveSlide(1)"></span>
        <span class="indicator" (click)="setActiveSlide(2)"></span>
      </div>
    </section>

    <!-- Quick Links Section -->
    <section class="quick-links">
      <div class="container">
        <div class="links-grid">
          <a href="#exams" class="link-card">
            <div class="link-icon">
              <img src="assets/images/exam-icon.svg" alt="Exams">
            </div>
            <h3>Apply for Exams</h3>
            <p>Register for upcoming HSC examinations</p>
          </a>
          <a href="#results" class="link-card">
            <div class="link-icon">
              <mat-icon>assessment</mat-icon>
            </div>
            <h3>Check Results</h3>
            <p>View your examination results online</p>
          </a>
          <a href="#certificates" class="link-card">
            <div class="link-icon">
              <mat-icon>description</mat-icon>
            </div>
            <h3>Certificates</h3>
            <p>Download mark sheets and certificates</p>
          </a>
          <a href="#help" class="link-card">
            <div class="link-icon">
              <mat-icon>help</mat-icon>
            </div>
            <h3>Help & Support</h3>
            <p>Get assistance and guidance</p>
          </a>
        </div>
      </div>
    </section>

    <!-- Statistics Section -->
    <section class="stats-section">
      <div class="container">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">
              <img src="assets/images/exam-icon.svg" alt="Exams">
            </div>
            <div class="stat-number">{{ totalExams() }}</div>
            <div class="stat-label">Active Examinations</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <img src="assets/images/student-icon.svg" alt="Students">
            </div>
            <div class="stat-number">{{ totalApplications() }}</div>
            <div class="stat-label">Student Applications</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <img src="assets/images/news-icon.svg" alt="Institutes">
            </div>
            <div class="stat-number">{{ totalInstitutes() }}</div>
            <div class="stat-label">Registered Institutes</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">
              <mat-icon>school</mat-icon>
            </div>
            <div class="stat-number">25+</div>
            <div class="stat-label">Years of Excellence</div>
          </div>
        </div>
      </div>
    </section>

    <!-- About Maharashtra Board Section -->
    <section class="about-section" id="about">
      <div class="container">
        <div class="about-content">
          <div class="about-text">
            <div class="section-header">
              <img src="assets/images/exam-icon.svg" alt="Board" class="section-icon">
              <h2>About Maharashtra State Board</h2>
            </div>
            <p>The Maharashtra State Board of Secondary and Higher Secondary Education (MSBSHSE) is the apex education board in the state of Maharashtra, India. Established with the vision of providing quality education and conducting fair examinations, the board has been serving lakhs of students across the state for over two decades.</p>
            <div class="board-features">
              <div class="feature">
                <mat-icon>verified</mat-icon>
                <span>Fair & Transparent Examination System</span>
              </div>
              <div class="feature">
                <mat-icon>school</mat-icon>
                <span>Quality Education Standards</span>
              </div>
              <div class="feature">
                <mat-icon>groups</mat-icon>
                <span>Over 25,000 Affiliated Schools</span>
              </div>
              <div class="feature">
                <mat-icon>assessment</mat-icon>
                <span>Comprehensive Evaluation Methods</span>
              </div>
            </div>
          </div>
          <div class="about-image">
            <img src="assets/images/hero-bg.svg" alt="Board Building" class="board-image">
          </div>
        </div>
      </div>
    </section>

    <!-- News & Updates Section with Moving Ticker -->
    <section class="news-updates-section" id="news">
      <div class="container">
        <div class="section-header">
          <img src="assets/images/news-icon.svg" alt="News" class="section-icon">
          <h2>Latest News & Updates</h2>
        </div>

        <!-- Moving News Ticker -->
        <div class="news-ticker">
          <div class="ticker-header">
            <mat-icon>campaign</mat-icon>
            <span>Breaking News:</span>
          </div>
          <div class="ticker-content">
            <div class="ticker-text" *ngFor="let item of news()">
              <span class="news-type {{item.type}}">{{item.type.toUpperCase()}}</span>
              {{item.title}} •
            </div>
          </div>
        </div>

        <!-- News Grid -->
        <div class="news-grid">
          <mat-card class="news-card" *ngFor="let item of news()">
            <mat-card-header>
              <div class="news-icon">
                <mat-icon *ngIf="item.type === 'news'">article</mat-icon>
                <mat-icon *ngIf="item.type === 'event'">event</mat-icon>
                <mat-icon *ngIf="item.type === 'notification'">notifications</mat-icon>
              </div>
              <mat-card-title>{{ item.title }}</mat-card-title>
              <mat-card-subtitle>{{ item.type.toUpperCase() }} • {{ formatDate(item.createdAt) }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>{{ item.content }}</p>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button>Read More</button>
            </mat-card-actions>
          </mat-card>
        </div>

        <div *ngIf="news().length === 0" class="no-data">
          <img src="assets/images/news-icon.svg" alt="No news" class="no-data-icon">
          <h3>No announcements yet</h3>
          <p>Check back later for the latest updates and news.</p>
        </div>
      </div>
    </section>

    <!-- Active Exams Section -->
    <section class="active-exams-section" id="exams">
      <div class="container">
        <div class="section-header">
          <img src="assets/images/exam-icon.svg" alt="Exams" class="section-icon">
          <h2>Active Examinations</h2>
        </div>

        <div class="exams-container">
          <div class="exams-grid">
            <mat-card class="exam-card" *ngFor="let exam of upcomingExams()">
              <mat-card-header>
                <div class="exam-icon">
                  <img src="assets/images/exam-icon.svg" alt="Exam">
                </div>
                <mat-card-title>{{ exam.name }}</mat-card-title>
                <mat-card-subtitle>{{ exam.session }} {{ exam.academicYear }}</mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <div class="exam-details">
                  <div class="exam-deadline">
                    <mat-icon>schedule</mat-icon>
                    <span>Application Deadline: {{ formatDate(exam.applicationDeadline) }}</span>
                  </div>
                  <div class="exam-applications">
                    <mat-icon>people</mat-icon>
                    <span>{{ exam._count.applications }} applications received</span>
                  </div>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-raised-button color="primary" (click)="scrollToSection('auth')">
                  <mat-icon>edit</mat-icon>
                  Apply Now
                </button>
              </mat-card-actions>
            </mat-card>
          </div>

          <div *ngIf="upcomingExams().length === 0" class="no-data">
            <img src="assets/images/exam-icon.svg" alt="No exams" class="no-data-icon">
            <h3>No active examinations</h3>
            <p>New examinations will be announced soon. Stay tuned!</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Exam Instructions Section -->
    <section class="instructions-section" id="instructions">
      <div class="container">
        <div class="section-header">
          <mat-icon class="section-icon">info</mat-icon>
          <h2>Examination Instructions</h2>
        </div>

        <div class="instructions-content">
          <div class="instructions-grid">
            <div class="instruction-card">
              <div class="instruction-icon">
                <mat-icon>assignment</mat-icon>
              </div>
              <h3>Application Process</h3>
              <ul>
                <li>Register with valid email and mobile number</li>
                <li>Fill all required personal and academic details</li>
                <li>Upload necessary documents (photo, signature)</li>
                <li>Pay examination fees online</li>
                <li>Submit application before deadline</li>
              </ul>
            </div>

            <div class="instruction-card">
              <div class="instruction-icon">
                <mat-icon>event</mat-icon>
              </div>
              <h3>Exam Day Guidelines</h3>
              <ul>
                <li>Reach examination center 30 minutes early</li>
                <li>Carry valid admit card and ID proof</li>
                <li>Mobile phones and electronic devices not allowed</li>
                <li>Follow COVID-19 safety protocols</li>
                <li>Report any discrepancies immediately</li>
              </ul>
            </div>

            <div class="instruction-card">
              <div class="instruction-icon">
                <mat-icon>verified</mat-icon>
              </div>
              <h3>Important Rules</h3>
              <ul>
                <li>Maintain examination hall discipline</li>
                <li>No malpractice or unfair means allowed</li>
                <li>Follow invigilator instructions</li>
                <li>Complete all questions within time limit</li>
                <li>Sign attendance sheet before leaving</li>
              </ul>
            </div>

            <div class="instruction-card">
              <div class="instruction-icon">
                <mat-icon>help</mat-icon>
              </div>
              <h3>Help & Support</h3>
              <ul>
                <li>Contact helpline: 1800-XXX-XXXX</li>
                <li>Email: support[at]msbshse.edu.in</li>
                <li>Visit nearest divisional board office</li>
                <li>Check FAQ section for common queries</li>
                <li>Technical support available 24/7</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Student Portal Section -->
    <section class="auth-section" id="auth">
      <div class="container">
        <div class="section-header">
          <img src="assets/images/student-icon.svg" alt="Students" class="section-icon">
          <h2>Student Portal</h2>
        </div>

        <div class="auth-container">
          <mat-card class="auth-card">
            <mat-card-content>
              <mat-tab-group>
                <!-- Login Tab -->
                <mat-tab label="Login">
                  <div class="tab-content">
                    <div class="tab-icon">
                      <mat-icon>login</mat-icon>
                    </div>
                    <h3>Student Login</h3>
                    <p>Access your account to apply for exams and check results</p>
                    <form class="auth-form" (ngSubmit)="login()">
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Username</mat-label>
                        <input matInput type="text" [(ngModel)]="loginData.username" name="username" required>
                        <mat-icon matSuffix>person</mat-icon>
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Password</mat-label>
                        <input matInput type="password" [(ngModel)]="loginData.password" name="password" required>
                        <mat-icon matSuffix>lock</mat-icon>
                      </mat-form-field>

                      <button mat-raised-button color="primary" type="submit" class="full-width" [disabled]="loginLoading()">
                        {{ loginLoading() ? 'Logging in...' : 'Login to Portal' }}
                      </button>
                    </form>
                  </div>
                </mat-tab>

                <!-- Register Tab -->
                <mat-tab label="Create Account">
                  <div class="tab-content">
                    <div class="tab-icon">
                      <mat-icon>person_add</mat-icon>
                    </div>
                    <h3>Create New Account</h3>
                    <p>Join thousands of students using our portal</p>
                    <form class="auth-form" (ngSubmit)="register()">
                      <div class="name-fields">
                        <mat-form-field appearance="outline">
                          <mat-label>First Name</mat-label>
                          <input matInput [(ngModel)]="registerData.firstName" name="firstName" required>
                        </mat-form-field>

                        <mat-form-field appearance="outline">
                          <mat-label>Last Name</mat-label>
                          <input matInput [(ngModel)]="registerData.lastName" name="lastName" required>
                        </mat-form-field>
                      </div>

                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Email Address</mat-label>
                        <input matInput type="email" [(ngModel)]="registerData.email" name="email" required>
                        <mat-icon matSuffix>email</mat-icon>
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Password</mat-label>
                        <input matInput type="password" [(ngModel)]="registerData.password" name="password" required>
                        <mat-icon matSuffix>lock</mat-icon>
                      </mat-form-field>

                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Confirm Password</mat-label>
                        <input matInput type="password" [(ngModel)]="registerData.confirmPassword" name="confirmPassword" required>
                        <mat-icon matSuffix>lock</mat-icon>
                      </mat-form-field>

                      <button mat-raised-button color="primary" type="submit" class="full-width" [disabled]="registerLoading()">
                        {{ registerLoading() ? 'Creating Account...' : 'Create Account' }}
                      </button>
                    </form>
                  </div>
                </mat-tab>
              </mat-tab-group>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <div class="footer-logo">
              <img src="assets/images/exam-icon.svg" alt="MSBSHSE Logo">
              <div>
                <h4>महाराष्ट्र राज्य माध्यमिक व उच्च माध्यमिक शिक्षण मंडळ</h4>
                <p>Maharashtra State Board of Secondary & Higher Secondary Education</p>
              </div>
            </div>
            <p>Committed to excellence in education and fair assessment practices for the students of Maharashtra.</p>
            <div class="social-links">
              <a href="#" class="social-link"><mat-icon>facebook</mat-icon></a>
              <a href="#" class="social-link"><mat-icon>twitter</mat-icon></a>
              <a href="#" class="social-link"><mat-icon>instagram</mat-icon></a>
              <a href="#" class="social-link"><mat-icon>youtube</mat-icon></a>
            </div>
          </div>
          <div class="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#about">About Board</a></li>
              <li><a href="#exams">Active Exams</a></li>
              <li><a href="#news">News & Updates</a></li>
              <li><a href="#instructions">Exam Instructions</a></li>
              <li><a href="#auth">Student Portal</a></li>
            </ul>
          </div>
          <div class="footer-section">
            <h4>Divisional Boards</h4>
            <ul>
              <li>Pune Division</li>
              <li>Nagpur Division</li>
              <li>Mumbai Division</li>
              <li>Nashik Division</li>
              <li>Amravati Division</li>
              <li>Latur Division</li>
              <li>Kolhapur Division</li>
              <li>Konkan Division</li>
            </ul>
          </div>
          <div class="footer-section">
            <h4>Contact Information</h4>
            <p><mat-icon>location_on</mat-icon> 17th Floor, New Excelsior Building, A.K. Nayak Marg, Fort, Mumbai - 400001</p>
            <p><mat-icon>phone</mat-icon> +91-22-2202-4000</p>
            <p><mat-icon>email</mat-icon> info[at]msbshse.edu.in</p>
            <p><mat-icon>web</mat-icon> www.msbshse.edu.in</p>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2024 Maharashtra State Board of Secondary & Higher Secondary Education. All rights reserved.</p>
          <div class="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Disclaimer</a>
          </div>
        </div>
      </div>
    </footer>
  `,
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {
  news = signal<News[]>([]);
  upcomingExams = signal<Exam[]>([]);
  totalExams = signal(0);
  totalApplications = signal(0);
  totalInstitutes = signal(0);

  loginData: LoginCredentials = { username: '', password: '' };
  registerData: RegisterData = { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' };

  loginLoading = signal(false);
  registerLoading = signal(false);

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    // Check if user is already authenticated
    const token = localStorage.getItem('token');
    if (token) {
      this.router.navigate(['/app/dashboard']);
      return;
    }

    this.loadNews();
    this.loadUpcomingExams();
    this.loadStats();
    this.initScrollAnimations();
  }

  loadNews() {
    this.http.get<{ news: News[] }>(`${API_BASE_URL}/public/news`).subscribe({
      next: (response) => this.news.set(response.news),
      error: () => this.showError('Failed to load news')
    });
  }

  loadUpcomingExams() {
    this.http.get<{ exams: Exam[] }>(`${API_BASE_URL}/public/exams`).subscribe({
      next: (response) => this.upcomingExams.set(response.exams),
      error: () => this.showError('Failed to load exams')
    });
  }

  loadStats() {
    this.http.get<{ totalExams: number; totalApplications: number; totalInstitutes: number }>(`${API_BASE_URL}/public/stats`).subscribe({
      next: (response) => {
        this.totalExams.set(response.totalExams);
        this.totalApplications.set(response.totalApplications);
        this.totalInstitutes.set(response.totalInstitutes);
      },
      error: () => this.showError('Failed to load statistics')
    });
  }

  login() {
    if (!this.loginData.username || !this.loginData.password) return;

    this.loginLoading.set(true);
    this.http.post(`${API_BASE_URL}/auth/login`, this.loginData).subscribe({
      next: (response: any) => {
        localStorage.setItem('token', response.token);
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.showError(error.error?.message || 'Login failed');
        this.loginLoading.set(false);
      }
    });
  }

  register() {
    if (this.registerData.password !== this.registerData.confirmPassword) {
      this.showError('Passwords do not match');
      return;
    }

    this.registerLoading.set(true);
    this.http.post(`${API_BASE_URL}/auth/register`, this.registerData).subscribe({
      next: (response: any) => {
        this.showSuccess('Account created successfully! Please login.');
        // Switch to login tab
        const tabGroup = document.querySelector('mat-tab-group');
        if (tabGroup) {
          const tabs = tabGroup.querySelectorAll('mat-tab');
          if (tabs[0]) {
            (tabs[0] as HTMLElement).click();
          }
        }
        this.registerLoading.set(false);
      },
      error: (error) => {
        this.showError(error.error?.message || 'Registration failed');
        this.registerLoading.set(false);
      }
    });
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  private initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    setTimeout(() => {
      document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
      });
    }, 100);
  }

  private showError(message: string) {
    this.snackBar.open(message, 'Close', { duration: 5000, panelClass: 'error-snackbar' });
  }

  private showSuccess(message: string) {
    this.snackBar.open(message, 'Close', { duration: 3000, panelClass: 'success-snackbar' });
  }

  toggleMenu() {
    const navMenu = document.querySelector('.nav-menu');
    if (navMenu) {
      navMenu.classList.toggle('active');
    }
  }

  setActiveSlide(index: number) {
    const slides = document.querySelectorAll('.carousel-slide');
    const indicators = document.querySelectorAll('.indicator');

    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });

    indicators.forEach((indicator, i) => {
      indicator.classList.toggle('active', i === index);
    });
  }
}