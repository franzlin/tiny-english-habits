import React from 'react';

export default function CelebrationModal({ score, onClose }) {
  // 如果没有分数，不显示任何内容
  if (!score) return null;

  return (
    // 这是弹窗的背景遮罩
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
      {/* 这是弹窗的主体内容 */}
      <div className="bg-white rounded-2xl shadow-xl p-8 m-4 max-w-sm w-full text-center transform transition-all animate-pop-in">
        <h2 className="text-4xl font-bold mb-4">🎉 恭喜！🎉</h2>
        <p className="text-lg text-gray-700 mb-6">
          你已完成本次练习！
        </p>
        <div className="bg-gray-100 rounded-lg p-4 mb-8">
          <p className="text-xl text-gray-800">你的得分是</p>
          <p className="text-5xl font-bold text-indigo-600">
            {score.correct} <span className="text-3xl text-gray-500">/ {score.total}</span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          查看答题详情
        </button>
      </div>
    </div>
  );
}