import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth } from '../auth/middleware.js';

export const studentsRouter = Router();

// Get current student profile
studentsRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const student = await prisma.student.findUnique({
      where: { userId },
      include: {
        institute: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        applications: true,
        previousExams: true,
        feeReimbursement: true
      }
    });

    if (!student) {
      // Student profile not yet created - return 404 with specific error
      return res.status(404).json({ error: 'STUDENT_PROFILE_MISSING', message: 'Please complete your profile first' });
    }

    return res.json({ student });
  } catch (err) {
    console.error('Get student profile error:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Update current student profile (PATCH /students/me)
studentsRouter.patch('/me', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const student = await prisma.student.findUnique({
      where: { userId },
      include: { user: true }
    });
    
    if (!student) {
      return res.status(404).json({ error: 'STUDENT_NOT_FOUND', message: 'Student profile not found' });
    }

    // Validation schema - allow both omitted and null values for optional fields
    const updateSchema = z.object({
      firstName: z.string().min(2).max(50).nullable().optional(),
      middleName: z.string().max(50).nullable().optional(),
      lastName: z.string().min(2).max(50).nullable().optional(),
      motherName: z.string().min(2).max(50).nullable().optional(),
      dob: z.string().datetime().nullable().optional(),
      gender: z.string().nullable().optional(),
      aadhaar: z.string().nullable().optional(),
      address: z.string().nullable().optional(),
      pinCode: z.string().nullable().optional(),
      mobile: z.string().regex(/^[6-9]\d{9}$/).nullable().optional(),
      streamCode: z.string().nullable().optional(),
      minorityReligionCode: z.string().nullable().optional(),
      categoryCode: z.string().nullable().optional(),
      divyangCode: z.string().nullable().optional(),
      mediumCode: z.string().nullable().optional()
    });

    const data = updateSchema.parse(req.body);
    
    const updated = await prisma.student.update({
      where: { id: student.id },
      data: {
        ...data,
        dob: data.dob ? new Date(data.dob) : undefined
      }
    });

    return res.json({ ok: true, student: updated });
  } catch (err) {
    console.error('Update student profile error:', err);
    if (err.name === 'ZodError') {
      const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
      return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
    }
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// Update student profile (PATCH)
studentsRouter.patch('/:id', requireAuth, async (req, res) => {
  try {
    const studentId = z.coerce.number().int().positive().parse(req.params.id);
    
    // Verify ownership - student can only update their own profile
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true }
    });
    
    if (!student) return res.status(404).json({ error: 'STUDENT_NOT_FOUND' });
    if (student.userId !== req.auth?.userId) return res.status(403).json({ error: 'FORBIDDEN' });

    // Comprehensive validation schema
    const body = z.object({
      // Personal Details
      firstName: z.string()
        .min(2, 'First name must be at least 2 characters')
        .max(50, 'First name must not exceed 50 characters')
        .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
        .optional(),
      
      lastName: z.string()
        .min(2, 'Last name must be at least 2 characters')
        .max(50, 'Last name must not exceed 50 characters')
        .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
        .optional(),
      
      middleName: z.string()
        .max(50, 'Middle name must not exceed 50 characters')
        .regex(/^[a-zA-Z\s'-]*$/, 'Middle name can only contain letters, spaces, hyphens, and apostrophes')
        .optional(),
      
      motherName: z.string()
        .min(2, 'Mother name must be at least 2 characters')
        .max(50, 'Mother name must not exceed 50 characters')
        .regex(/^[a-zA-Z\s'-]+$/, 'Mother name can only contain letters, spaces, hyphens, and apostrophes')
        .optional(),
      
      // Contact Information
      email: z.string()
        .email('Invalid email format')
        .max(100, 'Email must not exceed 100 characters')
        .optional(),
      
      mobile: z.string()
        .regex(/^[6-9]\d{9}$/, 'Mobile number must be 10 digits and start with 6-9')
        .optional(),
      
      // Identification
      aadharNumber: z.string()
        .regex(/^\d{12}$/, 'Aadhar number must be exactly 12 digits')
        .optional(),
      
      // Date of Birth
      dateOfBirth: z.string()
        .refine(
          (val) => {
            if (!val) return true;
            const dob = new Date(val);
            const today = new Date();
            // Check if date is valid
            if (isNaN(dob.getTime())) return false;
            // Check if date is in the future
            if (dob > today) return false;
            // Check minimum age (14 years)
            const age = today.getFullYear() - dob.getFullYear();
            const monthDiff = today.getMonth() - dob.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
              return age - 1 >= 14;
            }
            return age >= 14;
          },
          'Date of birth must be valid, not in future, and at least 14 years old'
        )
        .optional(),
      
      // Demographics
      gender: z.enum(['Male', 'Female', 'Other'], {
        errorMap: () => ({ message: 'Gender must be Male, Female, or Other' })
      }).optional(),
      
      // Address Information
      addressLineOne: z.string()
        .min(3, 'Address line 1 must be at least 3 characters')
        .max(100, 'Address line 1 must not exceed 100 characters')
        .optional(),
      
      addressLineTwo: z.string()
        .max(100, 'Address line 2 must not exceed 100 characters')
        .optional(),
      
      addressLineThree: z.string()
        .max(100, 'Address line 3 must not exceed 100 characters')
        .optional(),
      
      pincode: z.string()
        .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits')
        .optional(),
      
      district: z.string()
        .min(2, 'District must be at least 2 characters')
        .max(50, 'District must not exceed 50 characters')
        .optional(),
      
      taluka: z.string()
        .min(2, 'Taluka must be at least 2 characters')
        .max(50, 'Taluka must not exceed 50 characters')
        .optional(),
      
      village: z.string()
        .min(1, 'Village must not be empty')
        .max(50, 'Village must not exceed 50 characters')
        .optional(),
      
      revenueCircle: z.string()
        .max(50, 'Revenue circle must not exceed 50 characters')
        .optional(),
      
      // Academic Information
      streamCode: z.string().optional(),
      categoryCode: z.string().optional(),
      divyangCode: z.string().optional(),
      mediumCode: z.string().optional(),
      minorityReligionCode: z.string().optional(),
      
      // Legacy fields (keep for backwards compatibility)
      instituteId: z.coerce.number().int().positive().optional(),
      rollNumber: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      collegeName: z.string().optional(),
      collegeBranch: z.string().optional(),
      admissionYear: z.coerce.number().int().min(2000).max(new Date().getFullYear()).optional(),
      stream: z.string().optional(),
      board: z.string().optional()
    }).parse(req.body);

    // Validate instituteId if provided
    if (body.instituteId) {
      const institute = await prisma.institute.findUnique({
        where: { id: body.instituteId }
      });
      if (!institute) return res.status(404).json({ error: 'INSTITUTE_NOT_FOUND' });
    }

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        firstName: body.firstName || undefined,
        lastName: body.lastName || undefined,
        middleName: body.middleName || undefined,
        motherName: body.motherName || undefined,
        email: body.email || undefined,
        mobile: body.mobile || undefined,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        gender: body.gender || undefined,
        aadharNumber: body.aadharNumber || undefined,
        rollNumber: body.rollNumber || undefined,
        address: body.address || undefined,
        city: body.city || undefined,
        state: body.state || undefined,
        pincode: body.pincode || undefined,
        instituteId: body.instituteId || undefined,
        collegeName: body.collegeName || undefined,
        collegeBranch: body.collegeBranch || undefined,
        admissionYear: body.admissionYear || undefined,
        stream: body.stream || undefined,
        board: body.board || undefined,
        streamCode: body.streamCode || undefined,
        categoryCode: body.categoryCode || undefined,
        divyangCode: body.divyangCode || undefined,
        mediumCode: body.mediumCode || undefined,
        minorityReligionCode: body.minorityReligionCode || undefined
      },
      include: {
        institute: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return res.json({ 
      ok: true, 
      student: updatedStudent 
    });
  } catch (err) {
    console.error('Update student profile error:', err);
    
    // Return validation errors from Zod
    if (err.name === 'ZodError') {
      return res.status(422).json({
        error: 'VALIDATION_ERROR',
        issues: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      });
    }
    
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// PATCH /students/me/previous-exams - Update previous exam records
studentsRouter.patch('/me/previous-exams', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const student = await prisma.student.findUnique({
      where: { userId }
    });

    if (!student) {
      return res.status(404).json({ error: 'STUDENT_NOT_FOUND' });
    }

    // Validation schema for previous exams - coerce numbers to strings
    const updateSchema = z.object({
      sscSeatNo: z.string().nullable().optional(),
      sscMonth: z.string().nullable().optional(),
      sscYear: z.coerce.string().nullable().optional(),
      sscBoard: z.string().nullable().optional(),
      sscPercentage: z.coerce.string().nullable().optional(),
      xithSeatNo: z.string().nullable().optional(),
      xithMonth: z.string().nullable().optional(),
      xithYear: z.coerce.string().nullable().optional(),
      xithCollege: z.string().nullable().optional(),
      xithPercentage: z.coerce.string().nullable().optional()
    });

    const data = updateSchema.parse(req.body);

    // Delete existing previous exam records
    await prisma.previousExam.deleteMany({
      where: { studentId: student.id }
    });

    // Create new previous exam records if data is provided
    const createdExams = [];

    // SSC exam record
    if (data.sscSeatNo || data.sscMonth || data.sscYear || data.sscBoard || data.sscPercentage) {
      const sscExam = await prisma.previousExam.create({
        data: {
          studentId: student.id,
          examType: 'SSC',
          seatNo: data.sscSeatNo || null,
          month: data.sscMonth || null,
          year: data.sscYear ? parseInt(data.sscYear) : null,
          percentage: data.sscPercentage || null,
          boardOrCollegeName: data.sscBoard || null
        }
      });
      createdExams.push(sscExam);
    }

    // XIth exam record
    if (data.xithSeatNo || data.xithMonth || data.xithYear || data.xithCollege || data.xithPercentage) {
      const xithExam = await prisma.previousExam.create({
        data: {
          studentId: student.id,
          examType: 'XI',
          seatNo: data.xithSeatNo || null,
          month: data.xithMonth || null,
          year: data.xithYear ? parseInt(data.xithYear) : null,
          percentage: data.xithPercentage || null,
          boardOrCollegeName: data.xithCollege || null
        }
      });
      createdExams.push(xithExam);
    }

    return res.json({ 
      ok: true, 
      previousExams: createdExams,
      message: 'Previous exams saved successfully'
    });
  } catch (err) {
    console.error('Update previous exams error:', err);
    if (err.name === 'ZodError') {
      const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
      return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
    }
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// PATCH /students/me/bank-details - Update bank details
studentsRouter.patch('/me/bank-details', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const student = await prisma.student.findUnique({
      where: { userId }
    });

    if (!student) {
      return res.status(404).json({ error: 'STUDENT_NOT_FOUND' });
    }

    // Validation schema for bank details
    const updateSchema = z.object({
      accountHolder: z.string().nullable().optional(),
      accountHolderRelation: z.string().nullable().optional(),
      ifscCode: z.string().nullable().optional(),
      accountNumber: z.string().nullable().optional()
    });

    const data = updateSchema.parse(req.body);

    // Get or create fee reimbursement record
    let bankDetails = await prisma.feeReimbursement.findUnique({
      where: { studentId: student.id }
    });

    if (!bankDetails) {
      bankDetails = await prisma.feeReimbursement.create({
        data: {
          studentId: student.id,
          accountHolder: data.accountHolder || null,
          ifscCode: data.ifscCode || null,
          accountNo: data.accountNumber || null,
          revenueCircleAndVillage: null
        }
      });
    } else {
      bankDetails = await prisma.feeReimbursement.update({
        where: { id: bankDetails.id },
        data: {
          accountHolder: data.accountHolder || null,
          ifscCode: data.ifscCode || null,
          accountNo: data.accountNumber || null
        }
      });
    }

    return res.json({
      ok: true,
      bankDetails,
      message: 'Bank details saved successfully'
    });
  } catch (err) {
    console.error('Update bank details error:', err);
    if (err.name === 'ZodError') {
      const issues = Array.isArray(err.errors) ? err.errors : (err.issues || []);
      return res.status(422).json({ error: 'VALIDATION_ERROR', issues });
    }
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});

// POST: Student selects institute and stream right after Google login
studentsRouter.post('/select-institute', requireAuth, async (req, res) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const body = z.object({
      instituteId: z.coerce.number().int().positive(),
      streamCode: z.string().min(1).max(10) // e.g., 'Science', 'Arts', 'Commerce'
    }).parse(req.body);

    // Verify institute exists
    const institute = await prisma.institute.findUnique({
      where: { id: body.instituteId }
    });
    if (!institute) return res.status(404).json({ error: 'INSTITUTE_NOT_FOUND' });

    // Get the student profile for this user
    let student = await prisma.student.findUnique({
      where: { userId }
    });

    if (!student) {
      // First time - student profile doesn't exist yet, create it
      student = await prisma.student.create({
        data: {
          userId,
          instituteId: body.instituteId,
          streamCode: body.streamCode,
          firstName: '',
          lastName: ''
        }
      });
    } else {
      // Once a student profile exists, prevent changing institute and stream
      return res.status(409).json({ 
        error: 'INSTITUTE_ALREADY_SELECTED',
        message: 'Institute and Stream cannot be changed after initial selection. Please contact support if you need to change.'
      });
    }

    return res.json({
      ok: true,
      message: 'Institute and Stream selected successfully',
      student: {
        id: student.id,
        userId: student.userId,
        instituteId: student.instituteId,
        streamCode: student.streamCode,
        firstName: student.firstName,
        lastName: student.lastName
      }
    });
  } catch (err) {
    console.error('Select institute error:', err);
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});