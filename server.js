const express = require('express');
const fs = require('fs');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync('users.json', 'utf-8'));

  if (users.find(u => u.username === username)) {
    return res.send('이미 존재하는 아이디입니다.');
  }

  const hashed = await bcrypt.hash(password, 10);
  users.push({ username, password: hashed });

  fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
  res.send('회원가입 성공!');
});

app.listen(port, () => {
  console.log(`Site running at http://localhost:${port}`);
});
