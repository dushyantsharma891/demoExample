

const   _CONF		= require('./index').init(),
        mysql       = require('mysql');

var pool  = mysql.createPool({
    connectionLimit : 1000000,
    host        : _CONF.mysql.host,
    user        : _CONF.mysql.user,
    password    : _CONF.mysql.password,
    port        : _CONF.mysql.port,
    database    : _CONF.mysql.database,
    charset     : 'utf8mb4'
  });
  
module.exports = pool;