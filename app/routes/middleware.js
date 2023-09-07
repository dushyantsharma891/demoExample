

const jwt       = require("jsonwebtoken");
// const config    = require('../config/').init();


module.exports.authenticate = function(req, res, next) {
    // console.log(jwt,"jwtttttttttttttttt======================================")
    if ( req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer' ) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
        token = req.query.token;
    } else {
        token = req.body.token || req.query.token || req.headers['x-access-token'];
    }
    //if no token found, return response (without going to the next middelware)
    let obj = {
        status 	: false,
        code 	: "CCS-E1000",
        message : "Access denied. No token provided.",
        payload : {}
    };
    if (!token) return res.status(401).send(obj);

    try {
        
        next();
    } catch (ex) {
        res.status(400).send("Invalid token.");
    }
};

module.exports.allowHeaders = function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // restrict it to the required domain
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-type, Accept, X-Access-Token, X-Key, Authorization');
    if (req.method == 'OPTIONS') {
        res.status(200).end();
    } else {
        next();
    }
};

