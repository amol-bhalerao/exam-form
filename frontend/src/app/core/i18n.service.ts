import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from './api';

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
  boardName: 'HSC परीक्षा व्यवस्थापन प्रणाली',
  boardNameShort: 'HEMS',
  
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
  hindi: 'हिंदी',
  
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
  notAuthorized: 'आपल्याला हे पाहण्याची परवानगी नाही',
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
  boardName: 'HSC Exam Management System',
  boardNameShort: 'HEMS',
  
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
  hindi: 'हिंदी',
  
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

// Hindi translation strings
const HINDI_TRANSLATIONS: Record<keyof typeof ENGLISH_TRANSLATIONS, string> = {
  // Common
  cancel: 'रद्द करें',
  save: 'सहेजें',
  submit: 'जमा करें',
  edit: 'संपादित करें',
  delete: 'हटाएँ',
  loading: 'लोड हो रहा है...',
  error: 'त्रुटि',
  success: 'सफल',
  warning: 'चेतावनी',
  info: 'जानकारी',
  close: 'बंद करें',
  next: 'आगे',
  previous: 'पिछला',
  back: 'वापस',

  // Authentication
  login: 'लॉगिन',
  logout: 'लॉगआउट',
  loginWithGoogle: 'Google से लॉगिन करें',
  studentLogin: 'विद्यार्थी लॉगिन',
  instituteLogin: 'संस्था लॉगिन',
  email: 'ई-मेल',
  password: 'पासवर्ड',
  rememberMe: 'मुझे याद रखें',
  forgotPassword: 'पासवर्ड भूल गए?',
  loginRequired: 'लॉगिन आवश्यक है',
  pleaseLogin: 'कृपया आगे बढ़ने के लिए लॉगिन करें',

  // Landing Page
  welcome: 'स्वागत है',
  welcomeToExamPortal: 'परीक्षा पोर्टल में आपका स्वागत है',
  startNow: 'अभी शुरू करें',
  learnMore: 'और जानें',
  features: 'विशेषताएँ',
  about: 'परिचय',
  contact: 'संपर्क',

  // Exam Form
  examForm: 'परीक्षा फ़ॉर्म',
  personalInformation: 'व्यक्तिगत जानकारी',
  academicDetails: 'शैक्षणिक विवरण',
  contactInformation: 'संपर्क जानकारी',
  subjectSelection: 'विषय चयन',
  review: 'समीक्षा',
  fullName: 'पूरा नाम',
  dateOfBirth: 'जन्मतिथि',
  gender: 'लिंग',
  category: 'श्रेणी',
  fatherName: 'पिता का नाम',
  motherName: 'माता का नाम',
  mobileNumber: 'मोबाइल नंबर',
  mobileEmail: 'ई-मेल',
  address: 'पता',
  city: 'शहर',
  pinCode: 'पिन कोड',
  stream: 'संकाय',
  medium: 'माध्यम',
  subjects: 'विषय',
  selectSubjects: 'विषय चुनें',

  // Board
  boardName: 'HSC परीक्षा प्रबंधन प्रणाली',
  boardNameShort: 'HEMS',

  // Messages
  formSubmitted: 'फ़ॉर्म सफलतापूर्वक जमा हुआ',
  formSaved: 'फ़ॉर्म सहेजा गया',
  formError: 'फ़ॉर्म में त्रुटि है',
  requiredField: 'यह फ़ील्ड आवश्यक है',
  invalidEmail: 'अमान्य ई-मेल',
  invalidPhone: 'अमान्य फ़ोन नंबर',

  // Language
  language: 'भाषा',
  selectLanguage: 'भाषा चुनें',
  marathi: 'मराठी',
  english: 'English',
  hindi: 'हिंदी',

  // Student Profile
  studentProfile: 'विद्यार्थी प्रोफ़ाइल',
  manageYourDetailsForAutoFill: 'परीक्षा फ़ॉर्म में स्वतः भरने के लिए अपनी जानकारी प्रबंधित करें',
  firstName: 'पहला नाम',
  lastName: 'उपनाम',
  mobile: 'मोबाइल',
  aadharNumber: 'आधार नंबर',
  rollNumber: 'रोल नंबर',
  personalDetails: 'व्यक्तिगत विवरण',
  collegeInfo: 'महाविद्यालय जानकारी',
  collegeName: 'महाविद्यालय का नाम',
  collegeBranch: 'महाविद्यालय शाखा',
  admissionYear: 'प्रवेश वर्ष',
  board: 'बोर्ड',
  subjectMarks: 'विषय अंक',
  addSubject: 'विषय जोड़ें',
  selectSubject: 'विषय चुनें',
  subjectName: 'विषय का नाम',
  maxMarks: 'अधिकतम अंक',
  obtainedMarks: 'प्राप्त अंक',
  percentage: 'प्रतिशत',
  grade: 'ग्रेड',
  isBacklogSubject: 'यह बैकलॉग विषय है',
  freshAdmission: 'नया प्रवेश',
  backlogSubjects: 'बैकलॉग विषय',
  add: 'जोड़ें',
  addBacklogSubject: 'बैकलॉग विषय जोड़ें',
  removeSubject: 'विषय हटाएँ',
  noSubjectsAdded: 'कोई विषय नहीं जोड़ा गया',
  noBacklogSubjectsAdded: 'कोई बैकलॉग विषय नहीं जोड़ा गया',
  summary: 'सारांश',
  profileSummary: 'प्रोफ़ाइल सारांश',
  name: 'नाम',
  freshSubjects: 'नए विषय',
  averagePercentage: 'औसत प्रतिशत',
  changesSaved: 'बदलाव सहेजे गए',
  subjectAdded: 'विषय जोड़ा गया',
  subjectRemoved: 'विषय हटाया गया',
  confirmDelete: 'हटाने की पुष्टि करें',
  saveChanges: 'बदलाव सहेजें',
  loadingProfile: 'प्रोफ़ाइल लोड हो रही है...',
  science: 'विज्ञान',
  commerce: 'वाणिज्य',
  arts: 'कला',
  vocational: 'व्यावसायिक',
  male: 'पुरुष',
  female: 'महिला',
  other: 'अन्य',
  state: 'राज्य',
  pincode: 'पिन कोड',

  // User Type Selection
  selectUserType: 'उपयोगकर्ता प्रकार चुनें',
  chooseYourRoleToLogin: 'लॉगिन के लिए अपनी भूमिका चुनें',
  student: 'विद्यार्थी',
  institute: 'संस्था',
  admin: 'प्रशासक',
  studentLoginDescription: 'परीक्षा फ़ॉर्म भरें और अपनी प्रोफ़ाइल प्रबंधित करें',
  instituteLoginDescription: 'विद्यार्थी आवेदन प्रबंधित करें और स्वीकृतियाँ देखें',
  adminLoginDescription: 'प्रणाली, उपयोगकर्ता और आवेदन प्रबंधित करें',
  fillExamForm: 'परीक्षा फ़ॉर्म भरें',
  autoFillProfile: 'स्वतः भरने वाली प्रोफ़ाइल',
  googleSignIn: 'Google साइन-इन',
  manageApplications: 'आवेदन प्रबंधित करें',
  viewStudents: 'विद्यार्थी देखें',
  generateReports: 'रिपोर्ट बनाएँ',
  systemManagement: 'प्रणाली प्रबंधन',
  userManagement: 'उपयोगकर्ता प्रबंधन',
  analytics: 'विश्लेषण',
  firstTimeUser: 'पोर्टल पर नए हैं?',
  signUpHere: 'यहाँ साइन अप करें',
  institutePortal: 'संस्था पोर्टल',
  adminPortal: 'प्रशासक पोर्टल',
  instituteFeatures: 'संस्था सुविधाएँ',
  adminCapabilities: 'प्रशासक क्षमताएँ',
  manageStudentApplications: 'विद्यार्थी आवेदन प्रबंधित करें',
  viewApprovals: 'स्वीकृतियाँ देखें',
  downloadReports: 'रिपोर्ट डाउनलोड करें',
  manageInstituteProfile: 'संस्था प्रोफ़ाइल प्रबंधित करें',
  systemConfiguration: 'प्रणाली कॉन्फ़िगरेशन',
  userAndRoleManagement: 'उपयोगकर्ता और भूमिका प्रबंधन',
  auditLogs: 'ऑडिट लॉग',
  applicationAnalytics: 'आवेदन विश्लेषण',
  enterYourCredentials: 'अपनी लॉगिन जानकारी दर्ज करें',
  adminUsername: 'प्रशासक उपयोगकर्ता नाम',
  securePassword: 'सुरक्षित पासवर्ड',
  securityCode: 'सुरक्षा कोड',
  secureLogin: 'सुरक्षित लॉगिन',
  backToUserSelection: 'उपयोगकर्ता चयन पर वापस जाएँ',
  restrictedAccess: 'प्रतिबंधित पहुँच',
  needHelp: 'मदद चाहिए?',
  contactSupport: 'सहायता से संपर्क करें',
  adminHelp: 'प्रशासक सहायता',
  emergencySupport: 'आपातकालीन सहायता',
  securityNotice: 'सुरक्षा सूचना: सार्वजनिक कंप्यूटर पर लॉगिन न करें। अपना पासवर्ड या सुरक्षा कोड किसी के साथ साझा न करें।',

  // Messages
  loginSuccess: 'लॉगिन सफल',
  loginFailed: 'लॉगिन विफल',
  notAuthorized: 'आपको इसे देखने की अनुमति नहीं है',
  or: 'या'
};

/**
 * Strings added with the redesigned shell and the GR subject guide.
 * Kept as one table so each key is translated into all three languages together.
 */
const SHARED_STRINGS: Record<string, { en: string; mr: string; hi: string }> = {
  profile: { en: 'Profile', mr: 'प्रोफाईल', hi: 'प्रोफ़ाइल' },
  navDashboard: { en: 'Dashboard', mr: 'डॅशबोर्ड', hi: 'डैशबोर्ड' },
  navSystemManagement: { en: 'System management', mr: 'प्रणाली व्यवस्थापन', hi: 'प्रणाली प्रबंधन' },
  navHealth: { en: 'Health monitor', mr: 'आरोग्य मॉनिटर', hi: 'हेल्थ मॉनिटर' },
  navPayments: { en: 'Payments dashboard', mr: 'पेमेंट डॅशबोर्ड', hi: 'भुगतान डैशबोर्ड' },
  navInstitutes: { en: 'Institutes', mr: 'संस्था', hi: 'संस्थाएँ' },
  navInstituteDashboard: { en: 'Institute dashboard', mr: 'संस्था डॅशबोर्ड', hi: 'संस्था डैशबोर्ड' },
  navInstituteUsers: { en: 'Institute users', mr: 'संस्था वापरकर्ते', hi: 'संस्था उपयोगकर्ता' },
  navAdminUsers: { en: 'Admin users', mr: 'व्यवस्थापक वापरकर्ते', hi: 'प्रशासक उपयोगकर्ता' },
  navMasterData: { en: 'Master data', mr: 'मास्टर डेटा', hi: 'मास्टर डेटा' },
  navContent: { en: 'Content management', mr: 'मजकूर व्यवस्थापन', hi: 'सामग्री प्रबंधन' },
  navExams: { en: 'Exams', mr: 'परीक्षा', hi: 'परीक्षाएँ' },
  navApplications: { en: 'Applications', mr: 'अर्ज', hi: 'आवेदन' },
  navStudentMaster: { en: 'Student master', mr: 'विद्यार्थी मास्टर', hi: 'विद्यार्थी मास्टर' },
  navNews: { en: 'News', mr: 'बातम्या', hi: 'समाचार' },
  navAcademic: { en: 'Academic', mr: 'शैक्षणिक', hi: 'शैक्षणिक' },
  navTeachers: { en: 'Teachers', mr: 'शिक्षक', hi: 'शिक्षक' },
  navSubjects: { en: 'Subjects', mr: 'विषय', hi: 'विषय' },
  navStreams: { en: 'Streams', mr: 'शाखा', hi: 'संकाय' },
  navStudentManagement: { en: 'Student management', mr: 'विद्यार्थी व्यवस्थापन', hi: 'विद्यार्थी प्रबंधन' },
  navAdministration: { en: 'Administration', mr: 'प्रशासन', hi: 'प्रशासन' },
  navInstituteDetails: { en: 'Institute details', mr: 'संस्थेचा तपशील', hi: 'संस्था विवरण' },
  navTeachersStaff: { en: 'Teachers and staff', mr: 'शिक्षक व कर्मचारी', hi: 'शिक्षक एवं कर्मचारी' },
  navStreamSubjects: { en: 'Stream subjects', mr: 'शाखानिहाय विषय', hi: 'संकायवार विषय' },
  navExamCapacity: { en: 'Exam capacity', mr: 'परीक्षा क्षमता', hi: 'परीक्षा क्षमता' },
  navMyStudies: { en: 'My studies', mr: 'माझा अभ्यास', hi: 'मेरी पढ़ाई' },
  navRegistration: { en: 'Student registration', mr: 'विद्यार्थी नोंदणी', hi: 'विद्यार्थी पंजीकरण' },
  navExamForms: { en: 'Exam forms', mr: 'परीक्षा फॉर्म', hi: 'परीक्षा फ़ॉर्म' },
  navMyPayments: { en: 'My payments', mr: 'माझी पेमेंट्स', hi: 'मेरे भुगतान' },
  navAccountSettings: { en: 'Account settings', mr: 'खाते सेटिंग्ज', hi: 'खाता सेटिंग्स' },
  portalStudent: { en: 'Student Portal', mr: 'विद्यार्थी पोर्टल', hi: 'विद्यार्थी पोर्टल' },
  portalInstitute: { en: 'Institute Portal', mr: 'संस्था पोर्टल', hi: 'संस्था पोर्टल' },
  portalBoard: { en: 'Board Portal', mr: 'मंडळ पोर्टल', hi: 'बोर्ड पोर्टल' },
  portalSystem: { en: 'System Admin Portal', mr: 'प्रणाली व्यवस्थापक पोर्टल', hi: 'सिस्टम प्रशासक पोर्टल' },
  portalDefault: { en: 'HSC Exam System', mr: 'HSC परीक्षा प्रणाली', hi: 'HSC परीक्षा प्रणाली' },
  appTitle: { en: 'HSC Exam Forms', mr: 'HSC परीक्षा फॉर्म', hi: 'HSC परीक्षा फ़ॉर्म' },
  appSubtitle: { en: 'Maharashtra State Board', mr: 'महाराष्ट्र राज्य मंडळ', hi: 'महाराष्ट्र राज्य बोर्ड' },
  roleSTUDENT: { en: 'Student', mr: 'विद्यार्थी', hi: 'विद्यार्थी' },
  roleINSTITUTE: { en: 'Institute', mr: 'संस्था', hi: 'संस्था' },
  roleBOARD: { en: 'Board', mr: 'मंडळ', hi: 'बोर्ड' },
  roleSUPER_ADMIN: { en: 'System admin', mr: 'प्रणाली व्यवस्थापक', hi: 'सिस्टम प्रशासक' },
  collapseSidebar: { en: 'Collapse sidebar', mr: 'साइडबार लहान करा', hi: 'साइडबार छोटा करें' },
  expandSidebar: { en: 'Expand sidebar', mr: 'साइडबार मोठा करा', hi: 'साइडबार बड़ा करें' },
  openMenu: { en: 'Open menu', mr: 'मेनू उघडा', hi: 'मेनू खोलें' },
  languageSaved: { en: 'Language saved to your account', mr: 'भाषा तुमच्या खात्यात जतन केली', hi: 'भाषा आपके खाते में सहेजी गई' },

  // Error messages shown by the HTTP error interceptor
  errNetwork: { en: 'Cannot reach the server. Check your internet connection and try again.', mr: 'सर्व्हरशी संपर्क होत नाही. इंटरनेट तपासून पुन्हा प्रयत्न करा.', hi: 'सर्वर से संपर्क नहीं हो पा रहा। इंटरनेट जाँचकर फिर से प्रयास करें।' },
  errSessionExpired: { en: 'Your session has expired. Please log in again.', mr: 'तुमचे सत्र संपले आहे. कृपया पुन्हा लॉगिन करा.', hi: 'आपका सत्र समाप्त हो गया है। कृपया फिर से लॉगिन करें।' },
  errForbidden: { en: 'You do not have permission to do this.', mr: 'ही कृती करण्याची तुम्हाला परवानगी नाही.', hi: 'आपको यह करने की अनुमति नहीं है।' },
  errNotFound: { en: 'The requested record was not found.', mr: 'मागितलेली नोंद सापडली नाही.', hi: 'माँगा गया रिकॉर्ड नहीं मिला।' },
  errValidation: { en: 'Some details are missing or invalid. Please check the form.', mr: 'काही माहिती अपूर्ण किंवा चुकीची आहे. कृपया फॉर्म तपासा.', hi: 'कुछ जानकारी अधूरी या गलत है। कृपया फ़ॉर्म जाँचें।' },
  errTooMany: { en: 'Too many attempts. Please wait a minute and try again.', mr: 'खूप प्रयत्न झाले. एक मिनिट थांबून पुन्हा प्रयत्न करा.', hi: 'बहुत अधिक प्रयास। एक मिनट रुककर फिर से प्रयास करें।' },
  errServer: { en: 'Something went wrong on the server. Please try again shortly.', mr: 'सर्व्हरवर अडचण आली. थोड्या वेळाने पुन्हा प्रयत्न करा.', hi: 'सर्वर पर समस्या आई। थोड़ी देर बाद फिर से प्रयास करें।' },
  errInvalidCredentials: { en: 'Incorrect username or password.', mr: 'वापरकर्तानाव किंवा पासवर्ड चुकीचा आहे.', hi: 'उपयोगकर्ता नाम या पासवर्ड गलत है।' },

  // GR subject guide
  grTitle: { en: 'Subject guide — 2019 GR scheme', mr: 'विषय मार्गदर्शक — २०१९ शासन निर्णय', hi: 'विषय मार्गदर्शिका — 2019 शासन निर्णय योजना' },
  grIntro: { en: 'Tap a subject to add or remove it. Rules are checked as you choose.', mr: 'विषय जोडण्यासाठी किंवा काढण्यासाठी त्यावर टॅप करा. निवडताना नियम तपासले जातात.', hi: 'विषय जोड़ने या हटाने के लिए उस पर टैप करें। चुनते समय नियम जाँचे जाते हैं।' },
  grPapers: { en: 'Subjects (papers)', mr: 'विषय (पेपर)', hi: 'विषय (पेपर)' },
  grAllGood: { en: 'Selection follows the 2019 GR scheme.', mr: 'निवड २०१९ शासन निर्णयानुसार योग्य आहे.', hi: 'चयन 2019 शासन निर्णय योजना के अनुसार सही है।' },
  grNotOffered: { en: 'Not offered by your institute', mr: 'तुमच्या संस्थेत उपलब्ध नाही', hi: 'आपकी संस्था में उपलब्ध नहीं' },
  grCompulsory: { en: 'Compulsory', mr: 'अनिवार्य', hi: 'अनिवार्य' },
  grPick: { en: 'Pick', mr: 'निवडा', hi: 'चुनें' },
  grPickRange: { en: 'Pick {min}–{max}', mr: '{min}–{max} निवडा', hi: '{min}–{max} चुनें' },
  grUpTo: { en: 'Up to {max}', mr: 'जास्तीत जास्त {max}', hi: 'अधिकतम {max}' },
  grRules: { en: 'Rules', mr: 'नियम', hi: 'नियम' },
  grStreamMissing: { en: 'Choose your stream in Academic Details to see the subject groups.', mr: 'विषय गट पाहण्यासाठी शैक्षणिक तपशीलमध्ये शाखा निवडा.', hi: 'विषय समूह देखने के लिए शैक्षणिक विवरण में संकाय चुनें।' },
  grStreamNotCovered: { en: 'This stream is not covered by the 2019 GR scheme. Pick subjects from the list below.', mr: 'ही शाखा २०१९ शासन निर्णयात नाही. खालील यादीतून विषय निवडा.', hi: 'यह संकाय 2019 शासन निर्णय योजना में शामिल नहीं है। नीचे की सूची से विषय चुनें।' },
  grLoadFailed: { en: 'Could not load the subject guide. You can still pick subjects below.', mr: 'विषय मार्गदर्शक लोड झाला नाही. तरीही खाली विषय निवडू शकता.', hi: 'विषय मार्गदर्शिका लोड नहीं हुई। आप फिर भी नीचे विषय चुन सकते हैं।' },
  grPapersSuffix: { en: 'papers', mr: 'पेपर', hi: 'पेपर' },
  grManualList: { en: 'Selected subjects & answer language', mr: 'निवडलेले विषय व उत्तराची भाषा', hi: 'चुने गए विषय और उत्तर की भाषा' }
};

export type LanguageCode = 'en' | 'mr' | 'hi';
export const SUPPORTED_LANGUAGES: ReadonlyArray<{ code: LanguageCode; label: string; short: string }> = [
  { code: 'mr', label: 'मराठी', short: 'मरा' },
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'hi', label: 'हिंदी', short: 'हिं' }
];

const LANGUAGE_STORAGE_KEY = 'language';
const EXPLICIT_CHOICE_KEY = 'language_explicit';
const AUTH_STORAGE_KEY = 'hsc_auth';

export function normalizeLanguage(value: unknown): LanguageCode | null {
  const lang = String(value ?? '').trim().toLowerCase().slice(0, 2);
  return lang === 'en' || lang === 'mr' || lang === 'hi' ? lang : null;
}

function safeGet(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function safeSet(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private readonly http = inject(HttpClient);
  private readonly currentLanguage = signal<LanguageCode>('mr'); // Default to Marathi
  readonly language = this.currentLanguage.asReadonly();
  private translations: Record<LanguageCode, Record<string, string>> = {
    en: { ...ENGLISH_TRANSLATIONS },
    mr: { ...MARATHI_TRANSLATIONS },
    hi: { ...HINDI_TRANSLATIONS }
  };

  constructor() {
    for (const [key, value] of Object.entries(SHARED_STRINGS)) {
      this.translations.en[key] = value.en;
      this.translations.mr[key] = value.mr;
      this.translations.hi[key] = value.hi;
    }
    const saved = normalizeLanguage(safeGet(LANGUAGE_STORAGE_KEY));
    this.applyLanguage(saved ?? 'mr');
  }

  /**
   * Change language. When the user is signed in the choice is also saved to
   * their account (PUT /api/me/preferences) so it is restored on next login.
   */
  setLanguage(lang: LanguageCode | string, options: { persist?: boolean } = {}) {
    const next = normalizeLanguage(lang);
    if (!next) return;
    this.applyLanguage(next);
    safeSet(LANGUAGE_STORAGE_KEY, next);
    safeSet(EXPLICIT_CHOICE_KEY, '1');
    if (options.persist !== false && safeGet(AUTH_STORAGE_KEY)) {
      this.saveToAccount(next);
    }
  }

  /**
   * Apply the language that came back with login / refresh / me.
   * Saved account preference wins; otherwise a choice made on this device
   * before signing in is kept (and saved to the account); otherwise the role default.
   */
  applyUserPreference(user: { preferredLanguage?: string | null; defaultLanguage?: string | null } | null | undefined) {
    if (!user) return;
    const saved = normalizeLanguage(user.preferredLanguage);
    if (saved) {
      this.applyLanguage(saved);
      safeSet(LANGUAGE_STORAGE_KEY, saved);
      return;
    }
    const local = normalizeLanguage(safeGet(LANGUAGE_STORAGE_KEY));
    if (local && safeGet(EXPLICIT_CHOICE_KEY)) {
      this.applyLanguage(local);
      this.saveToAccount(local);
      return;
    }
    const fallback = normalizeLanguage(user.defaultLanguage);
    if (fallback) {
      this.applyLanguage(fallback);
      safeSet(LANGUAGE_STORAGE_KEY, fallback);
    }
  }

  private saveToAccount(lang: LanguageCode) {
    this.http.put(`${API_BASE_URL}/me/preferences`, { language: lang }).subscribe({ error: () => { /* keep local choice */ } });
  }

  private applyLanguage(lang: LanguageCode) {
    this.currentLanguage.set(lang);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = 'ltr';
    }
  }

  getLanguage(): LanguageCode {
    return this.currentLanguage();
  }

  getLanguageSignal() {
    return this.currentLanguage;
  }

  translate(key: keyof typeof ENGLISH_TRANSLATIONS | string, params?: Record<string, string | number>): string {
    const lang = this.currentLanguage();
    let text = this.translations[lang][key as string] ?? this.translations.en[key as string] ?? String(key);
    if (params) {
      for (const [name, value] of Object.entries(params)) text = text.split(`{${name}}`).join(String(value));
    }
    return text;
  }

  t(key: keyof typeof ENGLISH_TRANSLATIONS | string, params?: Record<string, string | number>): string {
    return this.translate(key, params);
  }

  /** Pick the current-language value from an { en, mr, hi } object (as returned by the API). */
  pick(value: Partial<Record<LanguageCode, string>> | string | null | undefined): string {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    return value[this.currentLanguage()] ?? value.en ?? value.mr ?? value.hi ?? '';
  }

  // Get all translations for current language
  getTranslations() {
    return this.translations[this.currentLanguage()];
  }

  // Add or update a translation
  addTranslation(key: string, en: string, mr: string, hi?: string) {
    this.translations.en[key] = en;
    this.translations.mr[key] = mr;
    this.translations.hi[key] = hi ?? en;
  }
}
