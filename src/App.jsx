import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth.jsx';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import StatsPage from './pages/StatsPage';

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
      </Routes>
    </div>
  );
}

export default App;