const express = require('express');
const fs = require('fs');
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // 게시글 ID 생성용
const app = express();
const port = process.env.PORT || 3000;

const USERS_FILE = 'users.json';
const POSTS_FILE = 'posts.json';

// 📦 정적 파일 경로
app.use(express.static(path.join(__dirname, 'public')));

// 📦 템플릿 설정
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 📦 바디 파서
app.use(bodyParser.urlencoded({ extended: false }));

// 📦 세션 설정
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));

// ✅ 홈
app.get('/', (req, res) => {
  const user = req.session.user || null;
  res.render('index', { user });
});

// ✅ 회원가입
app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

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
  } catch (err) {
    res.status(500).send('회원가입 오류');
  }
});

// ✅ 로그인
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE)) : [];
    const user = users.find(u => u.username === username);

    if (!user) {
      return res.render('login', { error: '아이디가 존재하지 않습니다.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.render('login', { error: '비밀번호가 틀렸습니다.' });
    }

    req.session.user = { username };
    res.redirect('/');
  } catch (err) {
    res.status(500).render('login', { error: '로그인 중 오류 발생' });
  }
});

// ✅ 로그아웃
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// ✅ 게시판 목록
app.get('/board', (req, res) => {
  let posts = [];
  if (fs.existsSync(POSTS_FILE)) {
    posts = JSON.parse(fs.readFileSync(POSTS_FILE));
    posts.sort((a, b) => b.timestamp - a.timestamp);
  }
  res.render('board', { posts });
});

// ✅ 게시글 작성 폼
app.get('/board/new', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('new-post');
});

// ✅ 게시글 작성 처리
app.post('/board/new', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { title, content } = req.body;
  const newPost = {
    id: uuidv4(),
    title,
    content,
    username: req.session.user.username,
    timestamp: Date.now()
  };

  let posts = [];
  if (fs.existsSync(POSTS_FILE)) {
    posts = JSON.parse(fs.readFileSync(POSTS_FILE));
  }
  posts.push(newPost);
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
  res.redirect('/board');
});

// ✅ 게시글 상세 페이지
app.get('/board/:id', (req, res) => {
  if (!fs.existsSync(POSTS_FILE)) return res.status(404).send('게시글 없음');
  const posts = JSON.parse(fs.readFileSync(POSTS_FILE));
  const post = posts.find(p => p.id === req.params.id);
  if (!post) return res.status(404).send('게시글을 찾을 수 없습니다.');
  res.render('post', { post });
});

// ✅ 서버 실행
app.listen(port, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${port}`);
});
