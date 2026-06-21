import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { useState, useCallback, lazy, Suspense } from 'react';
import { useDarkMode } from '@/hooks/useDarkMode';
import Layout from './components/Layout.jsx';


// Lazy-load heavier pages
const Incidents = lazy(() => import('./pages/Incidents'));
const ReportIncident = lazy(() => import('./pages/ReportIncident'));
const Rides = lazy(() => import('./pages/Rides'));
const Travel = lazy(() => import('./pages/Travel'));
const Alerts = lazy(() => import('./pages/Alerts'));
const Hotels = lazy(() => import('./pages/Hotels'));
const SafetyCheck = lazy(() => import('./pages/SafetyCheck'));
const EmergencyContacts = lazy(() => import('./pages/EmergencyContacts'));
const DriverSignup = lazy(() => import('./pages/DriverSignup'));
const DriverDashboard = lazy(() => import('./pages/DriverDashboard'));
const UserProfile = lazy(() => import('./pages/UserProfile'));
const GuardianMode = lazy(() => import('./pages/GuardianMode'));
const EmergencyProfilePage = lazy(() => import('./pages/EmergencyProfile'));
const TripHistory = lazy(() => import('./pages/TripHistory'));
const EmergencyDashboard = lazy(() => import('./pages/EmergencyDashboard'));
const DriversLeaderboard = lazy(() => import('./pages/DriversLeaderboard'));
const SafePlaces = lazy(() => import('./pages/SafePlaces'));
const FamilySafety = lazy(() => import('./pages/FamilySafety'));

import Splash from './pages/Splash';
import Onboarding from './pages/Onboarding';
import Home from './pages/Home';

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const AuthenticatedApp = () => {
  useDarkMode();
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const handleSplashComplete = useCallback(() => {
    const seen = localStorage.getItem('sentrya_onboarded');
    if (seen) {
      setShowSplash(false);
    } else {
      setShowSplash(false);
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    localStorage.setItem('sentrya_onboarded', 'true');
    setShowOnboarding(false);
  }, []);

  if (showSplash) {
    return <Splash onComplete={handleSplashComplete} />;
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // App is public - don't block access for auth errors
  // Users can use the app without being registered/logged in

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/rides" element={<Rides />} />
          <Route path="/travel" element={<Travel />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/profile" element={<UserProfile />} />
        </Route>
        <Route path="/incidents/report" element={<ReportIncident />} />
        <Route path="/safety-check" element={<SafetyCheck />} />
        <Route path="/emergency-contacts" element={<EmergencyContacts />} />
        <Route path="/driver-signup" element={<DriverSignup />} />
        <Route path="/driver-dashboard" element={<DriverDashboard />} />
        <Route path="/guardian-mode" element={<GuardianMode />} />
        <Route path="/emergency-profile" element={<EmergencyProfilePage />} />
        <Route path="/trip-history" element={<TripHistory />} />
        <Route path="/emergency-dashboard" element={<EmergencyDashboard />} />
        <Route path="/drivers-leaderboard" element={<DriversLeaderboard />} />
        <Route path="/safe-places" element={<SafePlaces />} />
        <Route path="/family-safety" element={<FamilySafety />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App