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
            <h4>{{ selectedLanguage() === 'mr' ? 'संस्था माहिती' : 'About Board' }}</h4>
            <p>{{ selectedLanguage() === 'mr'
              ? 'महाराष्ट्र राज्य माध्यमिक व उच्च माध्यमिक शिक्षण मंडळ'
              : 'Maharashtra State Board of Secondary and Higher Secondary Education'
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
    :host {
      display: block;
      background: #f8f9fa;
    }

    /* General Styles */
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    .section-title {
      font-size: 2.2rem;
      text-align: center;
      color: #1a1a1a;
      margin-bottom: 12px;
      font-weight: 700;
    }

    /* Hero Section */
    .hero-section {
      position: relative;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      overflow: hidden;
      padding: 60px 20px 20px;
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
      max-width: 800px;
      animation: slideUp 0.8s ease-out;
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
      font-size: 1.1rem;
      opacity: 0.9;
      margin-bottom: 12px;
      font-weight: 500;
      letter-spacing: 1px;
    }

    .hero-title {
      font-size: 3.5rem;
      font-weight: 800;
      margin-bottom: 20px;
      line-height: 1.2;
      text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .hero-desc {
      font-size: 1.2rem;
      margin-bottom: 40px;
      opacity: 0.95;
      line-height: 1.6;
    }

    .hero-actions {
      display: flex;
      gap: 20px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn-large {
      padding: 14px 36px !important;
      font-size: 1.05rem !important;
      border-radius: 8px !important;
      text-transform: uppercase !important;
      font-weight: 600 !important;
      letter-spacing: 0.5px !important;
      transition: all 0.3s ease !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
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

    /* Features Section */
    .features-section {
      position: relative;
      padding: 100px 0;
      background: white;
      overflow: hidden;
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
      height: 120px;
    }

    .waves-bottom {
      bottom: -1px;
      height: 120px;
    }

    .waves-bottom svg {
      position: relative;
      display: block;
      width: calc(100% + 1.3px);
      height: 120px;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 30px;
      margin-top: 60px;
      position: relative;
      z-index: 1;
    }

    .feature-card {
      background: linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%);
      padding: 40px 30px;
      border-radius: 12px;
      text-align: center;
      transition: all 0.3s ease;
      border: 1px solid #e0e6ff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    .feature-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 12px 32px rgba(102, 126, 234, 0.15);
      border-color: #667eea;
    }

    .feature-icon {
      width: 60px;
      height: 60px;
      margin: 0 auto 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 12px;
      color: white;
    }

    .feature-icon mat-icon {
      font-size: 32px !important;
      width: 32px !important;
      height: 32px !important;
    }

    .feature-card h3 {
      color: #1a1a1a;
      font-size: 1.3rem;
      margin-bottom: 12px;
      font-weight: 700;
    }

    .feature-card p {
      color: #666;
      line-height: 1.6;
      font-size: 0.95rem;
      margin: 0;
    }

    /* Info Section */
    .info-section {
      padding: 100px 20px;
      background: #f0f4ff;
    }

    .steps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 25px;
      margin-top: 60px;
    }

    .step-card {
      background: white;
      padding: 35px 25px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
      border-left: 4px solid #667eea;
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 50%;
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 16px;
    }

    .step-card h3 {
      color: #1a1a1a;
      font-size: 1.1rem;
      margin-bottom: 10px;
      font-weight: 700;
    }

    .step-card p {
      color: #666;
      font-size: 0.9rem;
      margin: 0;
      line-height: 1.5;
    }

    /* CTA Section */
    .cta-section {
      position: relative;
      padding: 80px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      overflow: hidden;
    }

    .cta-waves-top {
      position: absolute;
      top: -1px;
      left: 0;
      width: 100%;
      overflow: hidden;
      line-height: 0;
      height: 120px;
    }

    .cta-waves-top svg {
      display: block;
      width: 100%;
      height: 120px;
    }

    .cta-content {
      position: relative;
      z-index: 1;
      max-width: 600px;
      margin: 0 auto;
    }

    .cta-content h2 {
      font-size: 2.2rem;
      margin-bottom: 16px;
      font-weight: 800;
    }

    .cta-content p {
      font-size: 1.1rem;
      margin-bottom: 30px;
      opacity: 0.95;
      line-height: 1.6;
    }

    .btn-cta {
      padding: 12px 36px !important;
      font-size: 1.05rem !important;
      border-radius: 8px !important;
      text-transform: uppercase !important;
      font-weight: 600 !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2) !important;
    }

    .btn-cta:hover {
      transform: translateY(-2px) !important;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3) !important;
    }

    /* Footer */
    .footer {
      background: #1a1a1a;
      color: #ccc;
      padding: 60px 20px 20px;
    }

    .footer-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 40px;
      margin-bottom: 40px;
    }

    .footer-section h4 {
      color: white;
      margin-bottom: 16px;
      font-weight: 600;
      font-size: 1.05rem;
    }

    .footer-section p {
      margin: 8px 0;
      line-height: 1.6;
      font-size: 0.9rem;
    }

    .footer-section ul {
      list-style: none;
    }

    .footer-section ul li {
      margin: 8px 0;
    }

    .footer-section a {
      color: #aaa;
      text-decoration: none;
      transition: color 0.3s ease;
      cursor: pointer;
    }

    .footer-section a:hover {
      color: #667eea;
    }

    .footer-bottom {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #333;
      font-size: 0.9rem;
      color: #999;
    }

    /* Hero Branding Section */
    .hero-branding {
      position: absolute;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1;
      opacity: 0.15;
      pointer-events: none;
    }

    .hero-logo {
      max-width: 280px;
      width: 100%;
      height: auto;
      filter: brightness(1.2) drop-shadow(0 0 20px rgba(255, 255, 255, 0.1));
    }

    /* Exams Section */
    .exams-section {
      padding: 80px 20px;
      background: linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%);
      min-height: auto;
    }

    .exams-title {
      text-align: center;
      font-size: 2.5rem;
      font-weight: 800;
      color: #333;
      margin-bottom: 50px;
      position: relative;
      padding-bottom: 20px;
    }

    .exams-title::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 100px;
      height: 4px;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      border-radius: 2px;
    }

    .exams-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 30px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .exam-card {
      background: white;
      border-radius: 12px;
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
      padding: 20px;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
      border-bottom: 2px solid rgba(102, 126, 234, 0.2);
      flex-shrink: 0;
    }

    .exam-name {
      font-size: 1.4rem;
      font-weight: 700;
      color: #667eea;
      margin: 0;
      line-height: 1.3;
    }

    .exam-details {
      padding: 20px;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .exam-detail {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      font-size: 0.95rem;
      color: #555;
    }

    .exam-detail-label {
      font-weight: 600;
      color: #333;
      min-width: 80px;
    }

    .exam-detail-value {
      color: #666;
      flex: 1;
    }

    .exam-deadline {
      padding: 0 20px 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.9rem;
      color: #e74c3c;
      font-weight: 600;
      flex-shrink: 0;
    }

    .exam-deadline-icon {
      font-size: 1.1rem;
    }

    .exam-footer {
      padding: 20px;
      border-top: 1px solid #eee;
      flex-shrink: 0;
    }

    .exam-btn {
      width: 100%;
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      text-transform: uppercase;
      letter-spacing: 0.5px;
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
      gap: 20px;
      min-height: 300px;
      color: #667eea;
    }

    .loading-exams mat-spinner {
      display: flex;
      justify-content: center;
    }

    .loading-text {
      font-size: 1.1rem;
      font-weight: 500;
      color: #667eea;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .exams-grid {
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 25px;
      }

      .exams-title {
        font-size: 2rem;
      }

      .exam-name {
        font-size: 1.2rem;
      }
    }

    @media (max-width: 768px) {
      .hero-title {
        font-size: 2.2rem;
      }

      .hero-desc {
        font-size: 1rem;
      }

      .section-title {
        font-size: 1.8rem;
      }

      .cta-content h2 {
        font-size: 1.8rem;
      }

      .features-grid,
      .steps-grid {
        gap: 20px;
      }

      .hero-actions {
        gap: 12px;
      }

      .btn-large {
        padding: 12px 24px !important;
        font-size: 0.95rem !important;
      }

      .exams-section {
        padding: 60px 15px;
      }

      .exams-title {
        font-size: 1.8rem;
        margin-bottom: 40px;
      }

      .exams-grid {
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .hero-logo {
        max-width: 200px;
      }

      .exam-card {
        border-radius: 10px;
      }

      .exam-btn {
        padding: 11px 20px;
        font-size: 0.9rem;
      }
    }

    @media (max-width: 480px) {
      .hero-title {
        font-size: 1.8rem;
      }

      .section-title {
        font-size: 1.4rem;
      }

      .features-section {
        padding: 60px 0;
      }

      .hero-actions {
        flex-direction: column;
      }

      .btn-large {
        width: 100%;
      }

      .exams-section {
        padding: 50px 15px;
      }

      .exams-title {
        font-size: 1.5rem;
        margin-bottom: 30px;
      }

      .exams-title::after {
        width: 60px;
      }

      .exam-header {
        padding: 15px;
      }

      .exam-name {
        font-size: 1rem;
      }

      .exam-details {
        padding: 15px;
        gap: 12px;
      }

      .exam-detail {
        font-size: 0.85rem;
      }

      .exam-footer {
        padding: 15px;
      }

      .exam-btn {
        padding: 10px 16px;
        font-size: 0.85rem;
      }

      .hero-logo {
        max-width: 150px;
      }

      .hero-branding {
        top: 70px;
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
