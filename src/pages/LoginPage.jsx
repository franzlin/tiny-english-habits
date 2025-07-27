import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { signIn, signUp } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 6) {
        setError('密码必须至少为6个字符。');
        return;
    }

    setLoading(true);
    const { error } = await signIn({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 6) {
        setError('密码必须至少为6个字符。');
        return;
    }
    
    setLoading(true);
    const { error } = await signUp({ email, password });
    if (error) {
        setError(error.message);
    } else {
        setMessage('注册成功！请检查您的邮箱以完成验证。');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-center text-gray-800">Tiny English Habits</h1>
        <p className="text-center text-gray-600">登录或注册以开始您的学习之旅</p>
        
        {error && <p className="p-3 text-center text-red-700 bg-red-100 rounded-md">{error}</p>}
        {message && <p className="p-3 text-center text-green-700 bg-green-100 rounded-md">{message}</p>}

        <form className="space-y-6">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-gray-700">邮箱</label>
            <input
              id="email"
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-gray-700">密码</label>
            <input
              id="password"
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-col space-y-4">
            <button onClick={handleLogin} disabled={loading} className="w-full px-4 py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400">
              {loading ? '正在登录...' : '登录'}
            </button>
            <button onClick={handleSignup} disabled={loading} className="w-full px-4 py-2 font-semibold text-indigo-700 bg-indigo-100 rounded-md hover:bg-indigo-200 disabled:bg-indigo-50">
              {loading ? '正在注册...' : '注册'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}