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

  // --- 状态管理 ---
  const [practice, setPractice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 弹窗和结果页的状态
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStats, setModalStats] = useState({ todayCount: 0 });
  const [quizScore, setQuizScore] = useState(null); // 新增：存储当前测验的分数
  const [showResults, setShowResults] = useState(false); // 新增：控制是否显示结果页
  const [selectedAnswers, setSelectedAnswers] = useState({}); // 新增：存储用户的答案

  // 注意：主题和难度设置已移至“设置”页面。

  // --- 核心流程函数 ---

  const handleStartPractice = async () => {
    setLoading(true);
    setError('');
    setPractice(null);
    setShowResults(false); // 重置结果页状态
    setQuizScore(null); // 重置分数
    setSelectedAnswers({}); // 重置答案
    try {
      // --- 新增：随机化逻辑 ---
      const availableTopics = ['Political News', 'Tech News', 'Sports News', 'History Facts'];
      let selectedTopic = profile.preferred_topic || 'Tech News';

      // 如果用户选择了“随机”，则从可用主题中随机挑选一个
      if (selectedTopic === 'Random') {
        const randomIndex = Math.floor(Math.random() * availableTopics.length);
        selectedTopic = availableTopics[randomIndex];
      }

      const lexileLevel = profile.preferred_lexile_level || '800L-1000L';
      
      // 随机选择内容类型以增加多样性
      const contentType = Math.random() > 0.5 ? 'text' : 'audio';
      // --- 随机化逻辑结束 ---

      const newPractice = await generatePractice(selectedTopic, lexileLevel, contentType);
      setPractice(newPractice);
    } catch (err) {
      setError('无法生成练习，请稍后再试。');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = (practiceType, score) => {
    // 1. 保存分数，更新统计数据
    setQuizScore(score);
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
            topic: profile.preferred_topic || 'Tech News', 
            lexileLevel: profile.preferred_lexile_level || '800L-1000L', 
            contentType: practiceType,
            score
        }]
    };
    updateProfile({ stats: newStats, streak: currentStreak });

    // 2. 准备并打开庆祝弹窗
    const newTodayCount = newStats.completions.filter(c => c.date === todayISO).length;
    setModalStats({ todayCount: newTodayCount });
    setIsModalOpen(true);
  };

  // 当用户在弹窗中点击“查看答题详情”
  const handleCloseModalAndShowResults = () => {
    setIsModalOpen(false);
    setShowResults(true); // 切换到结果视图
  };
  
  // 当用户在结果页点击“开始新的练习”
  const handleResetForNewPractice = () => {
      setPractice(null);
      setShowResults(false);
      setQuizScore(null);
  };

  if (profileLoading) {
    return <div className="flex items-center justify-center h-screen bg-slate-50">正在加载您的个人资料...</div>;
  }

  // --- 渲染逻辑 ---

  // 主页核心交互区
  const renderMainAction = () => (
    <div className="p-6 text-center bg-white rounded-xl shadow-sm">
        <h2 className="mb-4 text-2xl font-bold text-slate-800">准备好开始新的挑战了吗？</h2>
        <p className="mb-6 text-slate-500">点击下方按钮，立即根据您的偏好设置开始一段新练习。</p>
        <button 
            onClick={handleStartPractice} 
            disabled={loading} 
            className="w-full max-w-xs px-8 py-4 mx-auto font-bold text-white bg-green-600 rounded-lg shadow-lg hover:bg-green-700 disabled:bg-green-400 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300"
        >
            {loading ? '正在生成中...' : '🚀 开始新练习'}
        </button>
    </div>
  );

  // 渲染答题详情页
  const renderResults = () => (
    <div>
        <div className="p-6 mb-6 text-center bg-white rounded-xl shadow-sm">
            <h2 className="text-2xl font-bold text-slate-700">答题详情</h2>
        </div>
        <Quiz 
            key={`${practice.content}-results`}
            practice={practice} 
            onQuizComplete={() => {}} // 在结果页，不需要回调
            showResults={true} // 关键：告诉Quiz组件显示答案
            selectedAnswers={selectedAnswers}
            onAnswerSelect={() => {}} // 结果页不允许选择
        />
        <button onClick={handleResetForNewPractice} className="w-full px-4 py-3 mt-6 font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
            完成，开始新的练习
        </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl p-4 mx-auto sm:p-6 lg:p-8">
        <header className="flex items-center justify-between pb-6 mb-8 border-b border-slate-200">
            <h1 className="text-2xl font-bold text-slate-800">Tiny English Habits ✨</h1>
            <div className="flex items-center gap-2">
                <button onClick={() => navigate('/settings')} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors">
                    练习设置
                </button>
                <button onClick={() => navigate('/stats')} className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors">
                    我的仪表盘
                </button>
                <button onClick={signOut} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
                    登出
                </button>
            </div>
        </header>

        {/* 仪表盘统计数据 */}
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

        {error && <p className="p-4 my-4 text-center text-red-700 bg-red-100 rounded-md">{error}</p>}

        {/* 核心内容区：根据状态显示不同内容 */}
        {!practice && renderMainAction()}
        {practice && !showResults && (
            <Quiz 
                key={practice.content} 
                practice={practice} 
                onQuizComplete={handleQuizComplete}
                showResults={false}
                selectedAnswers={selectedAnswers}
                onAnswerSelect={setSelectedAnswers}
            />
        )}
        {practice && showResults && renderResults()}

        {/* 庆祝弹窗 */}
        <CompletionModal 
          isOpen={isModalOpen}
          onClose={handleCloseModalAndShowResults}
          stats={modalStats}
        />
      </div>
    </div>
  );
}