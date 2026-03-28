import { useState, useEffect } from 'react';
import { Clock, Search, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/Layout';
import KatexRenderer from '../components/KatexRenderer';

const GiveFeedback = () => {
  const { problemId: routeProblemId } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [hasSubmittedAnswer, setHasSubmittedAnswer] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [reviewType, setReviewType] = useState(null);

  const [mode, setMode] = useState(routeProblemId ? 'targeted' : 'random');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTopic, setFilterTopic] = useState('');
  const [filterStage, setFilterStage] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState(''); // New state for difficulty
  const [reviewableProblems, setReviewableProblems] = useState([]);
  const [reviewableLoading, setReviewableLoading] = useState(false);

  const topics = ['Algebra', 'Geometry', 'Combinatorics', 'Number Theory'];
  const stages = ['Idea', 'Review', 'Live/Ready for Review', 'Endorsed'];

  useEffect(() => {
    if (routeProblemId) {
      loadSpecificProblem(routeProblemId);
    } else if (mode === 'random') {
      loadNextProblem();
    } else {
      loadReviewableProblems();
    }
  }, [mode, routeProblemId]);

  useEffect(() => {
    if (problem) {
      setStartTime(Date.now());
      setElapsed(0);
      setHasSubmittedAnswer(false);
      setShowSolution(false);
    }
  }, [problem]);

  useEffect(() => {
    if (!problem || hasSubmittedAnswer) return;
    const interval = setInterval(() => setElapsed((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [problem, hasSubmittedAnswer]);

  const loadSpecificProblem = async (id) => {
    try {
      const res = await api.get(`/problems/${id}`);
      setProblem(res.data);
      setAnswer('');
      setFeedback('');
      setReviewType(null);
      setMessage('');
      setHasSubmittedAnswer(false);
      setShowSolution(false);
    } catch (error) {
      setMessage('Failed to load problem');
    }
  };

  const loadNextProblem = async () => {
    try {
      const response = await api.get('/feedback/next');
      if (response.data) {
        setProblem(response.data);
        setAnswer('');
        setFeedback('');
        setReviewType(null);
        setMessage('');
        setHasSubmittedAnswer(false);
        setShowSolution(false);
      } else {
        setProblem(null);
        setMessage('No more problems to review!');
      }
    } catch (error) {
      setProblem(null);
      setMessage('Failed to load problem');
    }
  };

  const loadReviewableProblems = async () => {
    setReviewableLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterTopic) params.append('topic', filterTopic);
      if (filterStage) params.append('stage', filterStage);
      // If your API supports filtering by difficulty natively, you can append it here:
      // if (filterDifficulty) params.append('quality', filterDifficulty);
      const res = await api.get(`/feedback/reviewable?${params.toString()}`);
      setReviewableProblems(res.data);
    } catch (error) {
      setMessage('Failed to load reviewable problems');
    } finally {
      setReviewableLoading(false);
    }
  };

  const handleSkip = () => {
    if (loading) return;
    setMessage('Skipping...');
    if (routeProblemId) {
      navigate('/feedback');
    } else {
      loadNextProblem();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (reviewType === null) {
      setMessage('You must select either "Needs Review" or "Endorse" before submitting.');
      return;
    }
    setLoading(true);
    const timeSpent = startTime ? Math.floor((Date.now() - startTime) / 1000) : null;
    try {
      await api.post('/feedback', {
        problemId: problem.id,
        answer,
        feedback,
        timeSpent,
        isEndorsement: reviewType === true,
      });
      setMessage('Feedback submitted! Loading next problem...');
      setReviewType(null);
      if (routeProblemId) {
        setTimeout(() => navigate('/feedback'), 1200);
      } else {
        setTimeout(loadNextProblem, 1000);
      }
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  const stripFormatting = (text) => {
    if (!text) return '';
    return text
      .replace(/\\$[^$]+\\$ /g, '')
      .replace(/\\$\\$[^$]+\\$\\$ /g, '')
      .replace(/[#*`]/g, '')
      .replace(/\\\\/g, '')
      .substring(0, 50) + (text.length > 50 ? '...' : ''); 
  };

const filteredProblems = reviewableProblems.filter((p) => {
    // Check quality (difficulty) match
    if (filterDifficulty && parseInt(p.quality) !== parseInt(filterDifficulty)) return false;
    
    // Check search query match
    if (!searchQuery) return true;
    return (
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.latex || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 transition-colors duration-300">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ucla-blue dark:text-[#FFD100] mb-2 transition-colors">Give Feedback</h1>
          <p className="text-gray-600 dark:text-gray-400 transition-colors">Help improve problems by providing solutions and feedback</p>
        </div>

        {!routeProblemId && (
          <div className="flex gap-4 mb-8 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700/50 w-fit transition-colors duration-300">
            <button
              onClick={() => {
                if (mode === 'random' && problem) return;
                setMode('random');
                setProblem(null);
                setMessage('');
              }}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                mode === 'random' 
                  ? 'bg-ucla-blue text-white dark:bg-[#FFD100] dark:text-slate-900 shadow-md' 
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-slate-900 dark:text-gray-400 dark:hover:bg-slate-700'
              }`}
            >
              Random Problem
            </button>
            <button
              onClick={() => {
                setMode('targeted');
                setProblem(null);
                setMessage('');
              }}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                mode === 'targeted' 
                  ? 'bg-ucla-blue text-white dark:bg-[#FFD100] dark:text-slate-900 shadow-md' 
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-slate-900 dark:text-gray-400 dark:hover:bg-slate-700'
              }`}
            >
              Select Problem
            </button>
          </div>
        )}

        {mode === 'targeted' && !problem && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md p-8 border border-gray-100 dark:border-slate-700/50 transition-colors duration-300">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 transition-colors">Select a Problem to Review</h2>
            
            <div className="flex flex-wrap gap-4 mb-8">
              <div className="flex-1 min-w-[200px] relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ID or content..."
                  className="w-full pl-10 pr-4 py-2 bg-transparent dark:bg-slate-900 border border-gray-200 dark:border-slate-600 dark:text-white rounded-lg focus:ring-2 focus:ring-ucla-blue dark:focus:ring-[#FFD100] outline-none transition-colors"
                />
              </div>
              
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-4 py-2 bg-transparent dark:bg-slate-900 border border-gray-200 dark:border-slate-600 dark:text-white rounded-lg focus:ring-2 focus:ring-ucla-blue dark:focus:ring-[#FFD100] outline-none transition-colors"
              >
                <option value="">All Difficulties</option>
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>Difficulty: {i + 1}</option>
                ))}
              </select>

              <select
                value={filterTopic}
                onChange={(e) => setFilterTopic(e.target.value)}
                className="px-4 py-2 bg-transparent dark:bg-slate-900 border border-gray-200 dark:border-slate-600 dark:text-white rounded-lg focus:ring-2 focus:ring-ucla-blue dark:focus:ring-[#FFD100] outline-none transition-colors"
              >
                <option value="">All Topics</option>
                {topics.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="px-4 py-2 bg-transparent dark:bg-slate-900 border border-gray-200 dark:border-slate-600 dark:text-white rounded-lg focus:ring-2 focus:ring-ucla-blue dark:focus:ring-[#FFD100] outline-none transition-colors"
              >
                <option value="">All Stages</option>
                {stages.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {reviewableLoading ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400 font-medium">Loading problems...</div>
            ) : filteredProblems.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500 italic">No reviewable problems found.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProblems.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => loadSpecificProblem(p.id)}
                    className="group text-left border border-gray-100 dark:border-slate-700/50 rounded-xl p-5 hover:border-ucla-blue dark:hover:border-[#FFD100] hover:bg-blue-50/50 dark:hover:bg-slate-700/50 transition-all shadow-sm hover:shadow-md"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-ucla-blue dark:text-[#FFD100] group-hover:underline">{p.id}</span>
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-300 uppercase bg-gray-50 dark:bg-slate-900 px-2 py-0.5 rounded border border-gray-100 dark:border-slate-600">
                        {p.quality ? `Diff: ${p.quality}/10` : 'No Diff'}
                      </span>
                    </div>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-3 italic transition-colors">
                      {stripFormatting(p.latex)}
                    </p>

                    <div className="flex flex-wrap gap-1.5 items-center">
                      {p.topics.map((t) => (
                        <span key={t} className="px-2 py-0.5 bg-white dark:bg-slate-800 text-[10px] font-bold text-gray-400 dark:text-gray-300 border border-gray-100 dark:border-slate-600 rounded uppercase">
                          {t}
                        </span>
                      ))}
                      <span className="ml-auto text-[10px] font-bold text-gray-400 dark:text-gray-300 uppercase">
                        {p._displayStatus === 'needs_review' ? 'Needs Review' : p._displayStatus === 'endorsed' ? 'Endorsed' : p.stage}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {problem && (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-100 dark:border-slate-700/50 overflow-hidden transition-colors duration-300">
            <div className="bg-gray-50/50 dark:bg-slate-800/80 px-8 py-6 border-b border-gray-100 dark:border-slate-700/50 flex justify-between items-center transition-colors">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3 transition-colors">
                  Problem {problem.id}
                  <span className="text-sm font-medium text-gray-400 dark:text-gray-500">by {problem.author?.firstName} {problem.author?.lastName}</span>
                </h2>
                <div className="flex gap-2 mt-2">
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-ucla-blue dark:text-blue-300 text-[10px] font-bold rounded border border-blue-200 dark:border-blue-800 uppercase transition-colors">Difficulty: {problem.quality}/10</span>
                  {problem.topics?.map((topic) => (
                    <span key={topic} className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-300 text-[10px] font-bold rounded border border-gray-200 dark:border-slate-600 uppercase transition-colors">{topic}</span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-2 text-ucla-blue dark:text-[#FFD100] font-mono font-bold bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm transition-colors">
                  <Clock size={16} />
                  {minutes}:{seconds.toString().padStart(2, '0')}
                </div>
                <button onClick={handleSkip} className="mt-2 text-xs font-bold text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 underline transition-colors">Skip Problem</button>
              </div>
            </div>

            <div className="p-8">
              <div className="prose dark:prose-invert max-w-none mb-8 bg-gray-50/30 dark:bg-slate-900/50 p-8 rounded-2xl border border-gray-100 dark:border-slate-700/50 min-h-[150px] transition-colors">
                <KatexRenderer latex={problem.latex} />
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 pt-6 border-t border-gray-100 dark:border-slate-700/50">
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">Your Solution/Answer</label>
                  <input
                    type="text"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl dark:text-white focus:ring-2 focus:ring-ucla-blue dark:focus:ring-[#FFD100] outline-none transition-all font-mono"
                    placeholder="Enter your solution..."
                    required
                    disabled={hasSubmittedAnswer}
                  />
                </div>

                {!hasSubmittedAnswer ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (answer.trim()) setHasSubmittedAnswer(true);
                      else setMessage('Please provide an answer first');
                    }}
                    className="w-full bg-ucla-blue text-white dark:bg-[#FFD100] dark:text-slate-900 py-4 rounded-xl font-bold hover:bg-ucla-dark-blue dark:hover:bg-yellow-500 transition-all shadow-lg shadow-blue-200 dark:shadow-none"
                  >
                    Check Creator Solution
                  </button>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="bg-gray-50 dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700/50 transition-colors">
                      <button
                        type="button"
                        onClick={() => setShowSolution(!showSolution)}
                        className="w-full flex justify-between items-center px-6 py-4 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2 font-bold text-ucla-blue dark:text-[#FFD100]">
                          <CheckCircle size={20} />
                          See Writer's Solution
                        </div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {showSolution ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </div>
                      </button>
                      {showSolution && (
                        <div className="p-6 border-t border-gray-200 dark:border-slate-700/50 bg-white dark:bg-slate-900 transition-colors">
                          <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">Writer's Solution</h4>
                          <div className="prose dark:prose-invert max-w-none mb-6 text-gray-800 dark:text-gray-200">
                            {problem.solution ? <KatexRenderer latex={problem.solution} /> : <p className="italic text-gray-400">No solution provided</p>}
                          </div>
                          {problem.answer && (
                            <div className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-100 dark:border-green-800 flex items-center gap-3 transition-colors">
                              <span className="font-bold text-green-700 dark:text-green-300 text-xs uppercase">Correct Answer:</span>
                              <div className="dark:text-white">
                                <KatexRenderer latex={problem.answer} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">Review Type <span className="text-red-500">*</span></label>
                      <div className="flex gap-4">
                        <button
                          type="button"
                          onClick={() => setReviewType(false)}
                          className={`flex-1 py-4 px-6 rounded-xl border-2 font-bold transition-all ${
                            reviewType === false 
                              ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 shadow-md' 
                              : 'border-gray-100 bg-white text-gray-400 hover:border-red-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-400 dark:hover:border-red-400'
                          }`}
                        >
                          Needs Review
                        </button>
                        <button
                          type="button"
                          onClick={() => setReviewType(true)}
                          className={`flex-1 py-4 px-6 rounded-xl border-2 font-bold transition-all ${
                            reviewType === true 
                              ? 'border-yellow-500 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 shadow-md' 
                              : 'border-gray-100 bg-white text-gray-400 hover:border-yellow-200 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-400 dark:hover:border-yellow-400'
                          }`}
                        >
                          Endorse
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider transition-colors">Feedback & Comments</label>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={4}
                        className="w-full px-6 py-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-600 rounded-xl dark:text-white focus:ring-2 focus:ring-ucla-blue dark:focus:ring-[#FFD100] outline-none transition-all"
                        placeholder="Share your thoughts, suggestions, or concerns..."
                        required
                      />
                    </div>

                    {message && (
                      <div className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                        message.includes('submitted') 
                          ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300' 
                          : message.includes('select') 
                            ? 'bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/30 dark:border-yellow-800 dark:text-yellow-300' 
                            : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300'
                      }`}>
                        {message}
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button
                        type="button"
                        onClick={() => setHasSubmittedAnswer(false)}
                        className="flex-1 py-4 border border-gray-200 dark:border-slate-600 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all font-bold"
                      >
                        Edit My Solution
                      </button>
                      <button
                        type="submit"
                        disabled={loading || reviewType === null}
                        className="flex-[2] bg-ucla-blue text-white dark:bg-[#FFD100] dark:text-slate-900 py-4 rounded-xl hover:bg-ucla-dark-blue dark:hover:bg-yellow-500 transition-all disabled:opacity-50 font-bold shadow-lg shadow-blue-200 dark:shadow-none"
                      >
                        {loading ? 'Submitting...' : 'Submit Feedback & Next'}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GiveFeedback;
