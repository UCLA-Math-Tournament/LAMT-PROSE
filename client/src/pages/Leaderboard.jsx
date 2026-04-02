import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Search, MessageSquare } from 'lucide-react';
import api from '../utils/api';
import Layout from '../components/Layout';

const Leaderboard = () => {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get('/stats/leaderboard');
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'endorsed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'idea': return 'bg-blue-100 text-ucla-blue dark:bg-blue-900/30 dark:text-blue-300';
      case 'needsReview': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400';
      case 'feedback': return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
      default: return 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
    }
  };

  const filtered = leaderboard.filter(entry =>
    search === '' ||
    entry.author.toLowerCase().includes(search.toLowerCase()) ||
    entry.initials.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96">
          <div className="w-10 h-10 border-4 border-ucla-blue border-t-transparent rounded-full animate-spin mb-4" />
          <div className="text-slate-500 dark:text-slate-400 text-sm">Loading leaderboard...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-3">
            <Trophy className="text-ucla-blue dark:text-[#FFD100]" size={28} />
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leaderboard</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Top problem contributors</p>
            </div>
          </div>

          <div className="relative w-full md:w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search contributors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-ucla-blue/20 focus:border-ucla-blue outline-none transition-all text-sm text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rank</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Contributor</th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Endorsed <span className="text-slate-400">(+5)</span></th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Idea <span className="text-slate-400">(+3)</span></th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Revision <span className="text-slate-400">(-2)</span></th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Feedback <span className="text-slate-400">(+0.25)</span></th>
                  <th className="px-5 py-3.5 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {filtered.map((entry, index) => (
                  <tr
                    key={entry.userId}
                    onClick={() => navigate(`/users/${entry.userId}`)}
                    className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4">
                      {index === 0 ? (
                        <span className="text-xl">🥇</span>
                      ) : index === 1 ? (
                        <span className="text-xl">🥈</span>
                      ) : index === 2 ? (
                        <span className="text-xl">🥉</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 font-mono text-sm font-semibold pl-1">{index + 1}</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-ucla-blue dark:group-hover:text-[#FFD100] transition-colors text-sm">{entry.author}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{entry.initials}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center justify-center min-w-[2rem] h-7 px-2.5 rounded-md text-sm font-semibold tabular-nums ${getBadgeStyle('endorsed')}`}>
                        {entry.badges.endorsed || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center justify-center min-w-[2rem] h-7 px-2.5 rounded-md text-sm font-semibold tabular-nums ${getBadgeStyle('idea')}`}>
                        {entry.badges.idea || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center justify-center min-w-[2rem] h-7 px-2.5 rounded-md text-sm font-semibold tabular-nums ${getBadgeStyle('needsReview')}`}>
                        {entry.badges.needsReview || 0}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`inline-flex items-center justify-center gap-1 min-w-[2rem] h-7 px-2.5 rounded-md text-sm font-semibold tabular-nums ${getBadgeStyle('feedback')}`}>
                        <MessageSquare size={11} />
                        {entry.reviewsGiven || 0}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span className="text-lg font-bold text-ucla-blue dark:text-[#FFD100] tabular-nums">
                        {entry.score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <Search size={36} className="text-slate-200 dark:text-slate-700 mb-3" />
                <p className="text-slate-400 dark:text-slate-500 text-sm">No contributors found matching "{search}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Leaderboard;
