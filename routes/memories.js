const express = require('express');
const router = express.Router();
const path = require('path');
const multer = require('multer');
var multerS3 = require('multer-s3');
const fs = require('fs');
const mysql = require('mysql2');
const AWS = require('aws-sdk');
const dotenv = require('dotenv');
const {isLoggedIn, isNotLoggedIn, isContentsAuthenticated} = require('./middlewares');

dotenv.config();
// https://mayajuni.tistory.com/entry/nodeJs-mysql-asyncawait%EB%A5%BC-%EC%9D%B4%EC%9A%A9%ED%95%9C-mySql-%EB%AA%A8%EB%93%88-%EB%A7%8C%EB%93%A4%EA%B8%B0
// https://evertpot.com/executing-a-mysql-query-in-nodejs/

const s3 = new AWS.S3({
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    region: process.env.S3_REGION
});


const upload = multer({
    // storage: multer.diskStorage({
    //     destination(req, file, cb) {
    //         const id = req.user.id;
    //         if(fs.existsSync(`./uploads/${id}`)){
    //             cb(null, `./uploads/${id}`);    
    //         } else {
    //             fs.mkdirSync(`./uploads/${id}`);
    //             cb(null, `./uploads/${id}`);
    //         }
    //     },
    //     filename(req, file, cb) {
    //         const ext = path.extname(file.originalname);
    //         cb(null, path.basename(file.originalname, ext) + '_' + new Date().valueOf() + ext);    //  
    //     }
    // })
    storage: multerS3({
        s3: s3,
        bucket: 'memories-of-places',
        acl: 'public-read',
        key: function(req, file, cb) {
            const ext = path.extname(file.originalname);
            cb(null, req.user.id + '/' + path.basename(file.originalname, ext) + '_' + new Date().valueOf() + ext);
        }
    }),
    limits: { fileSize: 8 * 1024 * 1024 }
});

router.get('/', isLoggedIn, async (req, res, next) => {
    const con = await connection.promise().getConnection();
    try {
        const query = getSearchParamQuery(req);
        const [result] = await con.query(query);
        res.send(result);
    } catch(error) {
        console.error(error);
        next(error);
    } finally {
        con.release();
    }
});

router.get('/searchParam/:type/:param', isLoggedIn, async (req, res, next) => {
    const con = await connection.promise().getConnection();
    try {
        const query = getSearchParamQuery(req);
        const [result] = await con.query(query);
        res.send(result);
    } catch(error) {
        console.error(error);
        next(error);
    } finally {
        con.release();
    }
});

router.post('/', upload.any(), async (req, res, next) => {
    const {lat, lon, place, memDate, memContents, keyword1, keyword2, keyword3} = req.body;
    const con = await connection.promise().getConnection();
    await con.beginTransaction();
    try {
        const insertMemoriesQuery = `
            INSERT INTO memories (lat, lon, place, mem_date, contents, reg_id, reg_date, keyword1, keyword2, keyword3)
            VALUES (${mysql.escape(lat)}, ${mysql.escape(lon)}, ${mysql.escape(place)}, REPLACE(${mysql.escape(memDate)}, '-', ''), ${mysql.escape(memContents)}, 
                    ${mysql.escape(req.user.id)}, NOW(), ${mysql.escape(keyword1)}, ${mysql.escape(keyword2)}, ${mysql.escape(keyword3)})`;
        await con.query(insertMemoriesQuery);

        let seq = 0;
        let insertPictureQuery = '';
        for(let i=0; i<req.files.length; i++){
            seq++;
            insertPictureQuery = `
                INSERT INTO picture (id, seq, path, filename, original_file_name)
                VALUES (LAST_INSERT_ID(), ${mysql.escape(seq)}, ${mysql.escape(req.files[i].location)}, 
                        ${mysql.escape(req.files[i].key)}, ${mysql.escape(req.files[i].originalname)})`;
            await con.query(insertPictureQuery);
        }
        await con.commit();
        return res.send();
    } catch(error) {
        console.error(error);
        await con.rollback();
        next(error);
    } finally {
        con.release();
    }
});

router.patch('/:memId', isContentsAuthenticated, upload.any(), async (req, res, next) => {
    const con = await connection.promise().getConnection();
    await con.beginTransaction();
    try{
        const updateMemoriesQuery = `
            UPDATE memories SET 
            place = ${mysql.escape(req.body.place)},
            mem_date = REPLACE(${mysql.escape(req.body.memDate)}, '-', ''),
            contents = ${mysql.escape(req.body.memContents)}
            WHERE id = ${mysql.escape(req.params.memId)}
            AND reg_id = ${mysql.escape(req.user.id)}`;
        await con.query(updateMemoriesQuery);

        const deleteImgSeqArr = req.body.deleteImgSeqArr.split(',');
        for(let i=0; i<deleteImgSeqArr.length; i++){
            const [result] = await con.query(`SELECT filename FROM picture WHERE id=${mysql.escape(req.params.memId)} AND seq=${mysql.escape(deleteImgSeqArr[i])}`);
            deleteS3File(result);
            await con.query(`DELETE FROM picture WHERE id=${mysql.escape(req.params.memId)} AND seq=${mysql.escape(deleteImgSeqArr[i])}`);
        }
        const [results] = await con.query(`SELECT MAX(seq) AS seq FROM picture WHERE id=${mysql.escape(req.params.memId)}`);

        let seq = Number(results[0].seq);
        let insertUpdatedPicture = '';
        for(let i=0; i<req.files.length; i++){
            seq++;
            insertUpdatedPicture = `
                INSERT INTO picture (id, seq, path, filename, original_file_name)
                VALUES (${mysql.escape(req.params.memId)}, ${mysql.escape(seq)}, ${mysql.escape(req.files[i].location)}, 
                        ${mysql.escape(req.files[i].key)}, ${mysql.escape(req.files[i].originalname)})`
            await con.query(insertUpdatedPicture);
        }

        await con.commit();
        return res.send();
    } catch(error) {
        console.error(error);
        await con.rollback();
        next(error);
    } finally {
        con.release();
    }
});

router.get('/picture/:memId', isLoggedIn, isContentsAuthenticated, async (req, res, next) => {
    const con = await connection.promise().getConnection();
    try {
        const query = `
        SELECT 
            /* CONCAT(path, filename) AS imgSrc, */
            path AS imgSrc,
            original_file_name,
            seq
        FROM picture
        WHERE id = ${mysql.escape(req.params.memId)}
        ORDER BY seq ASC`;
        const [result] = await con.query(query);
        res.send(result);
    } catch(error) {
        console.error(error);
        next(error);
    } finally {
        con.release();
    }
});

router.get('/keywords', isLoggedIn, async (req, res, next) => {
    const con = await connection.promise().getConnection();
    try {
        const query = `
            SELECT X.keyword, COUNT(X.keyword) AS cnt
            FROM (
                SELECT A.keyword1 AS keyword FROM memories A
                WHERE A.reg_id = ${mysql.escape(req.user.id)}
                UNION ALL
                SELECT B.keyword2 AS keyword FROM memories B
                WHERE B.reg_id = ${mysql.escape(req.user.id)}
                UNION ALL
                SELECT C.keyword3 AS keyword FROM memories C
                WHERE C.reg_id = ${mysql.escape(req.user.id)}
            ) X
            GROUP BY keyword
            ORDER BY cnt DESC, keyword ASC`;
        let [result] = await con.query(query);
        res.send(result);
    } catch(error) {
        console.error(error);
        next(error);
    } finally {
        con.release();
    }
});

router.delete('/:memId', isLoggedIn, isContentsAuthenticated, async (req, res, next) => {
    const con = await connection.promise().getConnection();
    await con.beginTransaction();
    try {
        const [result] = await con.query(`SELECT filename FROM picture WHERE id=${mysql.escape(req.params.memId)}`);
        deleteS3File(result);
        await con.query(`DELETE FROM picture WHERE id=${mysql.escape(req.params.memId)}`);
        await con.query(`DELETE FROM memories WHERE id=${mysql.escape(req.params.memId)} AND reg_id = ${mysql.escape(req.user.id)}`);
        await con.commit();
        return res.send();
    } catch(error) {
        await con.rollback();
        console.error(error);
        next(error);
    } finally {
        con.release();
    }
});

function getSearchParamQuery(req) {
    let query = `
        SELECT 
            A.id,
            A.lat,
            A.lon,
            A.place,
            CONCAT(substring(A.mem_date,1,4),'-',substring(A.mem_date,5,2),'-',substring(A.mem_date,7,2)) as mem_date,
            A.contents,
            A.reg_id,
            DATE_FORMAT(A.reg_date, '%Y-%m-%d %H:%i') as reg_date,
            A.keyword1,
            A.keyword2,
            A.keyword3,
            B.path,
            B.filename,
            B.original_file_name
        FROM memories A
        LEFT OUTER JOIN picture B
        ON A.id = B.id
        AND B.seq = (
            SELECT MIN(C.seq) from picture C
            WHERE C.id=B.id
        )`;
    query += ' WHERE reg_id=' + mysql.escape(req.user.id);
    if(req.params.type === '01') {
        query += ' AND (place LIKE CONCAT(\'%\','+mysql.escape(req.params.param)+',\'%\') OR contents LIKE CONCAT(\'%\','+mysql.escape(req.params.param)+',\'%\'))'
    }
    else if(req.params.type === '02') {
        query += ' AND mem_date BETWEEN '+mysql.escape(req.params.param.split('~')[0])+ ' AND '+ mysql.escape(req.params.param.split('~')[1]);
    }
    else if(req.params.type === '03'){
        query += ' AND (keyword1='+mysql.escape(req.params.param)+' OR keyword2='+mysql.escape(req.params.param)+' OR keyword3='+mysql.escape(req.params.param)+')';
    }
    query += ' ORDER BY ID DESC';
    return query;
}

function deleteS3File(result) {
    for(let i=0; i<result.length; i++) {
        s3.deleteObject({Bucket: 'memories-of-places', Key: result[i].filename}, function(error, data){
            if(error){
                console.error(error);
            }
        });
    }
}

module.exports = router;