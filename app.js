//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require('lodash');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');



const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


app.use(session({
  secret: "SecretWillBeSecret.",
  resave: false,
  saveUninitialized: true,
  // cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-anandb0101:QW5hbmRi@cluster0.1ylq2.mongodb.net/blogDB?retryWrites=true&w=majority",{ useNewUrlParser: true, useUnifiedTopology: true });
// mongoose.connect("mongodb://localhost:27017/blogDB",{ useNewUrlParser: true,  useUnifiedTopology: true  });


const userSchema = mongoose.Schema({
  username:String,
  password:String,
  posts : [{
    title:String,
    content:String
  }]
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req, res) {
  if(req.isAuthenticated()) {
    User.findById(req.user._id,function(err, foundUser){
      if(err) {
        console.log(err);
      } else {
        if(foundUser) {
          res.render("home", {
            posts : foundUser.posts
          });
        } else {
          console.log("user not found");
        }
      }
    });
  } else {
    res.redirect("/login");
  }
  
});

app.get("/about", function(req, res) {
  res.render("about");
});

app.get("/contact", function(req, res) {
  res.render("contact");
});

app.get("/login", function(req,res) {
  res.render("login");
});

app.get("/register", function(req, res) {
  res.render("register");
});

app.get("/compose", function(req,res) {
  res.render("compose");
});

app.post("/register", function(req, res) {
  User.register({username:req.body.username}, req.body.password, function(err, user){
      if(err) {
          console.log(err);
          res.redirect("/register");
      } else {
          passport.authenticate("local")(req, res, function(){
              res.redirect("/");
          });
      }
  });
});

app.post("/login", function(req, res){
  const user = new User({
      username:req.body.username,
      password:req.body.password
  });
  req.login(user, function(err){
      if(err) {
          console.log(err);
      } else {
          passport.authenticate("local")(req, res, function(){
              res.redirect("/");
          });
      }
  });
});


app.post("/compose", function(req,res){
  
  if(req.isAuthenticated()) {
    const newPost = {
      title : _.capitalize(req.body.title),
      content : req.body.postBody
    };
    User.findById(req.user._id, function(err, foundUser){
      if(err) {
        console.log(err) ;
      } else {
        foundUser.posts.push(newPost);
        foundUser.save(function(err){
          if(err) {
            console.log(err);
          } else {
            res.redirect("/");
          }
        });
      }
    });
  } else {
    res.redirect("/login");
  }
  
});

app.get("/posts/:postId",function(req, res){
  if(req.isAuthenticated()) {
    let requestedPostID = req.params.postId ;
    User.findById(req.user._id, function(err,foundUser){
      if(err) {
        console.log(err);
      } else {
        if(foundUser) {
          foundUser.posts.forEach(function(post){
            if(post._id==requestedPostID) {
              res.render("post",{
                postTitle:post.title,
                content:post.content
              });
            }
          });
        } else {
          console.log("user not found");
        }
      }
      
    });
  } else {
    res.redirect("/login");
  }
  
});









let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port "+port);
});
