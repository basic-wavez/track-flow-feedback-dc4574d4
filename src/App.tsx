
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import AuthPage from './pages/AuthPage';
import NotFound from './pages/NotFound';
import { Toaster } from './components/ui/toaster';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import ProfilePage from './pages/ProfilePage';
import TrackView from './pages/TrackView';
import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NewVersionPage from './pages/NewVersionPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import FAQPage from './pages/FAQPage';
import BugReportPage from './pages/BugReportPage';
import CookieConsent from './components/CookieConsent';
import AdminDashboard from './pages/admin/AdminDashboard';
import FeedbackView from './pages/FeedbackView';
import { useMemo } from 'react';

// Create a query client that is resilient to tab switches
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 6, // 6 hours - data stays fresh much longer
      gcTime: 1000 * 60 * 60 * 12, // 12 hours - keep in cache much longer
      refetchOnWindowFocus: false, // Critical: Disable refetching when window regains focus
      refetchOnMount: false, // Don't refetch on component mount
      refetchOnReconnect: false, // Don't refetch on network reconnect
      retry: 1, // Only retry once
      refetchInterval: false, // Prevent periodic refetches
      structuralSharing: true, // Preserve data between renders
    },
  },
});

function App() {
  // Memoize the AuthProvider props to ensure component stability
  const authProviderProps = useMemo(
    () => ({ preventRefreshOnVisibilityChange: true }),
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider {...authProviderProps}>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            {/* Important: The more specific route (with shareKey) must come BEFORE the more general route */}
            <Route path="/track/share/:shareKey" element={<TrackView />} />
            <Route path="/track/:trackId" element={<TrackView />} />
            <Route path="/track/:trackId/feedback" element={<FeedbackView />} />
            
            {/* Protected routes */}
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/track/:trackId/version" element={<ProtectedRoute><NewVersionPage /></ProtectedRoute>} />
            
            {/* Admin routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            
            {/* Legal & Information pages */}
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/cookies" element={<CookiePolicyPage />} />
            <Route path="/about" element={<AboutPage />} />
            
            {/* Support pages */}
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/bug-report" element={<BugReportPage />} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieConsent />
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
