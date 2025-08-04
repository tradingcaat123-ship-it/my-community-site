const express = require('express');
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const app = express();
const port = process.env.PORT || 3000;

const USERS_FILE = 'users.json';
const POSTS_FILE = 'posts.json';

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: false,
  store: new FileStore({ path: './sessions' }),
  cookie: {
    maxAge: 1000 * 60 * 60,
    sameSite: 'lax'
  }
}));

// 홈
app.get('/', (req, res) => {
  let posts = fs.existsSync(POSTS_FILE) ? JSON.parse(fs.readFileSync(POSTS_FILE)) : [];
  posts.sort((a, b) => b.timestamp - a.timestamp);
  res.render('index', { user: req.session.user || null, posts });
});

// 회원가입
app.get('/register', (req, res) => res.render('register', { error: null }));
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  let users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE)) : [];
  if (users.find(u => u.username === username)) return res.render('register', { error: '이미 존재하는 아이디입니다.' });
  const hashed = await bcrypt.hash(password, 10);
  users.push({ username, password: hashed });
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
  res.redirect('/login');
});

// 로그인
app.get('/login', (req, res) => res.render('login', { error: null }));
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  let users = fs.existsSync(USERS_FILE) ? JSON.parse(fs.readFileSync(USERS_FILE)) : [];
  const user = users.find(u => u.username === username);
  if (!user) return res.render('login', { error: '아이디 없음' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.render('login', { error: '비밀번호 틀림' });
  req.session.user = { username };
  res.redirect('/');
});

// 로그아웃
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// 글쓰기
app.get('/write', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('write');
});
app.post('/write', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  const { icon, title, content } = req.body;
  const newPost = {
    id: Date.now(),
    icon: icon || '💬',
    title,
    content,
    username: req.session.user.username,
    timestamp: Date.now(),
    views: 0,
    likes: 0
  };
  let posts = fs.existsSync(POSTS_FILE) ? JSON.parse(fs.readFileSync(POSTS_FILE)) : [];
  posts.push(newPost);
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
  res.redirect('/');
});

// 글 상세 (조회수 +1)
app.get('/post/:id', (req, res) => {
  let posts = fs.existsSync(POSTS_FILE) ? JSON.parse(fs.readFileSync(POSTS_FILE)) : [];
  const post = posts.find(p => p.id == req.params.id);
  if (!post) return res.send('글 없음');
  post.views = (post.views || 0) + 1;
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
  res.render('post', { post });
});

// 글 삭제
app.post('/delete/:id', (req, res) => {
  let posts = fs.existsSync(POSTS_FILE) ? JSON.parse(fs.readFileSync(POSTS_FILE)) : [];
  posts = posts.filter(p => p.id != req.params.id);
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
  res.send('<h2>글이 삭제되었습니다.</h2><a href="/">홈으로 가기</a>');
});

// 좋아요 기능
app.post('/like/:id', (req, res) => {
  let posts = fs.existsSync(POSTS_FILE) ? JSON.parse(fs.readFileSync(POSTS_FILE)) : [];
  const post = posts.find(p => p.id == req.params.id);
  if (!post) return res.status(404).send('글 없음');
  post.likes = (post.likes || 0) + 1;
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
  res.redirect('/post/' + post.id);
});

// 글 상세 페이지 (조회수 증가 포함)
app.get('/post/:id', (req, res) => {
  let posts = fs.existsSync(POSTS_FILE) ? JSON.parse(fs.readFileSync(POSTS_FILE)) : [];
  const postIndex = posts.findIndex(p => p.id == req.params.id);
  if (postIndex === -1) return res.send('글 없음');

  // 조회수 +1
  posts[postIndex].views = (posts[postIndex].views || 0) + 1;
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));

  const post = posts[postIndex];
  res.render('post', { post });
});

// 좋아요 처리
app.post('/like/:id', (req, res) => {
  let posts = fs.existsSync(POSTS_FILE) ? JSON.parse(fs.readFileSync(POSTS_FILE)) : [];
  const postIndex = posts.findIndex(p => p.id == req.params.id);
  if (postIndex === -1) return res.send('글 없음');

  posts[postIndex].likes = (posts[postIndex].likes || 0) + 1;
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));

  res.redirect('/post/' + req.params.id);
});

app.listen(port, () => console.log(`서버 실행 중: http://localhost:${port}`));
