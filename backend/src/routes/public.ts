import { Router } from 'express';
import { prisma } from '../prisma.js';

export const publicRouter = Router();

// Get public news/events/notifications
publicRouter.get('/news', async (req, res) => {
  try {
    // Sample news data - in production, this would come from a database
    const news = [
      {
        id: 1,
        title: 'HSC Examination 2024 Schedule Released',
        content: 'The Higher Secondary Certificate examination schedule for 2024 has been released. Students are advised to check the official website for detailed information.',
        createdAt: new Date().toISOString(),
        type: 'news'
      },
      {
        id: 2,
        title: 'Important Notice: Document Verification',
        content: 'All students must complete document verification process before the application deadline. Incomplete applications will not be accepted.',
        createdAt: new Date().toISOString(),
        type: 'notification'
      },
      {
        id: 3,
        title: 'Board Meeting - January 15, 2024',
        content: 'Board meeting scheduled for January 15, 2024, to discuss examination policies and procedures.',
        createdAt: new Date().toISOString(),
        type: 'event'
      }
    ];

    res.json({ news });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get upcoming exams
publicRouter.get('/exams', async (req, res) => {
  try {
    // Return sample exam data for landing page
    const exams = [
      {
        id: 1,
        name: 'HSC Science 2024',
        stream: { name: 'Science' },
        session: '2024',
        academicYear: '2023-2024',
        applicationDeadline: new Date('2024-02-15').toISOString(),
        examDate: new Date('2024-03-15').toISOString(),
        _count: { applications: 450 }
      },
      {
        id: 2,
        name: 'HSC Commerce 2024',
        stream: { name: 'Commerce' },
        session: '2024',
        academicYear: '2023-2024',
        applicationDeadline: new Date('2024-02-20').toISOString(),
        examDate: new Date('2024-03-20').toISOString(),
        _count: { applications: 380 }
      },
      {
        id: 3,
        name: 'HSC Arts 2024',
        stream: { name: 'Arts' },
        session: '2024',
        academicYear: '2023-2024',
        applicationDeadline: new Date('2024-02-25').toISOString(),
        examDate: new Date('2024-03-25').toISOString(),
        _count: { applications: 420 }
      }
    ];

    res.json({ exams });
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get public statistics
publicRouter.get('/stats', async (req, res) => {
  try {
    // Return sample statistics for landing page
    res.json({
      totalExams: 25,
      totalApplications: 1250,
      totalInstitutes: 150
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});