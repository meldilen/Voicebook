import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { initVK } from "../utils/vkInit";
import { useVkAuthMutation } from "./authApi";
import { setVKCredentials, logout } from "./authSlice";

const InitializeAuth = () => {
  const dispatch = useDispatch();
  const [vkAuth] = useVkAuthMutation();

  useEffect(() => {
    const initialize = async () => {
      try {
        const vkData = await initVK();
        const authResponse = await vkAuth({
          vkUserId: vkData.user.id,
          launchParams: vkData.launchParams
        }).unwrap();
        
        dispatch(setVKCredentials({
          user: authResponse.user,
          token: 'vk-auth',
          launchParams: vkData.launchParams
        }));
      } catch (error) {
        console.error('Auth initialization failed:', error);
        dispatch(logout());
      }
    };

    initialize();
  }, [dispatch, vkAuth]);

  return null;
};

export default InitializeAuth;