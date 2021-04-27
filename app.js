require('dotenv').config()
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt=require('mongoose-encryption')

app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.use(express.static("public"));
//db connect

mongoose.connect(
    "mongodb://localhost:27017/userDB",
    { useNewUrlParser: true, useUnifiedTopology: true },
    function (err, result) {
      if (!err) {
        console.log("connected successfully!!!");
      } else {
        console.log("connection failed");
      }
    }
  );

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]})
const User = new mongoose.model("User", userSchema);
app.get("/", function (req, res) {
  res.render("home");
});
app.get("/login", function (req, res) {
  res.render("login");
});
app.get("/register", function (req, res) {
  res.render("register");
});

app.post("/login", function (req, res) {
  const uname = req.body.username;
  const pass = req.body.password;
  User.findOne({ email: uname }, function (err, user) {
    if (err) {
      res.send("<h1>user doesn't exists!!!</h1>");
    } else {
      if (user) {
        if (user.password === pass) {
          res.render("secrets");
        } else {
          res.redirect("/login");
        }
      }
    }
  });
});

app.post("/register", function (req, res) {
  const email = req.body.username;
  const password = req.body.password;
  const newUser = new User({
    email: email,
    password: password,
  });
      newUser.save(function (err) {
        if (!err) {
          res.render("secrets");
        } else {
          res.send("<h1>user doesn't exist</h1>");
        }
      });
    
 });
app.listen("3000", function (req, res) {
  console.log("app running on port 3000");
});
