import { bridge } from '@vkontakte/vk-bridge';

export const initVK = async () => {
  try {
    // Инициализируем VK Bridge
    await bridge.send('VKWebAppInit');
    
    // Получаем данные пользователя
    const user = await bridge.send('VKWebAppGetUserInfo');
    
    // Получаем launch params для подписи
    const launchParams = await bridge.send('VKWebAppGetLaunchParams');
    
    return {
      user,
      launchParams,
      isAuthenticated: true
    };
  } catch (error) {
    console.error('VK init error:', error);
    throw error;
  }
};