import { useState, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient.js';

export default function Quiz({ 
  practice, 
  onQuizComplete, 
  lexileLevel, 
  showResults, 
  selectedAnswers, 
  onAnswerSelect 
}) {

  // --- 音频功能状态 ---
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef(null); // 用于存储 Audio 对象实例

  // --- 组件卸载时清理音频 ---
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // --- 蓝思值到语音速率的映射 ---
  const getSpeechRateForLexile = (level) => {
    switch (level) {
      case 'BR-200L': return -200; // 慢
      case '200L-500L': return -100;
      case '500L-800L': return 0;    // 正常
      case '700L-850L': return 25;   // 新增：中等偏快
      case '800L-1000L': return 50;
      case '1000L+': return 100;   // 快
      default: return 0;
    }
  };

  const handleAnswerSelect = (questionIndex, option) => {
    onAnswerSelect(prev => ({ ...prev, [questionIndex]: option }));
  };

  const handleSubmit = () => {
    // 移除 setShowResults(true); 因为状态由父组件控制
    const correctCount = practice.questions.reduce((acc, q, i) => {
      return selectedAnswers[i] === q.correct_answer ? acc + 1 : acc;
    }, 0);
    
    const score = {
      correct: correctCount,
      total: practice.questions.length,
    };

    onQuizComplete(practice.type, score);
  };

  // --- 新的音频播放控制逻辑 ---
  const handleAudioControl = async (script) => {
    if (isPlaying) {
      audioRef.current?.pause();
      return;
    }

    if (audioRef.current && !isPlaying) {
      audioRef.current?.play();
      return;
    }

    setIsAudioLoading(true);
    setAudioError('');
    try {
      const speechRate = getSpeechRateForLexile(lexileLevel);
      const { data, error } = await supabase.functions.invoke('dashscope-tts', {
        body: { text: script, speech_rate: speechRate },
      });

      if (error) throw new Error(error.message);
      const url = data.audio_url;
      if (!url) throw new Error("函数未能返回有效的音频URL。");

      const audio = new Audio(url);
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      audio.onended = () => {
        setIsPlaying(false);
        if (audioRef.current) audioRef.current.currentTime = 0;
      };
      audioRef.current = audio;
      audio.play();
    } catch (err) {
      console.error("音频处理失败:", err);
      setAudioError(err.message || "无法生成或播放音频。");
    } finally {
      setIsAudioLoading(false);
    }
  };

  const getButtonState = () => {
    if (isAudioLoading) return { text: '⏳ 正在生成...', disabled: true };
    if (isPlaying) return { text: '⏸️ 暂停播放', disabled: false };
    if (audioRef.current) return { text: '▶️ 继续播放', disabled: false };
    return { text: '▶️ 播放音频', disabled: false };
  };

  const buttonState = getButtonState();

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="mb-4 text-xl font-semibold">练习内容</h3>
      {practice.type === 'text_with_questions' && (
        <p className="mb-6 leading-relaxed text-gray-700">{practice.content}</p>
      )}
      {practice.type === 'audio_with_questions' && (
        <div className="flex flex-col items-center justify-center mb-6">
            <button 
              onClick={() => handleAudioControl(practice.script)}
              disabled={buttonState.disabled}
              className="px-6 py-3 font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 disabled:bg-blue-400"
            >
              {buttonState.text}
            </button>
            {audioError && <p className="mt-2 text-sm text-red-600">{audioError}</p>}
        </div>
      )}
      
      <h4 className="mb-4 text-lg font-semibold">理解测验</h4>
      {practice.questions.map((q, qIndex) => (
        <div key={qIndex} className="mb-6">
          <p className="mb-3 font-medium">{qIndex + 1}. {q.question_text}</p>
          <div className="space-y-2">
            {q.options.map((option, oIndex) => {
              let buttonClass = "w-full p-3 text-left border rounded-lg transition-colors";
              let icon = '⬜️';

              if (showResults) {
                const isCorrectAnswer = option === q.correct_answer;
                const isSelectedAnswer = selectedAnswers[qIndex] === option;

                if (isCorrectAnswer) {
                  buttonClass += ' bg-green-100 border-green-400 text-green-900 font-bold';
                  icon = '🟢';
                } else if (isSelectedAnswer) {
                  buttonClass += ' bg-red-100 border-red-400 text-red-900';
                  icon = '🔴';
                } else {
                  buttonClass += ' bg-gray-50 text-gray-500';
                  icon = '⚪️';
                }
              } else {
                const isSelected = selectedAnswers[qIndex] === option;
                if (isSelected) {
                  buttonClass += ' bg-indigo-100 border-indigo-300';
                  icon = '✅';
                } else {
                  buttonClass += ' bg-gray-100 hover:bg-gray-200';
                }
              }

              return (
                <button 
                  key={oIndex} 
                  onClick={() => handleAnswerSelect(qIndex, option)} 
                  disabled={showResults}
                  className={buttonClass}
                >
                  <span className="mr-3 font-mono text-lg">{icon}</span>
                  {option}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {!showResults && (
        <button 
          onClick={handleSubmit} 
          disabled={Object.keys(selectedAnswers).length < practice.questions.length}
          className="w-full px-4 py-3 mt-4 font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-colors"
        >
          提交答案
        </button>
      )}
    </div>
  );
}
