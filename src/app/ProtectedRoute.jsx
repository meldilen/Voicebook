import React from "react";
import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { selectIsAuthenticated } from "../features/auth/authSlice.js";

const ProtectedRoute = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const location = useLocation();

  const isFromLogout = location.state?.fromLogout;

  if (!isAuthenticated) {
    return (
      <Navigate
        to={isFromLogout ? "/onboarding" : "/login"}
        state={{ from: location }}
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;