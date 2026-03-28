import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, LayoutDashboard, MessageSquare, Trash2, User, Info } from 'lucide-react';
import { useAuth } from '../utils/AuthContext';
import api from '../utils/api';
import Layout from '../components/Layout';
import KatexRenderer from '../components/KatexRenderer';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, checkAuth } = useAuth();
  
  // --- UI State ---
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'profile'

  // --- Dashboard States ---
  const [stats, setStats] = useState(null);
  const [problems, setProblems] = useState([]);
  const [myFeedback, setMyFeedback] = useState([]);
  const [filter, setFilter] = useState('all');
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // --- Profile States ---
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    mathExp: ''
  });
  const [profileSubmitting, setProfileSubmitting] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  // --- Effects ---
  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        mathExp: user.mathExp || ''
      });
    }
  }, [user]);

  // --- Handlers ---
  const fetchDashboardData = async () => {
    setDashboardLoading(true);
    try {
      const [statsRes, problemsRes] = await Promise.all([
        api.get('/stats/dashboard'),
        api.get('/problems/my'),
      ]);
      setStats(statsRes.data);
      setProblems(problemsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setDashboardLoading(false);
    }

    try {
      const feedbackRes = await api.get('/feedback/my-feedback');
      setMyFeedback(feedbackRes.data);
    } catch (error) {
      console.error('Failed to fetch my feedback', error);
    }
  };

  const handleDeleteFeedback = async (e, feedbackId) => {
    e.stopPropagation(); 
    if (!window.confirm("Are you sure you want to remove this feedback/endorsement?")) return;

    try {
      await api.delete(`/feedback/${feedbackId}`);
      setMyFeedback(prev => prev.filter(fb => fb.id !== feedbackId));
      
      const statsRes = await api.get('/stats/dashboard');
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to delete feedback', error);
      alert("Failed to delete feedback. Please try again.");
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSubmitting(true);
    setProfileMessage('');
    try {
      await api.put('/user/profile', formData);
      await checkAuth();
      setProfileMessage('Profile updated successfully!');
    } catch (error) {
      setProfileMessage('Failed to update profile');
    } finally {
      setProfileSubmitting(false);
    }
  };

  // --- Derived Data ---
  const filteredProblems = filter === 'all'
    ? problems
    : problems.filter((p) => p._displayStatus === filter || p.stage === filter);

  const topics = ['Algebra', 'Geometry', 'Combinatorics', 'Number Theory'];

  if (dashboardLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64 text-gray-500">
          Loading Dashboard...
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        
        {/* Header & Navigation */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-ucla-blue mb-2">
              Welcome, {user?.firstName}!
            </h1>
            <p className="text-gray-500">
              {activeTab === 'overview' ? 'Here is an overview of your activity.' : 'Manage your profile and account settings.'}
            </p>
          </div>
          
          <div className="flex bg-white rounded-lg shadow-sm p-1 border border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-ucla-blue text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <LayoutDashboard size={18} />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'profile' 
                  ? 'bg-ucla-blue text-white' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <User size={18} />
              Profile Settings
            </button>
          </div>
        </div>

        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="animate-in fade-in duration-300">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Problems</h3>
                <p className="text-3xl font-bold text-ucla-blue">{stats?.totalProblems || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-400">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Endorsements</h3>
                <div className="flex items-center gap-2">
                  <Star size={24} className="text-yellow-500 fill-yellow-400" />
                  <p className="text-3xl font-bold text-ucla-blue">{stats?.totalEndorsements || 0}</p>
                </div>
              </div>
              {topics.map((topic) => (
                <div key={topic} className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">{topic}</h3>
                  <p className="text-3xl font-bold text-ucla-blue">{stats?.topicCounts?.[topic] || 0}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
              {/* Main Problems Table */}
              <div className="flex-1">
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-4 border-b flex gap-2 flex-wrap">
                    {['all', 'needs_review', 'Idea', 'Published', 'endorsed'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          filter === s
                            ? 'bg-ucla-blue text-white shadow-sm'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {s === 'all' ? 'All' : s === 'needs_review' ? 'Needs Review' : s}
                      </button>
                    ))}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Topics</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Endorsed</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredProblems.length === 0 ? (
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No problems found in this category</td></tr>
                        ) : filteredProblems.map((problem) => (
                          <tr
                            key={problem.id}
                            onClick={() => navigate(`/problem/${problem.id}`)}
                            className="hover:bg-gray-50 cursor-pointer"
                          >
                            <td className="px-4 py-3 font-mono text-sm font-bold">{problem.id}</td>
                            <td className="px-4 py-3">{problem.topics.map(t => <span key={t} className="mr-1 mb-1 inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{t}</span>)}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs rounded font-medium ${
                                problem._displayStatus === 'needs_review' ? 'bg-red-100 text-red-800' :
                                problem._displayStatus === 'endorsed' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {problem._displayStatus === 'needs_review' ? 'Needs Review' :
                                problem._displayStatus === 'endorsed' ? 'Endorsed' :
                                problem.stage}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {problem.endorsements > 0 ? (
                                <span className="flex items-center gap-1 text-yellow-600 text-sm">
                                  <Star size={14} fill="currentColor" /> {problem.endorsements}
                                </span>
                              ) : <span className="text-gray-400">-</span>}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">{new Date(problem.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Reviewer Sidebar */}
              <div className="w-full lg:w-80 flex-shrink-0">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MessageSquare size={20} />
                    Your Reviews
                  </h2>
                  {myFeedback.length === 0 ? (
                    <p className="text-gray-500 text-sm">You haven't submitted any reviews yet.</p>
                  ) : myFeedback.map((fb) => (
                    <div
                      key={fb.id}
                      onClick={() => navigate(`/problem/${fb.problemId}`)}
                      className="cursor-pointer border-l-4 border-gray-200 pl-3 py-2 mb-3 hover:border-ucla-blue transition-colors group"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold">{fb.problemId}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            fb.resolved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {fb.resolved ? 'Resolved' : 'Unresolved'}
                          </span>
                        </div>
                        <button 
                          onClick={(e) => handleDeleteFeedback(e, fb.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                          title="Remove Feedback"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      {fb.answer && <p className="text-xs text-gray-600 mt-1"><span className="font-semibold">Your answer:</span> {fb.answer}</p>}
                      {fb.comment && <p className="text-xs text-gray-500 mt-1 truncate">"{fb.comment}"</p>}
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-400">{fb.createdAt ? new Date(fb.createdAt).toLocaleDateString() : ''}</p>
                        {fb.isEndorsement && <span className="text-xs text-yellow-600 font-medium">Endorsed</span>}
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => navigate('/feedback')}
                    className="w-full mt-4 py-2 bg-ucla-blue text-white rounded-lg font-bold hover:bg-blue-800 transition-colors"
                  >
                    Review More Problems
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PROFILE */}
        {activeTab === 'profile' && (
          <div className="max-w-4xl mx-auto animate-in fade-in duration-300">
            {/* Profile Settings Card */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">Profile Settings</h2>

              {profileMessage && (
                <div className={`mb-4 px-4 py-3 rounded text-center ${
                  profileMessage.includes('success')
                    ? 'bg-blue-50 border border-blue-200 text-blue-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {profileMessage}
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-4">
                {/* Row 1: Email + Initials */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-center sm:text-left">
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-center sm:text-left"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-center sm:text-left">
                      Initials
                    </label>
                    <input
                      type="text"
                      value={user?.initials || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-center sm:text-left"
                    />
                  </div>
                </div>

                {/* Row 2: First Name + Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-center sm:text-left">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ucla-blue focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 text-center sm:text-left">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ucla-blue focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Row 3: Math Experience */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 text-center sm:text-left">
                    Math Experience
                  </label>
                  <textarea
                    value={formData.mathExp}
                    onChange={(e) => setFormData({ ...formData, mathExp: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ucla-blue focus:border-transparent"
                  />
                </div>

<button
                  type="submit"
                  disabled={profileSubmitting}
                  className="w-full bg-ucla-blue text-white py-3 rounded-lg transition-colors hover:bg-blue-800 disabled:opacity-50 font-semibold mt-4"
                >
                  {profileSubmitting ? 'Saving...' : 'Save Profile'}
                </button>
              </form>
            </div>
          </div>
        )}  

      </div>
    </Layout>
  );
};

export default Dashboard;
