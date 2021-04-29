require("dotenv").config();
const express = require("express");
const app = express();
//const googleapis=require("googleapis")
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
//const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

const findOrCreate = require("mongoose-findorcreate");

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
  "mongodb://127.0.0.1:27017/userDB",
  { useNewUrlParser: true, useUnifiedTopology: true },
  function (err, result) {
    if (!err) {
      console.log("connected successfully!!!");
    } else {
      console.log("connection failed");
    }
  }
);

mongoose.set("useCreateIndex", "true");
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secrets: String,
});

//set passport-local-mongoose to save password with hashing inside the db
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User", userSchema);
app.get("/", function (req, res) {
  res.render("home");
});

//passport local config
passport.serializeUser(function (user, done) {
  done(null, user.id);
});
passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});
passport.use(User.createStrategy());
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
    function (accessToken, refreshToken, profile, cb) {
      //console.log(profile)
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        if (err) {
          console.log(err);
        }
        return cb(err, user);
      });
    }
  )
);

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile"] })
);
app.get(
  "/auth/google/secrets",
  passport.authenticate("google", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/secrets");
  }
);

app.get("/login", function (req, res) {
  res.render("login");
});
app.get("/register", function (req, res) {
  res.render("register");
});
//creating secrets route because whenver user want to navigate to secret once logged in then it must be rendered
app.get("/secrets", function (req, res) {
  User.find({ secrets: { $ne: null } }, function (err, foundUser) {
    console.log("inside get secrets");
    // if(err)
    // {
    //   console.log("secret is not there")
    // }
    if (foundUser) {
      console.log("user is " + foundUser);
      console.log("render" + foundUser.secrets);
      res.render("secrets", { secretData: foundUser });
    } else {
      console.log("secrets is secret");
    }
  });
});

app.get("/logout", function (req, res) {
  //logout the user
  req.logout();
  res.redirect("/"); // whenevr server is restarted then session will be deleted
});
app.post("/login", function (req, res) {
  const user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  req.login(user, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/register", function (req, res) {
  User.register(
    { username: req.body.username },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        res.redirect("/register");
      } else {
        //triggered if the user is authenticated i.e set cookie for current login session created
        passport.authenticate("local")(req, res, function () {
          res.redirect("/secrets");
        });
      }
    }
  );
});
app.get("/submit", function (req, res) {
  if (req.isAuthenticated()) {
    res.render("submit");
  } else {
    console.log("failed");
    res.redirect("/login");
  }
  //res.render("submit");
});

app.post("/submit", function (req, res) {
  const secret = req.body.secret;
  console.log("user is" + req.user);
  const id = req.user.id;
  User.findById(id, function (err, foundUser) {
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secrets = secret;
        foundUser.save(function () {
          res.redirect("/secrets");
        });
      }
    }
  });
});
app.listen("3000", function (req, res) {
  console.log("app running on port 3000");
});
