import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../hooks/useProfile.js';

export default function SettingsPage() {
  const { profile, loading: profileLoading, updateProfile } = useProfile();
  const navigate = useNavigate();

  // --- 状态管理 ---
  const [topic, setTopic] = useState('Tech News');
  const [lexileLevel, setLexileLevel] = useState('800L-1000L');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // 当用户资料加载后，用数据库中的偏好来初始化本地状态
  useEffect(() => {
    if (profile) {
      setTopic(profile.preferred_topic || 'Tech News');
      setLexileLevel(profile.preferred_lexile_level || '800L-1000L');
    }
  }, [profile]);

  // --- 核心函数 ---
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setShowSuccess(false);
    try {
      await updateProfile({
        preferred_topic: topic,
        preferred_lexile_level: lexileLevel,
      });
      setShowSuccess(true);
      // 保存成功后，延迟1秒然后返回主页，给用户一个积极的反馈
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (error) {
      console.error("保存设置失败:", error);
      alert("保存失败，请稍后再试。");
    } finally {
      setIsSaving(false);
    }
  };

  if (profileLoading) {
    return <div className="flex items-center justify-center h-screen bg-slate-50">正在加载您的设置...</div>;
  }

  // --- 渲染逻辑 ---
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl p-4 mx-auto sm:p-6 lg:p-8">
        <header className="pb-6 mb-8 border-b border-slate-200">
          <h1 className="text-3xl font-bold text-slate-800">练习设置</h1>
          <p className="mt-2 text-slate-500">在这里定制您的日常英语练习偏好。</p>
        </header>

        <div className="p-8 bg-white rounded-xl shadow-sm">
          <div className="space-y-6">
            {/* 主题选择 */}
            <div>
              <label htmlFor="topic" className="block text-lg font-medium text-slate-700">选择主题</label>
              <p className="mb-2 text-sm text-slate-500">选择您感兴趣的新闻或知识领域。</p>
              <select 
                id="topic" 
                value={topic} 
                onChange={(e) => setTopic(e.target.value)} 
                className="w-full p-3 mt-1 bg-slate-100 border-transparent rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
              >
                <option>Random</option>
                <option>Political News</option>
                <option>Tech News</option>
                <option>Sports News</option>
                <option>History Facts</option>
              </select>
            </div>

            {/* 蓝思值难度选择 */}
            <div>
              <label htmlFor="lexile" className="block text-lg font-medium text-slate-700">选择难度 (蓝思值)</label>
              <p className="mb-2 text-sm text-slate-500">根据您的阅读水平选择合适的难度。</p>
              <select 
                id="lexile" 
                value={lexileLevel} 
                onChange={(e) => setLexileLevel(e.target.value)} 
                className="w-full p-3 mt-1 bg-slate-100 border-transparent rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
              >
                <option>BR-200L</option>
                <option>200L-500L</option>
                <option>500L-800L</option>
                <option>700L-850L</option>
                <option>800L-1000L</option>
                <option>1000L+</option>
              </select>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col gap-4 pt-8 mt-8 border-t border-slate-200 sm:flex-row">
            <button 
              onClick={handleSaveSettings} 
              disabled={isSaving || showSuccess}
              className="w-full px-6 py-3 font-bold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300"
            >
              {isSaving ? '正在保存...' : (showSuccess ? '✅ 保存成功!' : '保存设置并返回')}
            </button>
            <button 
              onClick={() => navigate('/')}
              className="w-full px-6 py-3 font-semibold text-slate-700 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors sm:w-auto"
            >
              取消
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}