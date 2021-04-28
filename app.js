require("dotenv").config();
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

app.use(bodyParser.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.use(express.static("public"));

//session
app.use(
  session({
    secret: "thisismysecret",
    resave: false,
    saveUninitialized: false,
    })
);

//initializing passport package and session 
app.use(passport.initialize());
app.use(passport.session());

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

mongoose.set("useCreateIndex","true")
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

//set passport-local-mongoose to save password with hashing inside the db
userSchema.plugin(passportLocalMongoose) 

const User = new mongoose.model("User", userSchema);
app.get("/", function (req, res) {
  res.render("home");
});

passport.use(User.createStrategy())

//passport local config
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())


app.get("/login", function (req, res) {
  res.render("login");
});
app.get("/register", function (req, res) {
  res.render("register");
});
//creating secrets route because whenver user want to navigate to secret once logged in then it must be rendered

app.get("/secrets",function(req,res){
  if(req.isAuthenticated())
  {
    res.render("secrets")
  }
  else
  {
    console.log("failed")
    res.redirect("/login")
  }
})
app.get("/logout",function(req,res){
  //logout the user
  req.logout()
  res.redirect("/") // whenevr server is restarted then session will be deleted
})
app.post("/login", function (req, res) {
  const user = new User({
   username:req.body.username,
   password:req.body.password,
  })
  req.login(user,function(err){
    if(err)
    {
      console.log(err)
    }
    else
    {
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets")
    })
  }
  })
});

app.post("/register", function (req, res) {
  User.register({username:req.body.username},req.body.password,function(err,user){
    if(err)
    {
      console.log(err)
      res.redirect("/register")
    }
    else
    {
      //triggered if the user is authenticated i.e set cookie for current login session created
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets")
      })
    }
  })
});


app.listen("3000", function (req, res) {
  console.log("app running on port 3000");
});
