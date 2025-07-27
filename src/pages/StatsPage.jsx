import { useState } from 'react';
import { useProfile } from '../hooks/useProfile.js';
import { useNavigate } from 'react-router-dom';

export default function StatsPage() {
  const { profile, loading, updateProfile } = useProfile();
  const navigate = useNavigate();
  const [goalInput, setGoalInput] = useState('');

  // 新增：处理数据清除的函数
  const handleClearData = async () => {
    if (window.confirm('警告：此操作不可逆！\n\n您确定要删除所有练习历史、打卡记录和目标吗？')) {
      try {
        await updateProfile({
          stats: { completions: [], monthlyGoal: 100, lastCompletionDate: null },
          streak: 0
        });
        alert('所有统计数据已成功清除。');
      } catch (error) {
        console.error("清除数据失败:", error);
        alert('清除数据失败，请稍后再试。');
      }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">正在加载仪表盘...</div>;
  }

  const completions = profile?.stats?.completions || [];
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = today.substring(0, 7);

  const todayCount = completions.filter(c => c.date === today).length;
  const monthCount = completions.filter(c => c.date.startsWith(thisMonth)).length;
  const totalCount = completions.length;
  const streak = profile?.streak || 0;

  const totalStats = completions.reduce((acc, item) => {
    if (item.score) {
      acc.totalCorrect += item.score.correct;
      acc.totalQuestions += item.score.total;
    }
    return acc;
  }, { totalCorrect: 0, totalQuestions: 0 });

  const overallAccuracy = totalStats.totalQuestions > 0 
    ? ((totalStats.totalCorrect / totalStats.totalQuestions) * 100).toFixed(1)
    : 0;

  const monthlyGoal = profile?.stats?.monthlyGoal || 100;
  const goalProgress = Math.min(100, (monthCount / monthlyGoal) * 100);

  const handleSetGoal = async () => {
    const newGoal = parseInt(goalInput, 10);
    if (!isNaN(newGoal) && newGoal > 0) {
        const newStats = { ...profile.stats, monthlyGoal: newGoal };
        await updateProfile({ stats: newStats });
        setGoalInput('');
        alert('新目标已保存！');
    } else {
        alert('请输入一个有效的正数作为目标。');
    }
  };

  return (
    <div className="max-w-4xl min-h-screen p-4 mx-auto md:p-8">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">我的仪表盘</h1>
        <button onClick={() => navigate('/')} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
          返回主页
        </button>
      </header>

      {/* --- 核心激励指标 --- */}
      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
        <div className="p-6 text-center bg-white rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-600">🔥 连续打卡天数</h2>
          <p className="text-6xl font-bold text-orange-500">{streak}</p>
        </div>
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="mb-2 text-lg font-semibold text-center text-gray-600">🎯 月度目标进度</h2>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl font-bold text-cyan-600">{monthCount} / {monthlyGoal}</span>
            <span className="text-sm font-semibold text-gray-500">{goalProgress.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div 
              className="bg-cyan-600 h-4 rounded-full transition-all duration-500 ease-in-out" 
              style={{ width: `${goalProgress}%` }}
            ></div>
          </div>
           <div className="flex mt-4">
            <input 
              type="number" 
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="设置新目标"
              className="w-full p-2 text-center border rounded-l-md focus:ring-cyan-500 focus:border-cyan-500"
            />
            <button onClick={handleSetGoal} className="px-4 py-2 text-white bg-cyan-600 rounded-r-md hover:bg-cyan-700">
              设置
            </button>
          </div>
        </div>
      </div>

      {/* --- 其他数据统计 --- */}
      <div className="grid grid-cols-2 gap-6 mb-12 md:grid-cols-4">
        <div className="p-4 text-center bg-white rounded-lg shadow">
          <h2 className="font-semibold text-gray-600">总正确率</h2>
          <p className="text-4xl font-bold text-purple-600">{overallAccuracy}%</p>
        </div>
        <div className="p-4 text-center bg-white rounded-lg shadow">
          <h2 className="font-semibold text-gray-600">累计练习</h2>
          <p className="text-4xl font-bold text-blue-600">{totalCount}</p>
        </div>
        <div className="p-4 text-center bg-white rounded-lg shadow">
          <h2 className="font-semibold text-gray-600">今日练习</h2>
          <p className="text-4xl font-bold text-indigo-600">{todayCount}</p>
        </div>
        <div className="p-4 text-center bg-white rounded-lg shadow">
          <h2 className="font-semibold text-gray-600">本月练习</h2>
          <p className="text-4xl font-bold text-green-600">{monthCount}</p>
        </div>
      </div>
      
      {/* --- 练习历史 --- */}
      <div className="mt-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-700">最近练习历史</h2>
          <div className="p-4 bg-white rounded-lg shadow">
              <ul className="space-y-3">
                  {completions.length > 0 ? (
                      [...completions].reverse().slice(0, 20).map((item, index) => (
                          <li key={index} className="flex items-center justify-between p-3 border-b last:border-b-0">
                              <div>
                                <p className="font-medium">{item.date}</p>
                                <p className="text-sm text-gray-600">
                                  {item.contentType === 'audio_with_questions' ? '音频' : '短文'} | {item.topic} | {item.lexileLevel}
                                </p>
                              </div>
                              {item.score && (
                                <span className="px-3 py-1 text-sm font-semibold text-indigo-800 bg-indigo-100 rounded-full">
                                  得分: {item.score.correct} / {item.score.total}
                                </span>
                              )}
                          </li>
                      ))
                  ) : (
                      <p className="text-center text-gray-500">还没有完成任何练习。</p>
                  )}
              </ul>
          </div>
      </div>

      {/* --- 新增：危险操作区域 --- */}
      <div className="py-8 mt-12 text-center border-t border-slate-200">
        <h3 className="text-lg font-semibold text-red-600">危险操作</h3>
        <p className="mt-1 mb-4 text-sm text-slate-500">此操作将永久删除您的所有统计数据，且无法恢复。</p>
        <button
            onClick={handleClearData}
            className="px-5 py-2 font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
            清除所有数据
        </button>
      </div>
    </div>
  );
}
