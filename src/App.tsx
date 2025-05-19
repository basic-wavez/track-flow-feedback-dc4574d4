
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import TrackView from "./pages/TrackView";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AboutPage from "./pages/AboutPage";
import FAQPage from "./pages/FAQPage";
import ContactPage from "./pages/ContactPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import CookiePolicyPage from "./pages/CookiePolicyPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import { Toaster } from "@/components/ui/toaster";
import CookieConsent from "./components/CookieConsent";
import ProfilePage from "./pages/ProfilePage";
import FeedbackView from "./pages/FeedbackView";
import NewVersionPage from "./pages/NewVersionPage";
import BugReportPage from "./pages/BugReportPage";
import AdminRoute from "./components/auth/AdminRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { AuthProvider } from "./context/AuthContext";
import PlaylistsPage from "./pages/PlaylistsPage";
import PlaylistView from "./pages/PlaylistView";
import EditPlaylistPage from "./pages/EditPlaylistPage";
import AddTracksToPlaylist from "./pages/AddTracksToPlaylist";
import PlaylistPlayerView from "./pages/PlaylistPlayerView";
import { PlaylistPlayerProvider } from "./context/PlaylistPlayerContext";
import "./App.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <PlaylistPlayerProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="/cookies" element={<CookiePolicyPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/bug-report" element={<BugReportPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/track/:trackId" element={<TrackView />} />
              <Route path="/track/:trackId/new-version" element={<NewVersionPage />} />
              <Route path="/feedback/:feedbackId" element={<FeedbackView />} />
              <Route path="/playlists" element={<PlaylistsPage />} />
              <Route path="/playlist/:playlistId" element={<PlaylistView />} />
              <Route path="/playlist/:playlistId/edit" element={<EditPlaylistPage />} />
              <Route path="/playlist/:playlistId/add-tracks" element={<AddTracksToPlaylist />} />
              <Route path="/playlist/:playlistId/play" element={<PlaylistPlayerView />} />
            </Route>

            {/* Admin routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          <CookieConsent />
        </PlaylistPlayerProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
