import { bridge } from '@vkontakte/vk-bridge';

export const initVK = async () => {
  try {
    console.log("[vkInit] Initializing VK Bridge");
    
    await bridge.send('VKWebAppInit');
    console.log("[vkInit] VKWebAppInit successful");
    
    console.log("[vkInit] Getting user info");
    const user = await bridge.send('VKWebAppGetUserInfo');
    console.log("[vkInit] User info received:", { id: user.id, firstName: user.first_name });
    
    console.log("[vkInit] Getting launch params");
    const launchParams = await bridge.send('VKWebAppGetLaunchParams');
    console.log("[vkInit] Launch params received");
    
    return {
      user,
      launchParams,
      isAuthenticated: true
    };
  } catch (error) {
    console.error('[vkInit] VK init error:', {
      message: error.message,
      code: error.code
    });
    throw error;
  }
};