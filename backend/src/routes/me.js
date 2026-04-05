import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { requireAuth } from '../auth/middleware.js';
import { prisma } from '../prisma.js';

export const meRouter = Router();

meRouter.get('/', requireAuth, async (req, res) => {
  const userId = req.auth.userId;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true, institute: true }
  });
  if (!user) return res.status(404).json({ error: 'NOT_FOUND' });

  // Get student profile if STUDENT role
  let student = null;
  if (user.role.name === 'STUDENT') {
    student = await prisma.student.findUnique({
      where: { userId: userId },
      include: { 
        institute: true,
        previousExams: true,
        feeReimbursement: true
      }
    });
  }

  return res.json({
    user: {
      userId: user.id,
      username: user.username,
      role: user.role.name,
      // For students, use instituteId from Student table; for others, use from User table
      instituteId: user.role.name === 'STUDENT' ? (student?.instituteId ?? null) : user.instituteId,
      email: user.email,
      mobile: user.mobile,
      status: user.status,
      institute: user.role.name === 'STUDENT' 
        ? (student?.institute ? { id: student.institute.id, name: student.institute.name, status: student.institute.status } : null)
        : (user.institute ? { id: user.institute.id, name: user.institute.name, status: user.institute.status } : null)
    },
    student: student ? {
      id: student.id,
      userId: student.userId,
      instituteId: student.instituteId,
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName,
      motherName: student.motherName,
      dob: student.dob,
      gender: student.gender,
      aadhaar: student.aadhaar,
      apaarId: student.apaarId,
      email: user.email,
      address: student.address,
      district: student.district,
      taluka: student.taluka,
      village: student.village,
      pinCode: student.pinCode,
      mobile: student.mobile || user.mobile,
      streamCode: student.streamCode,
      minorityReligionCode: student.minorityReligionCode,
      categoryCode: student.categoryCode,
      divyangCode: student.divyangCode,
      mediumCode: student.mediumCode,
      previousExams: student.previousExams,
      bankDetails: student.feeReimbursement
        ? {
            id: student.feeReimbursement.id,
            accountHolder: student.feeReimbursement.accountHolder,
            accountHolderRelation: student.feeReimbursement.accountHolderRelation,
            ifscCode: student.feeReimbursement.ifscCode,
            accountNo: student.feeReimbursement.accountNo,
            accountNumber: student.feeReimbursement.accountNo
          }
        : null
    } : null
  });
});

meRouter.put('/', requireAuth, async (req, res) => {
  const userId = req.auth.userId;
  const body = req.body;
  const { username, password, email, mobile } = body;
  const data = {};
  if (username) {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing && existing.id !== userId) return res.status(409).json({ error: 'USERNAME_TAKEN' });
    data.username = username;
  }
  if (password) {
    data.passwordHash = await bcrypt.hash(password, 10);
  }
  if (email) data.email = email;
  if (mobile) data.mobile = mobile;
  if (Object.keys(data).length === 0) return res.status(400).json({ error: 'NO_CHANGES' });
  const updated = await prisma.user.update({ where: { id: userId }, data });
  return res.json({ user: { id: updated.id, username: updated.username, email: updated.email, mobile: updated.mobile, status: updated.status } });
});
