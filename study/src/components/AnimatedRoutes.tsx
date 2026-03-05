import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { BookCover } from './BookCover';
import { LoginPage } from './LoginPage';
import { SignUpPage } from './SignUpPage';
import { AdminDashboard } from './AdminDashboard'; // N'oublie pas l'import !
import ForgotPassword from './ForgotPassword'; // N'oublie pas l'import !
import ResetPassword from './ResetPassword'; // N'oublie pas l'import !
export function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#e8e4db]">
      <AnimatePresence>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<BookCover />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          
          {/* espace Admin */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}