const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto'); // для проверки подписи от VK

const app = express();
app.use(bodyParser.json());

// Секретный ключ, который укажешь в настройках VK (раздел "Платежи")
const VK_SECRET = "00Az3wTs1tFYUOdaZuHQ";

// Временная "база" пользователей
const users = {};

// База товаров
const items = {
  'sale_item_id_50': {
    title: '50 монет',
    price: 50,
    photo_url: 'https://example.com/coin50.png',
    item_id: 'sale_item_id_50',
  },
  'sale_item_id_100': {
    title: '100 монет',
    price: 100,
    photo_url: 'https://example.com/coin100.png',
    item_id: 'sale_item_id_100',
  },
};


function checkSignature(req) {
  if (!VK_SECRET) return true; 
  return req.body.secret === VK_SECRET;
}


app.post('/purchase', (req, res) => {
  const data = req.body;
  console.log('Получено уведомление от VK:', data);

  if (!checkSignature(req)) {
    console.warn('⚠️ Подпись не совпала! Запрос не от VK.');
    return res.status(403).json({ error: 'Invalid signature' });
  }

  switch (data.type) {
    case 'get_item': {
      const itemId = data.item || data.item_id;
      const item = items[itemId];
      if (!item) return res.status(404).json({ error: 'Item not found' });

      return res.json({
        response: {
          item_id: item.item_id,
          title: item.title,
          price: item.price,
          photo_url: item.photo_url,
        },
      });
    }

    case 'order_status_change': {
      const { order_id, status, item_id, user_id } = data;

      if (!users[user_id]) users[user_id] = { coins: 0 };

      if (status === 'chargeable' || status === 'paid') {
        const coinsToAdd = items[item_id]?.price || 0;
        users[user_id].coins += coinsToAdd;
        console.log(` Пользователь ${user_id} купил ${coinsToAdd} монет, order_id=${order_id}`);
        return res.json({ response: 'ok' });
      } else if (status === 'refunded') {
        const coinsToSubtract = items[item_id]?.price || 0;
        users[user_id].coins = Math.max(0, users[user_id].coins - coinsToSubtract);
        console.log(`↩Возврат заказа ${order_id}, снято ${coinsToSubtract} монет`);
        return res.json({ response: 'ok' });
      }

      return res.json({ response: 'ignored' });
    }

    default:
      return res.status(400).json({ error: 'Unknown type' });
  }
});


app.get('/balance/:user_id', (req, res) => {
  const userId = req.params.user_id;
  const coins = users[userId]?.coins || 0;
  res.json({ user_id: userId, coins });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
