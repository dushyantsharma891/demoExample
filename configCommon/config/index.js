/* #################################
	Project		 : Bobotracker
	Module		 : Node Server
    Created		 : 2021-11-14
	Developed By : Anil Guleria 
    Description	 : Mysql configuration file.
*/

 exports.init = function() {

 	return {
 		"serverurl" : "http:localhost:3000",
 		"mysql": {   
 			"client"			: "mysql",
 			"host"				: "127.0.0.1",
 			"user"				: "root",
 			"password"			: "",
 			"port" 				: 3306,
 			"database"			: "example",
 			"timezone"			: "utc",
 			"multipleStatements": true,
 			"charset"			: "utf8"
 		},
 		"secret": "@&*(29783-d4343daf4dd*&@&^#^&@#",
		'fcmConfig'  : {
			"type"                          : "service_account",
			"project_id"                    : "example-16e83",
			"private_key_id"                : "0e60cc5159bc2d8ed6a05bc7707272590466eb18",
			"private_key"                   : "-----BEGIN PRIVATE KEY-----\example\n-----END PRIVATE KEY-----\n",
			"client_email"                  : "firebase-adminsdk-h10oe@example-16e83.iam.gserviceaccount.com",
			"client_id"                     : "101480015761093498777",
			"auth_uri"                      : "https://accounts.google.com/o/oauth2/auth",
			"token_uri"                     : "https://oauth2.googleapis.com/token",
			"auth_provider_x509_cert_url"   : "https://www.googleapis.com/oauth2/v1/certs",
			"client_x509_cert_url"          : "example",
			"universe_domain"               : "googleapis.com"
		},

 	}
 }; 

// exports.init = function() {
// 	return {
// 		"serverurl" : "https:api.boomceleb.com/",
// 		"mysql": {   
// 			"client"			: "mysql",
// 			"host"				: "54.209.34.0",
// 			"user"				: "root",
// 			"password"			: "M5cVBOO8lSI1XK",
// 			"port" 				: 3306,
// 			"database"			: "glimpsters_live",
// 			"timezone"			: "utc",
// 			"multipleStatements": true,
// 			"charset"			: "utf8"
// 		},
// 		"secret": "@&*(29783-d4343daf4dd*&@&^#^&@#"
// 	}
	
// };


