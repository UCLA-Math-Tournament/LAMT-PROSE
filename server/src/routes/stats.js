import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Classify problem using new 3-stage system: Idea / Needs Review / Endorsed
const classifyProblem = (problem) => {
  const feedbacks = problem.feedbacks || [];
  const pendingNeedsReview = feedbacks.some(
    (fb) => fb.needsReview && !fb.resolved
  );
  // Needs Review: has pending unresolved feedback (-2 pts)
  if (pendingNeedsReview) {
    return { category: 'Needs Review', points: -2 };
  }
  // Endorsed: has endorsements (5 pts)
  if ((problem.endorsements || 0) >= 1) {
    return { category: 'Endorsed', points: 5 };
  }
  // Idea: base state (3 pts)
  return { category: 'Idea', points: 3 };
};

// Leaderboard
router.get('/leaderboard', authenticate, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        problems: {
          include: {
            feedbacks: true,
          },
        },
        feedbacks: {
          select: {
            id: true,
            problemId: true,
            isEndorsement: true,
            resolved: true,
            createdAt: true,
          },
        },
      },
    });

    const leaderboard = users.map((user) => {
      const badges = { endorsed: 0, idea: 0, needsReview: 0 };
      let score = 0;

      user.problems.forEach((p) => {
        const { category, points } = classifyProblem(p);
        score += points;
        if (category === 'Endorsed') badges.endorsed++;
        else if (category === 'Idea') badges.idea++;
        else if (category === 'Needs Review') badges.needsReview++;
      });

      return {
        userId: user.id,
        author: `${user.firstName} ${user.lastName}`,
        initials: user.initials,
        badges,
        score,
        totalProblems: user.problems.length,
        reviewsGiven: user.feedbacks.length,
      };
    });

    leaderboard.sort((a, b) => b.score - a.score);
    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Dashboard stats (for current user)
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const problems = await prisma.problem.findMany({
      where: { authorId: req.userId },
      include: { feedbacks: true },
    });

    const topicCounts = {};
    const stageCounts = { Idea: 0, 'Needs Review': 0, Endorsed: 0 };
    const examTypeCounts = {};
    let totalEndorsements = 0;

    problems.forEach((p) => {
      p.topics.forEach((t) => {
        topicCounts[t] = (topicCounts[t] || 0) + 1;
      });
      const status = classifyProblem(p).category;
      stageCounts[status] = (stageCounts[status] || 0) + 1;
      totalEndorsements += p.endorsements || 0;
      const et = p.examType || 'Numerical Answer';
      examTypeCounts[et] = (examTypeCounts[et] || 0) + 1;
    });

    res.json({
      totalProblems: problems.length,
      totalEndorsements,
      topicCounts,
      stageCounts,
      examTypeCounts,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Tournament progress (cumulative, for charts)
router.get('/tournament-progress', authenticate, async (req, res) => {
  try {
    const problems = await prisma.problem.findMany({
      select: { stage: true, createdAt: true, feedbacks: { select: { needsReview: true, resolved: true } }, endorsements: true },
      orderBy: { createdAt: 'asc' },
    });

    const progressByDate = {};
    problems.forEach((p) => {
      const date = new Date(p.createdAt).toISOString().split('T')[0];
      if (!progressByDate[date]) {
        progressByDate[date] = { date, idea: 0, endorsed: 0, needsReview: 0 };
      }
      const status = classifyProblem(p).category;
      if (status === 'Idea') progressByDate[date].idea++;
      else if (status === 'Endorsed') progressByDate[date].endorsed++;
      else if (status === 'Needs Review') progressByDate[date].needsReview++;
    });

    const dates = Object.keys(progressByDate).sort();
    const cumulative = [];
    let totals = { idea: 0, endorsed: 0, needsReview: 0 };
    dates.forEach((date) => {
      totals.idea += progressByDate[date].idea;
      totals.endorsed += progressByDate[date].endorsed;
      totals.needsReview += progressByDate[date].needsReview;
      cumulative.push({
        date,
        idea: totals.idea,
        endorsed: totals.endorsed,
        needsReview: totals.needsReview,
        total: totals.idea + totals.endorsed + totals.needsReview,
      });
    });
    res.json(cumulative);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tournament progress' });
  }
});

export default router;
