import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { useState } from "react";
import OnboardingPage from "./pages/OnboardingPage";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import ProtectedRoute from "./app/ProtectedRoute.jsx";
import InitializeAuth from "./features/auth/InitializeAuth.jsx";
import JournalPage from "./pages/JournalPage"; 
import AchievementsPage from "./pages/AchievementsPage";

export default function App() {
  const [globalError, setGlobalError] = useState(null);

  return (
    <Provider store={store}>
      <Router basename="/">
        <InitializeAuth />
        <div className="app">
          <main className="app-content">
            {globalError && (
              <div className="global-error" role="alert">
                {globalError}
                <button onClick={() => setGlobalError(null)} aria-label="Close">
                  ✕
                </button>
              </div>
            )}
            
            <Routes>
              {/* Публичные роуты */}
              <Route path="/" element={<Navigate to="/onboarding" replace />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/signup" element={<AuthPage />} />
              
              {/* Защищенные роуты через ProtectedRoute */}
              <Route 
                path="/homepage" 
                element={
                  <ProtectedRoute>
                    <HomePage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/profile/settings" 
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/journal" 
                element={
                  <ProtectedRoute>
                    <JournalPage />
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/achievements" 
                element={
                  <ProtectedRoute>
                    <AchievementsPage />
                  </ProtectedRoute>
                } 
              />

              {/* 404 */}
              <Route path="*" element={
                <Navigate to="/onboarding" replace state={{ from: '404-redirect' }} />
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </Provider>
  );
}