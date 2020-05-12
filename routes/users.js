const express = require('express');
const router = express.Router();
const passport = require('passport');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const {isLoggedIn, isNotLoggedIn} = require('./middlewares');

router.get('/join', isNotLoggedIn, (req, res, next) => {
	res.render('join.ejs', {loginUser: req.user });
});

router.get('/modi', isLoggedIn, (req, res, next) => {
	res.render('userInfoModi.ejs', {loginUser: req.user });
});

router.get('/idDupCheck/:username', isNotLoggedIn, (req, res, next) => {
  	const id = req.params.username;
  	try {
		const query = `SELECT id FROM user WHERE id = ${mysql.escape(id)}`;
    	connection.getConnection((error, connection) => {
			connection.query(query, (error, result, field) => {
				if(error){
					connection.release();
					throw error;
				}
				else {
					let ret = {};
					if(result.length > 0 && result[0].id === id){
						ret.success = false;
						ret.msg = '이미 사용중인 ID입니다.';
					}
					else {
						ret.success = true;
					}
					connection.release();
					res.send(ret);
				}
			});
    	});
  	} catch(error) {
    	console.error(error);
    	next(error);
  	}
});

router.post('/join/:username', isNotLoggedIn, async (req, res, next) => {
  	const {username, password, nickname, email} = req.body;
  	try{
    	const hashPassword = await bcrypt.hash(password, 10);
		const query = `INSERT INTO user (id, password, nickname, email)	VALUES (${mysql.escape(username)}, ${mysql.escape(hashPassword)}, ${mysql.escape(nickname)}, ${mysql.escape(email)})`;
    	await connection.getConnection((error, connection) => {
      		connection.query(query, (error, result, field) => {
        		if(error){
          			connection.release();
          			throw error;
        		} else {
          			connection.release();
          			res.send(result);
        		}
      		});
    	});
  	} catch(error) {
    	console.log(error);
    	next(error);
  	}
});

router.post('/login', isNotLoggedIn, (req, res, next) => {
  	passport.authenticate('local', (authError, user, info) => {
    	if(authError){
      		console.error(authError);
      		return next(authError);
    	}
    	if(!user){
      		req.flash('loginError', info.message);
      		return res.redirect('/start');
    	}
    	return req.login(user, (loginError) => {
			if(loginError){
				console.log(loginError);
				return next(loginError);
			}
			return res.redirect('/main');
    	});
  	})(req, res, next);
});

router.get('/logout', isLoggedIn, (req, res) => {
  	req.logout();
  	res.redirect('/');
});

router.patch('/withdrawal', isLoggedIn, async(req, res, next) => {
	const con = await connection.promise().getConnection();
	try {
		const query = `UPDATE user SET del_f = 'Y' where id=${mysql.escape(req.user.id)}`;
		await con.query(query);
		return res.send();
	} catch (error) {
		console.error(error);
		next(error);
	} finally {
		con.release();
	}
});

router.patch('/modi', isLoggedIn, async(req, res, next) => {
	const con = await connection.promise().getConnection();
	const {password, newPassword, nickname, email} = req.body;
	try {
		const selectPasswordQuery = `SELECT password FROM user WHERE id=${mysql.escape(req.user.id)}`;
		const [result] = await con.query(selectPasswordQuery);
		const match = await bcrypt.compare(password, result[0].password);
		if(match) {
			const hashPassword = await bcrypt.hash(newPassword, 10);
			const updateUserQuery = `
				UPDATE user SET
				password = ${mysql.escape(hashPassword)}, nickname = ${mysql.escape(nickname)}, email = ${mysql.escape(email)}`;
			await con.query(updateUserQuery);
			req.user.nickname = nickname;
			req.user.email = email;
			return res.send({result: true});
		} else {
			return res.send({result: false});
		}
	} catch(error) {
		console.error(error);
		next(error);
	} finally {
		con.release();
	}
});

module.exports = router;