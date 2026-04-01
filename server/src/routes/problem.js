import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();
const prisma = new PrismaClient();

const ADMIN_EMAILS = [
  'arpituppal@ucla.edu',
  'kennethren271@ucla.edu',
  'brookswang@ucla.edu',
  'zhangv29@ucla.edu',
  'tomwu@g.ucla.edu',
];

// Consolidated 3-stage system
const VALID_STAGES = ['Idea', 'Needs Review', 'Endorsed'];

// Compute display status: unresolved feedback > endorsed > stage
function computeDisplayStatus(problem) {
  const hasUnresolvedFeedback = problem.feedbacks?.some(
    (f) => !f.resolved && !f.isEndorsement
  );
  if (hasUnresolvedFeedback) return 'Needs Review';
  if (problem.endorsements > 0) return 'Endorsed';
  return problem.stage || 'Idea';
}

// Atomically assign the next available problem ID (always max+1, never recycles gaps)
async function assignProblemId(userInitials) {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.problem.findMany({
      select: { id: true },
      where: { id: { startsWith: userInitials } },
    });
    const nums = existing
      .map((p) => parseInt(p.id.slice(userInitials.length)))
      .filter((n) => !isNaN(n));
    const maxNum = nums.length > 0 ? Math.max(...nums) : 0;
    const newId = `${userInitials}${String(maxNum + 1).padStart(4, '0')}`;
    return newId;
  });
}

// Create problem
router.post('/', authenticate, async (req, res) => {
  try {
    const { latex, topics, quality, solution, answer, notes, examType } = req.body;
    if (!latex || !topics || topics.length === 0 || !quality) {
      return res.status(400).json({ error: 'Missing required fields: latex, topics, quality' });
    }
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const problemId = await assignProblemId(user.initials);
    const problem = await prisma.problem.create({
      data: {
        id: problemId,
        authorId: req.userId,
        latex,
        solution: solution || '',
        answer: answer || '',
        notes: notes || '',
        topics,
        quality,
        stage: 'Idea',
        examType: examType || 'Numerical Answer',
      },
      include: {
        author: { select: { firstName: true, lastName: true, initials: true } },
      },
    });
    res.json(problem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create problem', details: error.message });
  }
});

// Get all problems
router.get('/', authenticate, async (req, res) => {
  try {
    const { stage, topic, author, search, reviewable } = req.query;
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isAdmin: true, email: true },
    });
    const isAdmin = currentUser?.isAdmin || ADMIN_EMAILS.includes(currentUser?.email);
    const where = {};
    if (reviewable === 'true') {
      where.authorId = { not: req.userId };
    } else {
      if (stage && stage !== 'all') where.stage = stage;
      if (author) where.authorId = author;
    }
    if (topic) where.topics = { has: topic };
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { latex: { contains: search, mode: 'insensitive' } },
      ];
    }
    const problems = await prisma.problem.findMany({
      where,
      include: {
        author: { select: { firstName: true, lastName: true, initials: true } },
        feedbacks: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    const result = problems.map((p) => {
      const pData = { ...p };
      // FIX: use String() coercion to avoid int vs string mismatch from JWT
      const isAuthor = String(p.authorId) === String(req.userId);
      if (!isAdmin) delete pData.answer;
      if (!isAdmin && !isAuthor) {
        delete pData.solution;
      }
      pData._displayStatus = computeDisplayStatus(p);
      pData._isAdmin = isAdmin;
      pData._isAuthor = isAuthor;
      pData._userId = req.userId;
      return pData;
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch problems', details: error.message });
  }
});

// Get my problems
router.get('/my', authenticate, async (req, res) => {
  try {
    const problems = await prisma.problem.findMany({
      where: { authorId: req.userId },
      include: { feedbacks: true },
      orderBy: { createdAt: 'desc' },
    });
    const result = problems.map((p) => ({
      ...p,
      _displayStatus: computeDisplayStatus(p),
      _isAuthor: true,
      _userId: req.userId,
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch problems', details: error.message });
  }
});

// Get specific problem
router.get('/:id', authenticate, async (req, res) => {
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isAdmin: true, email: true },
    });
    const problem = await prisma.problem.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { firstName: true, lastName: true, initials: true } },
        feedbacks: {
          include: { user: { select: { firstName: true, lastName: true, id: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!problem) return res.status(404).json({ error: 'Problem not found' });
    // FIX: String() coercion prevents int vs string JWT mismatch
    const isAuthor = String(problem.authorId) === String(req.userId);
    const isAdmin = currentUser?.isAdmin || ADMIN_EMAILS.includes(currentUser?.email);
    const result = { ...problem };
    if (!isAdmin && !isAuthor) delete result.answer;
    result._isAuthor = isAuthor;
    result._isAdmin = isAdmin;
    result._displayStatus = computeDisplayStatus(problem);
    result._userId = req.userId;
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch problem', details: error.message });
  }
});

// Update problem
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { latex, topics, quality, stage, solution, answer, notes, examType } = req.body;
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isAdmin: true, email: true },
    });
    const existing = await prisma.problem.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Problem not found' });
    // FIX: String() coercion
    const isAuthor = String(existing.authorId) === String(req.userId);
    const isAdmin = currentUser?.isAdmin || ADMIN_EMAILS.includes(currentUser?.email);
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (stage !== undefined && !VALID_STAGES.includes(stage)) {
      return res.status(400).json({ error: `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}` });
    }
    const updateData = {};
    if (latex !== undefined) updateData.latex = latex;
    if (solution !== undefined) updateData.solution = solution;
    if (topics !== undefined) updateData.topics = topics;
    if (quality !== undefined) updateData.quality = quality;
    if (stage !== undefined) updateData.stage = stage;
    if (notes !== undefined) updateData.notes = notes;
    if (answer !== undefined) updateData.answer = answer;
    if (examType !== undefined) updateData.examType = examType;
    const isContentEdit =
      (latex !== undefined && latex !== existing.latex) ||
      (solution !== undefined && solution !== existing.solution) ||
      (answer !== undefined && answer !== existing.answer) ||
      (topics !== undefined && JSON.stringify(topics) !== JSON.stringify(existing.topics));
    if (isContentEdit) updateData.endorsements = 0;
    const problem = await prisma.problem.update({
      where: { id: req.params.id },
      data: updateData,
      include: { author: { select: { firstName: true, lastName: true, initials: true } } },
    });
    res.json(problem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update problem', details: error.message });
  }
});

// Delete problem
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { isAdmin: true, email: true },
    });
    const existing = await prisma.problem.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Problem not found' });
    const isAdmin = currentUser?.isAdmin || ADMIN_EMAILS.includes(currentUser?.email);
    // FIX: String() coercion
    if (String(existing.authorId) !== String(req.userId) && !isAdmin) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await prisma.feedback.deleteMany({ where: { problemId: req.params.id } });
    await prisma.problem.delete({ where: { id: req.params.id } });
    res.json({ message: 'Problem deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete problem', details: error.message });
  }
});

export default router;
