import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Upload from './pages/Upload';
import Result from './pages/Result';
import History from './pages/History';
import AdminDashboard from './pages/AdminDashboard';
import VerifyCode from './pages/VerifyCode';
import PasswordRecovery from './pages/PasswordRecovery';
import Settings from './pages/Settings';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-900">
          <Navbar />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<PasswordRecovery />} />
            <Route path="/reset-password" element={<PasswordRecovery />} />

            {/* Protected Routes (User) */}
            <Route
              path="/upload"
              element={
                <ProtectedRoute>
                  <Upload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/result"
              element={
                <ProtectedRoute>
                  <Result />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route path="/verify" element={<VerifyCode />} />

            {/* Protected Routes (Admin) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route
              path="*"
              element={
                <div className="page-container text-center py-20">
                  <span className="text-6xl">🍂</span>
                  <h1 className="text-3xl font-bold text-slate-200 mt-6">Page Not Found</h1>
                  <p className="text-slate-400 mt-2">The page you're looking for doesn't exist.</p>
                </div>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
