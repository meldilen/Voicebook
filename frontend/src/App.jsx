import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { useState } from "react";
import OnboardingPage from "./pages/OnboardingPage";
// import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/NewHomePage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import ProtectedRoute from "./app/ProtectedRoute";
import InitializeAuth from "./features/auth/InitializeAuth";
import JournalPage from "./pages/JournalPage"; 
import AchievementsPage from "./pages/AchievementsPage";
import PayPage from "./pages/PayPage"; 
import AuthError from "./pages/AuthError";

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
              <Route path="/" element={<Navigate to="/homepage" replace />} />
              
              <Route element={<ProtectedRoute />}>
                <Route path="/homepage" element={<HomePage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />
                <Route path="/achievements" element={<AchievementsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/settings" element={<SettingsPage />} />
                <Route path="/journal" element={<JournalPage />} />
                <Route path="/pay" element={<PayPage />} />
              </Route>

              <Route path="/auth-error" element={<AuthError />} />

              <Route path="*" element={
                <Navigate to="/homepage" replace state={{ from: '404-redirect' }} />
              } />
            </Routes>
          </main>
        </div>
      </Router>
    </Provider>
  );
}