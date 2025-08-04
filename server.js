// 📁 server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

const USERS_FILE = 'users.json';
const POSTS_FILE = 'posts.json';

// 설정
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'secret-key', resave: false, saveUninitialized: true }));

// 홈
app.get('/', (req, res) => {
  const user = req.session.user || null;
  let posts = [];
  if (fs.existsSync(POSTS_FILE)) {
    posts = JSON.parse(fs.readFileSync(POSTS_FILE));
    posts.sort((a, b) => b.timestamp - a.timestamp);
  }
  res.render('index', { user, posts });
});

// 회원가입
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
  } catch {
    res.status(500).send('회원가입 오류');
  }
});

// 로그인
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

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

// 글쓰기 폼
app.get('/write', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('write');
});

// 글 작성 처리
app.post('/write', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { title, content } = req.body;
  const newPost = {
    id: Date.now().toString(),
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
  res.redirect('/');
});

// 게시글 상세
app.get('/post/:id', (req, res) => {
  if (!fs.existsSync(POSTS_FILE)) return res.send('글이 없습니다');
  const posts = JSON.parse(fs.readFileSync(POSTS_FILE));
  const post = posts.find(p => p.id == req.params.id);
  if (!post) return res.send('글이 없습니다');
  res.render('post', { post });
});

// 게시글 삭제
app.post('/delete/:id', (req, res) => {
  if (!fs.existsSync(POSTS_FILE)) return res.send('삭제할 글이 없습니다');
  let posts = JSON.parse(fs.readFileSync(POSTS_FILE));
  posts = posts.filter(p => p.id != req.params.id);
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
  res.send('<h2>글이 삭제되었습니다.</h2><a href="/">홈으로 가기</a>');
});

// 서버 실행
app.listen(port, () => {
  console.log(`서버 실행 중: http://localhost:${port}`);
});
