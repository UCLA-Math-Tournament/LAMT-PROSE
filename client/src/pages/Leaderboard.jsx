import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Search, Medal } from 'lucide-react';
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
      case 'endorsed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800';
      case 'idea': return 'bg-blue-100 text-ucla-blue dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
      case 'needsReview': return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800';
      default: return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600';
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
          <div className="w-12 h-12 border-4 border-ucla-blue border-t-ucla-gold rounded-full animate-spin mb-4"></div>
          <div className="text-gray-500 dark:text-gray-400 font-medium italic">Assembling the legends...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-8 transition-colors duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-ucla-blue/10 dark:bg-[#FFD100]/10 rounded-2xl">
              <Trophy className="text-ucla-blue dark:text-[#FFD100]" size={40} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-ucla-blue dark:text-white tracking-tight">Leaderboard</h1>
              <p className="text-gray-500 dark:text-gray-400 font-medium">Recognizing our top problem contributors</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search contributors..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-ucla-blue dark:focus:ring-[#FFD100] outline-none transition-all text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-700">
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Rank</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Contributor</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Endorsed (+5)</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Idea (+3)</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Revision (-2)</th>
                  <th className="px-6 py-4 text-center text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {filtered.map((entry, index) => (
                  <tr
                    key={entry.userId}
                    onClick={() => navigate(`/users/${entry.userId}`)}
                    className="group hover:bg-ucla-blue/[0.02] dark:hover:bg-[#FFD100]/[0.02] cursor-pointer transition-all"
                  >
                    {/* Rank with special Top 3 styling */}
                    <td className="px-6 py-5">
                      {index === 0 ? (
                        <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 dark:bg-yellow-900/40 rounded-full scale-110 shadow-sm">
                          <span className="text-xl">🥇</span>
                        </div>
                      ) : index === 1 ? (
                        <div className="flex items-center justify-center w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full scale-105 shadow-sm">
                          <span className="text-xl">🥈</span>
                        </div>
                      ) : index === 2 ? (
                        <div className="flex items-center justify-center w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full shadow-sm">
                          <span className="text-xl">🥉</span>
                        </div>
                      ) : (
                        <span className="pl-4 text-gray-400 dark:text-gray-600 font-mono font-bold">{index + 1}</span>
                      )}
                    </td>

                    {/* Author Info */}
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-ucla-blue dark:group-hover:text-[#FFD100] transition-colors">{entry.author}</span>
                        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">{entry.initials}</span>
                      </div>
                    </td>

                    {/* Badges */}
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center justify-center min-w-[2.5rem] h-8 px-3 rounded-lg text-sm font-black ${getBadgeStyle('endorsed')}`}>
                        {entry.badges.endorsed || 0}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center justify-center min-w-[2.5rem] h-8 px-3 rounded-lg text-sm font-black ${getBadgeStyle('idea')}`}>
                        {entry.badges.idea || 0}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex items-center justify-center min-w-[2.5rem] h-8 px-3 rounded-lg text-sm font-black ${getBadgeStyle('needsReview')}`}>
                        {entry.badges.needsReview || 0}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="px-6 py-5 text-center">
                      <div className="text-2xl font-black text-ucla-blue dark:text-[#FFD100] drop-shadow-sm">
                        {entry.score}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20">
                <Search size={48} className="text-gray-200 dark:text-gray-700 mb-4" />
                <p className="text-gray-400 dark:text-gray-500 font-medium italic">No contributors found matching "{search}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Leaderboard;
