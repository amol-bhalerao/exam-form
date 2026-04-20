import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { I18nService } from '../core/i18n.service';
import { BrandingService } from '../core/branding.service';

@Component({
  selector: 'app-marketing-landing',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTabsModule,
    MatExpansionModule
  ],
  template: `
    <div class="marketing-landing">
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-content">
          <div class="hero-left">
            <h1 class="hero-title">HSC परीक्षा व्यवस्थापन प्रणाली</h1>
            <p class="hero-subtitle">Digital Exam Management & Registration Portal</p>
            <p class="hero-description">
              एक संपूर्ण डिजिटल मंच जो HSC परीक्षा नोंदणी, व्यवस्थापन आणि निरीक्षण सुलभ, वेगवान आणि पारदर्शक बनवते।
            </p>
            <div class="hero-cta">
              <button mat-raised-button color="primary" (click)="navigateTo('/google-login')" class="cta-btn">
                <mat-icon>arrow_forward</mat-icon>
                विद्यार्थी लॉगिन
              </button>
              <button mat-stroked-button (click)="scrollToSection('roles')" class="cta-btn-secondary">
                <mat-icon>info</mat-icon>
                अधिक जाणून घ्या
              </button>
            </div>
          </div>
          <div class="hero-right">
            <div class="hero-image">
              <mat-icon class="large-hero-icon">assessment</mat-icon>
            </div>
          </div>
        </div>
      </section>

      <!-- Key Benefits -->
      <section class="benefits-section">
        <div class="container">
          <h2 class="section-title">आवेदनाचे मुख्य लाभ</h2>
          <div class="benefits-grid">
            <div class="benefit-card">
              <mat-icon class="benefit-icon">speed</mat-icon>
              <h3>वेगवान नोंदणी</h3>
              <p>5 मिनिटांत संपूर्ण परीक्षा नोंदणी सोडा. Google Sign-In सह तात्क्षणिक प्रमाणीकरण.</p>
            </div>
            <div class="benefit-card">
              <mat-icon class="benefit-icon">security</mat-icon>
              <h3>सुरक्षित डेटा</h3>
              <p>एंटरप्राइज-ग्रेड सुरक्षा, OAuth प्रमाणीकरण, आणि एन्क्रिप्टेड डेटा स्टोरेज.</p>
            </div>
            <div class="benefit-card">
              <mat-icon class="benefit-icon">language</mat-icon>
              <h3>बहुभाषिक समर्थन</h3>
              <p>मराठी आणि अंग्रेजी दोन्ही भाषांमध्ये सर्व वैशिष्ट्ये उपलब्ध आहेत.</p>
            </div>
            <div class="benefit-card">
              <mat-icon class="benefit-icon">print</mat-icon>
              <h3>सहज मुद्रण</h3>
              <p>एक-क्लिक फॉर्म प्रिंटिंग, प्रोफेशनल लेआउट, आणि तैयार असे फॉर्मेटिंग.</p>
            </div>
            <div class="benefit-card">
              <mat-icon class="benefit-icon">trending_up</mat-icon>
              <h3>रिअल-टाइम अपडेट्स</h3>
              <p>तत्काल अधिसूचना, आवेदन स्थिती ट्रॅकिंग, आणि लाइव डैशबोर्ड.</p>
            </div>
            <div class="benefit-card">
              <mat-icon class="benefit-icon">support_agent</mat-icon>
              <h3>24/7 समर्थन</h3>
              <p>WhatsApp, ईमेल, आणि फोन सहायता सर्व समय उपलब्ध.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- User Roles & Features -->
      <section class="roles-section" #rolesSection>
        <div class="container">
          <h2 class="section-title">सभी उपयोगकर्ता भूमिकाएं</h2>
          <p class="section-subtitle">विभिन्न पहुंचों के लिए डिज़ाइन की गई विशेषताएं</p>

          <mat-tab-group class="roles-tabs">
            <!-- STUDENT ROLE -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon>school</mat-icon>
                <span>विद्यार्थी</span>
              </ng-template>
              <div class="role-content">
                <div class="role-header">
                  <h3>विद्यार्थी पोर्टल</h3>
                  <p class="role-description">HSC परीक्षार्थीयांसाठी सर्वव्यापी समाधान</p>
                </div>
                <div class="role-features">
                  <div class="feature-group">
                    <h4>मुख्य विशेषताएं</h4>
                    <ul>
                      <li><mat-icon>check_circle</mat-icon> Google Sign-In सह तात्क्षणिक पंजीकरण</li>
                      <li><mat-icon>check_circle</mat-icon> परीक्षा नोंदणी फॉर्म भरना आणि जमा करणे</li>
                      <li><mat-icon>check_circle</mat-icon> व्यक्तिगत माहिती व्यवस्थापन</li>
                      <li><mat-icon>check_circle</mat-icon> बँक विवरण जोडना (शिक्षण शुल्क परिणामांसाठी)</li>
                      <li><mat-icon>check_circle</mat-icon> आधार, SSC आणि मागील परीक्षेची माहिती</li>
                      <li><mat-icon>check_circle</mat-icon> विषय निवड आणि प्रबंधन</li>
                      <li><mat-icon>check_circle</mat-icon> फोटो आणि स्वाक्षरी अपलोड करा</li>
                      <li><mat-icon>check_circle</mat-icon> आवेदन स्थिती ट्रॅकिंग</li>
                      <li><mat-icon>check_circle</mat-icon> फॉर्म प्रिंट करा आणि जमा करा</li>
                      <li><mat-icon>check_circle</mat-icon> परीक्षा परिणाम आणि प्रमाणपत्र डाउनलोड करा</li>
                    </ul>
                  </div>
                  <div class="feature-group">
                    <h4>विद्यार्थीय लाभ</h4>
                    <ul>
                      <li>🎯 5 मिनिटांत सर्व नोंदणी पूर्ण करा</li>
                      <li>📱 मोबाइलवरून कधीही फॉर्म व्यवस्थापित करा</li>
                      <li>🔔 रिअल-टाइम अपडेट आणि अधिसूचना</li>
                      <li>📄 पेशेवर मुद्रण-तयार फॉर्मेटिंग</li>
                      <li>🔐 संपूर्ण डेटा सुरक्षा आणि गोपनीयता</li>
                      <li>💳 सुरक्षित ऑनलाइन भुगतान</li>
                    </ul>
                  </div>
                </div>
                <div class="role-cta">
                  <button mat-raised-button color="primary" (click)="navigateTo('/google-login')">
                    विद्यार्थी लॉगिन शुरू करा
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </div>
            </mat-tab>

            <!-- INSTITUTE ROLE -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon>apartment</mat-icon>
                <span>संस्थान</span>
              </ng-template>
              <div class="role-content">
                <div class="role-header">
                  <h3>संस्थान प्रबंधन पोर्टल</h3>
                  <p class="role-description">कॉलेज आणि शाळांसाठी संपूर्ण व्यवस्थापन समाधान</p>
                </div>
                <div class="role-features">
                  <div class="feature-group">
                    <h4>मुख्य विशेषताएं</h4>
                    <ul>
                      <li><mat-icon>check_circle</mat-icon> संस्थान की माहिती व्यवस्थापन</li>
                      <li><mat-icon>check_circle</mat-icon> सभी विद्यार्थियों के आवेदन देखें</li>
                      <li><mat-icon>check_circle</mat-icon> आवेदन स्थिति सत्यापन और अनुमोदन</li>
                      <li><mat-icon>check_circle</mat-icon> धाराओं (Streams) का प्रबंधन</li>
                      <li><mat-icon>check_circle</mat-icon> शिक्षकों और कर्मचारियों को जोड़ें</li>
                      <li><mat-icon>check_circle</mat-icon> रिपोर्ट और विश्लेषण</li>
                      <li><mat-icon>check_circle</mat-icon> विद्यार्थी डेटा एक्सपोर्ट करें</li>
                      <li><mat-icon>check_circle</mat-icon> परीक्षा क्षमता प्रबंधन</li>
                      <li><mat-icon>check_circle</mat-icon> संचार और अधिसूचनाएं</li>
                      <li><mat-icon>check_circle</mat-icon> बोर्ड के साथ समन्वय</li>
                    </ul>
                  </div>
                  <div class="feature-group">
                    <h4>संस्थान के लाभ</h4>
                    <ul>
                      <li>📊 सभी आवेदन एक जगह पर प्रबंधित करें</li>
                      <li>✅ तेजी से सत्यापन और अनुमोदन प्रक्रिया</li>
                      <li>📈 विद्यार्थी डेटा विश्लेषण और रिपोर्ट</li>
                      <li>👥 शिक्षक और कर्मचारी प्रबंधन</li>
                      <li>🔐 सुरक्षित डेटा हैंडलिंग</li>
                      <li>📱 मोबाइल-अनुकूल इंटरफेस</li>
                    </ul>
                  </div>
                </div>
                <div class="role-cta">
                  <button mat-raised-button color="accent" (click)="navigateTo('/institute-login')">
                    संस्थान लॉगिन शुरू करा
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </div>
            </mat-tab>

            <!-- BOARD ROLE -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon>admin_panel_settings</mat-icon>
                <span>बोर्ड</span>
              </ng-template>
              <div class="role-content">
                <div class="role-header">
                  <h3>बोर्ड प्रबंधन पोर्टल</h3>
                  <p class="role-description">परीक्षा बोर्ड के लिए उन्नत प्रबंधन उपकरण</p>
                </div>
                <div class="role-features">
                  <div class="feature-group">
                    <h4>मुख्य विशेषताएं</h4>
                    <ul>
                      <li><mat-icon>check_circle</mat-icon> परीक्षाओं का निर्माण और प्रबंधन</li>
                      <li><mat-icon>check_circle</mat-icon> धाराओं (Streams) और विषयों का प्रबंधन</li>
                      <li><mat-icon>check_circle</mat_icon> सभी आवेदनों की समीक्षा करें</li>
                      <li><mat-icon>check_circle</mat-icon> आवेदन स्थिति को अनुमोदित या अस्वीकार करें</li>
                      <li><mat-icon>check_circle</mat-icon> संस्थान पंजीकरण को स्वीकृति दें</li>
                      <li><mat-icon>check_circle</mat-icon> उपयोगकर्ता और भूमिकाओं का प्रबंधन</li>
                      <li><mat-icon>check_circle</mat-icon> विस्तृत रिपोर्ट और विश्लेषण</li>
                      <li><mat-icon>check_circle</mat-icon> आवेदनों का ऑडिट ट्रेल</li>
                      <li><mat-icon>check_circle</mat-icon> बल्क डेटा आयात/निर्यात</li>
                      <li><mat-icon>check_circle</mat-icon> स्वास्थ्य जांच और निगरानी</li>
                    </ul>
                  </div>
                  <div class="feature-group">
                    <h4>बोर्ड के लाभ</h4>
                    <ul>
                      <li>🎯 सभी परीक्षा प्रक्रियाओं का केंद्रीय नियंत्रण</li>
                      <li>📊 संपूर्ण रियल-टाइम विश्लेषण डैशबोर्ड</li>
                      <li>✅ तेजी से आवेदन प्रसंस्करण</li>
                      <li>🔍 व्यापक ऑडिट और अनुपालन ट्रैकिंग</li>
                      <li>📈 डेटा-संचालित निर्णय लेने की क्षमता</li>
                      <li>🤝 बेहतर संस्थान समन्वय</li>
                    </ul>
                  </div>
                </div>
                <div class="role-cta">
                  <button mat-raised-button color="warn" (click)="navigateTo('/board-login')">
                    बोर्ड लॉगिन शुरू करा
                    <mat-icon>arrow_forward</mat-icon>
                  </button>
                </div>
              </div>
            </mat-tab>

            <!-- ADMIN ROLE -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon>security</mat-icon>
                <span>व्यवस्थापक</span>
              </ng-template>
              <div class="role-content">
                <div class="role-header">
                  <h3>व्यवस्थापक पोर्टल</h3>
                  <p class="role-description">सिस्टम के लिए व्यवस्थापकीय नियंत्रण और निगरानी</p>
                </div>
                <div class="role-features">
                  <div class="feature-group">
                    <h4>मुख्य विशेषताएं</h4>
                    <ul>
                      <li><mat-icon>check_circle</mat-icon> उपयोगकर्ता और भूमिकाओं का प्रबंधन</li>
                      <li><mat-icon>check_circle</mat-icon> सिस्टम कॉन्फ़िगरेशन</li>
                      <li><mat-icon>check_circle</mat-icon> आवेदनों की निगरानी</li>
                      <li><mat-icon>check_circle</mat-icon> सिस्टम स्वास्थ्य जांच</li>
                      <li><mat-icon>check_circle</mat-icon> लॉग और ऑडिट ट्रेल</li>
                      <li><mat-icon>check_circle</mat-icon> बैकअप और पुनर्स्थापना</li>
                      <li><mat-icon>check_circle</mat-icon> उपयोगकर्ता सहायता प्रबंधन</li>
                      <li><mat-icon>check_circle</mat-icon> प्रदर्शन निगरानी</li>
                    </ul>
                  </div>
                  <div class="feature-group">
                    <h4>व्यवस्थापक के लाभ</h4>
                    <ul>
                      <li>🔧 सर्वव्यापी सिस्टम नियंत्रण</li>
                      <li>📊 विस्तृत निगरानी और रिपोर्टिंग</li>
                      <li>🔐 उन्नत सुरक्षा विकल्प</li>
                      <li>⚡ तेजी से समस्या समाधान</li>
                      <li>📈 प्रदर्शन अनुकूलन</li>
                    </ul>
                  </div>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>
      </section>

      <!-- How It Works -->
      <section class="how-it-works">
        <div class="container">
          <h2 class="section-title">कैसे काम करता है</h2>
          <p class="section-subtitle">सरल 4 चरणों में शुरू करें</p>
          <div class="steps-grid">
            <div class="step-card">
              <div class="step-number">1</div>
              <h3>चरण 1: लॉगिन करें</h3>
              <p>अपनी भूमिका चुनें (विद्यार्थी, संस्थान या बोर्ड) और लॉगिन करें। विद्यार्थियों के लिए Google Sign-In उपलब्ध है।</p>
            </div>
            <div class="step-card">
              <div class="step-number">2</div>
              <h3>चरण 2: विवरण भरें</h3>
              <p>अपनी व्यक्तिगत जानकारी, परीक्षा विवरण और विषय का चयन करें। कुछ मिनिटों में पूरा करें।</p>
            </div>
            <div class="step-card">
              <div class="step-number">3</div>
              <h3>चरण 3: जमा करें</h3>
              <p>फॉर्म सत्यापित करें और जमा करें। तुरंत एक पुष्टि ईमेल प्राप्त करें।</p>
            </div>
            <div class="step-card">
              <div class="step-number">4</div>
              <h3>चरण 4: ट्रैक करें</h3>
              <p>अपने आवेदन की स्थिति ट्रैक करें। रियल-टाइम अपडेट और अधिसूचनाएं प्राप्त करें।</p>
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section class="faq-section">
        <div class="container">
          <h2 class="section-title">सामान्य प्रश्न</h2>
          <mat-accordion class="faq-accordion">
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-icon>help_outline</mat-icon>
                <span>क्या मुझे सफलतापूर्वक रजिस्टर करने के लिए कोई विशेष आवश्यकताएं हैं?</span>
              </mat-expansion-panel-header>
              <p>नहीं। आपको बस एक सक्रिय मोबाइल नंबर, ईमेल पते, और आधार नंबर की आवश्यकता है। सभी जानकारी सुरक्षित रखी जाती है।</p>
            </mat-expansion-panel>

            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-icon>help_outline</mat-icon>
                <span>क्या मुझे फॉर्म जमा करने के बाद संपादित कर सकता हूं?</span>
              </mat-expansion-panel-header>
              <p>हां। आप अपने आवेदन को बोर्ड अनुमोदन से पहले कभी भी संपादित कर सकते हैं। आवेदन अनुमोदित होने के बाद, आप कुछ क्षेत्रों को संपादित नहीं कर सकेंगे।</p>
            </mat-expansion-panel>

            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-icon>help_outline</mat-icon>
                <span>अगर मुझे अपनी प्रवेश परीक्षा की जानकारी भूल गई तो क्या करूं?</span>
              </mat-expansion-panel-header>
              <p>चिंता न करें। आप अपने स्कूल/कॉलेज से यह जानकारी सत्यापित कर सकते हैं। हमारा समर्थन दल आपको मिनटों में सहायता कर सकता है।</p>
            </mat-expansion-panel>

            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-icon>help_outline</mat-icon>
                <span>क्या आवेदन शुल्क है?</span>
              </mat-expansion-panel-header>
              <p>परीक्षा शुल्क बोर्ड द्वारा निर्धारित किया जाता है। आवेदन शुल्क आपके संस्थान या बोर्ड की नीति के अनुसार भिन्न हो सकते हैं।</p>
            </mat-expansion-panel>

            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-icon>help_outline</mat-icon>
                <span>मुझे आवेदन स्वीकार न होने पर क्या करना चाहिए?</span>
              </mat-expansion-panel-header>
              <p>अस्वीकृति के कारण देखने के लिए अपनी आवेदन स्थिति जांचें। आप आवेदन पुनः जमा कर सकते हैं या हमारे सहायता दल से संपर्क कर सकते हैं।</p>
            </mat-expansion-panel>

            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-icon>help_outline</mat-icon>
                <span>संस्थान के लिए नोंदणी कैसे करूं?</span>
              </mat-expansion-panel-header>
              <p>संस्थान को "संस्थान लॉगिन" पर जाना होगा, "चिंता का पत्र" उत्पन्न करना होगा, इसे संस्था की लेटरहेड पर मुद्रित करना होगा, हस्ताक्षर और मुहर करना होगा, और फिर contact@hscexam.in को भेजना होगा।</p>
            </mat-expansion-panel>
          </mat-accordion>
        </div>
      </section>

      <!-- Contact Section -->
      <section class="contact-section">
        <div class="container contact-container">
          <h2 class="section-title">हमसे संपर्क करें</h2>
          <p class="section-subtitle">आपके सभी प्रश्नों के लिए हम यहां हैं</p>
          <div class="contact-grid">
            <div class="contact-card">
              <mat-icon>email</mat-icon>
              <h3>ईमेल</h3>
              <p>contact@hscexam.in</p>
              <p>support@hscexam.in</p>
            </div>
            <div class="contact-card">
              <mat-icon>phone</mat-icon>
              <h3>फोन</h3>
              <p>+91 99227 74144</p>
              <p>सोमवार - शुक्रवार: 9AM - 6PM</p>
            </div>
            <div class="contact-card">
              <mat-icon>whatsapp</mat-icon>
              <h3>WhatsApp</h3>
              <p>+91 99227 74144</p>
              <p>तुरंत समर्थन के लिए</p>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Footer -->
      <section class="final-cta">
        <div class="container">
          <h2>आज ही शुरू करें</h2>
          <p>अपने HSC परीक्षा आवेदन को अभी जमा करें</p>
          <div class="final-cta-buttons">
            <button mat-raised-button color="primary" class="large-btn" (click)="navigateTo('/google-login')">
              <mat-icon>school</mat-icon>
              विद्यार्थी लॉगिन
            </button>
            <button mat-raised-button color="accent" class="large-btn" (click)="navigateTo('/institute-login')">
              <mat-icon>apartment</mat-icon>
              संस्थान लॉगिन
            </button>
            <button mat-raised-button color="warn" class="large-btn" (click)="navigateTo('/board-login')">
              <mat-icon>admin_panel_settings</mat-icon>
              बोर्ड लॉगिन
            </button>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .marketing-landing {
      width: 100%;
      background: #f5f5f5;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }

    /* Hero Section */
    .hero-section {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 6rem 2rem;
      min-height: 80vh;
      display: flex;
      align-items: center;
    }

    .hero-content {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 3rem;
      align-items: center;
      width: 100%;
    }

    .hero-left {
      animation: fadeInLeft 0.8s ease-out;
    }

    .hero-title {
      font-size: 3rem;
      font-weight: 700;
      margin-bottom: 1rem;
      line-height: 1.2;
    }

    .hero-subtitle {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      opacity: 0.9;
    }

    .hero-description {
      font-size: 1.1rem;
      margin-bottom: 2rem;
      opacity: 0.9;
      line-height: 1.6;
    }

    .hero-cta {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .cta-btn, .cta-btn-secondary {
      padding: 0.75rem 1.5rem !important;
      font-size: 1rem !important;
    }

    .hero-right {
      display: flex;
      justify-content: center;
      animation: fadeInRight 0.8s ease-out;
    }

    .hero-image {
      width: 300px;
      height: 300px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);
    }

    .large-hero-icon {
      font-size: 150px !important;
      width: 150px !important;
      height: 150px !important;
      color: rgba(255, 255, 255, 0.8);
    }

    /* Benefits Section */
    .benefits-section {
      padding: 5rem 2rem;
      background: white;
    }

    .section-title {
      text-align: center;
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
      color: #333;
    }

    .section-subtitle {
      text-align: center;
      font-size: 1.1rem;
      color: #666;
      margin-bottom: 3rem;
    }

    .benefits-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }

    .benefit-card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
      border: 1px solid #eee;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .benefit-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    }

    .benefit-icon {
      font-size: 48px !important;
      width: 48px !important;
      height: 48px !important;
      color: #667eea;
      margin-bottom: 1rem;
    }

    .benefit-card h3 {
      font-size: 1.3rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #333;
    }

    .benefit-card p {
      color: #666;
      line-height: 1.6;
    }

    /* Roles Section */
    .roles-section {
      padding: 5rem 2rem;
      background: #f9f9f9;
    }

    .roles-tabs {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .role-content {
      padding: 2rem 0;
    }

    .role-header {
      margin-bottom: 2rem;
      text-align: center;
    }

    .role-header h3 {
      font-size: 2rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .role-description {
      font-size: 1.1rem;
      color: #666;
    }

    .role-features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 3rem;
      margin-bottom: 2rem;
    }

    .feature-group h4 {
      font-size: 1.2rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 1rem;
    }

    .feature-group ul {
      list-style: none;
      padding: 0;
    }

    .feature-group li {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
      color: #555;
      line-height: 1.6;
    }

    .feature-group mat-icon {
      color: #4caf50;
      flex-shrink: 0;
      font-size: 20px !important;
      width: 20px !important;
      height: 20px !important;
    }

    .role-cta {
      text-align: center;
      margin-top: 2rem;
    }

    .role-cta button {
      padding: 0.75rem 2rem !important;
      font-size: 1rem !important;
    }

    /* How It Works */
    .how-it-works {
      padding: 5rem 2rem;
      background: white;
    }

    .steps-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }

    .step-card {
      background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
      border-left: 4px solid #667eea;
    }

    .step-number {
      display: inline-block;
      width: 50px;
      height: 50px;
      background: #667eea;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }

    .step-card h3 {
      font-size: 1.3rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .step-card p {
      color: #666;
      line-height: 1.6;
    }

    /* FAQ Section */
    .faq-section {
      padding: 5rem 2rem;
      background: #f9f9f9;
    }

    .faq-accordion {
      max-width: 800px;
      margin: 0 auto;
    }

    mat-expansion-panel {
      margin-bottom: 1rem !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08) !important;
    }

    mat-expansion-panel-header mat-icon {
      margin-right: 1rem;
      color: #667eea;
    }

    mat-expansion-panel-header span {
      font-weight: 500;
      color: #333;
    }

    /* Contact Section */
    .contact-section {
      padding: 5rem 2rem;
      background: white;
    }

    .contact-container {
      text-align: center;
    }

    .contact-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-top: 3rem;
    }

    .contact-card {
      background: linear-gradient(135deg, #667eea15 0%, #764ba215 100%);
      padding: 2rem;
      border-radius: 12px;
      text-align: center;
    }

    .contact-card mat-icon {
      font-size: 48px !important;
      width: 48px !important;
      height: 48px !important;
      color: #667eea;
      margin-bottom: 1rem;
    }

    .contact-card h3 {
      font-size: 1.3rem;
      font-weight: 600;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .contact-card p {
      color: #666;
      margin: 0.5rem 0;
    }

    /* Final CTA */
    .final-cta {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 5rem 2rem;
      text-align: center;
    }

    .final-cta h2 {
      font-size: 2.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .final-cta p {
      font-size: 1.2rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }

    .final-cta-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .large-btn {
      padding: 1rem 2rem !important;
      font-size: 1.1rem !important;
      min-width: 200px;
    }

    /* Animations */
    @keyframes fadeInLeft {
      from {
        opacity: 0;
        transform: translateX(-30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes fadeInRight {
      from {
        opacity: 0;
        transform: translateX(30px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    /* Responsive Design */
    @media (max-width: 968px) {
      .hero-content {
        grid-template-columns: 1fr;
      }

      .hero-title {
        font-size: 2rem;
      }

      .hero-right {
        display: none;
      }

      .section-title {
        font-size: 2rem;
      }

      .role-features {
        grid-template-columns: 1fr;
      }

      .final-cta-buttons {
        flex-direction: column;
      }

      .large-btn {
        width: 100%;
      }
    }

    @media (max-width: 480px) {
      .hero-section {
        padding: 3rem 1rem;
        min-height: auto;
      }

      .hero-title {
        font-size: 1.5rem;
      }

      .hero-subtitle {
        font-size: 1rem;
      }

      .section-title {
        font-size: 1.5rem;
      }

      .benefits-grid {
        grid-template-columns: 1fr;
      }

      .cta-btn, .cta-btn-secondary {
        padding: 0.5rem 1rem !important;
        font-size: 0.9rem !important;
      }
    }
  `]
})
export class MarketingLandingComponent {
  private router = inject(Router);

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  scrollToSection(sectionId: string) {
    const element = document.querySelector(`#${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
