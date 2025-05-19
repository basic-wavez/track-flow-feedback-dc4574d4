
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Index from './pages/Index';
import NotFound from './pages/NotFound';
import AuthPage from './pages/AuthPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import TrackView from './pages/TrackView';
import ProfilePage from './pages/ProfilePage';
import NewVersionPage from './pages/NewVersionPage';
import FeedbackView from './pages/FeedbackView';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import BugReportPage from './pages/BugReportPage';
import AdminDashboard from './pages/admin/AdminDashboard';

import ProtectedRoute from './components/auth/ProtectedRoute';
import CookieConsent from './components/CookieConsent';
import AdminRoute from './components/auth/AdminRoute';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';
import './App.css';

import GlobalAudioProvider from './providers/GlobalAudioProvider';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <GlobalAudioProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/track/:trackId" element={<TrackView />} />
              <Route path="/track/share/:shareKey" element={<TrackView />} />
              <Route path="/feedback/:feedbackId" element={<FeedbackView />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile/:userId"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/add-version/:trackId"
                element={
                  <ProtectedRoute>
                    <NewVersionPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/terms" element={<TermsOfServicePage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              <Route path="/cookies" element={<CookiePolicyPage />} />
              <Route path="/bug-report" element={<BugReportPage />} />
              <Route
                path="/admin/*"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
            <CookieConsent />
          </Router>
        </GlobalAudioProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
