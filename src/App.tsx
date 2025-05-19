
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useParams
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { PlaylistPlayerProvider } from "./context/PlaylistPlayerContext";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import PlaylistsPage from "./pages/PlaylistsPage";
import PlaylistPage from "./pages/PlaylistView"; 
import EditPlaylistPage from "./pages/EditPlaylistPage";
import PlaylistPlayerView from "./pages/PlaylistPlayerView";
import PlaylistSharedView from "./pages/PlaylistSharedView";
import AddTracksToPlaylist from "./pages/AddTracksToPlaylist";
import TrackView from "./pages/TrackView";
import NewVersionPage from "./pages/NewVersionPage";
import FeedbackView from "./pages/FeedbackView";
import Index from "./pages/Index";

// Helper component to handle the redirect with parameters
function LegacyPlaylistRedirect() {
  const { shareKey } = useParams();
  return <Navigate to={`/shared/playlist/${shareKey}`} replace />;
}

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
        <Route
          path="/playlists"
          element={user ? <PlaylistsPage /> : <Navigate to="/auth" />}
        />
        <Route
          path="/playlist/:playlistId"
          element={user ? <PlaylistPage /> : <Navigate to="/auth" />}
        />
        <Route
          path="/playlist/:playlistId/edit"
          element={user ? <EditPlaylistPage /> : <Navigate to="/auth" />}
        />
        <Route
          path="/playlist/:playlistId/add-tracks"
          element={user ? <AddTracksToPlaylist /> : <Navigate to="/auth" />}
        />
        <Route
          path="/playlist/:playlistId/play"
          element={
            user ? (
              <PlaylistPlayerProvider>
                <PlaylistPlayerView />
              </PlaylistPlayerProvider>
            ) : (
              <Navigate to="/auth" />
            )
          }
        />
        <Route
          path="/shared/playlist/:shareKey"
          element={
            <PlaylistPlayerProvider>
              <PlaylistSharedView />
            </PlaylistPlayerProvider>
          }
        />
        {/* Legacy route remains temporarily for backward compatibility */}
        <Route
          path="/shared/playlist/:shareKey/play"
          element={<LegacyPlaylistRedirect />}
        />
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
