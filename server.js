const express = require('express');
const fs = require('fs');
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

const USERS_FILE = 'users.json';

// 정적 파일 설정
app.use(express.static(path.join(__dirname, 'public')));

// EJS 템플릿 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parser
app.use(bodyParser.urlencoded({ extended: false }));

// 세션 설정
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));

// 홈
app.get('/', (req, res) => {
  const user = req.session.user || null;
  res.render('index', { user });
});

// 회원가입 폼
app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

// 회원가입 처리
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE)) : [];

    if (users.find(u => u.username === username)) {
      return res.render('register', { error: '이미 존재하는 아이디입니다.' });
    }

    const hashed = await bcrypt.hash(password, 10);
    users.push({ username, password: hashed });
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    res.redirect('/login');
  } catch {
    res.status(500).send('회원가입 오류');
  }
});

// 로그인 폼
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// 로그인 처리
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE)) : [];
    const user = users.find(u => u.username === username);
    if (!user) return res.render('login', { error: '아이디가 존재하지 않습니다.' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.render('login', { error: '비밀번호가 틀렸습니다.' });

    req.session.user = { username };
    res.redirect('/');
  } catch {
    res.status(500).render('login', { error: '로그인 오류' });
  }
});

// 로그아웃
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.listen(port, () => {
  console.log(`서버 실행 중: http://localhost:${port}`);
});
