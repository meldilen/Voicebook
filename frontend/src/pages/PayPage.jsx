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
  const [message, setMessage] = useState('');

  // Получаем данные пользователя из VK
  useEffect(() => {
    bridge.send('VKWebAppGetUserInfo')
      .then((user) => {
        setUserId(user.id);

        // Загружаем баланс с сервера
        fetch(`/api/vk/balance/${user.id}`)
          .then(res => res.json())
          .then(data => dispatch(setCoins(data.coins)))
          .catch(err => console.error("Ошибка загрузки баланса:", err));

        // После покупки проверяем баланс
        fetch(`/api/vk/balance/${user.id}`)
          .then(res => res.json())
          .then(data => dispatch(setCoins(data.coins)))
          .catch(err => console.error("Ошибка проверки баланса:", err));
      })
      .catch(err => console.error("Ошибка получения пользователя VK:", err));
  }, [dispatch]);

  // Просмотр рекламы (фейковое начисление)
  const watchAd = async () => {
  try {
    setMessage('Реклама просмотрена. Начисляем монеты...');

    const res = await fetch(`/api/vk/add-coins/${userId}?amount=5`, { method: 'POST' });
    const json = await res.json();

    // Если сервер вернул подозрительно низкий баланс — добавляем локально
    const newBalance = json?.coins && json.coins >= coins
      ? json.coins
      : coins + 5;

    dispatch(setCoins(newBalance));
    setMessage(`💰 +5 монет за просмотр рекламы! Баланс: ${newBalance}`);
  } catch (err) {
    console.error('Ошибка начисления монет:', err);
    setMessage('Не удалось начислить монеты.');
  }
};

  // const watchAd = async () => {
  //   try {
  //     setMessage('Реклама просмотрена. Начисляем монеты...');
  //     // имитация начисления
  //     const res = await fetch(`/api/vk/add-coins/${userId}?amount=5`, { method: 'POST' });
  //     const json = await res.json();
  //     dispatch(setCoins(json.coins));
  //     setMessage('💰 +5 монет за просмотр рекламы!');
  //   } catch (err) {
  //     console.error('Ошибка начисления монет:', err);
  //     setMessage('Не удалось начислить монеты.');
  //   }
  // };

  // Покупка монет
  const buyCoins = (itemId, amount) => {
    if (!userId) {
      setMessage('Пользователь не определён.');
      return;
    }

    bridge.send('VKWebAppShowOrderBox', {
      type: 'item',
      item: itemId
    })
      .then((data) => {
        if (data.status === 'ok') {
          setMessage('Покупка обрабатывается сервером...');
          setTimeout(() => {
            fetch(`/api/vk/balance/${userId}`)
              .then(res => res.json())
              .then(data => {
                dispatch(setCoins(data.coins));
                setMessage(`Покупка успешна! Текущий баланс: ${data.coins}`);
              })
              .catch(err => {
                console.error("Ошибка обновления баланса:", err);
                setMessage("Ошибка обновления баланса.");
              });
          }, 2000);
        }
      })
      .catch(err => {
        console.error("Ошибка покупки:", err);
        setMessage("Не удалось купить монеты.");
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

        {message && <div className="info-message">{message}</div>}
      </div>
    </div>
  );
}






// import React, { useEffect, useState } from 'react';
// import bridge from '@vkontakte/vk-bridge';
// import { useNavigate } from 'react-router-dom';
// import { FaArrowLeft, FaCoins, FaPlay } from 'react-icons/fa';
// import './PagePay.css'; 
// import { useSelector, useDispatch } from 'react-redux';
// import { selectCoinsBalance, setCoins } from '../features/Header/coinsSlice.js';

// export default function TopUp() {
//   const coins = useSelector(selectCoinsBalance);
//   const dispatch = useDispatch();
//   const navigate = useNavigate();

//   const [userId, setUserId] = useState(null);

//   // Получаем данные пользователя из VK
//   useEffect(() => {
//     bridge.send('VKWebAppGetUserInfo')
//       .then((user) => {
//         setUserId(user.id);

//         // Загружаем баланс с сервера
//         fetch(`/api/vk/balance/${user.id}`)  // ← изменили URL
//           .then(res => res.json())
//           .then(data => {
//             dispatch(setCoins(data.coins));
//           });

//         // После покупки проверяем баланс
//         fetch(`/api/vk/balance/${userId}`)  // ← изменили URL
//           .then(res => res.json())
//           .then(data => dispatch(setCoins(data.coins)));
//               })
//       .catch(err => console.error("Ошибка получения пользователя VK:", err));
//   }, [dispatch]);

//   const watchAd = () => {
//     alert("Реклама просмотрена. Монеты будут начислены на сервере");
//   };

//   const buyCoins = (itemId, amount) => {
//     if (!userId) return alert("Пользователь не определён");

//     bridge.send('VKWebAppShowOrderBox', {
//       type: 'item',
//       item: itemId
//     })
//     .then((data) => {
//       if (data.status === 'ok') {
//         alert(`Покупка обрабатывается сервером...`);
//         setTimeout(() => {
//           fetch(`/balance/${userId}`)
//             .then(res => res.json())
//             .then(data => dispatch(setCoins(data.coins)));
//         }, 2000);
//       }
//     })
//     .catch(err => {
//       console.error("Ошибка покупки:", err);
//       alert("Не удалось купить монеты");
//     });
//   };

//   return (
//     <div className="container">
//       <button className="back-btn" onClick={() => navigate("/homepage")} title="Вернуться на главную">
//         <FaArrowLeft /> Главная
//       </button>

//       <div className="topup-card">
//         <FaCoins size={50} style={{ marginBottom: '15px', color: '#FFD700' }} />
//         <h2>Баланс монет</h2>
//         <h1 className="coin-balance">{coins}</h1>

//         <div className="topup-actions">
//           <button className="watch-ad-btn" onClick={watchAd}>
//             <FaPlay /> Посмотреть рекламу (+5)
//           </button>

//           <button className="buy-coins-btn" onClick={() => buyCoins('sale_item_id_50', 50)}>
//             Купить 50 монет
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }
