/**
 * HSC (Std XI & XII) subject scheme — Government of Maharashtra GR
 * संकीर्ण २०१९/प्र.क.(२४३/१९)/एसडी-४, dated 08 August 2019, Annexure A/B/C.
 *
 * The scheme is keyed by the official board subject codes (the same codes
 * used in "HSC EXAM SUBJEC LIS.xlsx" and already used by the application:
 * 1 = English, 30 = Health & Physical Education, 31 = EVS & Jal Suraksha).
 * Keeping it keyed by code (not DB ids) makes validation independent of the
 * database contents and safe to run against any environment.
 *
 * Pure module: no database or framework imports, so it can be unit tested
 * directly with `node --test`.
 */

export const GR_REFERENCE = 'GR SANKIRN-2019/PR.KR.(243/19)/SD-4 dated 08-08-2019';

// ---------------------------------------------------------------------------
// Subject catalogue
// kind:
//   COMPULSORY  – Group A compulsory (English, EVS & Jal Suraksha, HPE)
//   MIL         – Modern Indian Language and Literature
//   MFL         – Modern Foreign Language and Literature
//   CLASSICAL   – Classical Language and Literature
//   IT          – Information Technology (stream specific code)
//   BIFOCAL     – Bifocal vocational subject (Paper I in Group A + Paper II in Group B)
//   VOCATIONAL  – HSC Vocational (MCVC) optional subject (three papers)
//   FOUNDATION  – Foundation Course of MCVC
//   ELECTIVE    – Group B / Group C academic subject
// theory/internal: Annexure B marks split (written / practical-oral-internal).
// graded: marks are converted into a grade (EVS, HPE) — Annexure C.
// ---------------------------------------------------------------------------

const S = (code, kind, en, mr, hi, extra = {}) => ({ code, kind, name: { en, mr, hi }, ...extra });

export const SUBJECT_CATALOGUE = [
  // Group A compulsory
  S('1', 'COMPULSORY', 'English Language and Literature', 'इंग्रजी भाषा व साहित्य', 'अंग्रेज़ी भाषा एवं साहित्य', { theory: 80, internal: 20 }),
  S('31', 'COMPULSORY', 'Jal Suraksha and Environmental Education', 'जलसुरक्षा व पर्यावरण शिक्षण', 'जल सुरक्षा एवं पर्यावरण शिक्षा', { theory: 30, internal: 20, graded: true }),
  S('30', 'COMPULSORY', 'Health and Physical Education', 'आरोग्य व शारीरिक शिक्षण', 'स्वास्थ्य एवं शारीरिक शिक्षा', { theory: 25, internal: 25, graded: true }),

  // Modern Indian Languages
  S('2', 'MIL', 'Marathi', 'मराठी', 'मराठी', { theory: 80, internal: 20 }),
  S('3', 'MIL', 'Gujarati', 'गुजराती', 'गुजराती', { theory: 80, internal: 20 }),
  S('4', 'MIL', 'Hindi', 'हिंदी', 'हिंदी', { theory: 80, internal: 20 }),
  S('5', 'MIL', 'Urdu', 'उर्दू', 'उर्दू', { theory: 80, internal: 20 }),
  S('6', 'MIL', 'Kannada', 'कन्नड', 'कन्नड़', { theory: 80, internal: 20 }),
  S('7', 'MIL', 'Sindhi', 'सिंधी', 'सिंधी', { theory: 80, internal: 20 }),
  S('8', 'MIL', 'Malayalam', 'मल्याळम', 'मलयालम', { theory: 80, internal: 20 }),
  S('9', 'MIL', 'Tamil', 'तमिळ', 'तमिल', { theory: 80, internal: 20 }),
  S('10', 'MIL', 'Telugu', 'तेलुगु', 'तेलुगु', { theory: 80, internal: 20 }),
  S('11', 'MIL', 'Punjabi', 'पंजाबी', 'पंजाबी', { theory: 80, internal: 20 }),
  S('12', 'MIL', 'Bengali', 'बंगाली', 'बंगाली', { theory: 80, internal: 20 }),

  // Modern Foreign Languages
  S('13', 'MFL', 'French', 'फ्रेंच', 'फ़्रेंच', { theory: 80, internal: 20 }),
  S('14', 'MFL', 'German', 'जर्मन', 'जर्मन', { theory: 80, internal: 20 }),
  S('20', 'MFL', 'Russian', 'रशियन', 'रूसी', { theory: 80, internal: 20 }),
  S('21', 'MFL', 'Japanese', 'जपानी', 'जापानी', { theory: 80, internal: 20 }),
  S('25', 'MFL', 'Spanish', 'स्पॅनिश', 'स्पेनिश', { theory: 80, internal: 20 }),
  S('26', 'MFL', 'Chinese', 'चिनी', 'चीनी', { theory: 80, internal: 20 }),

  // Classical Languages
  S('33', 'CLASSICAL', 'Sanskrit', 'संस्कृत', 'संस्कृत', { theory: 80, internal: 20 }),
  S('35', 'CLASSICAL', 'Pali', 'पाली', 'पाली', { theory: 80, internal: 20 }),
  S('16', 'CLASSICAL', 'Ardhamagadhi', 'अर्धमागधी', 'अर्धमागधी', { theory: 80, internal: 20 }),
  S('27', 'CLASSICAL', 'Maharashtri Prakrit', 'महाराष्ट्री प्राकृत', 'महाराष्ट्री प्राकृत', { theory: 80, internal: 20 }),
  S('36', 'CLASSICAL', 'Arabic', 'अरेबिक', 'अरबी', { theory: 80, internal: 20 }),
  S('37', 'CLASSICAL', 'Persian', 'पर्शियन', 'फ़ारसी', { theory: 80, internal: 20 }),
  S('87', 'CLASSICAL', 'Avesta Pahlavi', 'अवेस्ता पहलवी', 'अवेस्ता पहलवी', { theory: 80, internal: 20 }),

  // Information Technology (stream specific board codes)
  S('97', 'IT', 'Information Technology (Science)', 'माहिती तंत्रज्ञान (विज्ञान)', 'सूचना प्रौद्योगिकी (विज्ञान)', { theory: 80, internal: 20 }),
  S('98', 'IT', 'Information Technology (Arts)', 'माहिती तंत्रज्ञान (कला)', 'सूचना प्रौद्योगिकी (कला)', { theory: 80, internal: 20 }),
  S('99', 'IT', 'Information Technology (Commerce)', 'माहिती तंत्रज्ञान (वाणिज्य)', 'सूचना प्रौद्योगिकी (वाणिज्य)', { theory: 80, internal: 20 }),

  // Academic electives (Group B / C)
  S('38', 'ELECTIVE', 'History', 'इतिहास', 'इतिहास', { theory: 80, internal: 20 }),
  S('39', 'ELECTIVE', 'Geography', 'भूगोल', 'भूगोल', { theory: 80, internal: 20 }),
  S('40', 'ELECTIVE', 'Mathematics and Statistics (Arts and Science)', 'गणित आणि संख्याशास्त्र (कला आणि विज्ञान)', 'गणित एवं सांख्यिकी (कला एवं विज्ञान)', { theory: 80, internal: 20 }),
  S('41', 'ELECTIVE', 'Geology', 'भूशास्त्र', 'भूविज्ञान', { theory: 70, internal: 30 }),
  S('42', 'ELECTIVE', 'Political Science', 'राज्यशास्त्र', 'राजनीति विज्ञान', { theory: 80, internal: 20 }),
  S('43', 'ELECTIVE', 'Child Development', 'बाल विकास', 'बाल विकास', { theory: 70, internal: 30 }),
  S('44', 'ELECTIVE', 'Textile', 'वस्त्रशास्त्र', 'वस्त्र विज्ञान', { theory: 70, internal: 30 }),
  S('45', 'ELECTIVE', 'Sociology', 'समाजशास्त्र', 'समाजशास्त्र', { theory: 80, internal: 20 }),
  S('46', 'ELECTIVE', 'Philosophy', 'तत्त्वज्ञान', 'दर्शनशास्त्र', { theory: 80, internal: 20 }),
  S('47', 'ELECTIVE', 'Logic', 'तर्कशास्त्र', 'तर्कशास्त्र', { theory: 80, internal: 20 }),
  S('48', 'ELECTIVE', 'Psychology', 'मानसशास्त्र', 'मनोविज्ञान', { theory: 80, internal: 20 }),
  S('49', 'ELECTIVE', 'Economics', 'अर्थशास्त्र', 'अर्थशास्त्र', { theory: 80, internal: 20 }),
  S('50', 'ELECTIVE', 'Book Keeping and Accountancy', 'पुस्तपालन व लेखाकर्म', 'बहीखाता एवं लेखाकर्म', { theory: 80, internal: 20 }),
  S('51', 'ELECTIVE', 'Organisation of Commerce and Management', 'वाणिज्य संघटन आणि व्यवस्थापन', 'वाणिज्य संगठन एवं प्रबंधन', { theory: 80, internal: 20 }),
  S('52', 'ELECTIVE', 'Secretarial Practice', 'चिटणीसाची कार्यपद्धती', 'सचिवीय पद्धति', { theory: 80, internal: 20 }),
  S('53', 'ELECTIVE', 'Co-operation', 'सहकार', 'सहकारिता', { theory: 80, internal: 20 }),
  S('54', 'ELECTIVE', 'Physics', 'भौतिकशास्त्र', 'भौतिकी', { theory: 70, internal: 30 }),
  S('55', 'ELECTIVE', 'Chemistry', 'रसायनशास्त्र', 'रसायन विज्ञान', { theory: 70, internal: 30 }),
  S('56', 'ELECTIVE', 'Biology', 'जीवशास्त्र', 'जीव विज्ञान', { theory: 70, internal: 30 }),
  S('60', 'ELECTIVE', 'History of Art and Appreciation', 'कलेचा इतिहास आणि रसग्रहण', 'कला का इतिहास एवं रसास्वादन', { theory: 50, internal: 50 }),
  S('61', 'ELECTIVE', 'Home Management', 'गृह व्यवस्थापन', 'गृह प्रबंधन', { theory: 70, internal: 30 }),
  S('62', 'ELECTIVE', 'Food Science and Technology', 'अन्नविज्ञान व तंत्रज्ञान', 'खाद्य विज्ञान एवं प्रौद्योगिकी', { theory: 70, internal: 30 }),
  S('65', 'ELECTIVE', 'History and Development of Indian Music', 'भारतीय संगीताचा इतिहास व विकास', 'भारतीय संगीत का इतिहास एवं विकास', { theory: 50, internal: 50 }),
  S('75', 'ELECTIVE', 'Agricultural Science and Technology', 'कृषीविज्ञान आणि तंत्रज्ञान', 'कृषि विज्ञान एवं प्रौद्योगिकी', { theory: 70, internal: 30 }),
  S('76', 'ELECTIVE', 'Animal Science and Technology', 'पशुविज्ञान आणि तंत्रज्ञान', 'पशु विज्ञान एवं प्रौद्योगिकी', { theory: 70, internal: 30 }),
  S('77', 'ELECTIVE', 'Defence Studies', 'संरक्षणशास्त्र', 'रक्षा अध्ययन', { theory: 80, internal: 20 }),
  S('78', 'ELECTIVE', 'Education', 'शिक्षणशास्त्र', 'शिक्षाशास्त्र', { theory: 80, internal: 20 }),
  S('88', 'ELECTIVE', 'Mathematics and Statistics (Commerce)', 'गणित आणि संख्याशास्त्र (वाणिज्य)', 'गणित एवं सांख्यिकी (वाणिज्य)', { theory: 80, internal: 20 }),

  // MCVC foundation course
  S('90', 'FOUNDATION', 'Foundation Course (MCVC)', 'पायाभूत अभ्यासक्रम (MCVC)', 'आधार पाठ्यक्रम (MCVC)'),

  // Bifocal subjects (Paper I + Paper II)
  S('A1', 'BIFOCAL', 'Electrical Maintenance', 'विद्युत देखभाल', 'विद्युत रखरखाव', { streams: ['SCIENCE'] }),
  S('A2', 'BIFOCAL', 'Mechanical Maintenance', 'यांत्रिक देखभाल', 'यांत्रिक रखरखाव', { streams: ['SCIENCE'] }),
  S('A3', 'BIFOCAL', 'Scooter and Motorcycle Servicing', 'स्कूटर व मोटारसायकल सर्व्हिसिंग', 'स्कूटर एवं मोटरसाइकिल सर्विसिंग', { streams: ['SCIENCE'] }),
  S('A4', 'BIFOCAL', 'General Civil Engineering', 'सामान्य स्थापत्य अभियांत्रिकी', 'सामान्य सिविल इंजीनियरिंग', { streams: ['SCIENCE'] }),
  S('A5', 'BIFOCAL', 'Banking', 'बँकिंग', 'बैंकिंग', { streams: ['COMMERCE'] }),
  S('A7', 'BIFOCAL', 'Office Management', 'कार्यालय व्यवस्थापन', 'कार्यालय प्रबंधन', { streams: ['COMMERCE'] }),
  S('A8', 'BIFOCAL', 'Marketing and Salesmanship', 'विपणन व विक्रयकला', 'विपणन एवं विक्रय कला', { streams: ['COMMERCE'] }),
  S('A9', 'BIFOCAL', 'Small Industries and Self-employment', 'लघुउद्योग व स्वयंरोजगार', 'लघु उद्योग एवं स्वरोज़गार', { streams: ['COMMERCE'] }),
  S('B2', 'BIFOCAL', 'Animal Science and Dairying', 'पशुविज्ञान व दुग्धव्यवसाय', 'पशु विज्ञान एवं डेयरी', { streams: ['SCIENCE'] }),
  S('B4', 'BIFOCAL', 'Crop Science', 'पीकशास्त्र', 'फसल विज्ञान', { streams: ['SCIENCE'] }),
  S('B5', 'BIFOCAL', 'Horticulture', 'उद्यानविद्या', 'बागवानी', { streams: ['SCIENCE'] }),
  S('B9', 'BIFOCAL', 'Fish Processing Technology', 'मत्स्य प्रक्रिया तंत्रज्ञान', 'मत्स्य प्रसंस्करण प्रौद्योगिकी', { streams: ['SCIENCE'] }),
  S('C1', 'BIFOCAL', 'Fresh Water Fish Culture', 'गोड्या पाण्यातील मत्स्यसंवर्धन', 'मीठे पानी में मत्स्य पालन', { streams: ['SCIENCE'] }),
  S('C2', 'BIFOCAL', 'Electronics', 'इलेक्ट्रॉनिक्स', 'इलेक्ट्रॉनिक्स', { streams: ['SCIENCE'] }),
  S('D9', 'BIFOCAL', 'Computer Science', 'संगणकशास्त्र', 'कंप्यूटर विज्ञान', { streams: ['SCIENCE'] }),

  // HSC Vocational (MCVC) optional subjects — three papers each
  S('EA/EB/EC', 'VOCATIONAL', 'Electronics Technology', 'इलेक्ट्रॉनिक्स तंत्रज्ञान', 'इलेक्ट्रॉनिक्स प्रौद्योगिकी'),
  S('FA/FB/FC', 'VOCATIONAL', 'Electrical Technology', 'विद्युत तंत्रज्ञान', 'विद्युत प्रौद्योगिकी'),
  S('GA/GB/GC', 'VOCATIONAL', 'Automobile Technology', 'ऑटोमोबाईल तंत्रज्ञान', 'ऑटोमोबाइल प्रौद्योगिकी'),
  S('HA/HB/HC', 'VOCATIONAL', 'Construction Technology', 'बांधकाम तंत्रज्ञान', 'निर्माण प्रौद्योगिकी'),
  S('IA/IB/IC', 'VOCATIONAL', 'Mechanical Technology', 'यांत्रिक तंत्रज्ञान', 'यांत्रिक प्रौद्योगिकी'),
  S('JA/JB/JC', 'VOCATIONAL', 'Computer Technology', 'संगणक तंत्रज्ञान', 'कंप्यूटर प्रौद्योगिकी'),
  S('KA/KB/KC', 'VOCATIONAL', 'Horticulture', 'उद्यानविद्या', 'बागवानी'),
  S('LA/LB/LC', 'VOCATIONAL', 'Crop Science', 'पीकशास्त्र', 'फसल विज्ञान'),
  S('MA/MB/MC', 'VOCATIONAL', 'Animal Husbandry and Dairy', 'पशुसंवर्धन व दुग्धव्यवसाय', 'पशुपालन एवं डेयरी'),
  S('NA/NB/NC', 'VOCATIONAL', 'Fisheries Technology', 'मत्स्यव्यवसाय तंत्रज्ञान', 'मत्स्य प्रौद्योगिकी'),
  S('OA/OB/OC', 'VOCATIONAL', 'Medical Laboratory Technician', 'वैद्यकीय प्रयोगशाळा तंत्रज्ञ', 'चिकित्सा प्रयोगशाला तकनीशियन'),
  S('PA/PB/PC', 'VOCATIONAL', 'Radiology Technician', 'रेडिओलॉजी तंत्रज्ञ', 'रेडियोलॉजी तकनीशियन'),
  S('QA/QB/QC', 'VOCATIONAL', 'Child, Old Age and Health Care', 'बाल, वृद्ध व आरोग्य सेवा', 'बाल, वृद्ध एवं स्वास्थ्य देखभाल'),
  S('RA/RB/RC', 'VOCATIONAL', 'Ophthalmic Technician', 'नेत्रचिकित्सा तंत्रज्ञ', 'नेत्र तकनीशियन'),
  S('SA/SB/SC', 'VOCATIONAL', 'Food Products Technology', 'अन्नपदार्थ तंत्रज्ञान', 'खाद्य उत्पाद प्रौद्योगिकी'),
  S('TA/TB/TC', 'VOCATIONAL', 'Tourism and Hospitality Management', 'पर्यटन व आतिथ्य व्यवस्थापन', 'पर्यटन एवं आतिथ्य प्रबंधन'),
  S('UA/UB/UC', 'VOCATIONAL', 'Accounting and Office Management', 'लेखा व कार्यालय व्यवस्थापन', 'लेखा एवं कार्यालय प्रबंधन'),
  S('VA/VB/VC', 'VOCATIONAL', 'Marketing and Retail Management', 'विपणन व किरकोळ विक्री व्यवस्थापन', 'विपणन एवं खुदरा प्रबंधन'),
  S('WA/WB/WC', 'VOCATIONAL', 'Logistics and Supply Chain Management', 'लॉजिस्टिक्स व पुरवठा साखळी व्यवस्थापन', 'लॉजिस्टिक्स एवं आपूर्ति शृंखला प्रबंधन'),
  S('XA/XB/XC', 'VOCATIONAL', 'Banking, Financial Services and Insurance', 'बँकिंग, वित्तीय सेवा व विमा', 'बैंकिंग, वित्तीय सेवाएँ एवं बीमा')
];

const CATALOGUE_BY_CODE = new Map(SUBJECT_CATALOGUE.map((s) => [s.code, s]));
const LANGUAGE_KINDS = ['MIL', 'MFL', 'CLASSICAL'];
const codesOfKind = (...kinds) => SUBJECT_CATALOGUE.filter((s) => kinds.includes(s.kind)).map((s) => s.code);
const bifocalCodesFor = (stream) => SUBJECT_CATALOGUE.filter((s) => s.kind === 'BIFOCAL' && (!s.streams || s.streams.includes(stream))).map((s) => s.code);

export const COMPULSORY_CODES = ['1', '31', '30'];
export const IT_CODE_BY_STREAM = { SCIENCE: '97', ARTS: '98', COMMERCE: '99' };
export const FOUNDATION_CODE = '90';
export const BIOLOGY_CODE = '56';

// ---------------------------------------------------------------------------
// Annexure A — groups per stream
// ---------------------------------------------------------------------------
export const STREAM_SCHEME = {
  ARTS: {
    groupAChoice: [...codesOfKind(...LANGUAGE_KINDS), IT_CODE_BY_STREAM.ARTS, ...bifocalCodesFor('ARTS')],
    // Arts Group B also allows a second (different) language: MIL, MFL or Classical.
    groupB: [...codesOfKind(...LANGUAGE_KINDS), '38', '49', '42', '45', '48', '39', '46', IT_CODE_BY_STREAM.ARTS],
    groupC: ['77', '47', IT_CODE_BY_STREAM.ARTS, '78', '40', '75', '76', '44', '60', '65', '50', '43', '61', '62', '51', '53']
  },
  COMMERCE: {
    groupAChoice: [...codesOfKind(...LANGUAGE_KINDS), IT_CODE_BY_STREAM.COMMERCE, ...bifocalCodesFor('COMMERCE')],
    groupB: ['88', '49', '50', '51', '52', '53', IT_CODE_BY_STREAM.COMMERCE],
    groupC: ['77', '47', IT_CODE_BY_STREAM.COMMERCE, '38', '42', '75', '76', '46', '45', '39', '48']
  },
  SCIENCE: {
    groupAChoice: [...codesOfKind(...LANGUAGE_KINDS), IT_CODE_BY_STREAM.SCIENCE, ...bifocalCodesFor('SCIENCE')],
    groupB: ['40', '54', '55', '56', IT_CODE_BY_STREAM.SCIENCE],
    groupC: ['77', '47', IT_CODE_BY_STREAM.SCIENCE, '38', '49', '75', '76', '46', '45', '39', '48', '50', '43', '61', '62', '51', '44', '41']
  },
  VOCATIONAL: {
    groupAChoice: codesOfKind(...LANGUAGE_KINDS),
    foundation: FOUNDATION_CODE,
    optional: codesOfKind('VOCATIONAL')
  }
};

// Papers each subject contributes to the "8 subjects" rule.
export function paperCount(code) {
  const subject = CATALOGUE_BY_CODE.get(String(code));
  if (!subject) return 1;
  if (subject.kind === 'BIFOCAL') return 2; // Paper I (Group A) + Paper II (Group B)
  if (subject.kind === 'VOCATIONAL') return 3; // three papers
  return 1;
}

export function getCatalogueSubject(code) {
  return CATALOGUE_BY_CODE.get(String(code ?? '').trim()) || null;
}

/**
 * Map a stream row / code / name to a scheme key.
 * Accepts stream DB rows ({ name, shortCode }), student stream codes ('1'..'4'),
 * or plain names. Returns null for streams not covered by the GR (e.g. Technical).
 */
export function resolveSchemeStream(stream) {
  if (!stream) return null;
  const raw = typeof stream === 'object'
    ? `${stream.shortCode || ''} ${stream.name || ''}`
    : String(stream);
  const value = raw.trim().toUpperCase();
  const studentCode = { '1': 'SCIENCE', '2': 'ARTS', '3': 'COMMERCE', '4': 'VOCATIONAL' }[value];
  if (studentCode) return studentCode;
  if (/\bTEC\b|TECHNOLOGY|TECHNICAL/.test(value)) return null;
  if (/\bVOC\b|VOCATIONAL|MCVC/.test(value)) return 'VOCATIONAL';
  if (/\bSCI\b|SCIENCE/.test(value)) return 'SCIENCE';
  if (/\bCOM\b|COMMERCE/.test(value)) return 'COMMERCE';
  if (/\bART\b|ARTS/.test(value)) return 'ARTS';
  return null;
}

/** Which scheme groups a code can belong to for a stream. */
export function groupsForCode(streamKey, code) {
  const scheme = STREAM_SCHEME[streamKey];
  const c = String(code ?? '').trim();
  if (!scheme) return [];
  if (COMPULSORY_CODES.includes(c)) return ['A'];
  const groups = [];
  if (scheme.groupAChoice?.includes(c)) groups.push('A_CHOICE');
  if (scheme.groupB?.includes(c)) groups.push('B');
  if (scheme.groupC?.includes(c)) groups.push('C');
  if (scheme.foundation === c) groups.push('FOUNDATION');
  if (scheme.optional?.includes(c)) groups.push('OPTIONAL');
  return groups;
}

// ---------------------------------------------------------------------------
// Messages (English / Marathi / Hindi) so any client can show them directly.
// ---------------------------------------------------------------------------
const MESSAGES = {
  COMPULSORY_MISSING: {
    en: (p) => `Compulsory subject missing: ${p.subject.en}.`,
    mr: (p) => `अनिवार्य विषय निवडलेला नाही: ${p.subject.mr}.`,
    hi: (p) => `अनिवार्य विषय नहीं चुना गया: ${p.subject.hi}.`
  },
  GROUP_A_CHOICE_REQUIRED: {
    en: () => 'Select one subject in Group A: a Modern Indian / Foreign / Classical language, Information Technology or Bifocal Paper I.',
    mr: () => 'गट अ मधून एक विषय निवडा: आधुनिक भारतीय / परकीय / अभिजात भाषा, माहिती तंत्रज्ञान किंवा द्विलक्षी पेपर I.',
    hi: () => 'समूह अ से एक विषय चुनें: आधुनिक भारतीय / विदेशी / शास्त्रीय भाषा, सूचना प्रौद्योगिकी या द्विफोकल पेपर I.'
  },
  GROUP_A_LANGUAGE_REQUIRED: {
    en: () => 'Select one language (Modern Indian, Modern Foreign or Classical) in Group A.',
    mr: () => 'गट अ मधून एक भाषा (आधुनिक भारतीय, परकीय किंवा अभिजात) निवडा.',
    hi: () => 'समूह अ से एक भाषा (आधुनिक भारतीय, विदेशी या शास्त्रीय) चुनें.'
  },
  TOO_MANY_GROUP_A_CHOICES: {
    en: () => 'Only one language / IT / Bifocal Paper I can be taken in Group A.',
    mr: () => 'गट अ मध्ये फक्त एकच भाषा / माहिती तंत्रज्ञान / द्विलक्षी पेपर I घेता येतो.',
    hi: () => 'समूह अ में केवल एक भाषा / सूचना प्रौद्योगिकी / द्विफोकल पेपर I लिया जा सकता है.'
  },
  GROUP_B_MIN: {
    en: (p) => `Select at least ${p.min} subjects from Group B (currently ${p.actual}).`,
    mr: (p) => `गट ब मधून किमान ${p.min} विषय निवडा (सध्या ${p.actual}).`,
    hi: (p) => `समूह ब से कम से कम ${p.min} विषय चुनें (अभी ${p.actual}).`
  },
  GROUP_BC_TOTAL: {
    en: (p) => `Group B and Group C together must have exactly ${p.expected} subjects (currently ${p.actual}).`,
    mr: (p) => `गट ब व गट क मिळून नेमके ${p.expected} विषय असावेत (सध्या ${p.actual}).`,
    hi: (p) => `समूह ब और समूह क मिलाकर ठीक ${p.expected} विषय होने चाहिए (अभी ${p.actual}).`
  },
  TOTAL_SUBJECTS: {
    en: (p) => `Total subjects (papers) must be ${p.expected}; currently ${p.actual}.`,
    mr: (p) => `एकूण विषय (पेपर) ${p.expected} असावेत; सध्या ${p.actual}.`,
    hi: (p) => `कुल विषय (पेपर) ${p.expected} होने चाहिए; अभी ${p.actual}.`
  },
  ONE_BIFOCAL_ONLY: {
    en: () => 'Only one Bifocal subject can be selected.',
    mr: () => 'फक्त एकच द्विलक्षी विषय निवडता येतो.',
    hi: () => 'केवल एक द्विफोकल विषय चुना जा सकता है.'
  },
  BIFOCAL_REPLACES_BIOLOGY: {
    en: () => 'Science Bifocal Paper II is taken in place of Biology — remove Biology or the Bifocal subject.',
    mr: () => 'विज्ञान शाखेत द्विलक्षी पेपर II जीवशास्त्राऐवजी घेतला जातो — जीवशास्त्र किंवा द्विलक्षी विषय काढा.',
    hi: () => 'विज्ञान में द्विफोकल पेपर II जीव विज्ञान के स्थान पर लिया जाता है — जीव विज्ञान या द्विफोकल विषय हटाएँ.'
  },
  FOUNDATION_REQUIRED: {
    en: () => 'Foundation Course of MCVC is compulsory for HSC Vocational students.',
    mr: () => 'एचएससी व्यावसायिक (MCVC) विद्यार्थ्यांसाठी पायाभूत अभ्यासक्रम अनिवार्य आहे.',
    hi: () => 'एचएससी व्यावसायिक (MCVC) विद्यार्थियों के लिए आधार पाठ्यक्रम अनिवार्य है.'
  },
  ONE_VOCATIONAL_REQUIRED: {
    en: (p) => `Select exactly one vocational subject (three papers); currently ${p.actual}.`,
    mr: (p) => `नेमका एक व्यावसायिक विषय (तीन पेपर) निवडा; सध्या ${p.actual}.`,
    hi: (p) => `ठीक एक व्यावसायिक विषय (तीन पेपर) चुनें; अभी ${p.actual}.`
  },
  NOT_ALLOWED_FOR_STREAM: {
    en: (p) => `${p.subject.en} is not offered for this stream under the 2019 subject scheme.`,
    mr: (p) => `२०१९ विषय योजनेनुसार ${p.subject.mr} हा विषय या शाखेसाठी उपलब्ध नाही.`,
    hi: (p) => `2019 विषय योजना के अनुसार ${p.subject.hi} इस संकाय के लिए उपलब्ध नहीं है.`
  },
  UNLISTED_SUBJECT: {
    en: (p) => `Subject ${p.code} (${p.name}) is not listed in the 2019 GR scheme; the institute should confirm it.`,
    mr: (p) => `विषय ${p.code} (${p.name}) २०१९ च्या शासन निर्णयातील यादीत नाही; संस्थेने खात्री करावी.`,
    hi: (p) => `विषय ${p.code} (${p.name}) 2019 के शासन निर्णय की सूची में नहीं है; संस्था पुष्टि करे.`
  },
  DUPLICATE_SUBJECT: {
    en: (p) => `Subject ${p.code} is selected more than once.`,
    mr: (p) => `विषय ${p.code} एकापेक्षा जास्त वेळा निवडला आहे.`,
    hi: (p) => `विषय ${p.code} एक से अधिक बार चुना गया है.`
  },
  STREAM_NOT_IN_SCHEME: {
    en: () => 'This stream is not covered by the 2019 GR subject scheme; subject rules were not applied.',
    mr: () => 'ही शाखा २०१९ च्या विषय योजनेत नाही; विषय नियम लागू केले नाहीत.',
    hi: () => 'यह संकाय 2019 विषय योजना में शामिल नहीं है; विषय नियम लागू नहीं किए गए.'
  }
};

function issue(code, params = {}) {
  const tpl = MESSAGES[code];
  const subject = params.subjectCode ? getCatalogueSubject(params.subjectCode) : null;
  const p = { ...params, subject: subject?.name || { en: params.subjectCode, mr: params.subjectCode, hi: params.subjectCode } };
  return {
    code,
    params,
    message: tpl ? { en: tpl.en(p), mr: tpl.mr(p), hi: tpl.hi(p) } : { en: code, mr: code, hi: code }
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate a subject selection against the GR scheme.
 *
 * @param {object} input
 * @param {string|object} input.stream   stream row / name / student stream code
 * @param {Array<string|{code:string,name?:string}>} input.subjects selected subjects
 * @returns {{ ok: boolean, stream: string|null, errors: object[], warnings: object[],
 *             summary: { papers: number, groupA: string[], aChoice: string[], groupB: string[], groupC: string[], unlisted: string[] } }}
 */
export function validateSubjectSelection({ stream, subjects = [] }) {
  const streamKey = resolveSchemeStream(stream);
  const rows = subjects.map((s) => (typeof s === 'object' && s !== null
    ? { code: String(s.code ?? '').trim(), name: s.name || '' }
    : { code: String(s ?? '').trim(), name: '' })).filter((r) => r.code);

  const errors = [];
  const warnings = [];

  const seen = new Set();
  for (const row of rows) {
    if (seen.has(row.code)) errors.push(issue('DUPLICATE_SUBJECT', { code: row.code }));
    seen.add(row.code);
  }
  const codes = [...seen];

  const emptySummary = { papers: codes.reduce((n, c) => n + paperCount(c), 0), groupA: [], aChoice: [], groupB: [], groupC: [], unlisted: [] };
  if (!streamKey) {
    warnings.push(issue('STREAM_NOT_IN_SCHEME'));
    return { ok: errors.length === 0, stream: null, errors, warnings, summary: emptySummary };
  }

  return streamKey === 'VOCATIONAL'
    ? validateVocational(codes, rows, errors, warnings)
    : validateGeneral(streamKey, codes, rows, errors, warnings);
}

function validateVocational(codes, rows, errors, warnings) {
  const scheme = STREAM_SCHEME.VOCATIONAL;
  const summary = { papers: 0, groupA: [], aChoice: [], groupB: [], groupC: [], optional: [], foundation: [], unlisted: [] };

  for (const code of COMPULSORY_CODES) {
    if (!codes.includes(code)) errors.push(issue('COMPULSORY_MISSING', { subjectCode: code }));
    else summary.groupA.push(code);
  }

  for (const code of codes) {
    if (COMPULSORY_CODES.includes(code)) continue;
    if (scheme.groupAChoice.includes(code)) summary.aChoice.push(code);
    else if (code === scheme.foundation) summary.foundation.push(code);
    else if (scheme.optional.includes(code)) summary.optional.push(code);
    else if (getCatalogueSubject(code)) errors.push(issue('NOT_ALLOWED_FOR_STREAM', { subjectCode: code }));
    else {
      summary.unlisted.push(code);
      warnings.push(issue('UNLISTED_SUBJECT', { code, name: rows.find((r) => r.code === code)?.name || '' }));
    }
  }

  if (summary.aChoice.length === 0) errors.push(issue('GROUP_A_LANGUAGE_REQUIRED'));
  if (summary.aChoice.length > 1) errors.push(issue('TOO_MANY_GROUP_A_CHOICES'));
  if (!summary.foundation.length) errors.push(issue('FOUNDATION_REQUIRED'));
  if (summary.optional.length !== 1) errors.push(issue('ONE_VOCATIONAL_REQUIRED', { actual: summary.optional.length }));

  summary.papers = codes.reduce((n, c) => n + paperCount(c), 0);
  if (summary.papers !== 8 && !errors.some((e) => e.code === 'ONE_VOCATIONAL_REQUIRED')) {
    errors.push(issue('TOTAL_SUBJECTS', { expected: 8, actual: summary.papers }));
  }

  return { ok: errors.length === 0, stream: 'VOCATIONAL', errors, warnings, summary };
}

function validateGeneral(streamKey, codes, rows, errors, warnings) {
  const scheme = STREAM_SCHEME[streamKey];

  for (const code of COMPULSORY_CODES) {
    if (!codes.includes(code)) errors.push(issue('COMPULSORY_MISSING', { subjectCode: code }));
  }

  const optional = codes.filter((c) => !COMPULSORY_CODES.includes(c));
  const unlisted = [];
  const flexible = [];
  for (const code of optional) {
    const groups = groupsForCode(streamKey, code);
    if (groups.length) {
      flexible.push({ code, groups });
    } else if (getCatalogueSubject(code)) {
      errors.push(issue('NOT_ALLOWED_FOR_STREAM', { subjectCode: code }));
    } else {
      unlisted.push(code);
      warnings.push(issue('UNLISTED_SUBJECT', { code, name: rows.find((r) => r.code === code)?.name || '' }));
    }
  }

  const bifocals = optional.filter((c) => getCatalogueSubject(c)?.kind === 'BIFOCAL');
  if (bifocals.length > 1) errors.push(issue('ONE_BIFOCAL_ONLY'));
  if (streamKey === 'SCIENCE' && bifocals.length && codes.includes(BIOLOGY_CODE)) {
    errors.push(issue('BIFOCAL_REPLACES_BIOLOGY'));
  }

  // Find the best assignment of each optional subject to Group A-choice / B / C.
  // Bifocal: Paper I occupies the Group A choice, Paper II counts as one Group B subject.
  // Unlisted subjects are counted as Group C so totals still add up.
  const best = bestAssignment(flexible, unlisted.length);

  const groupErrors = [];
  if (best.aChoice.length === 0) groupErrors.push(issue('GROUP_A_CHOICE_REQUIRED'));
  if (best.aChoice.length > 1) groupErrors.push(issue('TOO_MANY_GROUP_A_CHOICES'));
  if (best.bCount < 3) groupErrors.push(issue('GROUP_B_MIN', { min: 3, actual: best.bCount }));
  if (best.bCount + best.cCount !== 4) groupErrors.push(issue('GROUP_BC_TOTAL', { expected: 4, actual: best.bCount + best.cCount }));
  errors.push(...groupErrors);

  const papers = codes.reduce((n, c) => n + paperCount(c), 0);
  if (papers !== 8 && !groupErrors.some((e) => e.code === 'GROUP_BC_TOTAL')) {
    errors.push(issue('TOTAL_SUBJECTS', { expected: 8, actual: papers }));
  }

  const summary = {
    papers,
    groupA: COMPULSORY_CODES.filter((c) => codes.includes(c)),
    aChoice: best.aChoice,
    groupB: best.groupB,
    groupC: [...best.groupC, ...unlisted],
    unlisted
  };
  return { ok: errors.length === 0, stream: streamKey, errors, warnings, summary };
}

function scoreAssignment(aChoice, bCount, cCount) {
  let violations = 0;
  if (aChoice.length !== 1) violations += Math.abs(aChoice.length - 1) || 1;
  if (bCount < 3) violations += 3 - bCount;
  violations += Math.abs(bCount + cCount - 4);
  return violations;
}

function bestAssignment(flexible, unlistedCount) {
  let best = null;
  const n = flexible.length;
  const choice = new Array(n);

  const evaluate = () => {
    const aChoice = [];
    const groupB = [];
    const groupC = [];
    let bCount = 0;
    let cCount = unlistedCount;
    for (let i = 0; i < n; i += 1) {
      const { code } = flexible[i];
      const group = choice[i];
      const isBifocal = getCatalogueSubject(code)?.kind === 'BIFOCAL';
      if (group === 'A_CHOICE') {
        aChoice.push(code);
        if (isBifocal) { groupB.push(code); bCount += 1; } // Paper II
      } else if (group === 'B') { groupB.push(code); bCount += 1; }
      else { groupC.push(code); cCount += 1; }
    }
    const score = scoreAssignment(aChoice, bCount, cCount);
    if (!best || score < best.score) best = { score, aChoice, groupB, groupC, bCount, cCount };
  };

  const walk = (i) => {
    if (best && best.score === 0) return;
    if (i === n) { evaluate(); return; }
    for (const g of flexible[i].groups) {
      choice[i] = g;
      walk(i + 1);
    }
  };
  walk(0);
  return best || { score: 0, aChoice: [], groupB: [], groupC: [], bCount: 0, cCount: unlistedCount };
}

/**
 * Describe the scheme for a stream in a UI-friendly way, joined with the
 * subjects actually present in the database (matched by board code).
 *
 * @param {string|object} stream
 * @param {Array<{id:number, code:string, name:string, category?:string}>} dbSubjects
 */
export function describeScheme(stream, dbSubjects = []) {
  const streamKey = resolveSchemeStream(stream);
  if (!streamKey) return { stream: null, reference: GR_REFERENCE, groups: [], rules: [] };
  const byCode = new Map(dbSubjects.map((s) => [String(s.code).trim(), s]));
  const scheme = STREAM_SCHEME[streamKey];

  const toItem = (code) => {
    const cat = getCatalogueSubject(code);
    const db = byCode.get(code);
    return {
      code,
      subjectId: db?.id ?? null,
      available: !!db,
      kind: cat?.kind ?? 'OTHER',
      name: cat?.name ?? { en: db?.name ?? code, mr: db?.name ?? code, hi: db?.name ?? code },
      theory: cat?.theory ?? null,
      internal: cat?.internal ?? null,
      graded: !!cat?.graded,
      papers: paperCount(code)
    };
  };

  const groups = [
    { key: 'A', label: { en: 'Group A — compulsory', mr: 'गट अ — अनिवार्य', hi: 'समूह अ — अनिवार्य' }, pick: { min: 3, max: 3 }, subjects: COMPULSORY_CODES.map(toItem) }
  ];

  if (streamKey === 'VOCATIONAL') {
    groups.push(
      { key: 'A_CHOICE', label: { en: 'Group A — one language', mr: 'गट अ — एक भाषा', hi: 'समूह अ — एक भाषा' }, pick: { min: 1, max: 1 }, subjects: scheme.groupAChoice.map(toItem) },
      { key: 'FOUNDATION', label: { en: 'Foundation Course of MCVC', mr: 'MCVC पायाभूत अभ्यासक्रम', hi: 'MCVC आधार पाठ्यक्रम' }, pick: { min: 1, max: 1 }, subjects: [toItem(scheme.foundation)] },
      { key: 'OPTIONAL', label: { en: 'Vocational subject (3 papers)', mr: 'व्यावसायिक विषय (३ पेपर)', hi: 'व्यावसायिक विषय (3 पेपर)' }, pick: { min: 1, max: 1 }, subjects: scheme.optional.map(toItem) }
    );
  } else {
    groups.push(
      { key: 'A_CHOICE', label: { en: 'Group A — one language / IT / Bifocal Paper I', mr: 'गट अ — एक भाषा / माहिती तंत्रज्ञान / द्विलक्षी पेपर I', hi: 'समूह अ — एक भाषा / सूचना प्रौद्योगिकी / द्विफोकल पेपर I' }, pick: { min: 1, max: 1 }, subjects: scheme.groupAChoice.map(toItem) },
      { key: 'B', label: { en: 'Group B — minimum 3', mr: 'गट ब — किमान ३', hi: 'समूह ब — न्यूनतम 3' }, pick: { min: 3, max: 4 }, subjects: scheme.groupB.map(toItem) },
      { key: 'C', label: { en: 'Group C — up to 1', mr: 'गट क — जास्तीत जास्त १', hi: 'समूह क — अधिकतम 1' }, pick: { min: 0, max: 1 }, subjects: scheme.groupC.map(toItem) }
    );
  }

  const rules = streamKey === 'VOCATIONAL'
    ? [
        { en: 'Total 8 subjects (papers).', mr: 'एकूण ८ विषय (पेपर).', hi: 'कुल 8 विषय (पेपर).' },
        { en: 'All Group A subjects are compulsory, including one language and the Foundation Course.', mr: 'गट अ मधील सर्व विषय अनिवार्य, त्यात एक भाषा व पायाभूत अभ्यासक्रम.', hi: 'समूह अ के सभी विषय अनिवार्य, जिसमें एक भाषा और आधार पाठ्यक्रम शामिल.' },
        { en: 'Take any one vocational subject; each has three papers.', mr: 'कोणताही एक व्यावसायिक विषय घ्या; प्रत्येकाचे तीन पेपर.', hi: 'कोई एक व्यावसायिक विषय लें; प्रत्येक के तीन पेपर.' }
      ]
    : [
        { en: 'Total 8 subjects.', mr: 'एकूण ८ विषय.', hi: 'कुल 8 विषय.' },
        { en: 'All Group A subjects are compulsory (English, EVS & Jal Suraksha, HPE and one language / IT / Bifocal Paper I).', mr: 'गट अ मधील सर्व विषय अनिवार्य (इंग्रजी, पर्यावरण व जलसुरक्षा, आरोग्य व शारीरिक शिक्षण आणि एक भाषा / माहिती तंत्रज्ञान / द्विलक्षी पेपर I).', hi: 'समूह अ के सभी विषय अनिवार्य (अंग्रेज़ी, पर्यावरण एवं जल सुरक्षा, स्वास्थ्य एवं शारीरिक शिक्षा और एक भाषा / सूचना प्रौद्योगिकी / द्विफोकल पेपर I).' },
        { en: 'Minimum 3 subjects from Group B, and 4 in total from Group B and Group C.', mr: 'गट ब मधून किमान ३ विषय आणि गट ब व क मिळून एकूण ४ विषय.', hi: 'समूह ब से न्यूनतम 3 विषय और समूह ब व क से कुल 4 विषय.' },
        { en: 'Information Technology may replace any subject other than English, EVS and HPE.', mr: 'इंग्रजी, पर्यावरण व आरोग्य-शारीरिक शिक्षण वगळता कोणत्याही विषयाऐवजी माहिती तंत्रज्ञान घेता येते.', hi: 'अंग्रेज़ी, पर्यावरण और स्वास्थ्य-शारीरिक शिक्षा को छोड़कर किसी भी विषय के स्थान पर सूचना प्रौद्योगिकी ली जा सकती है.' },
        { en: 'Bifocal: Paper I replaces the Group A language; Paper II replaces Biology (Science) or one Group B subject (Commerce).', mr: 'द्विलक्षी: पेपर I गट अ भाषेऐवजी; पेपर II जीवशास्त्राऐवजी (विज्ञान) किंवा गट ब मधील एका विषयाऐवजी (वाणिज्य).', hi: 'द्विफोकल: पेपर I समूह अ की भाषा के स्थान पर; पेपर II जीव विज्ञान (विज्ञान) या समूह ब के एक विषय (वाणिज्य) के स्थान पर.' }
      ];

  if (streamKey === 'ARTS') {
    rules.push({ en: 'Arts students may take two languages from Group B other than the Group A language.', mr: 'कला शाखेचे विद्यार्थी गट अ मधील भाषेव्यतिरिक्त गट ब मधून दोन भाषा घेऊ शकतात.', hi: 'कला के विद्यार्थी समूह अ की भाषा के अतिरिक्त समूह ब से दो भाषाएँ ले सकते हैं.' });
  }

  return { stream: streamKey, reference: GR_REFERENCE, groups, rules };
}

/**
 * Decide whether a subject selection may be submitted under the 2019 GR scheme.
 * mode (GR_SUBJECT_SCHEME_MODE env):
 *   strict – always block on scheme errors
 *   off    – never block
 *   auto   – (default) block only when every selected subject has a recognised
 *            board code; if the institute uses subjects outside the GR list the
 *            result is advisory so existing configurations are never locked out.
 *
 * @param {object|string} stream
 * @param {Array<{code:string,name?:string}|{subject:{code:string,name?:string}}>} subjects
 */
export function checkSubjectScheme(stream, subjects = [], mode = process.env.GR_SUBJECT_SCHEME_MODE || 'auto') {
  const normalizedMode = String(mode || 'auto').toLowerCase();
  const result = validateSubjectSelection({
    stream,
    subjects: subjects
      .map((entry) => entry?.subject || entry)
      .filter(Boolean)
      .map((subject) => ({ code: subject.code, name: subject.name }))
  });
  if (normalizedMode === 'off' || result.ok) return { block: false, result };
  if (normalizedMode === 'strict') return { block: true, result };
  return { block: (result.summary?.unlisted?.length ?? 0) === 0, result };
}
