import { Component, OnInit, signal, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { API_BASE_URL } from '../../core/api';


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
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatTabsModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <!-- Navigation -->
    <nav class="navbar" [class.scrolled]="scrolled()">
      <div class="nav-wrapper">
        <div class="nav-brand">
          <div class="logo-icon">
            <mat-icon>school</mat-icon>
          </div>
          <div class="brand-text">
            <h1>Maharashtra HSC</h1>
            <p>Educational Excellence</p>
          </div>
        </div>
        <div class="nav-menu">
          <a href="#features" class="nav-link">Features</a>
          <a href="#stats" class="nav-link">By Numbers</a>
          <a href="#about" class="nav-link">How It Works</a>
          <a href="#signup" class="nav-link btn-primary">Get Started</a>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-bg">
        <div class="gradient-overlay"></div>
      </div>
      <div class="hero-content">
        <div class="hero-text fade-in-up">
          <h2 class="hero-subtitle">Welcome to Maharashtra Board</h2>
          <h1 class="hero-title">Next Generation HSC Exam Portal</h1>
          <p class="hero-desc">Seamlessly manage your exam applications with our secure, fast platform.</p>
          <div class="hero-actions">
            <button mat-raised-button color="primary" class="btn-large" (click)="scrollTo('signup')">
              <mat-icon>rocket_launch</mat-icon>
              Start Now
            </button>
            <button mat-stroked-button class="btn-large btn-outline" (click)="scrollTo('features')">
              <mat-icon>explore</mat-icon>
              Features
            </button>
          </div>
        </div>
      </div>
      <div class="scroll-indicator" (click)="scrollTo('features')">
        <mat-icon class="bounce">expand_more</mat-icon>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features" id="features">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">Powerful Features</h2>
          <p class="section-desc">Everything you need to succeed</p>
        </div>
        <div class="features-grid">
          <div class="feature-card" *ngFor="let feature of features">
            <div class="feature-icon">
              <mat-icon>{{ feature.icon }}</mat-icon>
            </div>
            <h3>{{ feature.title }}</h3>
            <p>{{ feature.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Statistics -->
    <section class="stats" id="stats">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">By The Numbers</h2>
        </div>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">25,000+</div>
            <p>Active Students</p>
          </div>
          <div class="stat-card">
            <div class="stat-value">500+</div>
            <p>Registered Institutes</p>
          </div>
          <div class="stat-card">
            <div class="stat-value">99.9%</div>
            <p>Uptime</p>
          </div>
          <div class="stat-card">
            <div class="stat-value">24/7</div>
            <p>Support</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="how-it-works" id="about">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">How It Works</h2>
        </div>
        <div class="steps-grid">
          <div class="step-card" *ngFor="let step of steps; let i = index">
            <div class="step-number">{{ i + 1 }}</div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta">
      <div class="container">
        <h2>Ready to Get Started?</h2>
        <p>Join thousands of students today</p>
        <button mat-raised-button color="accent" class="btn-cta" (click)="scrollTo('signup')">
          <mat-icon>arrow_forward</mat-icon>
          Create Account
        </button>
      </div>
    </section>

    <!-- Signup -->
    <section class="signup" id="signup">
      <div class="container">
        <div class="signup-wrapper">
          <div class="signup-card">
            <h2 class="signup-title">Create Account</h2>
            <form [formGroup]="registerForm" (ngSubmit)="register()" class="signup-form">
              <div class="form-row">
                <mat-form-field appearance="outline">
                  <mat-label>First Name</mat-label>
                  <input matInput formControlName="firstName" required>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Last Name</mat-label>
                  <input matInput formControlName="lastName" required>
                </mat-form-field>
              </div>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput type="email" formControlName="email" required>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Password</mat-label>
                <input matInput [type]="showPassword() ? 'text' : 'password'" formControlName="password" required>
                <button type="button" mat-icon-button matSuffix (click)="showPassword.set(!showPassword())">
                  <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirm Password</mat-label>
                <input matInput [type]="showPassword() ? 'text' : 'password'" formControlName="confirmPassword" required>
              </mat-form-field>
              @if (registerError()) {
                <div class="error-box">{{ registerError() }}</div>
              }
              <button mat-raised-button color="primary" type="submit" class="full-width submit-btn" [disabled]="registerLoading()">
                {{ registerLoading() ? 'Creating...' : 'Create Account' }}
              </button>
              <p class="form-footer">
                Already have an account? <a routerLink="/login" class="link">Sign In</a>
              </p>
            </form>
          </div>
          <div class="info-card">
            <h3>What You Get</h3>
            <div class="info-list">
              <div class="info-item">
                <div class="info-number">1</div>
                <div><h4>Secure Account</h4><p>Enterprise-grade encryption</p></div>
              </div>
              <div class="info-item">
                <div class="info-number">2</div>
                <div><h4>Easy Application</h4><p>Step-by-step guidance</p></div>
              </div>
              <div class="info-item">
                <div class="info-number">3</div>
                <div><h4>Live Tracking</h4><p>Real-time monitoring</p></div>
              </div>
              <div class="info-item">
                <div class="info-number">4</div>
                <div><h4>24/7 Support</h4><p>Always here to help</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h4>About Board</h4>
            <p>Maharashtra State Board dedicated to providing quality education and fair assessment.</p>
          </div>
          <div class="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#about">How It Works</a></li>
              <li><a href="mailto:support@msbshse.edu.in">Contact</a></li>
            </ul>
          </div>
          <div class="footer-section">
            <h4>Support</h4>
            <ul>
              <li><a href="#">Documentation</a></li>
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Community</a></li>
            </ul>
          </div>
          <div class="footer-section">
            <h4>Contact</h4>
            <p>📧 support&#64;msbshse.edu.in</p>
            <p>📞 1800-XXX-XXXX</p>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2026 Maharashtra State Board. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :host {
      --primary: #1976d2;
      --secondary: #212121;
      --accent: #ff6f00;
      --bg: #f5f7fa;
      --surface: white;
      --text: #1a1a1a;
      --text-muted: #666;
    }

    /* Animations */
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    .fade-in-up { animation: fadeInUp 0.8s ease-out; }
    .bounce { animation: bounce 2s infinite; }

    /* Navigation */
    .navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      padding: 12px 0;
      transition: all 0.3s ease;
    }

    .navbar.scrolled {
      background: rgba(255, 255, 255, 0.95);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .nav-wrapper {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .logo-icon {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      border-radius: 10px;
      display: grid;
      place-items: center;
      color: white;
    }

    .brand-text h1 { font-size: 1.3rem; font-weight: 700; margin: 0; }
    .brand-text p { font-size: 0.75rem; color: var(--text-muted); margin: 0; }

    .nav-menu {
      display: flex;
      gap: 32px;
      align-items: center;
    }

    .nav-link {
      color: var(--text);
      text-decoration: none;
      font-weight: 500;
      transition: 0.3s;
      padding: 6px 12px;
      border-radius: 6px;
    }

    .nav-link:hover { color: var(--primary); background: rgba(25, 118, 210, 0.1); }
    .nav-link.btn-primary { background: var(--primary); color: white; }

    /* Hero */
    .hero {
      position: relative;
      min-height: 100vh;
      display: grid;
      place-items: center;
      overflow: hidden;
      margin-top: 64px;
    }

    .hero-bg {
      position: absolute;
      inset: 0;
      z-index: -1;
    }

    .gradient-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(25, 118, 210, 0.8) 0%, rgba(33, 150, 243, 0.6) 100%);
    }

    .hero-content {
      position: relative;
      z-index: 1;
      text-align: center;
      max-width: 800px;
      padding: 60px 24px;
    }

    .hero-subtitle {
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.9);
      font-weight: 600;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 16px;
    }

    .hero-title {
      font-size: clamp(2.5rem, 6vw, 4rem);
      font-weight: 800;
      color: white;
      margin-bottom: 24px;
      letter-spacing: -1px;
    }

    .hero-desc {
      font-size: 1.1rem;
      color: rgba(255, 255, 255, 0.95);
      margin-bottom: 40px;
      line-height: 1.6;
      max-width: 700px;
      margin-left: auto;
      margin-right: auto;
    }

    .hero-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn-large {
      padding: 14px 32px !important;
      font-size: 1rem !important;
      font-weight: 600 !important;
      border-radius: 12px !important;
      display: flex !important;
      gap: 8px;
    }

    .btn-outline {
      background: rgba(255, 255, 255, 0.2) !important;
      color: white !important;
      border: 2px solid white !important;
    }

    .scroll-indicator {
      position: absolute;
      bottom: 32px;
      left: 50%;
      transform: translateX(-50%);
      cursor: pointer;
    }

    /* Container */
    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* Sections */
    .section-header {
      text-align: center;
      margin-bottom: 60px;
    }

    .section-title {
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--secondary);
      margin-bottom: 16px;
    }

    .section-desc {
      font-size: 1.1rem;
      color: var(--text-muted);
      max-width: 600px;
      margin: 0 auto;
    }

    /* Features */
    .features {
      padding: 120px 0;
      background: var(--bg);
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 32px;
    }

    .feature-card {
      background: var(--surface);
      padding: 40px 32px;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      animation: fadeInUp 0.6s ease-out forwards;
    }

    .feature-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .feature-icon {
      width: 72px;
      height: 72px;
      background: linear-gradient(135deg, var(--primary) 0%, #2196f3 100%);
      border-radius: 16px;
      display: grid;
      place-items: center;
      color: white;
      font-size: 36px;
      margin: 0 auto 24px;
    }

    .feature-card h3 {
      font-size: 1.3rem;
      font-weight: 700;
      margin-bottom: 12px;
      color: var(--secondary);
    }

    /* Stats */
    .stats {
      padding: 120px 0;
      background: linear-gradient(135deg, var(--secondary) 0%, #37474f 100%);
      color: white;
    }

    .stats .section-header {
      color: white;
    }

    .stats .section-desc {
      color: rgba(255, 255, 255, 0.8);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 32px;
    }

    .stat-card {
      text-align: center;
      padding: 40px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-4px);
    }

    .stat-value {
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--accent);
      margin-bottom: 8px;
    }

    /* Steps */
    .how-it-works {
      padding: 120px 0;
      background: var(--bg);
    }

    .steps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 32px;
    }

    .step-card {
      background: var(--surface);
      padding: 40px;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
    }

    .step-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%);
      transform: scaleX(0);
      transform-origin: left;
      transition: all 0.3s ease;
    }

    .step-card:hover::before { transform: scaleX(1); }

    .step-number {
      width: 48px;
      height: 48px;
      background: var(--primary);
      color: white;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0 auto 24px;
    }

    .step-card h3 {
      font-size: 1.2rem;
      font-weight: 700;
      margin-bottom: 12px;
      color: var(--secondary);
    }

    /* CTA */
    .cta {
      padding: 120px 0;
      background: linear-gradient(135deg, var(--primary) 0%, #2196f3 100%);
      color: white;
      text-align: center;
    }

    .cta h2 {
      font-size: 2.5rem;
      font-weight: 800;
      margin-bottom: 16px;
    }

    .cta p {
      font-size: 1.1rem;
      margin-bottom: 40px;
    }

    .btn-cta {
      background: var(--accent) !important;
      padding: 14px 32px !important;
      font-weight: 600 !important;
      display: inline-flex !important;
      gap: 8px;
    }

    /* Signup */
    .signup {
      padding: 120px 0;
      background: var(--bg);
    }

    .signup-wrapper {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
    }

    .signup-card {
      background: var(--surface);
      padding: 48px;
      border-radius: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .signup-title {
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--secondary);
      margin-bottom: 12px;
    }

    .signup-form {
      display: grid;
      gap: 20px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    mat-form-field {
      width: 100%;
    }

    .error-box {
      background: rgba(244, 67, 54, 0.1);
      border: 1px solid #f44336;
      border-radius: 8px;
      padding: 12px 16px;
      color: #f44336;
      grid-column: 1 / -1;
      font-size: 0.9rem;
    }

    .submit-btn {
      padding: 14px !important;
      font-size: 1rem !important;
      font-weight: 600 !important;
      border-radius: 8px !important;
      display: flex !important;
      justify-content: center;
      margin-top: 12px;
    }

    .form-footer {
      text-align: center;
      font-size: 0.95rem;
      color: var(--text-muted);
    }

    .link {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
    }

    .info-card {
      background: linear-gradient(135deg, var(--bg) 0%, #e3f2fd 100%);
      border-radius: 20px;
      padding: 48px;
      border: 2px solid rgba(25, 118, 210, 0.1);
    }

    .info-card h3 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 32px;
      color: var(--secondary);
    }

    .info-list {
      display: grid;
      gap: 24px;
    }

    .info-item {
      display: flex;
      gap: 16px;
    }

    .info-number {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, var(--primary) 0%, #2196f3 100%);
      color: white;
      border-radius: 12px;
      display: grid;
      place-items: center;
      font-weight: 700;
      flex-shrink: 0;
    }

    .info-item h4 {
      font-size: 1rem;
      font-weight: 700;
      color: var(--secondary);
      margin-bottom: 4px;
    }

    .info-item p {
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    /* Footer */
    .footer {
      background: var(--secondary);
      color: white;
      padding: 80px 0 20px;
    }

    .footer-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 40px;
      margin-bottom: 40px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding-bottom: 40px;
    }

    .footer-section h4 {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 16px;
    }

    .footer-section p {
      font-size: 0.9rem;
      opacity: 0.8;
      line-height: 1.6;
    }

    .footer-section ul {
      list-style: none;
    }

    .footer-section ul li {
      margin-bottom: 8px;
    }

    .footer-section a {
      color: rgba(255, 255, 255, 0.7);
      text-decoration: none;
      transition: 0.3s;
    }

    .footer-section a:hover {
      color: white;
    }

    .footer-bottom {
      text-align: center;
      padding-top: 20px;
      opacity: 0.7;
      font-size: 0.9rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .nav-menu { display: none; }
      .hero { margin-top: 60px; min-height: 80vh; }
      .hero-title { font-size: 2rem; }
      .hero-actions { flex-direction: column; }
      .btn-large { width: 100%; }
      .section-title { font-size: 1.8rem; }
      .signup-wrapper { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
      .features-grid, .stats-grid, .steps-grid { grid-template-columns: 1fr; }
      .signup-card, .info-card { padding: 32px; }
    }
  `]
})
export class LandingComponent implements OnInit, OnDestroy {
  scrolled = signal(false);
  showPassword = signal(false);
  registerLoading = signal(false);
  registerError = signal('');

  registerForm: FormGroup;

  features = [
    {
      icon: 'security',
      title: 'Bank-Grade Security',
      desc: 'Encrypted with military-grade protocols'
    },
    {
      icon: 'speed',
      title: 'Lightning Fast',
      desc: 'Optimized infrastructure'
    },
    {
      icon: 'devices',
      title: 'Cross-Platform',
      desc: 'Works on all devices'
    },
    {
      icon: 'notifications_active',
      title: 'Real-time Updates',
      desc: 'Instant status notifications'
    },
    {
      icon: 'support_agent',
      title: '24/7 Support',
      desc: 'Always here to help'
    },
    {
      icon: 'language',
      title: 'Multi-Language',
      desc: 'English, Marathi & Hindi'
    }
  ];

  steps = [
    {
      icon: 'person_add',
      title: 'Create Account',
      desc: 'Sign up with your email'
    },
    {
      icon: 'description',
      title: 'Fill Application',
      desc: 'Complete the form with guidance'
    },
    {
      icon: 'check_circle',
      title: 'Verification',
      desc: 'Institute verifies details'
    },
    {
      icon: 'done_all',
      title: 'Submit & Pay',
      desc: 'Submit and pay fee securely'
    }
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    });
  }

  ngOnInit() {
    window.addEventListener('scroll', this.onScroll.bind(this));
  }

  ngOnDestroy() {
    window.removeEventListener('scroll', this.onScroll.bind(this));
  }

  private onScroll() {
    this.scrolled.set(window.scrollY > 50);
  }

  scrollTo(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  register() {
    this.registerError.set('');

    if (!this.registerForm.valid) {
      this.registerError.set('Please fill all fields correctly');
      return;
    }

    if (this.registerForm.get('password')?.value !== this.registerForm.get('confirmPassword')?.value) {
      this.registerError.set('Passwords do not match');
      return;
    }

    this.registerLoading.set(true);

    const payload = {
      firstName: this.registerForm.get('firstName')?.value,
      lastName: this.registerForm.get('lastName')?.value,
      email: this.registerForm.get('email')?.value,
      password: this.registerForm.get('password')?.value
    };

    this.http.post(`${API_BASE_URL}/auth/register`, payload).subscribe({
      next: (res: any) => {
        this.registerLoading.set(false);
        this.registerForm.reset();
        this.registerError.set('');
        this.showSuccess('Account created! Redirecting to login...');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err) => {
        this.registerLoading.set(false);
        this.registerError.set(err.error?.message || 'Registration failed. Please try again.');
      }
    });
  }

  scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
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

}
