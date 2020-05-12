const mysql = require('mysql2');

exports.isLoggedIn = (req, res, next) => {
    if(req.isAuthenticated()){
        next();
    } else {
        res.redirect('/');
    }
};

exports.isNotLoggedIn = (req, res, next) => {
    if(!req.isAuthenticated()){
        next();
    } else {
        res.redirect('/main');
    }
};

exports.isContentsAuthenticated = async (req, res, next) => {
    const con = await connection.promise().getConnection();
    try {
        const query = `SELECT reg_id FROM memories WHERE id = ${mysql.escape(req.params.memId)}`;
        const [result] = await con.query(query);
        if(result[0].reg_id === req.user.id) {
            next();
        } else {
            res.status(403);
            res.render('../views/main.ejs', {loginUser: req.user});
        }
    } catch(error) {
        console.error(error);
        next(error);
    } finally {
        con.release();
    }
};