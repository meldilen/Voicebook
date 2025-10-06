// // import { useSelector } from "react-redux";
// import { Navigate, Outlet, useLocation } from "react-router-dom";
// // import { selectIsAuthenticated } from "../features/auth/authSlice";

// const ProtectedRoute = () => {
//   // const isAuthenticated = useSelector(selectIsAuthenticated);
//     const isAuthenticated = true;
//   const location = useLocation();

//   const isFromLogout = location.state?.fromLogout;

//   return isAuthenticated ? (
//     <Outlet />
//   ) : (
//     <Navigate
//       to={isFromLogout ? "/onboarding" : "/login"}
//       state={{ from: location }}
//       replace
//     />
//   );
// };

// export default ProtectedRoute;


import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useDispatch } from "react-redux";
import { initVK } from "../vk/vkInit";
import { useVkAuthMutation } from "../features/auth/authApi";
import { setVKCredentials } from "../features/auth/authSlice";

const ProtectedRoute = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const dispatch = useDispatch();
  const [vkAuth] = useVkAuthMutation();

  useEffect(() => {
    const initializeVKAuth = async () => {
      try {
        console.log("[ProtectedRoute] Starting VK initialization");
        
        const vkData = await initVK();
        console.log("[ProtectedRoute] VK init successful");
        
        console.log("[ProtectedRoute] Sending VK auth to backend");
        const authResponse = await vkAuth({
          vkUserId: vkData.user.id,
          launchParams: vkData.launchParams
        }).unwrap();
        
        console.log("[ProtectedRoute] Backend auth successful");
        
        dispatch(setVKCredentials({
          user: {
            id: authResponse.user.id,
            vkUserId: authResponse.user.vkUserId,
            coins: authResponse.user.coins,
          },
          token: 'vk-auth',
          launchParams: vkData.launchParams
        }));
        
        console.log("[ProtectedRoute] Redux state updated, setting authenticated");
        setIsAuthenticated(true);
      } catch (error) {
        console.error('[ProtectedRoute] VK auth failed:', {
          message: error.message,
          code: error.code,
          status: error.status
        });
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
        console.log("[ProtectedRoute] Loading completed, authenticated:", isAuthenticated);
      }
    };

    initializeVKAuth();
  }, [dispatch, vkAuth]);

  if (isLoading) {
    console.log("[ProtectedRoute] Rendering loading state");
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Загрузка VK Mini App...</div>
      </div>
    );
  }

  console.log("[ProtectedRoute] Rendering route, authenticated:", isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/auth-error" replace />;
};

export default ProtectedRoute;