import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth.js';
const router = express.Router();
const prisma = new PrismaClient();

// Classify problem using full stage system
const classifyProblem = (problem) => {
  const feedbacks = problem.feedbacks || [];
  const pendingNeedsReview = feedbacks.some(
    (fb) => (fb.needsReview || (!fb.isEndorsement && !fb.resolved)) && !fb.resolved
  );
  // Needs Review: has pending unresolved feedback (-2 pts)
  if (pendingNeedsReview) {
    return { category: 'needsReview', points: -2 };
  }
  // Stage-based classification
  const stage = problem.stage || 'Idea';
  if (stage === 'On Test') return { category: 'onTest', points: 10 };
  if (stage === 'Published' || stage === 'Live/Ready for Review') return { category: 'approved', points: 8 };
  if ((problem.endorsements || 0) >= 1 || stage === 'Endorsed') return { category: 'endorsed', points: 5 };
  if (stage === 'Review') return { category: 'idea', points: 3 };
  return { category: 'idea', points: 3 };
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
      const badges = { onTest: 0, approved: 0, endorsed: 0, idea: 0, needsReview: 0 };
      let score = 0;
      user.problems.forEach((p) => {
        const { category, points } = classifyProblem(p);
        score += points;
        badges[category] = (badges[category] || 0) + 1;
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
    const stageCounts = { Idea: 0, 'Needs Review': 0, Endorsed: 0, 'On Test': 0, Approved: 0 };
    const examTypeCounts = {};
    let totalEndorsements = 0;
    problems.forEach((p) => {
      p.topics.forEach((t) => {
        topicCounts[t] = (topicCounts[t] || 0) + 1;
      });
      const { category } = classifyProblem(p);
      if (category === 'needsReview') stageCounts['Needs Review'] = (stageCounts['Needs Review'] || 0) + 1;
      else if (category === 'onTest') stageCounts['On Test'] = (stageCounts['On Test'] || 0) + 1;
      else if (category === 'approved') stageCounts['Approved'] = (stageCounts['Approved'] || 0) + 1;
      else if (category === 'endorsed') stageCounts['Endorsed'] = (stageCounts['Endorsed'] || 0) + 1;
      else stageCounts['Idea'] = (stageCounts['Idea'] || 0) + 1;
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
      select: {
        stage: true,
        createdAt: true,
        feedbacks: { select: { needsReview: true, resolved: true, isEndorsement: true } },
        endorsements: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    const progressByDate = {};
    problems.forEach((p) => {
      const date = new Date(p.createdAt).toISOString().split('T')[0];
      if (!progressByDate[date]) {
        progressByDate[date] = { date, idea: 0, endorsed: 0, needsReview: 0, count: 0 };
      }
      const { category } = classifyProblem(p);
      progressByDate[date].count++;
      if (category === 'needsReview') progressByDate[date].needsReview++;
      else if (category === 'endorsed' || category === 'onTest' || category === 'approved') progressByDate[date].endorsed++;
      else progressByDate[date].idea++;
    });
    const dates = Object.keys(progressByDate).sort();
    const cumulative = [];
    let totals = { idea: 0, endorsed: 0, needsReview: 0, count: 0 };
    dates.forEach((date) => {
      totals.idea += progressByDate[date].idea;
      totals.endorsed += progressByDate[date].endorsed;
      totals.needsReview += progressByDate[date].needsReview;
      totals.count += progressByDate[date].count;
      cumulative.push({
        date,
        idea: totals.idea,
        endorsed: totals.endorsed,
        needsReview: totals.needsReview,
        count: totals.count,
      });
    });
    res.json(cumulative);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tournament progress' });
  }
});

export default router;
