const express = require('express');
const fs = require('fs');
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// 정적 파일 경로
app.use(express.static(path.join(__dirname, 'public')));

// 템플릿 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// body-parser 설정
app.use(bodyParser.urlencoded({ extended: false }));

// 세션 설정
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));

// ✅ 홈페이지
app.get('/', (req, res) => {
  try {
    const user = req.session ? req.session.user : null;
    res.render('index', { user });
  } catch (err) {
    console.error('Error rendering index:', err);
    res.status(500).send('서버 오류입니다.');
  }
});

// ✅ 회원가입 폼
app.get('/register', (req, res) => {
  res.render('register');
});

// ✅ 회원가입 처리
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync('users.json', 'utf-8'));

    if (users.find(u => u.username === username)) {
      return res.send('이미 존재하는 아이디입니다.');
    }

    const hashed = await bcrypt.hash(password, 10);
    users.push({ username, password: hashed });

    fs.writeFileSync('users.json', JSON.stringify(users, null, 2));
    res.redirect('/login');
  } catch (err) {
    console.error('회원가입 에러:', err);
    res.status(500).send('회원가입 중 오류 발생');
  }
});

// ✅ 로그인 폼
app.get('/login', (req, res) => {
  res.render('login');
});

// ✅ 로그인 처리
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = JSON.parse(fs.readFileSync('users.json', 'utf-8'));
    const user = users.find(u => u.username === username);

    if (!user) return res.send('아이디가 존재하지 않습니다.');

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.send('비밀번호가 틀렸습니다.');

    req.session.user = { username: user.username };
    res.redirect('/');
  } catch (err) {
    console.error('로그인 에러:', err);
    res.status(500).send('로그인 중 오류 발생');
  }
});

// ✅ 로그아웃 처리
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});
