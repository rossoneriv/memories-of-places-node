var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mysql = require('mysql2');  // https://github.com/mysqljs/mysql
const mybatisMapper = require('mybatis-mapper');
const passport = require('passport');
const session = require('express-session');
const passportConfig = require('./config/passport.js');
const flash = require('connect-flash');
const dotenv = require('dotenv');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const memoriesRouter = require('./routes/memories');

var app = express();

if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === '') {
  dotenv.config();
} else if (process.env.NODE_ENV === 'production') {
  dotenv.config();
} else {
  throw new Error('process.env.NODE_ENV를 설정하지 않았습니다!');
}

const connection = mysql.createPool({  //커넥션 생성
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password : process.env.DB_PASSWORD
});

// connection.connect();
global.connection = connection;
// global.mybatisMapper = mybatisMapper;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use(flash());
app.use(session({ secret: process.env.SESSION_CODE, resave: false, saveUninitialized: false })); // 세션 활성화
app.use(passport.initialize());
app.use(passport.session());
passportConfig(passport);

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/img', express.static(path.join(__dirname, 'uploads')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/memories', memoriesRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  if(res.statusCode === 500 || res.statusCode === 503) {
    res.render('error500');
  } else {
    res.render('error');
  }
  
});

module.exports = app;
