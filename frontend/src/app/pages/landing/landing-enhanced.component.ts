import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { GoogleAuthService } from '../../core/google-auth.service';
import { AuthService } from '../../core/auth.service';
import { I18nService } from '../../core/i18n.service';
import { BrandingService } from '../../core/branding.service';
import { PublicApiService } from '../../core/public-api.service';
import { BoardHeaderComponent } from '../../components/board-header/board-header.component';

@Component({
  selector: 'app-landing-enhanced',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    BoardHeaderComponent
  ],
  template: `
    <!-- Board Header - Student Landing Page -->
    <app-board-header></app-board-header>

    <!-- Hero Section with Animated Background -->
    <section class="hero-section">
      <div class="animated-bg">
        <svg class="waves" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,50 Q300,0 600,50 T1200,50 L1200,120 L0,120 Z" fill="rgba(255,255,255,0.1)"/>
          <path d="M0,60 Q300,10 600,60 T1200,60 L1200,120 L0,120 Z" fill="rgba(255,255,255,0.05)"/>
        </svg>
      </div>

      <div class="hero-content">
        <!-- Branding Logo in Hero -->
        <div class="hero-branding">
          <img [src]="branding.getLogoUrl()" alt="Board Logo" class="hero-logo" />
        </div>

        <div class="hero-text">
          <h2 class="hero-subtitle">{{ i18n.t('welcome') }}</h2>
          <h1 class="hero-title">{{ i18n.t('welcomeToExamPortal') }}</h1>
          <p class="hero-desc">
            {{ selectedLanguage() === 'mr' 
              ? 'आपल्या परीक्षा अर्जासाठी सुरक्षित, वेगवान प्लॅटफॉर्म।'
              : 'Seamlessly manage your exam applications with our secure, fast platform.'
            }}
          </p>
          
          <!-- Action Buttons -->
          <div class="hero-actions">
            <button mat-raised-button color="accent" class="btn-large" (click)="goToGoogleLogin()">
              <mat-icon>login</mat-icon>
              {{ i18n.t('loginWithGoogle') }}
            </button>
          </div>
        </div>

        <!-- Scroll Indicator -->
        <div class="scroll-indicator" (click)="scrollToExams()">
          <mat-icon class="bounce">expand_more</mat-icon>
        </div>
      </div>
    </section>

    <!-- Active Exams Section -->
    <section class="exams-section" #examsSection>
      <!-- <div class="waves-top">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,50 Q300,0 600,50 T1200,50 L1200,0 L0,0 Z" fill="white"/>
        </svg>
      </div> -->

      <div class="container">
        <h2 class="section-title">{{ selectedLanguage() === 'mr' ? 'सक्रिय परीक्षा' : 'Active Exams' }}</h2>
        
        @if ((exams$ | async); as response) {
        <div class="exams-grid">
          <div *ngFor="let exam of response.exams" class="exam-card" (click)="goToExamForm(exam)">
            <div class="exam-header">
              <h3>{{ exam.name }}</h3>
              <span class="exam-badge">{{ exam.class }}</span>
            </div>
            <div class="exam-details">
              <p><mat-icon>calendar_today</mat-icon> {{ exam.startDate | date: 'mediumDate' }}</p>
              <p><mat-icon>school</mat-icon> {{ exam.stream }}</p>
              <p><mat-icon>domain</mat-icon> {{ exam.board }}</p>
            </div>
            <div class="exam-deadline">
              <p>{{ selectedLanguage() === 'mr' ? 'आवेदन समय सीमा' : 'Application Deadline' }}: {{ exam.applicationDeadline | date: 'mediumDate' }}</p>
            </div>
            <button mat-raised-button color="primary" class="exam-btn">
              {{ selectedLanguage() === 'mr' ? 'आवेदन करा' : 'Apply Now' }}
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </div>
        </div>
        }

        @if (!(exams$ | async)) {
        <div class="loading-exams">
          <mat-spinner diameter="40"></mat-spinner>
          <p>{{ selectedLanguage() === 'mr' ? 'परीक्षा लोड होत आहेत...' : 'Loading exams...' }}</p>
        </div>
        }
      </div>
    </section>
    <section class="features-section" #featuresSection>
      <div class="waves-top">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,50 Q300,0 600,50 T1200,50 L1200,0 L0,0 Z" fill="white"/>
        </svg>
      </div>

      <div class="container">
        <h2 class="section-title">{{ i18n.t('features') }}</h2>
        
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <mat-icon>security</mat-icon>
            </div>
            <h3>{{ selectedLanguage() === 'mr' ? 'सुरक्षित लॉगिन' : 'Secure Login' }}</h3>
            <p>{{ selectedLanguage() === 'mr' 
              ? 'Google OAuth सह एंटरप्राइज-ग्रेड सुरक्षा'
              : 'Enterprise-grade security with Google OAuth'
            }}</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <mat-icon>language</mat-icon>
            </div>
            <h3>{{ selectedLanguage() === 'mr' ? 'बहुभाषिक' : 'Multilingual' }}</h3>
            <p>{{ selectedLanguage() === 'mr'
              ? 'मराठी आणि अंग्रेजी समर्थित'
              : 'Support for Marathi and English'
            }}</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <mat-icon>print</mat-icon>
            </div>
            <h3>{{ selectedLanguage() === 'mr' ? 'प्रिंट करा' : 'Print Support' }}</h3>
            <p>{{ selectedLanguage() === 'mr'
              ? 'फॉर्म प्रिंट करा आणि जमा करा'
              : 'Print forms with board branding'
            }}</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <mat-icon>assessment</mat-icon>
            </div>
            <h3>{{ selectedLanguage() === 'mr' ? 'परीक्षा नोंदणी' : 'Exam Registration' }}</h3>
            <p>{{ selectedLanguage() === 'mr'
              ? 'ऑनलाइन परीक्षा नोंदणी आणि व्यवस्थापन'
              : 'Online exam registration and management'
            }}</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <mat-icon>speed</mat-icon>
            </div>
            <h3>{{ selectedLanguage() === 'mr' ? 'वेगवान' : 'Fast & Reliable' }}</h3>
            <p>{{ selectedLanguage() === 'mr'
              ? '99.9% अपटाइम गारंटी'
              : 'Lightning-fast performance guaranteed'
            }}</p>
          </div>

          <div class="feature-card">
            <div class="feature-icon">
              <mat-icon>support_agent</mat-icon>
            </div>
            <h3>{{ selectedLanguage() === 'mr' ? 'समर्थन' : '24/7 Support' }}</h3>
            <p>{{ selectedLanguage() === 'mr'
              ? '24/7 ग्राहक सहायता'
              : 'Round-the-clock customer support'
            }}</p>
          </div>
        </div>
      </div>

      <div class="waves-bottom">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,50 Q300,100 600,50 T1200,50 L1200,120 L0,120 Z" fill="#f0f4ff"/>
        </svg>
      </div>
    </section>

    <!-- Information Section -->
    <section class="info-section">
      <div class="container">
        <h2 class="section-title">{{ selectedLanguage() === 'mr' ? 'कसे सुरू करावे' : 'How to Get Started' }}</h2>
        
        <div class="steps-grid">
          <div class="step-card">
            <div class="step-number">1</div>
            <h3>{{ selectedLanguage() === 'mr' ? 'लॉगिन करा' : 'Login' }}</h3>
            <p>{{ selectedLanguage() === 'mr'
              ? 'आपल्या Google खात्याद्वारे लॉगिन करा'
              : 'Sign in with your Google account'
            }}</p>
          </div>

          <div class="step-card">
            <div class="step-number">2</div>
            <h3>{{ selectedLanguage() === 'mr' ? 'फॉर्म भरा' : 'Fill Form' }}</h3>
            <p>{{ selectedLanguage() === 'mr'
              ? 'आपल्या तपशील भरा आणि विषय निवडा'
              : 'Fill your details and select subjects'
            }}</p>
          </div>

          <div class="step-card">
            <div class="step-number">3</div>
            <h3>{{ selectedLanguage() === 'mr' ? 'प्रिंट करा' : 'Print Form' }}</h3>
            <p>{{ selectedLanguage() === 'mr'
              ? 'फॉर्म प्रिंट करा व साक्षरे करा'
              : 'Print and sign your form'
            }}</p>
          </div>

          <div class="step-card">
            <div class="step-number">4</div>
            <h3>{{ selectedLanguage() === 'mr' ? 'जमा करा' : 'Submit' }}</h3>
            <p>{{ selectedLanguage() === 'mr'
              ? 'आपल्या संस्थेला जमा करा'
              : 'Submit to your institute'
            }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-waves-top">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,50 Q300,0 600,50 T1200,50 L1200,0 L0,0 Z" fill="#667eea"/>
        </svg>
      </div>

      <div class="cta-content">
        <h2>{{ selectedLanguage() === 'mr' ? 'सुरू करण्यास तयार?' : 'Ready to Get Started?' }}</h2>
        <p>{{ selectedLanguage() === 'mr'
          ? 'आज ही आपले परीक्षा अर्ज सादर करा'
          : 'Submit your exam application today'
        }}</p>
        <button mat-raised-button color="accent" class="btn-cta" routerLink="/google-login">
          <mat-icon>arrow_forward</mat-icon>
          {{ i18n.t('startNow') }}
        </button>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-section">
            <h4>{{ selectedLanguage() === 'mr' ? 'अंतर्गत माहिती' : 'About' }}</h4>
            <p>{{ selectedLanguage() === 'mr'
              ? 'HSC परीक्षा व्यवस्थापन प्रणाली - Hisoft IT Solutions'
              : 'HSC Exam Management System - Powered by Hisoft IT Solutions'
            }}</p>
          </div>

          <div class="footer-section">
            <h4>{{ selectedLanguage() === 'mr' ? 'त्वरित लिंक्स' : 'Quick Links' }}</h4>
            <ul>
              <li><a (click)="scrollToFeatures()">{{ i18n.t('features') }}</a></li>
              <li><a routerLink="/google-login">{{ i18n.t('login') }}</a></li>
              <li><a href="mailto:{{ branding.getEmail() }}">{{ i18n.t('contact') }}</a></li>
            </ul>
          </div>

          <div class="footer-section">
            <h4>{{ selectedLanguage() === 'mr' ? 'संपर्क' : 'Contact' }}</h4>
            <p>📧 {{ branding.getEmail() }}</p>
            <p>📞 {{ branding.getContactNumber() }}</p>
          </div>

          <div class="footer-section">
            <h4>{{ selectedLanguage() === 'mr' ? 'समर्थन' : 'Support' }}</h4>
            <ul>
              <li><a href="{{ branding.getWebsite() }}" target="_blank">{{ i18n.t('about') }}</a></li>
              <li><a href="#">FAQ</a></li>
              <li><a href="mailto:{{ branding.getEmail() }}">{{ i18n.t('contact') }}</a></li>
            </ul>
          </div>
        </div>

        <div class="footer-bottom">
          <p>&copy; 2026 {{ branding.getBoardNameShort() }}. {{ selectedLanguage() === 'mr' ? 'सर्व हक्क राखीव' : 'All rights reserved' }}</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    /* ============================================================
       CSS VARIABLES - Define responsive values
       ============================================================ */
    :host {
      display: block;
      background: #f8f9fa;
      --spacing-xs: 0.5rem;
      --spacing-sm: 1rem;
      --spacing-md: 1.5rem;
      --spacing-lg: 2rem;
      --spacing-xl: 2.5rem;
      --border-radius: 12px;
      --border-radius-sm: 8px;
      --primary-color: #667eea;
      --primary-dark: #764ba2;
      --text-primary: #1a1a1a;
      --text-secondary: #666;
      --font-size-base: 1rem;
      --font-size-sm: 0.95rem;
      --font-size-xs: 0.85rem;
      /* Responsive typography */
      --heading-2-size: clamp(1.8rem, 8vw, 3.5rem);
      --heading-3-size: clamp(1.3rem, 5vw, 2.2rem);
      --body-size: clamp(0.9rem, 2vw, 1.2rem);
      --button-height: clamp(40px, 10vw, 44px);
    }

    /* ============================================================
       BASE STYLES - Mobile-first approach
       ============================================================ */
    * {
      box-sizing: border-box;
    }

    /* General Styles */
    .container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--spacing-sm);
    }

    .section-title {
      font-size: var(--heading-3-size);
      text-align: center;
      color: var(--text-primary);
      margin-bottom: var(--spacing-sm);
      font-weight: 700;
      line-height: 1.3;
    }

    /* ============================================================
       HERO SECTION - Full viewport height, responsive
       ============================================================ */
    .hero-section {
      position: relative;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
      overflow: hidden;
      padding: clamp(60px, 10vw, 80px) var(--spacing-sm) var(--spacing-sm);
      color: white;
    }

    .animated-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
      opacity: 0.3;
    }

    .waves {
      display: block;
      width: 100%;
      height: 100%;
      position: absolute;
      bottom: 0;
    }

    .waves path {
      animation: wavesAnimation 15s ease-in-out infinite;
    }

    .waves path:nth-child(2) {
      animation-delay: -5s;
    }

    @keyframes wavesAnimation {
      0%, 100% {
        d: path("M0,50 Q300,0 600,50 T1200,50 L1200,120 L0,120 Z");
      }
      50% {
        d: path("M0,30 Q300,80 600,30 T1200,30 L1200,120 L0,120 Z");
      }
    }

    .hero-content {
      position: relative;
      z-index: 1;
      text-align: center;
      max-width: 100%;
      width: 100%;
      animation: slideUp 0.8s ease-out;
      padding: 0 var(--spacing-sm);
    }

    @media (min-width: 600px) {
      .hero-content {
        max-width: 800px;
      }
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(30px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .hero-subtitle {
      font-size: clamp(0.95rem, 2.5vw, 1.1rem);
      opacity: 0.9;
      margin-bottom: var(--spacing-sm);
      font-weight: 500;
      letter-spacing: 1px;
      line-height: 1.5;
    }

    .hero-title {
      font-size: var(--heading-2-size);
      font-weight: 800;
      margin-bottom: var(--spacing-md);
      line-height: 1.2;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .hero-desc {
      font-size: var(--body-size);
      margin-bottom: var(--spacing-lg);
      opacity: 0.95;
      line-height: 1.6;
    }

    .hero-actions {
      display: flex;
      gap: var(--spacing-sm);
      justify-content: center;
      flex-wrap: wrap;
      flex-direction: column;
    }

    @media (min-width: 600px) {
      .hero-actions {
        flex-direction: row;
      }
    }

    .btn-large {
      padding: clamp(10px, 2vw, 14px) clamp(20px, 5vw, 36px) !important;
      font-size: var(--font-size-sm) !important;
      border-radius: var(--border-radius-sm) !important;
      text-transform: uppercase !important;
      font-weight: 600 !important;
      letter-spacing: 0.5px !important;
      transition: all 0.3s ease !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
      width: 100%;
      white-space: nowrap;
    }

    @media (min-width: 600px) {
      .btn-large {
        width: auto;
      }
    }

    .btn-large:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.25) !important;
    }

    .btn-outline {
      background: rgba(255, 255, 255, 0.1) !important;
      color: white !important;
      border: 2px solid white !important;
    }

    .scroll-indicator {
      position: absolute;
      bottom: 30px;
      left: 50%;
      transform: translateX(-50%);
      cursor: pointer;
      z-index: 2;
    }

    .bounce {
      font-size: 32px !important;
      width: 32px !important;
      height: 32px !important;
      animation: bounce 2s infinite;
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-12px); }
    }

    /* ============================================================
       FEATURES SECTION - Responsive grid
       ============================================================ */
    .features-section {
      position: relative;
      padding: var(--spacing-lg) var(--spacing-sm);
      background: white;
      overflow: hidden;
    }

    @media (min-width: 768px) {
      .features-section {
        padding: clamp(60px, 10vw, 100px) var(--spacing-sm);
      }
    }

    .waves-top, .waves-bottom {
      position: absolute;
      left: 0;
      width: 100%;
      overflow: hidden;
      line-height: 0;
    }

    .waves-top {
      top: -1px;
      height: 80px;
    }

    .waves-bottom {
      bottom: -1px;
      height: 80px;
    }

    @media (min-width: 768px) {
      .waves-top,
      .waves-bottom {
        height: 120px;
      }
    }

    .waves-bottom svg {
      position: relative;
      display: block;
      width: calc(100% + 1.3px);
      height: 100%;
    }

    .features-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
      margin-top: var(--spacing-lg);
      position: relative;
      z-index: 1;
    }

    @media (min-width: 600px) {
      .features-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 1024px) {
      .features-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .feature-card {
      background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
      padding: var(--spacing-lg);
      border-radius: var(--border-radius);
      text-align: center;
      transition: all 0.3s ease;
      border: 1px solid #e0e6ff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .feature-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 32px rgba(102, 126, 234, 0.15);
      border-color: var(--primary-color);
    }

    .feature-icon {
      width: 60px;
      height: 60px;
      margin: 0 auto var(--spacing-md);
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
      border-radius: var(--border-radius-sm);
      color: white;
    }

    .feature-icon mat-icon {
      font-size: 32px !important;
      width: 32px !important;
      height: 32px !important;
    }

    .feature-card h3 {
      color: var(--text-primary);
      font-size: clamp(1rem, 3vw, 1.3rem);
      margin-bottom: var(--spacing-sm);
      font-weight: 700;
      line-height: 1.4;
    }

    .feature-card p {
      color: var(--text-secondary);
      line-height: 1.6;
      font-size: var(--font-size-sm);
      margin: 0;
    }

    /* ============================================================
       INFO SECTION - Steps & Process
       ============================================================ */
    .info-section {
      padding: var(--spacing-lg) var(--spacing-sm);
      background: #f0f4ff;
    }

    @media (min-width: 768px) {
      .info-section {
        padding: clamp(60px, 10vw, 100px) var(--spacing-sm);
      }
    }

    .steps-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
      margin-top: var(--spacing-lg);
    }

    @media (min-width: 600px) {
      .steps-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 1024px) {
      .steps-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .step-card {
      background: white;
      padding: var(--spacing-lg);
      border-radius: var(--border-radius);
      text-align: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      border-left: 4px solid var(--primary-color);
    }

    .step-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    }

    .step-number {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
      color: white;
      border-radius: 50%;
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: var(--spacing-sm);
    }

    .step-card h3 {
      color: var(--text-primary);
      font-size: clamp(1rem, 2.5vw, 1.1rem);
      margin-bottom: var(--spacing-xs);
      font-weight: 700;
    }

    .step-card p {
      color: var(--text-secondary);
      font-size: var(--font-size-xs);
      margin: 0;
      line-height: 1.5;
    }

    /* ============================================================
       CTA SECTION - Call To Action
       ============================================================ */
    .cta-section {
      position: relative;
      padding: var(--spacing-lg) var(--spacing-sm);
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
      color: white;
      text-align: center;
      overflow: hidden;
    }

    @media (min-width: 768px) {
      .cta-section {
        padding: clamp(60px, 10vw, 80px) var(--spacing-sm);
      }
    }

    .cta-waves-top {
      position: absolute;
      top: -1px;
      left: 0;
      width: 100%;
      overflow: hidden;
      line-height: 0;
      height: 80px;
    }

    @media (min-width: 768px) {
      .cta-waves-top {
        height: 120px;
      }
    }

    .cta-waves-top svg {
      display: block;
      width: 100%;
      height: 100%;
    }

    .cta-content {
      position: relative;
      z-index: 1;
      max-width: 600px;
      margin: 0 auto;
      padding: 0 var(--spacing-sm);
    }

    .cta-content h2 {
      font-size: var(--heading-3-size);
      margin-bottom: var(--spacing-sm);
      font-weight: 800;
      line-height: 1.3;
    }

    .cta-content p {
      font-size: var(--body-size);
      margin-bottom: var(--spacing-lg);
      opacity: 0.95;
      line-height: 1.6;
    }

    .btn-cta {
      padding: clamp(10px, 2vw, 12px) clamp(20px, 5vw, 36px) !important;
      font-size: var(--font-size-sm) !important;
      border-radius: var(--border-radius-sm) !important;
      text-transform: uppercase !important;
      font-weight: 600 !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
    }

    .btn-cta:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3) !important;
    }

    /* ============================================================
       FOOTER - Responsive footer layout
       ============================================================ */
    .footer {
      background: #1a1a1a;
      color: #ccc;
      padding: var(--spacing-lg) var(--spacing-sm) var(--spacing-sm);
    }

    .footer-content {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-lg);
      margin-bottom: var(--spacing-lg);
      max-width: 1200px;
      margin-left: auto;
      margin-right: auto;
    }

    @media (min-width: 600px) {
      .footer-content {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 1024px) {
      .footer-content {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .footer-section h4 {
      color: white;
      margin-bottom: var(--spacing-sm);
      font-weight: 600;
      font-size: clamp(0.95rem, 2vw, 1.05rem);
    }

    .footer-section p {
      margin: var(--spacing-xs) 0;
      line-height: 1.6;
      font-size: var(--font-size-sm);
    }

    .footer-section ul {
      list-style: none;
    }

    .footer-section ul li {
      margin: var(--spacing-xs) 0;
    }

    .footer-section a {
      color: #aaa;
      text-decoration: none;
      transition: color 0.3s ease;
      cursor: pointer;
      font-size: var(--font-size-sm);
    }

    .footer-section a:hover {
      color: var(--primary-color);
    }

    .footer-bottom {
      text-align: center;
      padding-top: var(--spacing-sm);
      border-top: 1px solid #333;
      font-size: var(--font-size-xs);
      color: #999;
      max-width: 1200px;
      margin: 0 auto;
    }

    /* ============================================================
       HERO BRANDING - Logo in hero section
       ============================================================ */
    .hero-branding {
      position: absolute;
      top: clamp(50px, 10vw, 80px);
      left: 50%;
      transform: translateX(-50%);
      z-index: 1;
      opacity: 0.15;
      pointer-events: none;
    }

    .hero-logo {
      max-width: clamp(150px, 40vw, 280px);
      width: 100%;
      height: auto;
      filter: brightness(1.2) drop-shadow(0 0 20px rgba(255, 255, 255, 0.1));
    }

    /* ============================================================
       EXAMS SECTION - Responsive exam cards
       ============================================================ */
    .exams-section {
      padding: var(--spacing-lg) var(--spacing-sm);
      background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
      min-height: auto;
    }

    @media (min-width: 768px) {
      .exams-section {
        padding: clamp(60px, 10vw, 80px) var(--spacing-sm);
      }
    }

    .exams-title {
      text-align: center;
      font-size: var(--heading-3-size);
      font-weight: 800;
      color: var(--text-primary);
      margin-bottom: var(--spacing-lg);
      position: relative;
      padding-bottom: var(--spacing-sm);
      line-height: 1.3;
    }

    .exams-title::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: clamp(60px, 15vw, 100px);
      height: 4px;
      background: linear-gradient(90deg, var(--primary-color) 0%, var(--primary-dark) 100%);
      border-radius: 2px;
    }

    .exams-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: var(--spacing-md);
      max-width: 1400px;
      margin: 0 auto;
    }

    @media (min-width: 600px) {
      .exams-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (min-width: 1024px) {
      .exams-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .exam-card {
      background: white;
      border-radius: var(--border-radius);
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      height: 100%;
      border: 1px solid rgba(102, 126, 234, 0.1);
    }

    .exam-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 32px rgba(102, 126, 234, 0.2);
      border-color: rgba(102, 126, 234, 0.3);
    }

    .exam-header {
      padding: var(--spacing-md);
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      border-bottom: 2px solid rgba(102, 126, 234, 0.2);
      flex-shrink: 0;
    }

    .exam-name {
      font-size: clamp(1rem, 3vw, 1.4rem);
      font-weight: 700;
      color: var(--primary-color);
      margin: 0;
      line-height: 1.3;
    }

    .exam-details {
      padding: var(--spacing-md);
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--spacing-sm);
    }

    .exam-detail {
      display: flex;
      align-items: flex-start;
      gap: var(--spacing-xs);
      font-size: var(--font-size-sm);
      color: var(--text-secondary);
      line-height: 1.5;
    }

    .exam-detail-label {
      font-weight: 600;
      color: var(--text-primary);
      min-width: 80px;
      flex-shrink: 0;
    }

    .exam-detail-value {
      color: var(--text-secondary);
      flex: 1;
      word-break: break-word;
    }

    .exam-deadline {
      padding: 0 var(--spacing-md) var(--spacing-md);
      display: flex;
      align-items: center;
      gap: var(--spacing-xs);
      font-size: var(--font-size-xs);
      color: #e74c3c;
      font-weight: 600;
      flex-shrink: 0;
      flex-wrap: wrap;
    }

    .exam-deadline-icon {
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .exam-footer {
      padding: var(--spacing-md);
      border-top: 1px solid #eee;
      flex-shrink: 0;
    }

    .exam-btn {
      width: 100%;
      padding: var(--spacing-xs) var(--spacing-md);
      background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
      color: white;
      border: none;
      border-radius: var(--border-radius-sm);
      font-size: var(--font-size-sm);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      min-height: var(--button-height);
    }

    .exam-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }

    .exam-btn:active {
      transform: translateY(0);
    }

    .loading-exams {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-md);
      min-height: 300px;
      color: var(--primary-color);
    }

    .loading-exams mat-spinner {
      display: flex;
      justify-content: center;
    }

    .loading-text {
      font-size: clamp(0.95rem, 2vw, 1.1rem);
      font-weight: 500;
      color: var(--primary-color);
    }

    /* Badge for exam class */
    .exam-badge {
      display: inline-block;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 0.5rem;
    }

    /* ============================================================
       MOBILE OPTIMIZATIONS
       ============================================================ */
    @media (max-width: 599px) {
      :host {
        --spacing-sm: 0.8rem;
        --spacing-md: 1.2rem;
      }

      .hero-section,
      .features-section,
      .info-section,
      .cta-section,
      .exams-section,
      .footer {
        border-radius: 0;
      }

      .hero-actions {
        gap: var(--spacing-xs);
      }

      .features-grid,
      .steps-grid {
        gap: var(--spacing-sm);
      }

      .exam-card {
        border-radius: var(--border-radius-sm);
      }

      .exam-header,
      .exam-details,
      .exam-footer {
        padding: var(--spacing-sm);
      }

      .exam-detail {
        font-size: 0.8rem;
      }

      .exam-deadline {
        font-size: 0.75rem;
        padding: 0 var(--spacing-sm) var(--spacing-sm);
      }

      .footer-bottom {
        padding: var(--spacing-sm);
      }
    }

    /* Extra Small Phone: 360px - 480px */
    @media (max-width: 480px) {
      .hero-title {
        font-size: 1.8rem;
      }

      .hero-desc {
        font-size: 0.95rem;
      }

      .section-title {
        font-size: 1.4rem;
      }

      .feature-card {
        padding: var(--spacing-md);
      }

      .step-card {
        padding: var(--spacing-md);
      }

      .exam-name {
        font-size: 1rem;
      }

      .exam-btn {
        padding: var(--spacing-xs) var(--spacing-sm);
        font-size: 0.8rem;
        min-height: 40px;
      }

      .cta-content h2 {
        font-size: 1.6rem;
      }

      .hero-logo {
        max-width: 120px;
      }

      .cta-waves-top,
      .waves-top,
      .waves-bottom {
        height: 60px;
      }
    }

    /* Tablet and above */
    @media (min-width: 600px) {
      :host {
        --spacing-sm: 1.25rem;
        --spacing-md: 1.75rem;
      }
    }

    /* Landscape mode optimization */
    @media (max-height: 500px) {
      .hero-section {
        min-height: auto;
        padding: 80px var(--spacing-sm) var(--spacing-sm);
      }

      .scroll-indicator {
        display: none;
      }
    }
  `]
})
export class LandingEnhancedComponent implements OnInit {
  protected router = inject(Router);
  protected i18n = inject(I18nService);
  protected branding = inject(BrandingService);
  protected googleAuth = inject(GoogleAuthService);
  protected publicApi = inject(PublicApiService);
  protected auth = inject(AuthService);

  selectedLanguage = this.i18n.getLanguageSignal();
  exams$ = this.publicApi.getActiveExams();

  ngOnInit() {
    // Redirect logged-in users to the dashboard
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/app/dashboard']);
    }
  }

  goToGoogleLogin() {
    this.router.navigate(['/google-login']);
  }

  goToExamForm(exam: any) {
    // After login, user will be directed to fill the form for this exam
    // For now, just redirect to google login
    this.router.navigate(['/google-login']);
  }

  scrollToExams() {
    const element = document.querySelector('.exams-section');
    element?.scrollIntoView({ behavior: 'smooth' });
  }

  scrollToFeatures() {
    const element = document.querySelector('.features-section');
    element?.scrollIntoView({ behavior: 'smooth' });
  }
}
