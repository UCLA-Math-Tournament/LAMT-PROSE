import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/Layout';
import KatexRenderer from '../components/KatexRenderer';

const WriteProblem = () => {
  const [latex, setLatex] = useState('');
  const [topics, setTopics] = useState([]);
  const [quality, setQuality] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const topicOptions = ['Algebra', 'Geometry', 'Combinatorics', 'Number Theory'];
  const qualityOptions = ['Easy', 'Medium', 'Hard'];

  const handleTopicToggle = (topic) => {
    setTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (topics.length === 0) {
      setMessage('Please select at least one topic');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await api.post('/problems', {
        latex,
        topics,
        quality
      });

      setMessage(`Problem ${response.data.id} created successfully!`);

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      setMessage('Failed to create problem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-ucla-blue mb-8">Write New Problem</h1>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">LaTeX Editor</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Problem Statement (LaTeX)
                </label>
                <textarea
                  value={latex}
                  onChange={(e) => setLatex(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ucla-blue focus:border-transparent font-mono text-sm"
                  placeholder="Enter LaTeX code..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Topics
                </label>
                <div className="flex flex-wrap gap-2">
                  {topicOptions.map(topic => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => handleTopicToggle(topic)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        topics.includes(topic)
                          ? 'bg-ucla-blue text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <div className="flex gap-2">
                  {qualityOptions.map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setQuality(q)}
                      className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                        quality === q
                          ? 'bg-ucla-blue text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {message && (
                <div className={`px-4 py-3 rounded ${
                  message.includes('success')
                    ? 'bg-blue-50 border border-blue-200 text-blue-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-ucla-blue text-white py-2 rounded-lg hover:bg-ucla-dark-blue transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Submit Problem'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Live Preview</h2>
            <div className="border border-gray-200 rounded-lg p-4 min-h-[400px]">
              {latex ? (
                <KatexRenderer latex={latex} displayMode />
              ) : (
                <p className="text-gray-400 text-center">Preview will appear here...</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WriteProblem;
