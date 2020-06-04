const util = require('util');
const mysql = require('mysql');
/**
 * Connection to the database
 */

const pool = mysql.createPool({
    connectionLimit: 10,
    host: 'un0jueuv2mam78uv.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
    user: 'hspibp6wdwj9sale',
    password: 'qer5yh81qbxlyfvn',
    database: 'fn0qvg5rc0ngplb0'
});

// Error Catch Connection To DATABASE
pool.getConnection((err, connection) => {
    if(err)
    console.error("Something went wrong connecting to the database ..")

    if(connection)
    connection.release();
    return;
});

pool.query = util.promisify(pool.query);

module.exports = pool;