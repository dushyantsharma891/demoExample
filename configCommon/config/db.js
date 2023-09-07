

const _CONF		= require('./index').init(),
    mysql       = require('mysql'),
    connection  = require('express-myconnection'),
	q           = require('q');


function getConnection() {
    let deferred = q.defer();
    let connection = mysql.createConnection({
        host				: _CONF.mysql.host,
		user				: _CONF.mysql.user,
		password			: _CONF.mysql.password,
		port 				: _CONF.mysql.port,
		database			: _CONF.mysql.database,
		timezone			: _CONF.mysql.timezone,
		multipleStatements	: _CONF.mysql.multipleStatements,
        charset             : 'utf8mb4'

    });

    connection.connect(function ( err ) {
        if ( err ) {
            //console.log('Mysql database connection error=')
            console.error(err);
            deferred.reject(err);
        }
        //console.log('[CONN] – Connection created with id:'+ connection.threadId);
        deferred.resolve( connection );
    });

    return deferred.promise;
}

function createConnection(app){
    app.use(connection(mysql,{
        host        : _CONF.mysql.host,
        user        : _CONF.mysql.user,
        password    : _CONF.mysql.password,
        port        : _CONF.mysql.port,
        database    : _CONF.mysql.database,
        charset     : 'utf8mb4'

    },'pool'));
}

function prepareQuery(query, parameters){
    if(!query || !parameters) {
        throw  new Error('query and parameters function parameters should be specified.');
    }
    return mysql.format(query, parameters);
}



module.exports = {
    getConnection : getConnection,
    createConnection: createConnection,
    prepareQuery  : prepareQuery
};