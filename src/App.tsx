
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { PlaylistPlayerProvider } from "./context/PlaylistPlayerContext";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import TrackView from "./pages/TrackView";
import NewVersionPage from "./pages/NewVersionPage";
import FeedbackView from "./pages/FeedbackView";
import Index from "./pages/Index";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

// Placeholder component for playlist routes
const PlaylistFeatureComingSoon = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Playlist Feature Coming Soon</CardTitle>
            <CardDescription>
              We're working on enhancing our playlist feature for an improved experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button 
              onClick={() => window.history.back()}
              className="mt-4"
            >
              Go Back
            </Button>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route
          path="/auth"
          element={!user ? <AuthPage /> : <Navigate to="/profile" />}
        />
        <Route
          path="/profile"
          element={user ? <ProfilePage /> : <Navigate to="/auth" />}
        />
        
        {/* Playlist routes - redirected to Coming Soon page */}
        <Route path="/playlists" element={<PlaylistFeatureComingSoon />} />
        <Route path="/playlist/:playlistId" element={<PlaylistFeatureComingSoon />} />
        <Route path="/playlist/:playlistId/edit" element={<PlaylistFeatureComingSoon />} />
        <Route path="/playlist/:playlistId/add-tracks" element={<PlaylistFeatureComingSoon />} />
        <Route path="/playlist/:playlistId/play" element={<PlaylistFeatureComingSoon />} />
        <Route path="/shared/playlist/:shareKey" element={<PlaylistFeatureComingSoon />} />
        <Route path="/shared/playlist/:shareKey/play" element={<PlaylistFeatureComingSoon />} />
        
        {/* Track Routes - Note: More specific routes come first */}
        <Route path="/track/share/:shareKey" element={<TrackView />} />
        <Route path="/track/:trackId/version" element={<NewVersionPage />} />
        <Route path="/track/:trackId/feedback" element={<FeedbackView />} />
        <Route path="/track/:trackId" element={<TrackView />} />
      </Routes>
    </Router>
  );
}

export default App;
