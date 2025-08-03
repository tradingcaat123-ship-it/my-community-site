const express = require('express');
const app = express();
const port = process.env.PORT || 3000; // 💡 Render는 이 방식만 인식함

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send('Hello from Node.js on Render!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
