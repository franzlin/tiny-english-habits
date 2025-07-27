import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';
import { useProfile } from '../hooks/useProfile.js';
import { generatePractice } from '../api/gemini.js';
import Quiz from '../components/Quiz.jsx';
import CompletionModal from '../components/CompletionModal.jsx';

export default function HomePage() {
  const { signOut } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const navigate = useNavigate();

  const [practice, setPractice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStats, setModalStats] = useState({ todayCount: 0 });

  const [topic, setTopic] = useState('Tech News');
  const [lexileLevel, setLexileLevel] = useState('800L-1000L');
  const [contentType, setContentType] = useState('text');

  useEffect(() => {
    if (profile) {
      setTopic(profile.preferred_topic || 'Tech News');
      setLexileLevel(profile.preferred_lexile_level || '800L-1000L');
    }
  }, [profile]);

  const handleStartPractice = async () => {
    setLoading(true);
    setError('');
    setPractice(null);
    try {
      const newPractice = await generatePractice(topic, lexileLevel, contentType);
      setPractice(newPractice);
    } catch (err) {
      setError('无法生成练习，请稍后再试。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = (practiceType, score) => {
    console.log(`测验完成！得分: ${score.correct}/${score.total}。正在记录统计数据...`);
    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];
    const currentCompletions = profile.stats?.completions || [];
    
    const lastCompletionDate = profile.stats?.lastCompletionDate;
    let currentStreak = profile.streak || 0;

    if (lastCompletionDate) {
        const lastDate = new Date(lastCompletionDate);
        const diffTime = today.setHours(0,0,0,0) - lastDate.setHours(0,0,0,0);
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            currentStreak++;
        } else if (diffDays > 1) {
            currentStreak = 1;
        }
    } else {
        currentStreak = 1;
    }

    const newStats = {
        ...profile.stats,
        lastCompletionDate: todayISO,
        completions: [...currentCompletions, { 
            date: todayISO, 
            topic, 
            lexileLevel, 
            contentType: practiceType,
            score
        }]
    };
    updateProfile({ stats: newStats, streak: currentStreak });

    const newTodayCount = newStats.completions.filter(c => c.date === todayISO).length;
    setModalStats({ todayCount: newTodayCount });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPractice(null);
  };
  
  const handleUpdatePreferences = async () => {
    await updateProfile({
        preferred_topic: topic,
        preferred_lexile_level: lexileLevel,
    });
    alert('偏好已保存！');
  };

  if (profileLoading) {
    return <div className="flex items-center justify-center h-screen bg-slate-50">正在加载您的个人资料...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl p-4 mx-auto sm:p-6 lg:p-8">
        <header className="flex items-center justify-between pb-6 mb-8 border-b border-slate-200">
            <h1 className="text-2xl font-bold text-slate-800">Tiny English Habits</h1>
            <div>
                <button onClick={() => navigate('/stats')} className="px-4 py-2 mr-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors">
                    我的仪表盘
                </button>
                <button onClick={signOut} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
                    登出
                </button>
            </div>
        </header>

        <div className="grid grid-cols-1 gap-5 mb-8 sm:grid-cols-3">
          <div className="p-5 text-center bg-white rounded-xl shadow-sm">
            <h2 className="text-sm font-semibold text-slate-500">🔥 连续打卡</h2>
            <p className="text-4xl font-bold text-orange-500">{profile?.streak || 0} <span className="text-lg font-medium">天</span></p>
          </div>
          <div className="p-5 text-center bg-white rounded-xl shadow-sm">
            <h2 className="text-sm font-semibold text-slate-500">🎯 本月目标</h2>
            <p className="text-4xl font-bold text-cyan-600">
              {
                (() => {
                  const completions = profile?.stats?.completions || [];
                  const thisMonth = new Date().toISOString().split('T')[0].substring(0, 7);
                  const monthCount = completions.filter(c => c.date.startsWith(thisMonth)).length;
                  const monthlyGoal = profile?.stats?.monthlyGoal || 100;
                  return `${monthCount} / ${monthlyGoal}`;
                })()
              }
            </p>
          </div>
          <div className="p-5 text-center bg-white rounded-xl shadow-sm">
            <h2 className="text-sm font-semibold text-slate-500">✅ 今日完成</h2>
            <p className="text-4xl font-bold text-green-500">
              {
                (() => {
                  const completions = profile?.stats?.completions || [];
                  const today = new Date().toISOString().split('T')[0];
                  return completions.filter(c => c.date === today).length;
                })()
              }
            </p>
          </div>
        </div>

        <div className="p-6 mb-6 bg-white rounded-xl shadow-sm">
          <h2 className="mb-5 text-xl font-bold text-slate-700">定制你的练习</h2>
          <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            <div>
              <label htmlFor="topic" className="block text-sm font-medium text-slate-600">主题</label>
              <select id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full p-2 mt-1 bg-slate-100 border-transparent rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option>Political News</option>
                <option>Tech News</option>
                <option>Sports News</option>
                <option>History Facts</option>
              </select>
            </div>
            <div>
              <label htmlFor="lexile" className="block text-sm font-medium text-slate-600">蓝思值难度</label>
            <select id="lexile" value={lexileLevel} onChange={(e) => setLexileLevel(e.target.value)} className="w-full p-2 mt-1 bg-slate-100 border-transparent rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
              <option>BR-200L</option>
              <option>200L-500L</option>
              <option>500L-800L</option>
              <option>700L-850L</option>
              <option>800L-1000L</option>
              <option>1000L+</option>
            </select>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="contentType" className="block text-sm font-medium text-slate-600">内容类型</label>
              <select id="contentType" value={contentType} onChange={(e) => setContentType(e.target.value)} className="w-full p-2 mt-1 bg-slate-100 border-transparent rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                <option value="text">短文</option>
                <option value="audio">短音频</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-4 mt-6 sm:flex-row">
              <button onClick={handleUpdatePreferences} className="w-full px-4 py-3 font-semibold text-indigo-700 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition-colors sm:w-auto">
                  保存偏好
              </button>
              <button onClick={handleStartPractice} disabled={loading} className="w-full px-4 py-3 font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-all transform hover:scale-105">
                {loading ? '正在生成中...' : '🚀 开始新练习'}
              </button>
          </div>
        </div>

        {error && <p className="p-4 my-4 text-center text-red-700 bg-red-100 rounded-md">{error}</p>}

        {practice && (
          <Quiz 
            key={practice.content} 
            practice={practice} 
            onQuizComplete={handleQuizComplete}
            lexileLevel={lexileLevel}
          />
        )}

        <CompletionModal 
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          stats={modalStats}
        />
      </div>
    </div>
  );
}