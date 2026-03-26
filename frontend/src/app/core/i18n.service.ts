import { Injectable, signal } from '@angular/core';

// Marathi translation strings
const MARATHI_TRANSLATIONS = {
  // Common
  cancel: 'रद्द करा',
  save: 'जतन करा',
  submit: 'सादर करा',
  edit: 'संपादन करा',
  delete: 'हटवा',
  loading: 'लोड होत आहे...',
  error: 'त्रुटी',
  success: 'यशस्वी',
  warning: 'सावधानता',
  info: 'माहिती',
  close: 'बंद करा',
  next: 'पुढील',
  previous: 'मागील',
  back: 'मागे',
  
  // Authentication
  login: 'लॉगिन',
  logout: 'लॉगआउट',
  loginWithGoogle: 'Google सह लॉगिन करा',
  studentLogin: 'विद्यार्थी लॉगिन',
  instituteLogin: 'संस्था लॉगिन',
  email: 'ई-मेल',
  password: 'पासवर्ड',
  rememberMe: 'मला लक्षात ठेवा',
  forgotPassword: 'पासवर्ड विसरलात?',
  loginRequired: 'लॉगिन आवश्यक आहे',
  pleaseLogin: 'कृपया लॉगिन करा',
  
  // Landing Page
  welcome: 'स्वागतम',
  welcomeToExamPortal: 'परीक्षा पोर्टलमध्ये आपले स्वागत आहे',
  startNow: 'आता सुरू करा',
  learnMore: 'अधिक जाणून घ्या',
  features: 'वैशिष्ट्ये',
  about: 'माहिती',
  contact: 'संपर्क',
  
  // Exam Form
  examForm: 'परीक्षा फॉर्म',
  personalInformation: 'व्यक्तिगत माहिती',
  academicDetails: 'शैक्षणिक तपशील',
  contactInformation: 'संपर्क माहिती',
  subjectSelection: 'विषय निवड',
  review: 'पुनरावलोकन',
  fullName: 'पूर्ण नाव',
  dateOfBirth: 'जन्मतारीख',
  gender: 'लिंग',
  category: 'श्रेणी',
  fatherName: 'पितेचे नाव',
  motherName: 'मातेचे नाव',
  mobileNumber: 'मोबाईल नंबर',
  mobileEmail: 'ई-मेल',
  address: 'पत्ता',
  city: 'शहर',
  pinCode: 'पिन कोड',
  stream: 'प्रवाह',
  medium: 'माध्यम',
  subjects: 'विषय',
  selectSubjects: 'विषय निवडा',
  
  // Board
  boardName: 'महाराष्ट्र राज्य माध्यमिक व उच्च माध्यमिक शिक्षण मंडळ, पुणे',
  boardNameShort: 'MSBSHSE',
  
  // Messages
  formSubmitted: 'फॉर्म यशस्वीरित्या सादर केला गेला',
  formSaved: 'फॉर्म जतन केला गेला',
  formError: 'फॉर्मवर त्रुटी आहे',
  requiredField: 'हे क्षेत्र आवश्यक आहे',
  invalidEmail: 'अमान्य ई-मेल',
  invalidPhone: 'अमान्य फोन क्रमांक',
  
  // Language
  language: 'भाषा',
  selectLanguage: 'भाषा निवडा',
  marathi: 'मराठी',
  english: 'English',
  
  // Student Profile
  studentProfile: 'विद्यार्थी प्रोफाईल',
  manageYourDetailsForAutoFill: 'परीक्षा फॉर्मसाठी आपली माहिती व्यवस्थापित करा',
  firstName: 'पहिले नाव',
  lastName: 'शेवटचे नाव',
  mobile: 'मोबाईल',
  aadharNumber: 'आधार क्रमांक',
  rollNumber: 'रोल क्रमांक',
  personalDetails: 'व्यक्तिगत तपशील',
  collegeInfo: 'महाविद्यालय माहिती',
  collegeName: 'महाविद्यालयाचे नाव',
  collegeBranch: 'महाविद्यालयाची शाखा',
  admissionYear: 'प्रवेश वर्ष',
  board: 'बोर्ड',
  subjectMarks: 'विषय गुण',
  addSubject: 'विषय जोडा',
  selectSubject: 'विषय निवडा',
  subjectName: 'विषयाचे नाव',
  maxMarks: 'कमाल गुण',
  obtainedMarks: 'प्राप्त गुण',
  percentage: 'टक्केवारी',
  grade: 'ग्रेड',
  isBacklogSubject: 'हा बॅकलॉग विषय आहे',
  freshAdmission: 'नवीन प्रवेश',
  backlogSubjects: 'बॅकलॉग विषय',
  add: 'जोडा',
  addBacklogSubject: 'बॅकलॉग विषय जोडा',
  removeSubject: 'विषय हटवा',
  noSubjectsAdded: 'विषय जोडलेले नाहीत',
  noBacklogSubjectsAdded: 'बॅकलॉग विषय जोडलेले नाहीत',
  summary: 'सारांश',
  profileSummary: 'प्रोफाईल सारांश',
  name: 'नाव',
  freshSubjects: 'नवीन विषय',
  averagePercentage: 'सरासरी टक्केवारी',
  changesSaved: 'बदल जतन केले गेले',
  subjectAdded: 'विषय जोडला गेला',
  subjectRemoved: 'विषय हटवला गेला',
  confirmDelete: 'काढून टाकण्याची पुष्टी करा',
  saveChanges: 'बदल जतन करा',
  loadingProfile: 'प्रोफाईल लोड होत आहे...',
  science: 'विज्ञान',
  commerce: 'व्यावसाय',
  arts: 'कला',
  vocational: 'व्यावसायिक',
  male: 'पुरुष',
  female: 'स्त्री',
  other: 'इतर',
  state: 'राज्य',
  pincode: 'पिन कोड',
  
  // User Type Selection
  selectUserType: 'वापरकर्तेचा प्रकार निवडा',
  chooseYourRoleToLogin: 'लॉगिन करण्यासाठी आपली भूमिका निवडा',
  student: 'विद्यार्थी',
  institute: 'संस्था',
  admin: 'व्यवस्थापक',
  studentLoginDescription: 'परीक्षा फॉर्म भरा आणि आपली प्रोफाईल व्यवस्थापित करा',
  instituteLoginDescription: 'विद्यार्थी अर्ज व्यवस्थापित करा आणि मंजूरी पहा',
  adminLoginDescription: 'प्रणाली, वापरकर्ता आणि अर्ज व्यवस्थापित करा',
  fillExamForm: 'परीक्षा फॉर्म भरा',
  autoFillProfile: 'स्वयंचलित भरण व्यवस्थाप्रोफाईल',
  googleSignIn: 'Google साइन-इन',
  manageApplications: 'अर्ज व्यवस्थापित करा',
  viewStudents: 'विद्यार्थी पहा',
  generateReports: 'अहवाल तयार करा',
  systemManagement: 'प्रणाली व्यवस्थापन',
  userManagement: 'वापरकर्ता व्यवस्थापन',
  analytics: 'विश्लेषण',
  firstTimeUser: 'पहिल्यांदा वापरकर्ता आहात?',
  signUpHere: 'येथे साइन अप करा',
  institutePortal: 'संस्था पोर्टल',
  adminPortal: 'व्यवस्थापक पोर्टल',
  instituteFeatures: 'संस्था वैशिष्ट्ये',
  adminCapabilities: 'व्यवस्थापक क्षमता',
  manageStudentApplications: 'विद्यार्थी अर्ज व्यवस्थापित करा',
  viewApprovals: 'मंजूरी पहा',
  downloadReports: 'अहवाल डाउनलोड करा',
  manageInstituteProfile: 'संस्था प्रोफाईल व्यवस्थापित करा',
  systemConfiguration: 'प्रणाली कॉन्फिगरेशन',
  userAndRoleManagement: 'वापरकर्ता आणि भूमिका व्यवस्थापन',
  auditLogs: 'ऑडिट लॉग',
  applicationAnalytics: 'अर्ज विश्लेषण',
  enterYourCredentials: 'आपल्या प्रमाणपत्र प्रविष्ट करा',
  adminUsername: 'व्यवस्थापक वापरकर्तानाम',
  securePassword: 'सुरक्षित पासवर्ड',
  securityCode: 'सुरक्षा कोड',
  secureLogin: 'सुरक्षित लॉगिन',
  backToUserSelection: 'वापरकर्ता निवडीकडे परत जा',
  restrictedAccess: 'प्रतिबंधित प्रवेश',
  needHelp: 'मदतीची आवश्यकता आहे?',
  contactSupport: 'समर्थनाशी संपर्क साधा',
  adminHelp: 'व्यवस्थापक मदत',
  emergencySupport: 'आपातकालीन समर्थन',
  securityNotice: 'सुरक्षितता सूचना: सार्वजनिक संगणकावर लॉगिन करू नका. कोणाशीही आपला पासवर्ड किंवा सुरक्षा कोड शेअर करू नका.',
  
  // Messages
  loginSuccess: 'लॉगिन यशस्वी',
  loginFailed: 'लॉगिन अपयशी',
  notAuthorized: 'आप को यह एक्सेस करने के लिए अधिकृत नहीं है',
  or: 'किंवा'
};

// English translation strings
const ENGLISH_TRANSLATIONS = {
  // Common
  cancel: 'Cancel',
  save: 'Save',
  submit: 'Submit',
  edit: 'Edit',
  delete: 'Delete',
  loading: 'Loading...',
  error: 'Error',
  success: 'Success',
  warning: 'Warning',
  info: 'Information',
  close: 'Close',
  next: 'Next',
  previous: 'Previous',
  back: 'Back',
  
  // Authentication
  login: 'Login',
  logout: 'Logout',
  loginWithGoogle: 'Login with Google',
  studentLogin: 'Student Login',
  instituteLogin: 'Institute Login',
  email: 'Email',
  password: 'Password',
  rememberMe: 'Remember Me',
  forgotPassword: 'Forgot Password?',
  loginRequired: 'Login Required',
  pleaseLogin: 'Please login to continue',
  
  // Landing Page
  welcome: 'Welcome',
  welcomeToExamPortal: 'Welcome to Exam Portal',
  startNow: 'Start Now',
  learnMore: 'Learn More',
  features: 'Features',
  about: 'About',
  contact: 'Contact',
  
  // Exam Form
  examForm: 'Exam Form',
  personalInformation: 'Personal Information',
  academicDetails: 'Academic Details',
  contactInformation: 'Contact Information',
  subjectSelection: 'Subject Selection',
  review: 'Review',
  fullName: 'Full Name',
  dateOfBirth: 'Date of Birth',
  gender: 'Gender',
  category: 'Category',
  fatherName: "Father's Name",
  motherName: "Mother's Name",
  mobileNumber: 'Mobile Number',
  mobileEmail: 'Email',
  address: 'Address',
  city: 'City',
  pinCode: 'Pin Code',
  stream: 'Stream',
  medium: 'Medium',
  subjects: 'Subjects',
  selectSubjects: 'Select Subjects',
  
  // Board
  boardName: 'Maharashtra State Board of Secondary and Higher Secondary Education, Pune',
  boardNameShort: 'MSBSHSE',
  
  // Messages
  formSubmitted: 'Form submitted successfully',
  formSaved: 'Form saved successfully',
  formError: 'There is an error in the form',
  requiredField: 'This field is required',
  invalidEmail: 'Invalid email',
  invalidPhone: 'Invalid phone number',
  
  // Language
  language: 'Language',
  selectLanguage: 'Select Language',
  marathi: 'मराठी',
  english: 'English',
  
  // Student Profile
  studentProfile: 'Student Profile',
  manageYourDetailsForAutoFill: 'Manage your details for auto-fill in exam forms',
  firstName: 'First Name',
  lastName: 'Last Name',
  mobile: 'Mobile',
  aadharNumber: 'Aadhar Number',
  rollNumber: 'Roll Number',
  personalDetails: 'Personal Details',
  collegeInfo: 'College Information',
  collegeName: 'College Name',
  collegeBranch: 'College Branch',
  admissionYear: 'Admission Year',
  board: 'Board',
  subjectMarks: 'Subject Marks',
  addSubject: 'Add Subject',
  selectSubject: 'Select Subject',
  subjectName: 'Subject Name',
  maxMarks: 'Max Marks',
  obtainedMarks: 'Obtained Marks',
  percentage: 'Percentage',
  grade: 'Grade',
  isBacklogSubject: 'This is a backlog subject',
  freshAdmission: 'Fresh Admission',
  backlogSubjects: 'Backlog Subjects',
  add: 'Add',
  addBacklogSubject: 'Add Backlog Subject',
  removeSubject: 'Remove Subject',
  noSubjectsAdded: 'No subjects added',
  noBacklogSubjectsAdded: 'No backlog subjects added',
  summary: 'Summary',
  profileSummary: 'Profile Summary',
  name: 'Name',
  freshSubjects: 'Fresh Subjects',
  averagePercentage: 'Average Percentage',
  changesSaved: 'Changes Saved',
  subjectAdded: 'Subject Added',
  subjectRemoved: 'Subject Removed',
  confirmDelete: 'Confirm Delete',
  saveChanges: 'Save Changes',
  loadingProfile: 'Loading Profile...',
  science: 'Science',
  commerce: 'Commerce',
  arts: 'Arts',
  vocational: 'Vocational',
  male: 'Male',
  female: 'Female',
  other: 'Other',
  state: 'State',
  pincode: 'Pincode',
  
  // User Type Selection
  selectUserType: 'Select User Type',
  chooseYourRoleToLogin: 'Choose your role to login',
  student: 'Student',
  institute: 'Institute',
  admin: 'Admin',
  studentLoginDescription: 'Fill exam forms and manage your profile',
  instituteLoginDescription: 'Manage student applications and view approvals',
  adminLoginDescription: 'Manage system, users, and applications',
  fillExamForm: 'Fill Exam Form',
  autoFillProfile: 'Auto-fill Profile',
  googleSignIn: 'Google Sign-In',
  manageApplications: 'Manage Applications',
  viewStudents: 'View Students',
  generateReports: 'Generate Reports',
  systemManagement: 'System Management',
  userManagement: 'User Management',
  analytics: 'Analytics',
  firstTimeUser: 'New to the portal?',
  signUpHere: 'Sign up here',
  institutePortal: 'Institute Portal',
  adminPortal: 'Admin Portal',
  instituteFeatures: 'Institute Features',
  adminCapabilities: 'Admin Capabilities',
  manageStudentApplications: 'Manage Student Applications',
  viewApprovals: 'View Approvals',
  downloadReports: 'Download Reports',
  manageInstituteProfile: 'Manage Institute Profile',
  systemConfiguration: 'System Configuration',
  userAndRoleManagement: 'User and Role Management',
  auditLogs: 'Audit Logs',
  applicationAnalytics: 'Application Analytics',
  enterYourCredentials: 'Enter your credentials',
  adminUsername: 'Admin Username',
  securePassword: 'Secure Password',
  securityCode: 'Security Code',
  secureLogin: 'Secure Login',
  backToUserSelection: 'Back to User Selection',
  restrictedAccess: 'Restricted Access',
  needHelp: 'Need Help?',
  contactSupport: 'Contact Support',
  adminHelp: 'Admin Help',
  emergencySupport: 'Emergency Support',
  securityNotice: 'Security Notice: Do not login on public computers. Never share your password or security code with anyone.',
  
  // Messages
  loginSuccess: 'Login Successful',
  loginFailed: 'Login Failed',
  notAuthorized: 'You are not authorized to access this',
  or: 'OR'
};

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private currentLanguage = signal<'en' | 'mr'>('mr'); // Default to Marathi
  private translations = {
    en: ENGLISH_TRANSLATIONS,
    mr: MARATHI_TRANSLATIONS
  };

  constructor() {
    // Load language preference from localStorage
    const saved = localStorage.getItem('language');
    if (saved === 'en' || saved === 'mr') {
      this.currentLanguage.set(saved);
    }
  }

  setLanguage(lang: 'en' | 'mr') {
    this.currentLanguage.set(lang);
    localStorage.setItem('language', lang);
    // Set HTML lang attribute
    document.documentElement.lang = lang === 'mr' ? 'mr' : 'en';
    // Set text direction if needed for future RTL language support
    document.documentElement.dir = 'ltr';
  }

  getLanguage() {
    return this.currentLanguage();
  }

  getLanguageSignal() {
    return this.currentLanguage;
  }

  translate(key: keyof typeof ENGLISH_TRANSLATIONS): string {
    const lang = this.currentLanguage();
    const trans = this.translations[lang] as any;
    return trans[key] || key;
  }

  t(key: keyof typeof ENGLISH_TRANSLATIONS): string {
    return this.translate(key);
  }

  // Get all translations for current language
  getTranslations() {
    return this.translations[this.currentLanguage()];
  }

  // Add or update a translation
  addTranslation(key: string, en: string, mr: string) {
    (this.translations.en as any)[key] = en;
    (this.translations.mr as any)[key] = mr;
  }
}
