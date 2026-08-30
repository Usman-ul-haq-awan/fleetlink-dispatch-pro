import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { Navigate } from 'react-router-dom';
import Dashboard from '@/pages/Dashboard';
import CarrierDatabase from '@/pages/CarrierDatabase';
import CarrierDetail from '@/pages/CarrierDetail';
import CarrierResearch from '@/pages/CarrierResearch';
import EmailCampaigns from '@/pages/EmailCampaigns';
import EmailTesting from '@/pages/EmailTesting';
import Outreach from '@/pages/Outreach';
import CallingQueue from '@/pages/CallingQueue';
import HumanHandoff from '@/pages/HumanHandoff';
import OnboardingPage from '@/pages/OnboardingPage';
import BrokerVetting from '@/pages/BrokerVetting';
import ImportExport from '@/pages/ImportExport';
import ActivityLog from '@/pages/ActivityLog';
import Settings from '@/pages/Settings';
import ProtectedLayout from '@/components/ProtectedLayout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import DispatchTools from '@/pages/DispatchTools';
import IncomeCalculatorPage from '@/pages/IncomeCalculatorPage';
import Tools from '@/pages/Tools';
import QuizHub from '@/pages/QuizHub';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, isAuthenticated } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle user not registered error
  if (authError?.type === 'user_not_registered') {
    return <UserNotRegisteredError />;
  }

  return (
    <Routes>
      {/* Auth routes - accessible without authentication */}
      <Route path="/dispatch-tools" element={<DispatchTools />} />
      <Route path="/income-calculator" element={<IncomeCalculatorPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected routes - require authentication */}
      <Route element={isAuthenticated ? <ProtectedLayout /> : <Navigate to="/login" replace />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/carriers" element={<CarrierDatabase />} />
        <Route path="/carriers/:id" element={<CarrierDetail />} />
        <Route path="/research" element={<CarrierResearch />} />
        <Route path="/campaigns" element={<EmailCampaigns />} />
        <Route path="/email-testing" element={<EmailTesting />} />
        <Route path="/outreach" element={<Outreach />} />
        <Route path="/calling" element={<CallingQueue />} />
        <Route path="/handoffs" element={<HumanHandoff />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/brokers" element={<BrokerVetting />} />
        <Route path="/import-export" element={<ImportExport />} />
        <Route path="/activity" element={<ActivityLog />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/tools" element={<Tools />} />
        <Route path="/quiz-hub" element={<QuizHub />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App