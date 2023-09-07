
const request 		  	= require('request'),
    url 			   	= require('url'),
    middle 	        	= require('./middleware'),
    _AUTHOBJ            = require('../controllers/auth'),
	_USEROBJ 			= require('../controllers/user'),
	_CONFIGOBJ 			= require('../controllers/configuration'),
    _POSTOBJ            = require('../controllers/post'),
	_USERPROFILEOBJ     = require('../controllers/upload_image'),
	_FOLLOWOBJ          = require('../controllers/follow'),
	_CHATSOBJ           = require('../controllers/chats'),
	_CONTESTOBJ         = require('../controllers/contests'),
	_BROADCASTOBJ       = require('../controllers/live_broadcast'),
	_ADSOBJ             = require('../controllers/ads'),
	_STORESOBJ          = require('../controllers/stores'),
	_REPORTOBJ          = require('../controllers/report'),
	_notification       = require('../controllers/notification'),
	_PAGESOBJ           = require('../controllers/pages');                   
    // const validateRequest = SchemaValidator(true);

const genericHandler = (req, res, next) => {
 res.json({
     status: 'success',
     data: req.body
 });
};

module.exports.init = async (app, jwt, socket, http) => {
 
	app.all('/*', middle.allowHeaders );
	app.all('/private/*', middle.authenticate);
	app.get('/testing', function(req , res){
		console.log("Got a GET request for the homepage");
        res.send('Hello GET get get get');
	});
	
	/*** Authentication APIs*/
	app.post('/signup', _AUTHOBJ.signup);
	app.post('/signup-with-phone', _AUTHOBJ.signupWithPhone);
	app.post('/signin-with-apple-id', _AUTHOBJ.signinWithAppleId);
	app.post('/login',  _AUTHOBJ.login);
	
}  

