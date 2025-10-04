import React from 'react';
import bridge from '@vkontakte/vk-bridge';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCoins, FaPlay } from 'react-icons/fa';
import './PagePay.css'; 
import { useSelector, useDispatch } from 'react-redux';
import { selectCoinsBalance, addCoins } from '../features/Header/coinsSlice.js';

export default function TopUp() {
  const coins = useSelector(selectCoinsBalance);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const watchAd = () => {
    const earned = 5;
    dispatch(addCoins(earned)); 
  };

  const buyCoins = (amount) => {
    bridge.send('VKWebAppOpenPayForm', {
      app_id: 54024812,
      action: 'pay-to-service',
      params: {
        amount: amount,
        description: `Покупка ${amount} монет`,
        merchant_id: 617001,
        version: 2,
        sign: '',
        data: {
          order_id: Date.now(),
          currency: 'RUB',
          merchant_data: '',
          merchant_sign: ''
        }
      }
    })
    .then((data) => {
      if (data.status) {
        dispatch(addCoins(amount)); 
      }
    })
    .catch((error) => {
      console.error('Ошибка платежа:', error);
    });
  };

  return (
    <div className="container">
      <button
        className="back-btn"
        onClick={() => navigate("/homepage")}
        title="Вернуться на главную"
      >
        <FaArrowLeft /> Главная
      </button>

      <div className="topup-card">
        <FaCoins size={50} style={{ marginBottom: '15px', color: '#FFD700' }} />
        <h2>Баланс монет</h2>
        <h1 className="coin-balance">{coins}</h1>

        <div className="topup-actions">
          <button className="watch-ad-btn" onClick={watchAd}>
            <FaPlay /> Посмотреть рекламу (+5)
          </button>
          <button className="buy-coins-btn" onClick={() => buyCoins(50)}>
            Купить 50 монет
          </button>
        </div>
      </div>

      <div className="gradient-ball"></div>
      <div className="gradient-ball-2"></div>
      <div className="gradient-ball-3"></div>
      <div className="gradient-ball-4"></div>
    </div>
  );
}
