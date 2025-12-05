import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { useState } from "react";

import OnboardingPage from "./pages/OnboardingPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import JournalPage from "./pages/JournalPage.jsx";
import AchievementsPage from "./pages/AchievementsPage.jsx";
import ProtectedRoute from "./app/ProtectedRoute.jsx";
import InitializeAuth from "./features/auth/InitializeAuth.jsx";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n.js";

console.log("=== FINAL TEST - STATIC IMPORTS ===");

// Создаем router
const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/onboarding" replace />,
  },
  {
    path: "/onboarding",
    element: <OnboardingPage />,
  },
  {
    path: "/login",
    element: <AuthPage />,
  },
  {
    path: "/signup",
    element: <AuthPage />,
  },
  // Защищенные роуты
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/homepage",
        element: <HomePage />,
      },
      {
        path: "/profile",
        element: <ProfilePage />,
      },
      {
        path: "/profile/settings",
        element: <SettingsPage />,
      },
      {
        path: "/journal",
        element: <JournalPage />,
      },
      {
        path: "/achievements",
        element: <AchievementsPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/onboarding" replace />,
  },
]);

export default function App() {
  const [globalError, setGlobalError] = useState(null);

  return (
    <I18nextProvider i18n={i18n}>
      <Provider store={store}>
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
            <RouterProvider router={router} />
          </main>
        </div>
      </Provider>
    </I18nextProvider>
  );
}
