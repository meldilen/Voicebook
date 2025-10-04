import React, { useEffect, useState } from 'react';
import bridge from '@vkontakte/vk-bridge';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCoins, FaPlay } from 'react-icons/fa';
import './PagePay.css'; 
import { useSelector, useDispatch } from 'react-redux';
import { selectCoinsBalance, setCoins } from '../features/Header/coinsSlice.js';

export default function TopUp() {
  const coins = useSelector(selectCoinsBalance);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [userId, setUserId] = useState(null);

  // Получаем данные пользователя из VK
  useEffect(() => {
    bridge.send('VKWebAppGetUserInfo')
      .then((user) => {
        setUserId(user.id);

        // Загружаем баланс с сервера
        fetch(`/balance/${user.id}`)
          .then(res => res.json())
          .then(data => {
            dispatch(setCoins(data.coins));
          });
      })
      .catch(err => console.error("Ошибка получения пользователя VK:", err));
  }, [dispatch]);

  const watchAd = () => {
    alert("Реклама просмотрена. Монеты будут начислены на сервере");
  };

  const buyCoins = (itemId, amount) => {
    if (!userId) return alert("Пользователь не определён");

    bridge.send('VKWebAppShowOrderBox', {
      type: 'item',
      item: itemId
    })
    .then((data) => {
      if (data.status === 'ok') {
        alert(`Покупка обрабатывается сервером...`);
        setTimeout(() => {
          fetch(`/balance/${userId}`)
            .then(res => res.json())
            .then(data => dispatch(setCoins(data.coins)));
        }, 2000);
      }
    })
    .catch(err => {
      console.error("Ошибка покупки:", err);
      alert("Не удалось купить монеты");
    });
  };

  return (
    <div className="container">
      <button className="back-btn" onClick={() => navigate("/homepage")} title="Вернуться на главную">
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

          <button className="buy-coins-btn" onClick={() => buyCoins('sale_item_id_50', 50)}>
            Купить 50 монет
          </button>
        </div>
      </div>
    </div>
  );
}
