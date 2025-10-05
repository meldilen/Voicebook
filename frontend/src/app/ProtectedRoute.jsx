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
        // 1. Инициализируем VK
        const vkData = await initVK();
        
        // 2. Отправляем на бекенд для валидации
        const authResponse = await vkAuth({
          vkUserId: vkData.user.id,
          launchParams: vkData.launchParams
        }).unwrap();
        
        // 3. Сохраняем в Redux
        dispatch(setVKCredentials({
          user: {
            id: authResponse.user.id,
            vkUserId: authResponse.user.vkUserId,
            coins: authResponse.user.coins,
          },
          token: 'vk-auth', // или JWT если бекенд возвращает
          launchParams: vkData.launchParams
        }));
        
        setIsAuthenticated(true);
      } catch (error) {
        console.error('VK auth failed:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeVKAuth();
  }, [dispatch, vkAuth]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div>Загрузка VK Mini App...</div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/auth-error" replace />;
};

export default ProtectedRoute;