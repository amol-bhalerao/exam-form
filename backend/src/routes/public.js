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
    
    const exams = await prisma.exam.findMany({
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
