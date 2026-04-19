-- HSC EXAM SUBJECT LIST - SQL INSERT STATEMENT
-- Insert subjects with categories (based on sheet names from HSC EXAM SUBJEC LIS.xlsx)
-- Database Table: subjects (id, name, code, category)
-- Created: April 1, 2026

-- Core Subjects - SCIENCE STREAM
INSERT IGNORE INTO subjects (code, name, category) VALUES
-- Group A1 (Physics, Chemistry, Biology, Mathematics)
('MH101', 'Physics', 'SCIENCE'),
('MH102', 'Chemistry', 'SCIENCE'),
('MH103', 'Biology', 'SCIENCE'),
('MH104', 'Mathematics', 'SCIENCE'),

-- Group A2 (Physics, Chemistry, Mathematics, Computer Science)
('MH105', 'Computer Science', 'SCIENCE'),

-- Group B (Environmental Science)
('MH106', 'Environmental Science', 'SCIENCE'),
('MH107', 'Biotechnology', 'SCIENCE'),
('MH108', 'Information Technology', 'SCIENCE');

-- Core Subjects - COMMERCE STREAM
INSERT IGNORE INTO subjects (code, name, category) VALUES
('MH201', 'Accounts', 'COMMERCE'),
('MH202', 'Economics', 'COMMERCE'),
('MH203', 'Business Studies', 'COMMERCE'),
('MH204', 'Organization of Commerce', 'COMMERCE'),
('MH205', 'Information Technology', 'COMMERCE'),
('MH206', 'Secretarial Practice', 'COMMERCE');

-- Core Subjects - ARTS STREAM
INSERT IGNORE INTO subjects (code, name, category) VALUES
('MH301', 'History', 'ARTS'),
('MH302', 'Geography', 'ARTS'),
('MH303', 'Political Science', 'ARTS'),
('MH304', 'Sociology', 'ARTS'),
('MH305', 'Psychology', 'ARTS'),
('MH306', 'Economics', 'ARTS'),
('MH307', 'Education', 'ARTS'),
('MH308', 'Philosophy', 'ARTS'),
('MH309', 'Logic', 'ARTS'),
('MH310', 'Public Administration', 'ARTS');

-- Core Subjects - VOCATIONAL STREAM
INSERT IGNORE INTO subjects (code, name, category) VALUES
('MH401', 'Beauty Culture & Cosmetology', 'HSC.VOC'),
('MH402', 'Fashion Design', 'HSC.VOC'),
('MH403', 'Hospital Management', 'HSC.VOC'),
('MH404', 'Information Technology & ITeS', 'HSC.VOC'),
('MH405', 'Retail Management', 'HSC.VOC'),
('MH406', 'Automobile Technology', 'HSC.VOC'),
('MH407', 'Food Production and Patisserie', 'HSC.VOC'),
('MH408', 'Travel and Tourism', 'HSC.VOC');

-- Common across all streams (Languages)
INSERT IGNORE INTO subjects (code, name, category) VALUES
('MHL01', 'Marathi', 'LANGUAGE'),
('MHL02', 'Hindi', 'LANGUAGE'),
('MHL03', 'English', 'LANGUAGE'),
('MHL04', 'Sanskrit', 'LANGUAGE'),
('MHL05', 'French', 'LANGUAGE'),
('MHL06', 'German', 'LANGUAGE'),
('MHL07', 'Spanish', 'LANGUAGE'),
('MHL08', 'Arabic', 'LANGUAGE');

-- Electives - SCIENCE
INSERT IGNORE INTO subjects (code, name, category) VALUES
('MHS01', 'Applied Chemistry', 'SCIENCE'),
('MHS02', 'Applied Physics', 'SCIENCE'),
('MHS03', 'Botany', 'SCIENCE'),
('MHS04', 'Zoology', 'SCIENCE'),
('MHS05', 'Geology', 'SCIENCE'),
('MHS06', 'Statistics', 'SCIENCE'),

-- Electives - COMMERCE & ARTS
('MHE01', 'Personal Development', 'ELECTIVE'),
('MHE02', 'Mass Media', 'ELECTIVE'),
('MHE03', 'Library Science', 'ELECTIVE'),
('MHE04', 'Entrepreneurship', 'ELECTIVE'),
('MHE05', 'Indian Culture', 'ELECTIVE'),
('MHE06', 'Food Nutrition & Dietetics', 'ELECTIVE');

-- Verification Query (Run this to verify the insert)
-- SELECT * FROM subjects ORDER BY category, name;
-- SELECT COUNT(*) as total_subjects FROM subjects;
-- SELECT DISTINCT category FROM subjects;
