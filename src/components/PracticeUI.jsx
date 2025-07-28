import React, { useState, useEffect } from 'react';
import { useProfile } from '../hooks/useProfile';
import { fetchExercise } from '../api/gemini';
import Quiz from './Quiz';
import CelebrationModal from './CelebrationModal'; // 1. 引入新组件

const TOPIC_OPTIONS = ["Political News", "Tech News", "Sports News", "History Facts"];
const LEXILE_LEVEL_OPTIONS = ["600L-800L", "800L-1000L", "1000L-1200L", "1200L+"];

export default function PracticeUI() {
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  
  const [topic, setTopic] = useState('');
  const [lexileLevel, setLexileLevel] = useState('');
  const [exercise, setExercise] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false); // 2. 添加新状态来控制弹窗

  useEffect(() => {
    if (profile) {
      setTopic(profile.preferred_topic || 'Tech News');
      setLexileLevel(profile.preferred_lexile_level || '800L-1000L');
    }
  }, [profile]);

  const handleStartPractice = async () => {
    setIsLoading(true);
    setExercise(null);
    setShowResults(false);
    setQuizScore(null);
    try {
      const result = await fetchExercise(topic, lexileLevel);
      setExercise(result);
    } catch (error) {
      console.error("获取练习失败:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 3. 修改完成回调：现在它会先显示庆祝弹窗
  const handleQuizComplete = (type, score) => {
    setQuizScore(score);
    setShowCelebration(true); // 显示庆祝弹窗
  };

  // 4. 新增一个函数：关闭弹窗并显示详细结果
  const handleCloseCelebration = () => {
    setShowCelebration(false);
    setShowResults(true); // 现在才显示结果页
  };

  const handleReset = () => {
    setExercise(null);
    setShowResults(false);
    setQuizScore(null);
  };

  const handleTopicChange = (e) => {
    const newTopic = e.target.value;
    setTopic(newTopic);
    updateProfile({ preferred_topic: newTopic });
  };

  const handleLevelChange = (e) => {
    const newLevel = e.target.value;
    setLexileLevel(newLevel);
    updateProfile({ preferred_lexile_level: newLevel });
  };

  // --- 渲染逻辑 ---
  // 将所有内容包裹在一个 Fragment (<>) 中，以便同时渲染页面和弹窗
  return (
    <>
      {/* 5. 在这里渲染庆祝弹窗 */}
      <CelebrationModal score={quizScore} onClose={handleCloseCelebration} />

      {/* 主要内容区域 */}
      <div className="max-w-2xl mx-auto">
        {profileLoading && <div className="text-center p-8">正在加载您的偏好...</div>}

        {!profileLoading && exercise && showResults && (
          <div>
            <div className="p-6 bg-white rounded-lg shadow mb-6">
              <h2 className="text-2xl font-bold text-center mb-4">答题详情</h2>
              <p className="text-center text-gray-700 text-lg">
                你的得分是: <span className="font-bold text-indigo-600">{quizScore?.correct}</span> / <span className="font-bold">{quizScore?.total}</span>
              </p>
            </div>
            <Quiz
              practice={exercise}
              lexileLevel={lexileLevel}
              showResults={true}
              onQuizComplete={() => {}}
            />
            <button
              onClick={handleReset}
              className="w-full mt-6 bg-green-600 text-white font-bold py-3 px-4 rounded-md hover:bg-green-700"
            >
              开始新的练习
            </button>
          </div>
        )}

        {!profileLoading && exercise && !showResults && (
          <Quiz
            practice={exercise}
            lexileLevel={lexileLevel}
            showResults={false}
            onQuizComplete={handleQuizComplete}
          />
        )}

        {!profileLoading && !exercise && (
          <div className="p-4 sm:p-6 bg-gray-50 rounded-lg shadow-md">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="topic-select" className="block text-sm font-medium text-gray-700 mb-1">
                  主题
                </label>
                <select
                  id="topic-select"
                  value={topic}
                  onChange={handleTopicChange}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {TOPIC_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="lexile-select" className="block text-sm font-medium text-gray-700 mb-1">
                  蓝思值
                </label>
                <select
                  id="lexile-select"
                  value={lexileLevel}
                  onChange={handleLevelChange}
                  className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {LEXILE_LEVEL_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>
            <button
              onClick={handleStartPractice}
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
            >
              {isLoading ? '正在生成练习...' : '开始练习'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}