import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { BookCover } from './BookCover';
import { LoginPage } from './LoginPage';
import { SignUpPage } from './SignUpPage';
import { AdminDashboard } from './AdminDashboard';
import { StatisticsPage } from './StatisticsPage';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import Dashboard from './Dashboard';
import Profile from './Profile';
import RaisonnementPage from './RaisonnementPage';
import ProgressionPage from './ProgressionPage';
import PlanningPage from './PlanningPage';
export function AnimatedRoutes() {
  const location = useLocation();

  return (
    <div className="relative w-full min-h-screen overflow-hidden bg-[#e8e4db]">
      <AnimatePresence>
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<BookCover />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/raisonnement" element={<RaisonnementPage />} />
          <Route path="/progression" element={<ProgressionPage />} />
          <Route path="/planning" element={<PlanningPage />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
}