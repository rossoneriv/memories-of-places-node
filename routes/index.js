var express = require('express');
var router = express.Router();
const path = require('path');
const {isLoggedIn, isNotLoggedIn} = require('./middlewares');

router.get('/', isNotLoggedIn, (req, res, next) => {
  res.render('index.ejs', {loginUser: req.user });
});

router.get('/start', isNotLoggedIn, (req, res, next) => {
  res.render('start.ejs', {loginError: req.flash('loginError'), loginUser: req.user});
});

router.get('/main', isLoggedIn, (req, res, next) => {
  res.render('main.ejs', {loginUser: req.user});
});

module.exports = router;
