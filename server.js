const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Post = require("./models/Post");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 });
  res.render("index", { posts });
});

app.get("/new", (req, res) => {
  res.render("new");
});

app.post("/new", async (req, res) => {
  const { title, content } = req.body;
  await Post.create({ title, content });
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
