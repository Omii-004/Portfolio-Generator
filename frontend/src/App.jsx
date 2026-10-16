// NEW: Import Navigate here so we can redirect users
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext'; // NEW: Import useAuth here

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import AuthBoard from './pages/AuthBoard';
import UploadPage from './pages/UploadPage';
import ReviewPage from './pages/ReviewPage';
import PreviewPage from './pages/PreviewPage';
import ProfilePage from './pages/ProfilePage';
import FeedbackPage from './pages/FeedbackPage';

// NEW: This wrapper checks if you are logged in. If not, it kicks you to /login!
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const Chrome = () => {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isAuth = ['/login', '/signup'].includes(location.pathname);
  // LandingPage ships its own header (and footer), same as the auth pages.
  const showNav = !isAuth && !isLanding;
  return (
    <>
      {showNav && <Navbar />}
      {/* pt offsets the fixed floating navbar so content clears it */}
      <main className={`flex-grow flex flex-col ${showNav ? 'pt-20' : ''}`}>
        <Routes>
          {/* Public Routes anyone can see */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth-board" element={<AuthBoard />} />
          <Route path="/feedback" element={<FeedbackPage />} />

          {/* Protected Routes wrapped in our security check! */}
          <Route path="/upload" element={<ProtectedRoute><UploadPage /></ProtectedRoute>} />
          <Route path="/review" element={<ProtectedRoute><ReviewPage /></ProtectedRoute>} />
          <Route path="/preview" element={<ProtectedRoute><PreviewPage /></ProtectedRoute>} />
          <Route path="/preview/:id" element={<ProtectedRoute><PreviewPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        </Routes>
      </main>
      {!isLanding && !isAuth && <Footer />}
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 font-sans transition-colors duration-300">
            <Chrome />
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;