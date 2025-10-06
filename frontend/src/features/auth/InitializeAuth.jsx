import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { initVK } from "../../vk/vkInit";
import { useVkAuthMutation } from "./authApi";
import { setVKCredentials, logout } from "./authSlice";

const InitializeAuth = () => {
  const dispatch = useDispatch();
  const [vkAuth] = useVkAuthMutation();

  useEffect(() => {
    const initialize = async () => {
      try {
        console.log("[InitializeAuth] Starting auth initialization");
        
        const vkData = await initVK();
        console.log("[InitializeAuth] VK init successful");
        
        const authResponse = await vkAuth({
          vkUserId: vkData.user.id,
          launchParams: vkData.launchParams
        }).unwrap();
        
        console.log("[InitializeAuth] Backend auth successful, dispatching credentials");
        
        dispatch(setVKCredentials({
          user: authResponse.user,
          token: 'vk-auth',
          launchParams: vkData.launchParams
        }));
        
        console.log("[InitializeAuth] Auth initialization completed successfully");
      } catch (error) {
        console.error('[InitializeAuth] Auth initialization failed:', {
          message: error.message,
          step: error.step || 'unknown'
        });
        dispatch(logout());
      }
    };

    initialize();
  }, [dispatch, vkAuth]);

  return null;
};

export default InitializeAuth;