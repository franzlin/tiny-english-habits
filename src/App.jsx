import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.jsx';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import StatsPage from './pages/StatsPage';
import SettingsPage from './pages/SettingsPage'; // 导入新的设置页面

function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route 
          path="/" 
          element={user ? <HomePage /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/login" 
          element={!user ? <LoginPage /> : <Navigate to="/" />} 
        />
        <Route 
          path="/stats"
          element={user ? <StatsPage /> : <Navigate to="/login" />}
        />
        <Route 
          path="/settings"
          element={user ? <SettingsPage /> : <Navigate to="/login" />}
        />
      </Routes>
    </div>
  );
}

export default App;