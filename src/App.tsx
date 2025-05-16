
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from './pages/Index';
import AuthPage from './pages/AuthPage';
import NotFound from './pages/NotFound';
import { Toaster } from './components/ui/toaster';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ProfilePage from './pages/ProfilePage';
import TrackView from './pages/TrackView';
import FeedbackView from './pages/FeedbackView';
import { AuthProvider } from './context/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NewVersionPage from './pages/NewVersionPage';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            {/* Important: The more specific route (with shareKey) must come BEFORE the more general route */}
            <Route path="/track/share/:shareKey" element={<TrackView />} />
            <Route path="/track/:trackId" element={<TrackView />} />
            <Route path="/feedback/:feedbackId" element={<FeedbackView />} />
            
            {/* Protected routes */}
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/track/:trackId/version" element={<ProtectedRoute><NewVersionPage /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
