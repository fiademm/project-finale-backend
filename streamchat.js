// const express = require('express');
// const { StreamChat } = require('stream-chat');

// const app = express();
// const chatClient = new StreamChat('cm5fsf6rc8xz', 'nthhsgnt4bv5nf4ckewvkfe5beqrpjvcqtxy4gy4dqgnq3jy6n9perz36rd9wfn7');

// app.post('/auth', async (req, res) => {
//   const { userId } = req.body;

//   // Create a Stream Chat user with the given user ID
//   const { token } = chatClient.createToken(userId);

//   res.json({ token });
// });

// app.listen(7000, () => console.log('Server started on port 7000'));