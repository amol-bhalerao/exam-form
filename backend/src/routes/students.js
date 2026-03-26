import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { requireAuth } from '../auth/middleware.js';

export const studentsRouter = Router();

// Get current student profile
studentsRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const studentId = req.user?.id;
    if (!studentId) return res.status(401).json({ error: 'UNAUTHORIZED' });

    const student = await prisma.student.findUnique({
      where: { userId: studentId },
      include: {
        freshSubjects: true,
        backlogSubjects: true,
        institute: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      }
    });

    if (!student) return res.status(404).json({ error: 'STUDENT_PROFILE_NOT_FOUND' });

    return res.json({ student });
  } catch (err) {
    console.error('Get student profile error:', err);
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
    if (student.userId !== req.user?.id) return res.status(403).json({ error: 'FORBIDDEN' });

    const body = z.object({
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      middleName: z.string().optional(),
      motherName: z.string().optional(),
      email: z.string().email().optional(),
      mobile: z.string().optional(),
      dateOfBirth: z.string().optional(),
      gender: z.string().optional(),
      aadharNumber: z.string().optional(),
      rollNumber: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      pincode: z.string().optional(),
      instituteId: z.coerce.number().int().positive().optional(),
      collegeName: z.string().optional(),
      collegeBranch: z.string().optional(),
      admissionYear: z.coerce.number().int().optional(),
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
        middleName: body.middleName,
        motherName: body.motherName,
        email: body.email,
        mobile: body.mobile,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        gender: body.gender,
        aadharNumber: body.aadharNumber,
        rollNumber: body.rollNumber,
        address: body.address,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        instituteId: body.instituteId || undefined,
        collegeName: body.collegeName,
        collegeBranch: body.collegeBranch,
        admissionYear: body.admissionYear,
        stream: body.stream,
        board: body.board
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
    return res.status(500).json({ error: 'INTERNAL_ERROR', message: err.message });
  }
});
