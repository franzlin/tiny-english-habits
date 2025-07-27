export default function CompletionModal({ isOpen, onClose, stats }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
      <div className="p-8 text-center bg-white rounded-lg shadow-2xl transform transition-all animate-fade-in-up">
        <h2 className="mb-4 text-4xl font-bold text-green-500">太棒了!</h2>
        <p className="mb-6 text-lg text-gray-700">
          你已经完成了今天的第 <span className="text-2xl font-bold text-indigo-600">{stats.todayCount}</span> 次练习！
        </p>
        <button
          onClick={onClose}
          className="px-8 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          继续加油
        </button>
      </div>
      <style>
        {`
          @keyframes fade-in-up {
            0% {
              opacity: 0;
              transform: translateY(20px);
            }
            100% {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in-up {
            animation: fade-in-up 0.5s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
}