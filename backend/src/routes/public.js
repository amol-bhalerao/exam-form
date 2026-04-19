import { Router } from 'express';
import { prisma } from '../prisma.js';

export const publicRouter = Router();

// Get public news/events/notifications
publicRouter.get('/news', async (req, res) => {
  try {
    const news = await prisma.news?.findMany({
      where: {
        isActive: true,
        type: { not: 'internal' }
      },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        createdAt: true,
        createdBy: {
          select: { id: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    res.json({ news });
  } catch (error) {
    const errorDetails = {
      error: 'Internal server error',
      message: error.message,
      code: error.code,
      meta: error.meta,
      timestamp: new Date().toISOString()
    };
    console.error('[/api/public/news] Error:', errorDetails);
    res.status(500).json(errorDetails);
  }
});

// Get upcoming exams
publicRouter.get('/exams', async (req, res) => {
  try {
    const now = new Date();
    
    const rawExams = await prisma.exam.findMany({
      where: {
        applicationClose: {
          gte: now // Only show exams that are still accepting applications
        }
      },
      select: {
        id: true,
        name: true,
        academicYear: true,
        session: true,
        applicationOpen: true,
        applicationClose: true,
        stream: {
          select: { name: true }
        },
        _count: {
          select: { applications: true }
        }
      },
      orderBy: {
        applicationClose: 'asc'
      },
      take: 10
    });

    // Map to frontend-expected format
    const exams = rawExams.map(exam => ({
      id: exam.id,
      name: exam.name,
      class: exam.academicYear || 'HSC',
      stream: exam.stream?.name || 'General',
      board: 'Maharashtra Board',
      startDate: exam.applicationOpen,
      endDate: exam.applicationClose,
      applicationDeadline: exam.applicationClose,
      status: 'ACTIVE',
      totalApplications: exam._count.applications
    }));

    res.json({ exams });
  } catch (error) {
    const errorDetails = {
      error: 'Internal server error',
      message: error.message,
      code: error.code,
      meta: error.meta,
      timestamp: new Date().toISOString()
    };
    console.error('[/api/public/exams] Error:', errorDetails);
    res.status(500).json(errorDetails);
  }
});

// Get public statistics
publicRouter.get('/stats', async (req, res) => {
  try {
    const [totalExams, totalApplications, totalInstitutes] = await Promise.all([
      prisma.exam.count(),
      prisma.examApplication.count(),
      prisma.institute.count({
        where: {
          status: 'APPROVED'
        }
      })
    ]);

    res.json({
      totalExams,
      totalApplications,
      totalInstitutes
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify document validity by application number (used by QR scan)
publicRouter.get('/verify-document/:applicationNo', async (req, res) => {
  try {
    const applicationNo = String(req.params.applicationNo || '').trim();
    if (!applicationNo) {
      return res.status(400).json({ valid: false, error: 'APPLICATION_NO_REQUIRED' });
    }

    const app = await prisma.examApplication.findUnique({
      where: { applicationNo },
      include: {
        exam: {
          select: {
            name: true,
            session: true,
            academicYear: true
          }
        },
        institute: {
          select: {
            name: true,
            code: true,
            collegeNo: true,
            district: true
          }
        },
        student: {
          select: {
            firstName: true,
            middleName: true,
            lastName: true
          }
        },
        fees: {
          orderBy: { id: 'desc' },
          take: 1
        }
      }
    });

    if (!app) {
      return res.status(404).json({
        valid: false,
        error: 'DOCUMENT_NOT_FOUND',
        message: 'No document found for this application number.'
      });
    }

    const latestPayment = app.fees?.[0] ?? null;
    const paymentCompleted = !!latestPayment
      && !!latestPayment.receivedAt
      && new Date(latestPayment.receivedAt).getTime() > 1000
      && !String(latestPayment.method || '').toUpperCase().includes('PENDING');

    const isSubmitted = String(app.status || '').toUpperCase() === 'SUBMITTED';
    const valid = isSubmitted && paymentCompleted;

    const studentName = [app.student?.firstName, app.student?.middleName, app.student?.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    return res.json({
      valid,
      verifiedAt: new Date().toISOString(),
      document: {
        applicationId: app.id,
        applicationNo: app.applicationNo,
        status: app.status,
        candidateType: app.candidateType,
        submittedAt: app.submittedAt,
        studentName: studentName || null,
        exam: app.exam,
        institute: app.institute,
        payment: latestPayment
          ? {
              amountPaise: latestPayment.amountPaise,
              amountRupees: Number(latestPayment.amountPaise || 0) / 100,
              method: latestPayment.method,
              referenceNo: latestPayment.referenceNo,
              receivedAt: latestPayment.receivedAt,
              paymentCompleted
            }
          : null
      }
    });
  } catch (error) {
    console.error('[/api/public/verify-document/:applicationNo] Error:', error);
    return res.status(500).json({ valid: false, error: 'INTERNAL_ERROR' });
  }
});
