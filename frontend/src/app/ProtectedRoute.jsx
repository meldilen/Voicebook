import { useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { selectIsAuthenticated } from "../features/auth/authSlice";

const ProtectedRoute = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const location = useLocation();

  const isFromLogout = location.state?.fromLogout;

  return isAuthenticated ? (
    <Outlet />
  ) : (
    <Navigate
      to={isFromLogout ? "/onboarding" : "/login"}
      state={{ from: location }}
      replace
    />
  );
};

export default ProtectedRoute;
