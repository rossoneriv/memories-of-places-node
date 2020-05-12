const passport = require('passport');
const bcrypt = require('bcrypt');
const mysql = require('mysql2');
const LocalStrategy = require('passport-local').Strategy;

module.exports = () => {
    passport.serializeUser((user, done) => {
        done(null, user);
    });

    passport.deserializeUser((user, done) => {
        done(null, user);
    });

    passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password',
        session: true,
        passReqToCallback: false
    }, async (username, password, done) => {
        try{
            const query = `SELECT id, password, nickname, email FROM user WHERE id = ${mysql.escape(username)} AND del_f = 'N'`;
            await connection.getConnection((error, connection) => {
                connection.query(query, (error, result, field) => {
                    if(error){
                        connection.release();
                        throw error;
                    } else {
                        connection.release();
                        if(result.length > 0) {
                            bcrypt.compare(password, result[0].password, (err, res) => {
                                if (res) {
                                    return done(null, { id : result[0].id, nickname : result[0].nickname, email: result[0].email });
                                }
                                else {
                                    return done(null, false, {message: '로그인 정보가 일치하지 않습니다.'});
                                }
                            });
                        } else {
                            return done(null, false, {message: '로그인 정보가 일치하지 않습니다.'});
                        }
                    }
                });
            });
        } catch(error){
            console.error(error);
        }
    }));
}