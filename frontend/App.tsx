import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NavBar, { MobileNav } from './components/NavBar';
import AudioPlayer from './components/AudioPlayer';
import Home from './pages/Home';
import Chat from './pages/Chat';
import Upload from './pages/Upload';
import Login from './pages/Login';
import Settings from './pages/Settings';
import SongDetail from './pages/SongDetail';
import Admin from './pages/Admin';
import { AudioProvider } from './context/AudioContext';
import { AuthProvider, useAuth } from './context/AuthContext';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AudioProvider>
        <Router>
          <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black overflow-hidden">
            {/* Ambient Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
              <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px] animate-float"></div>
              <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-3s' }}></div>
            </div>

            {/* Main Layout */}
            <div className="relative z-10 flex h-screen">
              <NavBar />
              <MobileNav />

              <main className="flex-1 overflow-y-auto overflow-x-hidden md:ml-20 pb-24 relative">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/chat" element={<Chat />} />
                  <Route path="/upload" element={<Upload />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/song/:id" element={<SongDetail />} />
                  <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                </Routes>
              </main>
            </div>

            <AudioPlayer />
          </div>
        </Router>
      </AudioProvider>
    </AuthProvider>
  );
};

const AdminRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { user } = useAuth();
  if (!user || !user.isAdmin) {
    return <Navigate to="/" />;
  }
  return children;
};


export default App;