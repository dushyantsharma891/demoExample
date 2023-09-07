
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";

const express			= require('express'),
    http 				= require('http'),
    cookieParser	    = require('cookie-parser'),
    helmet			    = require('helmet'),
    bodyParser 		    = require('body-parser'),
    nocache             = require('nocache'),
    jwt		            = require('jsonwebtoken'),
    fs		            = require('fs');    
    router		        = require('./app/routes/index');
    const config		= require('./configCommon/config').init();

    const socketObj 	= require('./connect');
   

const app 	            = express();

global.app = app;       
global.jwt = jwt;

app.set('port', process.env.PORT || 3000);
app.set('superSecret', config.secret);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

app.use('/uploads', express.static('uploads'));
app.use(express.static(__dirname + 'uploads'));

app.use(cookieParser());
	app.use(nocache());


let server = http.createServer(app);
const socketio          = require("socket.io")(server, {
	pingInterval: 1000, // how often to ping/pong.
	pingTimeout: 2000 // time after which the connection is considered timed-out.
});

// const socketio          = require("socket.io");

const io    = socketio.listen(app.listen(app.get('port')));

global.io   = io;

router.init( app, '' , '' , '' );

socketObj.init(io);












