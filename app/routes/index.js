
const request 		  	= require('request'),
    url 			   	= require('url'),
    middle 	        	= require('./middleware'),
    _AUTHOBJ            = require('../controllers/auth');                   
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

