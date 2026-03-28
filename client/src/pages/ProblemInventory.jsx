import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { Check, Star } from 'lucide-react';
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

  useEffect(() => {
    fetchData();
  }, []);

  // Compute multi-line history data directly from the problems array
  const generateProgressData = (problemsData) => {
    if (!problemsData || problemsData.length === 0) return [];
    
    const sorted = [...problemsData].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    let ideas = 0;
    let review = 0;
    let endorsed = 0;
    
    const history = [];
    
    sorted.forEach(p => {
      const stage = (p.stage || '').toLowerCase();
      const display = (p._displayStatus || '').toLowerCase();
      
      // Categorize the problem into the 3 buckets
      if (display === 'endorsed' || stage === 'endorsed' || stage === 'published' || p.endorsements >= 3) {
        endorsed++;
      } else if (display === 'needs_review' || stage.includes('review')) {
        review++;
      } else {
        ideas++;
      }

      const dateStr = new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      const lastEntry = history[history.length - 1];
      if (lastEntry && lastEntry.date === dateStr) {
        // Update the existing day's totals
        lastEntry.Ideas = ideas;
        lastEntry['Needs Review'] = review;
        lastEntry.Endorsed = endorsed;
      } else {
        // Start a new day
        history.push({
          date: dateStr,
          Ideas: ideas,
          'Needs Review': review,
          Endorsed: endorsed,
        });
      }
    });
    
    return history;
  };

  const fetchData = async () => {
    try {
      // We only need the problems endpoint now since we compute the complex chart data ourselves
      const res = await api.get('/problems');
      setProblems(res.data);
      setChartData(generateProgressData(res.data));
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalProblems = problems.length;
  const progressPercent = Math.min((totalProblems / 200) * 100, 100);

  let filtered = problems.filter(p => {
    const matchesSearch = search === '' || 
      (p.id || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.latex || '').toLowerCase().includes(search.toLowerCase());
    
    const matchesStage = stageFilter === 'all' || 
      (p.stage || '').toLowerCase() === stageFilter.toLowerCase();
      
    const matchesTopic = topicFilter === 'all' || (p.topics || []).includes(topicFilter);
    
    const matchesDifficulty = difficultyFilter === 'all' || 
      parseInt(p.quality) === parseInt(difficultyFilter);
    
    return matchesSearch && matchesStage && matchesTopic && matchesDifficulty;
  });

  filtered = filtered.sort((a, b) => {
    if (sortBy === 'diff-asc') {
      return (parseInt(a.quality) || 0) - (parseInt(b.quality) || 0);
    }
    if (sortBy === 'diff-desc') {
      return (parseInt(b.quality) || 0) - (parseInt(a.quality) || 0);
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const topicCounts = filtered.reduce((acc, p) => {
    const topics = p.topics && p.topics.length > 0 ? p.topics : ['Uncategorized'];
    topics.forEach(topic => {
      acc[topic] = (acc[topic] || 0) + 1;
    });
    return acc;
  }, {});

  const barData = Object.entries(topicCounts).map(([name, value]) => ({ name, value }));
  const COLORS = ['#2774AE', '#FFD100', '#003B5C', '#808080'];

  const stripFormatting = (text) => {
    if (!text) return '';
    return text
      .replace(/\$[^$]+\$/g, '')
      .replace(/\$\$[^$]+\$\$/g, '')
      .replace(/[#*`]/g, '')
      .replace(/\\/g, '')
      .substring(0, 50) + (text.length > 50 ? '...' : '');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600 font-medium">Loading Inventory...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ucla-blue mb-2">Tournament Progress</h1>
        <p className="text-gray-600 mb-6">Tracking progress toward 200 problems</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-1 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Total Problems</h2>
              <span className="text-ucla-blue font-bold">{totalProblems} / 200</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
              <div 
                className="bg-ucla-blue h-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            
            <div className="mt-8 grid grid-cols-2 gap-4">
              {Object.entries(topicCounts).map(([topic, count]) => (
                <div key={topic} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase truncate">{topic}</p>
                  <p className="text-xl font-bold text-ucla-blue">{count}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-64">
              <div className="flex flex-col h-full min-w-0">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-2 shrink-0">Cumulative Growth by Stage</h3>
                <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="date" hide />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      
                      {/* Added Hover Tooltip & Interactive Legend */}
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #f0f0f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
                      
                      {/* Three separate lines for each stage */}
                      <Line type="monotone" name="Endorsed" dataKey="Endorsed" stroke="#22c55e" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                      <Line type="monotone" name="Needs Review" dataKey="Needs Review" stroke="#eab308" strokeWidth={2} dot={false} />
                      <Line type="monotone" name="Ideas" dataKey="Ideas" stroke="#94a3b8" strokeWidth={2} dot={false} />
                      
                      <ReferenceLine y={200} stroke="#cbd5e1" strokeDasharray="3 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="flex flex-col h-full min-w-0">
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 shrink-0">Topic Breakdown</h3>
                <div className="flex-1 w-full min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" hide />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #f0f0f0' }} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {barData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-4 flex flex-wrap gap-4 items-center mb-6">
          <input
            type="text"
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ucla-blue focus:border-transparent outline-none"
          />
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ucla-blue outline-none bg-gray-50"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="diff-desc">Difficulty (High-Low)</option>
            <option value="diff-asc">Difficulty (Low-High)</option>
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ucla-blue outline-none"
          >
            <option value="all">All Difficulties</option>
            {[...Array(10)].map((_, i) => (
              <option key={i + 1} value={i + 1}>Difficulty: {i + 1}</option>
            ))}
          </select>

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ucla-blue outline-none"
          >
            <option value="all">All Stages</option>
            <option value="Idea">Idea</option>
            <option value="Review">Review</option>
            <option value="Endorsed">Endorsed</option>
            <option value="Live/Ready for Review">Live/Ready for Review</option>
            <option value="On Test">On Test</option>
            <option value="Published">Published</option>
            <option value="Needs Review">Needs Review</option>
          </select>

          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ucla-blue outline-none"
          >
            <option value="all">All Topics</option>
            <option value="Algebra">Algebra</option>
            <option value="Geometry">Geometry</option>
            <option value="Combinatorics">Combinatorics</option>
            <option value="Number Theory">Number Theory</option>
          </select>

          <div className="text-sm font-medium text-gray-500 ml-auto">
            Showing {filtered.length} results
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Problem Details</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Feedback</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(problem => (
                <tr 
                  key={problem.id} 
                  onClick={() => navigate(`/problem/${problem.id}`)}
                  className="hover:bg-blue-50/30 transition-colors group cursor-pointer"
                >
                  <td className="px-4 py-2 align-top">
                    {problem.stage === 'Published' || problem.endorsements >= 3 ? (
                      <div className="p-1.5 bg-green-100 text-green-600 rounded-full w-fit shadow-sm">
                        <Check size={16} />
                      </div>
                    ) : (
                      <div className="p-1.5 bg-yellow-100 text-yellow-600 rounded-full w-fit shadow-sm">
                        <Star size={16} fill={problem.endorsements > 0 ? "currentColor" : "none"} />
                      </div>
                    )}
                    <p className="mt-1 text-[10px] font-bold text-gray-400 uppercase">{problem.stage}</p>
                  </td>
                  <td className="px-4 py-2 max-w-md">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-ucla-blue font-bold group-hover:underline">
                        {problem.id}
                      </span>
                      <span className="text-xs text-gray-400">by {problem.author?.initials}</span>
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-1.5 italic truncate">
                      {stripFormatting(problem.latex)}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      {problem.quality && (
                        <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-700 text-[10px] font-bold rounded uppercase tracking-tighter border border-yellow-200">
                          Diff: {problem.quality}
                        </span>
                      )}
                      {(problem.topics || []).map(t => (
                        <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded uppercase tracking-tighter">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-2 align-top">
                    <div className="space-y-1">
                      {problem.feedbacks && problem.feedbacks.length > 0 ? (
                        problem.feedbacks.slice(0, 1).map(fb => (
                          <div key={fb.id} className="text-xs flex gap-1.5 items-center">
                            <div className={`w-1 h-3 rounded-full ${fb.isEndorsement ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
                            <p className="text-gray-500 truncate max-w-[120px]">{fb.feedback}</p>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-gray-300 italic">No feedback yet</span>
                      )}
                      {problem.feedbacks?.length > 1 && (
                        <p className="text-[10px] text-gray-400">+{problem.feedbacks.length - 1} more</p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-400 align-top">
                    {new Date(problem.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default ProblemInventory;
