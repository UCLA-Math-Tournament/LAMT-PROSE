import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/Layout';
import KatexRenderer from '../components/KatexRenderer';

const DIFFICULTY_LABELS = {
  1: 'Level 1 — Simple / Beginner',
  2: 'Level 2 — Simple / Beginner',
  3: 'Level 3 — AMC 8 / Easy AMC 10',
  4: 'Level 4 — AMC 10 (Problems 1–10)',
  5: 'Level 5 — AMC 10 (Problems 11–20)',
  6: 'Level 6 — AMC 10 (Problems 21–25) / AMC 12 (Problems 1–10)',
  7: 'Level 7 — AMC 12 (Problems 11–18)',
  8: 'Level 8 — AMC 12 (Problems 19–22)',
  9: 'Level 9 — AMC 12 (Problems 23–25)',
  10: 'Level 10 — AIME Level',
};

const WriteProblem = () => {
  const [latex, setLatex] = useState('');
  const [solution, setSolution] = useState('');
  const [topics, setTopics] = useState([]);
  const [difficulty, setDifficulty] = useState(5);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const topicOptions = ['Algebra', 'Geometry', 'Combinatorics', 'Number Theory'];

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
        solution,
        topics,
        quality: String(difficulty),
      });

      setMessage(`Problem ${response.data.id} created successfully!`);
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      const errMsg = error.response?.data?.details || error.response?.data?.error || error.message || 'Unknown error';
      setMessage(`Failed to create problem: ${errMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-ucla-blue mb-8">Write New Problem</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column: form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Problem Editor</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Problem Statement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Problem Statement (LaTeX)
                </label>
                <textarea
                  value={latex}
                  onChange={(e) => setLatex(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ucla-blue focus:border-transparent font-mono text-sm"
                  placeholder="Enter LaTeX code for the problem..."
                  required
                />
              </div>

              {/* Writer's Solution */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Writer's Solution (LaTeX) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ucla-blue focus:border-transparent font-mono text-sm"
                  placeholder="Enter your full solution in LaTeX..."
                  required
                />
              </div>

              {/* Topics */}
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

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty: <span className="font-bold text-ucla-blue">{difficulty}/10</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={difficulty}
                  onChange={(e) => setDifficulty(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-ucla-blue"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                  <span>6</span>
                  <span>7</span>
                  <span>8</span>
                  <span>9</span>
                  <span>10</span>
                </div>
                <div className="mt-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  {DIFFICULTY_LABELS[difficulty]}
                </div>
              </div>

              {message && (
                <div className={`px-4 py-3 rounded text-sm ${
                  message.includes('successfully')
                    ? 'bg-green-50 border border-green-200 text-green-700'
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

          {/* Right column: preview */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Problem Preview</h2>
              <div className="border border-gray-200 rounded-lg p-4 min-h-[200px]">
                {latex ? (
                  <KatexRenderer latex={latex} displayMode />
                ) : (
                  <p className="text-gray-400 text-center">Problem preview will appear here...</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Solution Preview</h2>
              <div className="border border-gray-200 rounded-lg p-4 min-h-[200px]">
                {solution ? (
                  <KatexRenderer latex={solution} displayMode />
                ) : (
                  <p className="text-gray-400 text-center">Solution preview will appear here...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WriteProblem;
