
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AuthPage from "./pages/AuthPage";
import ProfilePage from "./pages/ProfilePage";
import PlaylistsPage from "./pages/PlaylistsPage";
import PlaylistPage from "./pages/PlaylistView"; // Fixed import path
import EditPlaylistPage from "./pages/EditPlaylistPage";
import PlaylistPlayerView from "./pages/PlaylistPlayerView";
import PlaylistSharedView from "./pages/PlaylistSharedView";
import PlaylistSharedPlayerView from "./pages/PlaylistSharedPlayerView";

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/playlists" />} />
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
          path="/playlist/:playlistId/play"
          element={user ? <PlaylistPlayerView /> : <Navigate to="/auth" />}
        />
        <Route
          path="/shared/playlist/:shareKey"
          element={<PlaylistSharedView />}
        />
        <Route
          path="/shared/playlist/:shareKey/play"
          element={<PlaylistSharedPlayerView />}
        />
      </Routes>
    </Router>
  );
}

export default App;
