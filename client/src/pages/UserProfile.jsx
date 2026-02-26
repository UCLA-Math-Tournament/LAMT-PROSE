import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { User, Star, ArrowLeft } from 'lucide-react';
import api from '../utils/api';
import Layout from '../components/Layout';

const STAGE_COLORS = {
  'On Test': 'bg-blue-100 text-blue-800',
  'Endorsed': 'bg-yellow-100 text-yellow-800',
  'Published': 'bg-green-100 text-green-800',
  'Review': 'bg-orange-100 text-orange-800',
  'Live/Ready for Review': 'bg-green-100 text-green-800',
  'Idea': 'bg-gray-100 text-gray-700',
  'Needs Review': 'bg-red-100 text-red-800',
};

const UserProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/user/${id}`);
      setProfile(response.data);
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (error || !profile) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-red-500">{error || 'User not found'}</p>
          <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-gray-200 rounded-lg">
            Go Back
          </button>
        </div>
      </Layout>
    );
  }

  const stageCounts = {};
  profile.problems.forEach(p => {
    stageCounts[p.stage] = (stageCounts[p.stage] || 0) + 1;
  });

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white" style={{ backgroundColor: '#2774AE' }}>
            {profile.initials}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="text-gray-500 text-sm mt-1">{profile.initials}</p>
            {profile.mathExp && (
              <p className="text-gray-600 mt-1 text-sm">{profile.mathExp}</p>
            )}
          </div>
          <div className="ml-auto text-right">
            <div className="text-3xl font-bold" style={{ color: '#2774AE' }}>
              {profile.problems.length}
            </div>
            <div className="text-sm text-gray-500">Problems</div>
          </div>
        </div>

        {/* Stage Summary */}
        {profile.problems.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold mb-3">Problem Stages</h2>
            <div className="flex flex-wrap gap-2">
              {Object.entries(stageCounts).map(([stage, count]) => (
                <span
                  key={stage}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${STAGE_COLORS[stage] || 'bg-gray-100 text-gray-700'}`}
                >
                  {stage}: {count}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Problems List */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4">Problems ({profile.problems.length})</h2>
          {profile.problems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No problems yet</p>
          ) : (
            <div className="space-y-3">
              {profile.problems.map(p => (
                <Link
                  key={p.id}
                  to={`/problem/${p.id}`}
                  className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-gray-700">{p.id}</span>
                      <div className="flex gap-1">
                        {p.topics.map(t => (
                          <span key={t} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {p.endorsements > 0 && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded font-medium">
                          <Star size={10} fill="#CA8A04" /> {p.endorsements}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${STAGE_COLORS[p.stage] || 'bg-gray-100 text-gray-700'}`}>
                        {p.stage}
                      </span>
                      <span className="text-xs text-gray-400">{new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default UserProfile;
