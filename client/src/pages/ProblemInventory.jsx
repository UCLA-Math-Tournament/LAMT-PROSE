import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { Check, Star, Search, Filter, TrendingUp, BookOpen } from 'lucide-react';
import api from '../utils/api';
import Layout from '../components/Layout';

const ProblemInventory = () => {
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);

  // UCLA Brand Constants
  const UCLA_BLUE = '#2774AE';
  const UCLA_GOLD = '#FFD100';
  const DARK_NAVY = '#003B5C';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/problems');
      setProblems(res.data);
      setChartData(generateProgressData(res.data));
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const { filtered, topicCounts } = useMemo(() => {
    let result = problems.filter(p => {
      const matchesSearch = search === '' || 
        (p.id || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.latex || '').toLowerCase().includes(search.toLowerCase());
      const matchesStage = stageFilter === 'all' || (p.stage || '').toLowerCase() === stageFilter.toLowerCase();
      const matchesTopic = topicFilter === 'all' || (p.topics || []).includes(topicFilter);
      const matchesDifficulty = difficultyFilter === 'all' || parseInt(p.quality) === parseInt(difficultyFilter);
      return matchesSearch && matchesStage && matchesTopic && matchesDifficulty;
    });

    result.sort((a, b) => {
      if (sortBy === 'diff-asc') return (parseInt(a.quality) || 0) - (parseInt(b.quality) || 0);
      if (sortBy === 'diff-desc') return (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const counts = result.reduce((acc, p) => {
      const topics = p.topics && p.topics.length > 0 ? p.topics : ['Misc'];
      topics.forEach(topic => acc[topic] = (acc[topic] || 0) + 1);
      return acc;
    }, {});

    return { filtered: result, topicCounts: counts };
  }, [problems, search, stageFilter, topicFilter, difficultyFilter, sortBy]);

  const totalProblems = problems.length;
  const progressPercent = Math.min((totalProblems / 200) * 100, 100);
  const barData = Object.entries(topicCounts).map(([name, value]) => ({ name, value }));

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-ucla-gold border-t-ucla-blue rounded-full animate-spin mb-4"></div>
          <p className="text-ucla-blue dark:text-ucla-gold font-bold animate-pulse">Gathering the Pack...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {/* --- Header Section --- */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black text-ucla-blue dark:text-ucla-gold tracking-tight italic uppercase">
              Bruin <span className="text-slate-800 dark:text-white not-italic">Inventory</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Tournament Preparation Dashboard</p>
          </div>
          <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4">
             <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Current Velocity</p>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{(totalProblems / 7).toFixed(1)} problems/week</p>
             </div>
             <TrendingUp className="text-green-500" size={20} />
          </div>
        </div>

        {/* --- Top Stats Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Progress Card */}
          <div className="lg:col-span-1 bg-gradient-to-br from-ucla-blue to-[#005587] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Collection Goal</h2>
                <span className="text-2xl font-black">{totalProblems}<span className="text-ucla-gold/60">/200</span></span>
              </div>
              <div className="w-full bg-white/20 blur-[0.5px] rounded-full h-3 mb-6 overflow-hidden border border-white/10">
                <div 
                  className="bg-ucla-gold h-full shadow-[0_0_15px_rgba(255,209,0,0.5)] transition-all duration-1000" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(topicCounts).slice(0, 4).map(([topic, count]) => (
                  <div key={topic} className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/5 hover:bg-white/20 transition-colors">
                    <p className="text-[10px] font-bold uppercase opacity-70 truncate">{topic}</p>
                    <p className="text-lg font-bold">{count}</p>
                  </div>
                ))}
              </div>
            </div>
            {/* Decorative "U" background */}
            <div className="absolute -bottom-10 -right-10 text-[15rem] font-black opacity-10 select-none pointer-events-none">U</div>
          </div>

          {/* Chart Card */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-6">
            <div className="flex items-center gap-2 mb-6">
               <BookOpen className="text-ucla-blue dark:text-ucla-gold" size={18} />
               <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Growth Analytics</h3>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="colorEndorsed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={UCLA_GOLD} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={UCLA_GOLD} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                  <XAxis dataKey="date" hide />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                    itemStyle={{ padding: '2px 0' }}
                  />
                  <Line type="monotone" name="Endorsed" dataKey="Endorsed" stroke={UCLA_GOLD} strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Line type="monotone" name="Review" dataKey="Needs Review" stroke={UCLA_BLUE} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* --- Interactive Filter Bar --- */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-4 z-30 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-3 mb-8 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search by ID or Content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-ucla-blue outline-none transition-all"
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            {[
              { val: stageFilter, set: setStageFilter, options: ['All Stages', 'Idea', 'Review', 'Endorsed', 'Published'], icon: <Filter size={14}/> },
              { val: topicFilter, set: setTopicFilter, options: ['All Topics', 'Algebra', 'Geometry', 'Combinatorics', 'Number Theory'] }
            ].map((f, i) => (
              <select
                key={i}
                value={f.val}
                onChange={(e) => f.set(e.target.value)}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors outline-none"
              >
                {f.options.map(opt => <option key={opt} value={opt === 'All Stages' || opt === 'All Topics' ? 'all' : opt}>{opt}</option>)}
              </select>
            ))}
          </div>
        </div>

        {/* --- Problem Table --- */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Problem Details</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filtered.map(problem => {
                const isEndorsed = problem.stage === 'Published' || problem.endorsements >= 3;
                return (
                  <tr 
                    key={problem.id} 
                    onClick={() => navigate(`/problem/${problem.id}`)}
                    className="hover:bg-ucla-blue/[0.02] dark:hover:bg-ucla-gold/[0.02] transition-all group cursor-pointer"
                  >
                    <td className="px-6 py-6 w-32">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-2xl transition-transform group-hover:scale-110 ${
                        isEndorsed 
                        ? 'bg-green-100 dark:bg-green-500/10 text-green-600' 
                        : 'bg-ucla-gold/10 text-ucla-gold'
                      }`}>
                        {isEndorsed ? <Check size={20} strokeWidth={3} /> : <Star size={20} fill={problem.endorsements > 0 ? "currentColor" : "none"} />}
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-ucla-blue dark:text-ucla-gold font-black text-base tracking-tight">
                          {problem.id}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-md">
                          @{problem.author?.initials || '??'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-3 line-clamp-1 font-medium opacity-80">
                        {problem.latex ? problem.latex.replace(/[$#\\]/g, '').substring(0, 80) + '...' : 'No content...'}
                      </p>
                      <div className="flex gap-2">
                        {problem.quality && (
                          <span className="px-2 py-1 bg-ucla-blue/5 dark:bg-ucla-blue/20 text-ucla-blue dark:text-blue-300 text-[10px] font-black rounded-lg border border-ucla-blue/10">
                            LVL {problem.quality}
                          </span>
                        )}
                        {(problem.topics || []).map(t => (
                          <span key={t} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-lg uppercase tracking-tighter">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right">
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
                        {new Date(problem.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1 uppercase font-black">{problem.stage}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-slate-400 font-medium italic">No problems found matching those filters...</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ProblemInventory;
