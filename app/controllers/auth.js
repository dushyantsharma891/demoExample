


 const 	request 		= require('request'),
	AWS                 = require('aws-sdk'),
	passwordHash 		= require('password-hash'),
	payloadChecker 		= require('payload-validator'),
	path				= require('path'),
	https				= require('https'),
	Stream				= require('stream'),
	fs					= require('fs'),
	download            = require('image-downloader'),
	q                   = require('q'),
	{v1: uuidv1}        = require('uuid'),
	config				= require('../../configCommon/config').init(),
	authModel			= require('../models/auth'),
	commonModel		    = require('../models/configCommon'),
	helper				= require('../../configCommon/helpers/index'),
	_userModel          = require('../models/user'),
	constant 			= require('../../configCommon/config/constants');

let auth = {

	isValid: function( req, res ) {

	},

	get_profile_detail : function(req, res) {

		request({

			headers: {
				'Authorization' : req.headers['authorization'],
				'Content-Type': 'multipart/formdata'
			},
			uri   : config.serverurl + "private/getProfileDetail",
			form  : req.body,
			method: 'POST'

		}, function (error, response, body) {

			if ( error ) {

				res.status(500).json({
					success: true,
					message: "error"
				});

			} else if (response) {

				res.send(
					JSON.parse(response.body)
				)
			}
		});
	}
};

/**
 * Signup Controller
 * @param         :
 * @returns       :
 * @developer     :  
 */
auth.signup = async function( req, res ) {

	// console.log("req.bodyreq.bodyreq.bodyreq.body ", req.body);
	
	if ( req && req.body && req.body.email && req.body.password && req.body.name ) {
		// console.log("11111111111 ");
		if ( typeof req.body.email == 'string' && typeof req.body.password == 'string' && typeof req.body.name == 'string' ) {
			// console.log("22222222222222 ");
			let obj = {
				message:'',
				status : false
			};
			
			if ( req.body.email.length > 100 ) {
				// console.log("3333333333 ");
				obj.message = 'Please enter the valid email max length of email is 100 characters';
				helper.successHandler(res,obj);
			}

			if ( req.body.password.length > 200 ) {
				// console.log("44444444444444 ");
				obj.message = 'Please enter the valid password';
				helper.successHandler(res,obj);
			}

			if ( req.body.name.length > 100 ) {
				// console.log("555555555555555 ");
				obj.message = 'Please enter the valid name max length of email is 100 characters';
				helper.successHandler(res,obj);
			}

		} 

		let userDetailObj = await commonModel.getRowIdAll(req.body.email, 'u_email', 'user');
		// console.log("6666666666666666 ", userDetailObj);
		if ( userDetailObj && userDetailObj.u_email && userDetailObj.u_email != '' && userDetailObj.u_logged_in_by != 'RQ' ) {


			let statusCode = '',
				message    = '';

			if ( userDetailObj.u_active == '0' ) {

				statusCode = "AAA-E1002",
				message    = 'User already exists but not active.';

				
			} else if ( userDetailObj.u_deleted == '1' ) {

				message = 'User prohibited, please contact glimpsters support team for help.';

			} else {

				statusCode = "AAA-E1001",
				message    = 'User already exists. Please signup with other account.';

			}

			let obj = {
				code : statusCode,
				message: message,
				status : false
			};

			helper.successHandler( res, obj );

		} else {
			// console.log("777777777777777777 ");
			authModel.signup(req.body).then(function(signupStatus) {
				// console.log("88888888888888888 ", signupStatus);
					if ( signupStatus == true ) {
						// console.log("99999999999 ");
	
						let obj = {
							message:'Account activation code sent to your email.'
						};
						helper.successHandler(res, obj);
	
					} else {
						// console.log("100000000000001111111111 ");
	
						helper.errorHandler(res,{
							status : false
						},500);
	
					}
	
				}, function(error) {
					// console.log("11111111111 0000000000000000000", error);
					helper.errorHandler(res, {}, 500);
				});
		}
	} else {

		let obj = {
			code : "AAA-E2001",
			message : 'All fields are required' ,
			status : false
		};
		helper.successHandler(res,obj);
	}
}

/**
 * Signup Controller 
 * @param         :
 * @returns       :
 * @developer     : Dushyant Sharma 
 * @modification  : 
 */
auth.signupWithPhone = async function( req, res ) {
	
	if ( req && req.body && req.body.mobile && req.body.password && req.body.name ) {

		if ( typeof req.body.mobile == 'string' && typeof req.body.password == 'string' && typeof req.body.name == 'string' ) {
			
			let obj = {
				message : '',
				status  : false
			};

			if ( req.body.password.length > 200 ) {
				obj.message = 'Please enter the valid password';
				helper.successHandler(res,obj);
			}

			if ( req.body.name.length > 100 ) {
				obj.message = 'Please enter the valid name max length of email is 100 characters';
				helper.successHandler(res,obj);
			}

		} 

		let userDetailObj = await commonModel.getRowIdAll( req.body.mobile, 'u_phone', 'user' );

		if ( userDetailObj && userDetailObj.u_phone && userDetailObj.u_phone != '' && userDetailObj.u_logged_in_by != 'RQ' ) {

			let statusCode = '',
				message    = '';

			if ( userDetailObj.u_active == '0' ) {

				let updateData = await authModel.updateUserData(req.body);

				if ( updateData ) {

					let obj = {
						message:'Account activation code sent to your phone.'
					};
					helper.successHandler(res, obj);
					return;

				} else {

					helper.successHandler(res, {
						status  : false,
						message : 'Failed,Please try again.',
						code    : 'AAA-E1001'
					}, 200);
					return;
				}
			} else if ( userDetailObj.u_deleted == '1' ) {

				message = 'User prohibited, please contact glimpsters support team for help.';

			} else {

				statusCode = "AAA-E1001",
				message    = 'User already exists. Please signup with other account.';

			}

			let obj = {
				code  	: statusCode,
				message	: message,
				status 	: false
			};

			helper.successHandler(res, obj);

		} else {

			let signupStatus = await authModel.signupWithPhone(req.body);

			if ( signupStatus ) {

				let obj = {
					message:'Account activation code sent to your phone.'
				};
				helper.successHandler(res, obj);

			} else {

				helper.successHandler(res, {
					status : false,
					code   : 'SWP-E1001'
				}, 200);
			}
		}
	} else {

		let obj = {
			code 	: "AAA-E2001",
			message : 'All fields are required' ,
			status 	: false
		};
		helper.successHandler(res,obj);
	}
}

/**
 * Login Controller
 * @param        :
 * @returns       :
  * @developer : 
 */
auth.login = async (req, res) => {
	
	let conObj    = await constant.getConstant(); 
            console.log('adasdasdada',req.body);
	if ( req && req.body && req.body.email && req.body.password && req.body.device_token && req.body.device_id && req.body.device_platform ) {

		let expectedPayload = {
			"email"           : "",
			"password"        : "",
			"device_token"    : "",
			"device_id"       : "",
			"device_platform" : "",
		};

		// let result = payloadChecker.validator ( req.body, expectedPayload, ["email", "password", "device_token", "device_id", "device_platform"], true);
		let result = payloadChecker.validator (req.body, expectedPayload, ["email", "password"], true);
		
		if ( result && result.success ) {
		
			let userDetail = await commonModel.getRowIdAll(req.body.email, 'u_email', 'user');
                    console.log('userDetail============>>>>',  userDetail)
				if ( userDetail && userDetail.u_email && typeof  userDetail.u_email == 'string' && userDetail.u_email != ''  ) {

					console.log('userDetail============>>>>11111111111111',typeof  userDetail.u_email)
					if (  userDetail.u_active && userDetail.u_active == '0' ) {
						// console.log('userDetail============>>>>222222222222222222',userDetail.u_active)

						let obj = {
							code 	: "AAA-E1002",
							message	:'User exists but not active.',
							status 	: false
						};
						helper.errorHandler(res, obj, 200);
						
					} else if (  userDetail.u_deleted && userDetail.u_deleted == '1' ) {
						// console.log('userDetail============>>>>33333333333333333333',userDetail.u_deleted)

						let obj = {
							code 	: "",
							message :'User prohibited, please contact bobotracker support team for help.',
							status 	: false
						};
						helper.errorHandler(res, obj, 200);

					} else {
						// console.log('userDetail============>>>>44444444444444444444',req.body)

						authModel.login(req.body).then(async function(result) {

							// console.log("resultresultresultresultresultresult : ", result);

							if ( typeof(result) == 'object' && Object.keys(result).length > 0 ) {
								
								let updateActiveStatus = authModel.updateActiveStatus(),

								payload = {
									iat      : Date.now(),
									"orgId"  : result.u_id,
									"userId" : result.u_uuid,
									"email"  : result.u_email
								},

								token        = jwt.sign(payload,config.secret);

								result.token 		= token;
								result.profileUrl 	= conObj.SITE_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH;

								if ( result.u_image != null && result.u_image != '' ) {

									result.u_image = conObj.SITE_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + result.u_image;

								} else {
									result.u_image = '';
								}

								let commonData = {
									"u_uuid"           			: result.u_uuid, 
									"u_full_address"   			: result.u_full_address,
									"u_name"           			: result.u_name,
									"u_email"          			: result.u_email,
									"u_description" 			: result.u_description,
									"u_image"          			: result.u_image,
									"u_latitude"       			: result.u_latitude,
									"u_longitude"      			: result.u_longitude,
									"u_phone"          			: result.u_phone,
									"u_gender"         			: result.u_gender,
									"u_country" 	   			: result.u_country,
									"u_state" 	   	   			: result.u_state,
									"u_full_address"   			: result.u_full_address,
									"u_is_online"      			: result.u_is_online,
									"u_is_available"   			: result.u_is_available,
									"uw_balance"       			: result.uw_balance,
									"state_name"	   			: result.state_name,
									"country_name"	   			: result.country_name,
									"u_rank"                    : result.u_rank,
									"u_login_type"				: result.u_login_type,
									"token"            			: result.token,
									"u_free_contest"            : result.u_free_contest,
									"u_points_contest"			: result.u_points_contest,
									"u_sponsor_contest"			: result.u_sponsor_contest,
									"u_paid_contest"			: result.u_paid_contest,
									"ubs_uuid"                  : result.ubs_uuid,  
									"ubs_name"                  : result.ubs_name,
									"ubs_description"           : result.ubs_description,
									"ubs_address"               : result.ubs_address,
									"ubs_email"                 : result.ubs_email,
									"ubs_image"                 : result.ubs_image,
									"ubs_mobile"                : result.ubs_mobile,
									"ubs_drivers_count"         : result.ubs_drivers_count,
									"ubs_created_at"            : result.ubs_created_at,

									"profleUrl" 				: result.profileUrl,
								};
								
								commonData.u_profile_completed = 'N';

								if ( result.u_name != ''  && result.u_phone != ''  && result.u_image != '' && result.u_full_address != '' && result.communityName != null ) {

									commonData.u_profile_completed = 'Y';

								}

								// commonData.followerCount     = await commonModel.getFollowerCount(result.u_id);
								// commonData.followingCount    = await commonModel.getFollowingCount(result.u_id);
								// commonData.rating_user_count = await commonModel.getRatingUserCount(result.u_id);

								let obj = {
									message : 'Login successfully.',
									payload : commonData
								};

								// let socketData = {
								// 	"u_is_online"      			: commonData.u_is_online,
								// 	"u_is_available"   			: commonData.u_is_available,
								// 	"u_uuid"           			: commonData.u_uuid, 
								// }

								// io.emit('USER-PRESENCE',socketData);

								let date            = await helper.getPstDateTime('timeDate'),
									activityObj 	= {
										userId          : result.u_id,
										actionUserId    : result.u_id,  
										description     : result.u_name + ' logged in at ' + date, 
										activityType    : 'LOGIN', 
										date            : date
									};
								
								helper.insertUserActivityLogs(activityObj); 
								helper.successHandler(res, obj);

							} else {

								let obj = {
									code : "AAA-E1008",
									message : 'Login credentials are incorrect',
									status : false
								};
								helper.errorHandler(res, obj, 200);
							}
						}, function(error) {
							// console.log("error");
							helper.errorHandler(res, {}, 500);
						});
					}
				} else {
					let obj = {
						code 	: "AAA-E1008",
						message : 'Login credentials are incorrect.',
						status 	: false
					};
					helper.errorHandler(res, obj, 200);
				}
		} else {

			let obj = {
				code 	: "AAA-E2001",
				message : 'All fields are required',
				status 	: false
			};
			helper.errorHandler(res, obj, 200);
		}
	} else {

		let obj = {
			code : "AAA-E2001",
			message : 'All fields are required',
			status : false
		};
		helper.errorHandler(res, obj, 200);
	}
}

/**
 * Used tologin business driver.
 * @param        :
 * @returns       :
  * @developer : 
 */
auth.loginDriver = async (req, res) => {
	
	let conObj    = await constant.getConstant(); 

	if ( req && req.body && req.body.email && req.body.email != 'null' ) {

		let userDetail = await commonModel.getRowIdAll(req.body.email, 'u_email', 'user');

		if ( userDetail && userDetail.u_email && typeof userDetail.u_email == 'string' && userDetail.u_email != '' ) {

			/* if ( userDetail.u_active && userDetail.u_active == '0' ) {

				let obj 	= {
					code 	: "AAA-E1002",
					message	:'User exists but not active.',
					status 	: false
				};
				helper.errorHandler(res, obj, 200);
				
			} else if ( userDetail.u_deleted && userDetail.u_deleted == '1' ) {

				let obj 	= {
					code 	: "",
					message :'User prohibited, please contact bobotracker support team for help.',
					status 	: false
				};
				helper.errorHandler(res, obj, 200);

			} else { */

			if ( userDetail.u_login_type && userDetail.u_login_type != 'null' && userDetail.u_login_type == 'DRIVER' ) {

				let result = await authModel.loginDriver(req.body);

				// authModel.loginDriver(req.body).then(async (result) => {
				// console.log("resultresultresultresultresultresult : ", result);

				if ( typeof(result) == 'object' && Object.keys(result).length > 0 ) {
					
					let payload 		= {
							iat      : Date.now(),
							"orgId"  : result.u_id,
							"userId" : result.u_uuid,
							"email"  : result.u_email
						},

						token        	= jwt.sign(payload, config.secret);

						result.token	= token;

						result.profileUrl = conObj.SITE_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH;

						if ( result.u_image != null && result.u_image != '' ) {

							result.u_image = conObj.SITE_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + result.u_image;
						} else {
							result.u_image = '';
						}

						let commonData = {
							"u_uuid"           			: result.u_uuid, 
							"u_full_address"   			: result.u_full_address,
							"u_name"           			: result.u_name,
							"u_email"          			: result.u_email,
							"u_description" 			: result.u_description,
							"u_image"          			: result.u_image,
							"u_latitude"       			: result.u_latitude,
							"u_longitude"      			: result.u_longitude,
							"u_phone"          			: result.u_phone,
							"u_gender"         			: result.u_gender,
							"u_country" 	   			: result.u_country,
							"u_state" 	   	   			: result.u_state,
							"u_full_address"   			: result.u_full_address,
							"u_is_online"      			: result.u_is_online,
							"u_is_available"   			: result.u_is_available,
							"uw_balance"       			: result.uw_balance,
							"state_name"	   			: result.state_name,
							"country_name"	   			: result.country_name,
							"u_login_type"				: result.u_login_type,
							"token"            			: result.token,

							"ubdd_uuid" 				: result.ubdd_uuid,
							"ubdd_licence_number"		: result.ubdd_licence_number,
							"ubdd_driver_name" 			: result.ubdd_driver_name,
							"ubdd_email" 				: result.ubdd_email,
							"ubdd_mobile" 				: result.ubdd_mobile,
							"ubdd_image" 				: result.ubdd_image,
							"ubdd_vehicle_name" 		: result.ubdd_vehicle_name,
							"ubdd_vehicle_number" 		: result.ubdd_vehicle_number,


							"ubs_uuid"                  : result.ubs_uuid,  
							"ubs_name"                  : result.ubs_name,
							"ubs_description"           : result.ubs_description,
							"ubs_address"               : result.ubs_address,
							"ubs_email"                 : result.ubs_email,
							"ubs_image"                 : result.ubs_image,
							"ubs_mobile"                : result.ubs_mobile,
							"ubs_drivers_count"         : result.ubs_drivers_count,
							"ubs_created_at"            : result.ubs_created_at,
							"profileUrl"				: result.profileUrl,

						};
						
						commonData.u_profile_completed = 'N';

						if ( result.u_name != ''  && result.u_phone != ''  && result.u_image != '' && result.u_full_address != '' && result.communityName != null ) {

							commonData.u_profile_completed = 'Y';

						}

						let obj 			= {
								message : 'Login successfully.',
								payload : commonData
							},
							date            = await helper.getPstDateTime('timeDate'),
							activityObj 	= {
								userId          : result.u_id,
								actionUserId    : result.u_id,  
								description     : result.u_name + ' logged in at ' + date, 
								activityType    : 'LOGIN', 
								date            : date
							};
						
						helper.insertUserActivityLogs(activityObj); 
						helper.successHandler(res, obj);

					} else {

						let obj = {
							code 	: "AAA-E1008",
							message : 'Please provide corect email and token.',
							status 	: false
						};
						helper.errorHandler(res, obj, 200);
					}
		
				} else {
					helper.errorHandler(res, {
						code    : 'AAA-E2002',
						message : 'Incorrect login, you tried to login in driver account with business or app user account.',
						status  : false
					}, 200);
				}


			
				/* }, async (error) => {
					console.log("error : ", error);
					helper.errorHandler(res, {}, 500);
				}); */
		} else {
			let obj = {
				code 	: "AAA-E1008",
				message : 'Email does not exist, please provide correct email id.',
				status 	: false
			};
			helper.errorHandler(res, obj, 200);
		}
		/* } else {

			let obj = {
				code 	: "AAA-E1008",
				message : 'Login credentials are incorrect',
				status 	: false
			};
			helper.errorHandler(res, obj, 200);
		} */
	} else {

		let obj = {
			code : "AAA-E2001",
			message : 'All fields are required.',
			status : false
		};
		helper.errorHandler(res, obj, 200);
	}
}

/**
 * Used to check if phone number is verified or not
 * @params 		: 
 * @developer 	: Anil Guleria
 * @modified 	: 
 */
auth.checkPhoneNumberVerification = async (userEmail) => {

	let deferred  		= q.defer();

	if ( userEmail ) {

		let getData = await commonModel.getRowIdAll(userEmail, 'u_email', 'user');

		if ( getData && Object.keys(getData).length > 0 ) {

			if ( getData.u_phone && getData.u_phone > 0 && getData.u_phone_verified == '1' ) {
				deferred.resolve(true);
			} else {
				deferred.resolve(false);
			}
		}
	} else {
		deferred.resolve(false);
	}

	return deferred.promise;
}

/**
 * This function is used to remove image
 * @param:
 * @returns:
 * @developer :
 */
auth.removeAttachment = async function(file) {

	if ( fs.existsSync('./uploads/profile_image/') ) {
        
        fs.unlink('./uploads/profile_image/' + file, (result) => {

            if ( result ) {
                return true
			} 
			           
        });
    }	
    return false;
}

/**
 * Activate user account by entring activation code
 
 */
auth.activateAccount = async function(req, res) {

	let expectedPayload = {
		"email": "",
		"token": ""
	};

	let result = payloadChecker.validator (req.body, expectedPayload, ["email", "token"], true);

	if ( result && result.success ) {

		authModel.activateAccount(req.body).then(function(respnose) {

			if ( respnose && typeof(respnose) == 'object') {

				helper.successHandler( res, respnose );

			} else {

				helper.successHandler( res, {
					status  : false,
					code    : "AAA-E1000",
					message : 'Invalid OTP' 
				}, 200);
			}
		}, function(error) {

			helper.errorHandler(res,{
				status  :false,
				code    : "AAA-E1000",
			}, 500);
		});
	} else {

		helper.errorHandler(res, {
			code    : 'AAA-E2001',
			message : 'All fields are required.',
			status  : false
		}, 200);
	}
}

/**
 * Activate user account by entring activation code
 * @param        :
 * @returns       :
  * @developer : 
 */
auth.activateAccountViaPhone = async function(req, res) {

	if ( req.body && req.body.phone && req.body.token ) {

		let respnose = await authModel.activateAccountViaPhone(req.body);

		if ( respnose && typeof (respnose) == 'object' ) {

			helper.successHandler(res, respnose);

		} else {

			helper.successHandler(res, {
				status	: false,
				code	: "AAA-E1000",
				message	: 'Invalid OTP'
			}, 200);
		}
	} else {

		helper.errorHandler(res, {
			code 	: 'AAA-E2001',
			message	: 'All fields are required.',
			status	: false
		}, 200);
	}
}

/**
 * Fogot password controller
 * @param      :
 * @returns    :
  * @developer : 
 */
auth.forgotPassword = async (req, res) => {

	let expectedPayload = {
			"email" : "",
		},
		result 			= payloadChecker.validator(req.body, expectedPayload, ["email"], true);

	if ( result && result.success ) {

		let userDetail = await commonModel.getRowIdAll(req.body.email, 'u_email', 'user');

		if ( userDetail && userDetail.u_login_type && userDetail.u_login_type != 'null' && userDetail.u_login_type == 'DRIVER' ) {

			helper.errorHandler(res, {
				code    : 'AAA-E2002',
				message : 'Incorrect login, you tried to reset paswword in driver account.',
				status  : false
			}, 200);
			
		} else {
			
			authModel.forgotPassword(req.body.email).then(async (row) => {

				let obj 			= {};

				if ( row && row.code ) {

					obj.code 		= row.code;

					if ( row.code == 'AAA-E1010' ) {

						obj.message = 'Wrong activation code';
						obj.status 	= false;

					} else if ( row.code == 'AAA-E1013' ) {

						obj.message = 'Account does not exist';
						obj.status 	= false;

					} else if ( row.code == 'AAA-E1002' ) {

						obj.message = 'Account exist but not verified';
						obj.status  = false;
					}
				}

				helper.successHandler(res, obj);
				
			}, async (error) => {

				helper.errorHandler(res, {
					status : false
				}, 200);
			});
		}
	} else {

		helper.errorHandler(res, {
			code    : 'AAA-E2001',
			message : 'All fields are required.',
			status  : false
		}, 200);
	}
}

/**
 * Reset password controller
 
 */
auth.resetPassword = function(req, res) {
	console.log('xcvxcvxcvxvxvxvx=========>>>>>>', req.body)
	let expectedPayload = {
		'email'    : '',
		'password' : '',
		'code'     : '',
	};

	let result = payloadChecker.validator(req.body, expectedPayload, ["email", "password", "code"], true);

	if ( result && result.success ) {

		authModel.resetPassword(req.body).then(async function(row) {

			let obj = {};

			obj.message = 'Password reset successfully.';

			if ( row && row.code ) {

				obj.code = row.code;

				if ( row.code == 'AAA-E1010' ) {

					obj.message = 'You entered wrong token';
					obj.status  = false;

				} else if ( row.code == 'AAA-E1013' ) {

					obj.message = 'Account does not exist';
					obj.status  = false;

				} else if ( row.code == 'AAA-E1012' ) {

					obj.message = 'Token has been expired.';
					obj.status  = false;
				} 
			}
			helper.successHandler(res, obj, 200);

		}, function(error) {

			helper.errorHandler(res, {}, 200);

		});
	} else {

		helper.errorHandler( res, {
			code    : 'AAA-E2001',
			message : 'All fields are required.',
			status  : false
		}, 200);
	}
}

/**
 * USED TO RESEND ACTIVATION CODE
 
 */
auth.resendActivationCode = async function(req, res) {

	let expectedPayload = {
		'email': '',
	};

	let result = payloadChecker.validator(req.body, expectedPayload, ["email"], true);

	if ( result && result.success ) {

		authModel.resendActivationCode(req.body.email).then(async function(row) {

			let obj = {};

			if ( row && row.code ) {

				obj.code = row.code;

				if ( row.code == 'AAA-E1014' ) {

					obj.message = 'Account is already active';
					obj.status  = false;
				}
			}

			helper.successHandler(res, obj);

		}, function (error) {

			helper.errorHandler(res, {}, 200);
		});
	} else {

		helper.errorHandler(res, {
			code    : 'AAA-E2001',
			message : 'All fields are required.',
			status  : false
		}, 200);
	}
}

/**
 * USED TO SEND TOKEN CODE TO DRIVER'S EMAIL
 
 */
auth.sendDriverActivationCode = async (req, res) => {

	if ( req && req.body && req.body.email && req.body.email != 'null' ) {

		let userDetail 	= await commonModel.getRowIdAll(req.body.email, 'u_email', 'user');

		if ( userDetail && userDetail.u_email && typeof userDetail.u_email == 'string' && userDetail.u_email != '' ) {

			if ( userDetail.u_login_type && userDetail.u_login_type != 'null' && userDetail.u_login_type == 'DRIVER' ) {

				let resObj 	= await authModel.sendDriverActivationCode(req.body);

				// console.log('resObjresObjresObjresObjresObj ===== ', resObj);

				if ( resObj ) {

					let obj = {
						message : 'Account login code has been sent to your email.',
						payload : {},
					};

					helper.successHandler(res, obj);

				}  else {
					helper.errorHandler(res, {}, 200);
				}

			} else {
				helper.errorHandler(res, {
					code    : 'AAA-E2002',
					message : 'Incorrect login, you tried to login in driver account with business or app user account.',
					status  : false
				}, 200);
			}
		} else {

			helper.errorHandler(res, {
				code    : 'AAA-E2001',
				message : 'Email does not exists, please check email id.',
				status  : false
			}, 200);
		}
	} else {

		helper.errorHandler(res, {
			code    : 'AAA-E2001',
			message : 'All fields are required.',
			status  : false
		}, 200);
	}
}

/**
 * 
 * Created By 	: Anil Guleria 
 * Modified By 	:
 */
auth.downloadImage = async function (body) {
	
	let deferred 	    = q.defer(),
		filenameThree 	=  Date.now() + '.jpeg',
		options 	= {
			url		: body.image_url,
			dest	: './uploads/profile_image/'+ filenameThree,
		};
	let  { filenameFour, image } = await download.image(options);
	
	deferred.resolve(filenameThree);
	return deferred.promise;

}

/**
 * Used to download facebook image
 * Created By 	:  
 * Modified By 	: Dushyant Sharma
 */
auth.logout = async function (req , res) {
	let obj = {
		payload : "Device not deleted"
	};
	if ( req && req.body && req.body.device_id ) { 

		deleteDevice = await authModel.removeUserDevice(req.body.device_id, req.body.bundleId);
		
		if ( deleteDevice ) {

			let userId = helper.getUUIDByTocken(req);

			if ( userId ) {

				let updateOnlineStatus = await authModel.updateOnlineStatus(userId);

				if ( updateOnlineStatus ) {
					helper.successHandler(res);
				} else {
					helper.successHandler(res, obj);
				}

			} else {
				helper.successHandler(res, obj);
			}

		} else {
			helper.successHandler(res, obj);
		}

	} else {
		helper.successHandler(res, obj);
	}
}

/**
 * Used to signinWithFacebook 
 * @params 		: 
 * @developer 	: Dushyant Sharma
 * @modified 	: 
 */
auth.signinWithAppleId = async function(req, res) {

	console.log("req.body signinWithAppleId : ", req.body);

	if ( req && req.body && ( req.body.email || req.body.token ) ) {
		let userEmailData = '';
		if ( req.body.email ) {
			userEmailData = await authModel.checkUserExist(req.body.email);
		} else {
			userEmailData = await authModel.checkAppleTokenExist(req.body.token);
		}
		
		if ( userEmailData && Object.keys(userEmailData).length > 0 ) {

			let updateUserData = await auth.updateUserDataAppleId(req, userEmailData);
			console.log("ddddddddddddddddddd : updateUserData : ", updateUserData);
			if ( updateUserData ) {

				helper.successHandler(res, updateUserData );

			} else {
				// console.log("eeeeeeeeeeeeeeee : ");
				helper.errorHandler(res, {
					status 	: false,
					payload : {}
				}, 200);

			}

		} else {

			console.log("ffffffffffffffffffffff : ");

			let insertUserData = await auth.insertUserDataAppleId(req);
			console.log("gggggggggggggggggggggg insertUserData : ", insertUserData);
			if ( insertUserData ) {

				helper.successHandler(res, insertUserData);

			} else {
				// console.log("hhhhhhhhhhhhhhhhhhhhh : ");

				helper.errorHandler(res, {
					status 	: false,
					code 	: "AAA-E2003",
					message : 'Failed,Please try again.',
					payload : {}
				}, 200);

			}

		}

	} else {
		// console.log("iiiiiiiiiiiiiiiiiiiiiiii : ");

		helper.errorHandler(res, {
			status 	: false,
			code 	: "AAA-E2001",
			message : 'All fields are required',
			payload : {}
		}, 200);

	}

}
/**
 * Used to insert user data
 * @params 		: 
 * @developer 	: Dushyant Sharma
 * @modified 	: 
 */
 auth.insertUserDataAppleId= async function ( req ) {
	
	let deferred  		= q.defer(),
		uuid 			= uuidv1(Date.now()),
		insertedDate 	= new Date();

	if ( req && req.body ) {

		let conObj      = await constant.getConstant();
		let name        = await helper.capitalizeFirstLetter(req.body.name);
		let insertData 	= { 
			u_uuid                    : uuid,
			u_email                   : req.body.email,
			u_name                    : name,
			u_apple_id_token          : req.body.token,
			u_phone                   : req.body.mobile,
			u_created                 : insertedDate,
			u_is_online               : '1',
			u_is_available            : '1',
		},
		insertId 		= await commonModel.insert('user', insertData,true);
		console.log('insertUserDataAppleId==========111111111111111',insertId);
		if ( insertId > 0 ) {

			let qq = await authModel.removeDeviceIfExists(insertId, req.body.device_id);
			console.log('insertUserDataAppleId==========222222222',qq);

			let updateData 				    = {};
			updateData.u_device_token		= req.body.device_token;
			updateData.u_device_id 			= req.body.device_id;
			updateData.u_device_platform 	= req.body.device_platform;
			
			if ( updateData != '' ) {
				let updateSql = `UPDATE user SET ? WHERE u_id = ?`;
				let sqlQuery = commonModel.commonSqlQuery(updateSql,[updateData,insertId]);
			}

			let deviceObj = {
				'ud_fk_u_id'    : insertId,
				'ud_device_id'  : req.body.device_id,
				'ud_token'      : req.body.device_token,
				'ud_type'       : 'W',
				'ud_platform'   : req.body.device_platform,
			};

			if ( req.body.device_platform == 'Android' || req.body.device_platform == 'iOS') {
				deviceObj.ud_type = 'M';
			}

			if ( req.body.voipToken ) {
				deviceObj.ud_voip = req.body.voipToken;
			}

			let www = await authModel.addDeviceIfNotExists(deviceObj);
			console.log('insertUserDataAppleId==========333333333333',www);

			let getData = await _userModel.me( insertId ),
				payload = {
					iat 	 : Date.now(),
					"orgId"  : insertId,
					"userId" : uuid,
					"email"  : req.body.email
				},
			token = jwt.sign( payload, config.secret );	
			console.log('insertUserDataAppleId==========444444444444',getData);
	
			getData.token = token;
			
			let _res = {
				status: true,
				payload : getData
			};
			deferred.resolve(_res);

		} else {
			deferred.resolve(false);
		}

	} else {
		deferred.resolve(false);
	}

	return deferred.promise;

}
/**
 * Used to update user data
 * @params 		: 
 * @developer 	: Dushyant Sharma
 * @modified 	: 
 */
 auth.updateUserDataAppleId = async function(req, userEmailData) {

	let deferred  		= q.defer(),
		updateData 		= {};

	if ( req && userEmailData ) {

		let conObj      = await constant.getConstant();

		if ( userEmailData.u_name != '' || userEmailData.u_name != null ) {

			updateData.u_name    = req.body.name;
			userEmailData.u_name = req.body.name;
		}

		let removeDeviceIfExistsLet  	= await authModel.removeDeviceIfExists( userEmailData.u_id, req.body.device_id );
		updateData.u_device_token    	= req.body.device_token;
		updateData.u_apple_id_token  	= req.body.token;
		updateData.u_device_id       	= req.body.device_id;
		updateData.u_device_platform 	= req.body.device_platform;
		updateData.u_logged_in_by    	= 'AI';
		
		if ( updateData ) {

			let updateSql = `UPDATE user SET ? WHERE u_uuid = ?`;
			let sqlQuery = commonModel.commonSqlQuery(updateSql,[updateData,userEmailData.u_uuid]);
			
		}

		let deviceObj = {
			'ud_fk_u_id'    : userEmailData.u_id,
			'ud_device_id'  : req.body.device_id,
			'ud_token'      : req.body.device_token,
			'ud_type'       : 'W',
			'ud_platform'   : req.body.device_platform,
		};

		if ( req.body.device_platform == 'Android' || req.body.device_platform == 'iOS') {
			deviceObj.ud_type = 'M';
		}
		if ( req.body.voipToken ) {
			deviceObj.ud_voip = req.body.voipToken;
		}
		await authModel.addDeviceIfNotExists(deviceObj);
		let getData    		= await _userModel.me(userEmailData.u_id),
			payload 		= {
				iat : Date.now(),
				"orgId"  : userEmailData.u_id,
				"userId" : userEmailData.u_uuid,
				"email"  : req.body.email
			},

			token         	= jwt.sign(payload,config.secret);
			getData.token   = token;
		
		let _res 			= {
				status : true,
				payload : getData,
				message : 'Login Successfully'
			};
		// 	date            = await helper.getPstDateTime('timeDate'),
		// 	joinDate        = await helper.dateFormat(date, 'n');

		// 	activityObj 	= {
		// 		userId          : userEmailData.u_id,
		// 		actionUserId    : userEmailData.u_id,  
		// 		description     : getData.u_name + ' logged in using apple id on dated ' + joinDate, 
		// 		activityType    : 'LOGIN', 
		// 		date            : date
		// 	};
		
		// helper.insertUserActivityLogs(activityObj); 

		deferred.resolve( _res );
		
	} else {
		deferred.resolve( false );
	}	

	return deferred.promise;

}

/**
 * This function is using
 * @param        :
 * @returns       :
  * @developer : 
 */
auth.sendActivationCode = async function(req, res) {

	if ( req.body && req.body.email && req.body.mobile ) {

		let  userId = await commonModel.getRowById(req.body.email, 'u_email', 'u_id', 'user');
		let  active = await commonModel.getRowById(req.body.email, 'u_email', 'u_active', 'user');

		if ( userId && active == '1' ) {

			helper.successHandler( res, {
				message : 'Email already exist, Please enter new email.',
				status  : false
			},200);

		} else {

			let row = await authModel.sendActivationCode(req.body.email, req.body.mobile);

			let obj = {};
	
			if ( row && row.code ) {
	
				obj.code = row.code;
	
				if ( row.code == 'AAA-E1014' ) {
	
					obj.message = 'Account is already active';
					obj.status  = false;
	
				}
	
				helper.successHandler(res, obj);
	
			} else {
	
				helper.successHandler(res, {
					message : 'Account Activation code sent to your email.',
					status  : true
				}, 200);
			}
		}
	} else {

		helper.successHandler(res, {
			code    : 'AAA-E2001',
			message : 'All fields are required.',
			status  : false
		}, 200);
	}
}

/**
 * Forgot password controller
 * @param		:
 * @returns		:
 * @developer 	: 
 */
auth.forgotPasswordWithPhoneOrEmail = async function(req, res) {

	if ( req && req.body && req.body.email ) {

		let  phone 	= await commonModel.getRowById(req.body.email, 'u_phone', 'u_id', 'user');
		let  email 	= await commonModel.getRowById(req.body.email, 'u_email', 'u_id', 'user');
		let type    = '';

		if ( phone && phone != '' ) {
			type = 'PHONE';
		} else if ( email && email != '' ) {
			type = 'EMAIL';
		}

		if ( type && type != '' ) {

			let row = await authModel.forgotPasswordWithPhoneOrEmail(req.body.email, type);

			let obj = {};

			if ( row && row.code ) {

				obj.code = row.code;

				if ( row.code == 'AAA-E1010' ) {

					obj.message = 'Wrong activation code';
					obj.status = false;

				} else if ( row.code == 'AAA-E1013' ) {

					obj.message = 'Account does not exist';
					obj.status = false;

				} else if ( row.code == 'AAA-E1002' ) {

					obj.message = 'Account exist but not verified';
					obj.status  = false;

				} else {
					obj.message = 'Something went wrong.';
					obj.status  = false;
				}
			}

			obj.payload = {
				accountType : type
			};

			helper.successHandler(res, obj);

		} else {

			helper.successHandler(res, {
				code    : 'AAA-E2001',
				message : 'Account doesn`t exist.',
				status  : false
			}, 200);
		}
	} else {

		helper.errorHandler(res, {
			code    : 'AAA-E2001',
			message : 'All fields are required.',
			status  : false
		}, 200);
	}
}

/**
 * Reset password controller
 
 */
auth.resetPasswordWithPhoneOrEmail = async function(req, res) {

	if ( req && req.body && req.body.email && req.body.password && req.body.code && req.body.accountType ) {

		let row = await authModel.resetPasswordWithPhoneOrEmail(req.body);

		let obj = {};

		obj.message = 'Password reset successfully.';

		if ( row && row.code ) {

			obj.code = row.code;

			if ( row.code == 'AAA-E1010' ) {

				obj.message = 'You entered wrong token';
				obj.status  = false;

			} else if ( row.code == 'AAA-E1013' ) {

				obj.message = 'Account does not exist';
				obj.status  = false;

			} else if ( row.code == 'AAA-E1012' ) {

				obj.message = 'Token has been expired.';
				obj.status  = false;

			} else {
				obj.message = 'Something went wrong.';
				obj.status  = false;
			}

		}
		helper.successHandler(res, obj, 200);

	} else {

		helper.errorHandler(res, {
			code    : 'AAA-E2001',
			message : 'All fields are required.',
			status  : false
		}, 200);
	}
}

/**
 * Login Controller
 * @param        :
 * @returns      :
 * @developer    : 
 * @modification : 
 */
auth.loginWithPhoneEmail = async function(req, res) {
	
	let conObj    = await constant.getConstant(); 

	if ( req && req.body && req.body.email && req.body.password && req.body.device_token && req.body.device_id && req.body.device_platform ) {

		let expectedPayload = {
				"email"           : "",
				"password"        : "",
				"device_token"    : "",
				"device_id"       : "",
				"device_platform" : "",
			},

			result 			= payloadChecker.validator(req.body, expectedPayload, ["email", "password","device_token", "device_id", "device_platform"], true);
		
		if ( result && result.success ) {

			let type       = 'EMAIL',
				userDetail = await commonModel.getRowIdAll(req.body.email, 'u_email', 'user');

			if ( !userDetail ) {

				userDetail = await commonModel.getRowIdAll(req.body.email, 'u_phone', 'user');

				if ( userDetail && userDetail.u_phone ) {
					type = 'PHONE';
				}
			}

			if ( userDetail  && userDetail.u_logged_in_by != 'RQ' ) {
				
				let verifyPassword = passwordHash.verify(req.body.password, userDetail.u_password );
				// console.log(verifyPassword,"verifyPasswordverifyPasswordverifyPasswordverifyPasswordverifyPassword");
				if (  userDetail.u_active && userDetail.u_active == '0' && type == 'EMAIL' ) {

					let obj = {
						code    : "AAA-E1002",
						message : 'User exists but not active.',
						status  : false
					};
					helper.errorHandler(res, obj, 200);
					
				} else if ( userDetail.u_active && userDetail.u_active == '0' && type == 'PHONE' ) {

					let obj = {
						code    : "AAA-E1002",
						message : 'User doesn`t exist.',
						status  : false
					};
					helper.errorHandler(res, obj, 200);
						
				} else if (  userDetail.u_deleted && userDetail.u_deleted == '1' ) {

					let obj = {
						code    : "AAA-E1000",
						message :'User prohibited, please contact bobotracker support team for help.',
						status  : false
					};

					helper.errorHandler(res, obj, 200);

				} else if ( !verifyPassword ) {

					let obj = {
						code    : "AAA-E1001",
						message : 'Login credentials are incorrect.',
						status  : false
					};

					helper.errorHandler(res, obj, 200);

				} else {

					if ( userDetail.u_active == '1' && userDetail.u_phone_verified == '1' ) {

						let result  = await authModel.login( req.body,type );
						
						if ( typeof(result) == 'object' && Object.keys(result).length > 0 ) {
							
							let updateActiveStatus = authModel.updateActiveStatus(),

							payload = {
								iat      : Date.now(),
								"orgId"  : result.u_id,
								"userId" : result.u_uuid,
								"email"  : result.u_email
							},

							token        = jwt.sign(payload,config.secret);
                            result.token = token;

                            if ( result.u_image != null && result.u_image != '' ) {
                                result.u_image = conObj.SITE_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH +result.u_image;

							} else {
								
                               result.u_image = '';
                            }

							let commonData = {
								"u_uuid"           			: result.u_uuid, 
								"u_full_address"   			: result.u_full_address,
								"u_name"           			: result.u_name,
								"u_email"          			: result.u_email,
								"u_image"          			: result.u_image,
								"u_latitude"       			: result.u_latitude,
								"u_longitude"      			: result.u_longitude,
								"u_phone"          			: result.u_phone,
								"u_gender"         			: result.u_gender,
								"u_country" 	   			: result.u_country,
								"u_state" 	   	   			: result.u_state,
								"u_full_address"   			: result.u_full_address,
								"u_is_online"      			: result.u_is_online,
								"u_is_available"   			: result.u_is_available,
								"u_designation"    			: result.u_designation,
								"uw_balance"       			: result.uw_balance,
								"state_name"	   			: result.state_name,
								"country_name"	   			: result.country_name,
								"u_login_type"				: result.u_login_type,
							};
							
							commonData.u_profile_completed = 'N';

							if ( result.u_name != ''  && result.u_phone != ''  && result.u_image != '' && result.u_full_address != '' && result.communityName != null ) {

								commonData.u_profile_completed = 'Y';

							}

							// commonData.followerCount     = await commonModel.getFollowerCount(result.u_id);
							// commonData.followingCount    = await commonModel.getFollowingCount(result.u_id);
							// commonData.rating_user_count = await commonModel.getRatingUserCount(result.u_id);

							let obj = {
								message : 'Login successfully.',
								payload : commonData
							};
							// let socketData = {
							// 	"u_is_online"      			: commonData.u_is_online,
							// 	"u_is_available"   			: commonData.u_is_available,
							// 	"u_uuid"           			: commonData.u_uuid, 
							// }

							// io.emit('USER-PRESENCE',socketData);

							let date            = await helper.getPstDateTime('timeDate'),
								activityObj 	= {
									userId          : result.u_id,
									actionUserId    : result.u_id,  
									description     : result.u_name + ' logged in at ' + date, 
									activityType    : 'LOGIN', 
									date            : date
								};
							
							helper.insertUserActivityLogs(activityObj); 
							helper.successHandler(res,obj);

						} else {

							let obj = {
								code    : "AAA-E1008",
								message : 'Login credentials are incorrect.',
								status  : false
							};
							helper.errorHandler(res, obj, 200);

						}
					} else {

						let obj = {
							code    : "AAA-E1011",
							message : 'Your phone number not verified yet.',
							status  : false
						};
						helper.errorHandler(res, obj, 200);

					}
				}
			} else {

				let obj = {
					code    : "AAA-E1008",
					message : 'Account does not exist.',
					status  : false
				};
				helper.errorHandler(res, obj, 200);
				
			}
		} else {

			let obj = {
				code 	: "AAA-E2001",
				message : 'All fields are required',
				status 	: false
			};
			helper.errorHandler(res, obj, 200);
		}
	} else {

		let obj = {
			code 	: "AAA-E2001",
			message : 'All fields are required',
			status 	: false
		};
		helper.errorHandler(res, obj, 200);
	}
}

/**
 * Activate user account by entring activation code
 * @param        :
 * @returns       :
  * @developer : 
 */
auth.activateAccountWithPhoneCode = async function(req, res) {

	let userId = helper.getUUIDByTocken(req);

	if ( userId && req && req.body ) {

        let respnose = await authModel.activateAccountWithPhoneCode(req.body);

		if ( respnose && typeof(respnose) == 'object' ) {

			helper.successHandler(res, respnose);

		} else {

			helper.successHandler(res, {
				status  : false,
				code    : "AAA-E1000",
				message : 'Invalid OTP' 
			}, 200);
		}
	} else {

		helper.errorHandler(res, {
			code    : 'AAA-E2001',
			message : 'All fields are required.',
			status  : false
		}, 200);
	}
}

/**
 * 
 * @param     : password
 * @returns   : true , false 
 * @developer : Anil Guleria
 */
auth.validateWithPassword = async(req , res) => {

    let userId = helper.getUUIDByTocken(req);

	if ( userId && req && req.body && typeof(req.body.password) == 'string' ) {

        let result = await authModel.validatePassword(req.body, userId);

        if ( result ) {

			helper.successHandler(res, {
				status  : true ,
				code    : 200 ,
				message :'Password matched successfuly.',
				payload : []
			});

		} else {
            helper.successHandler(res, {
		 		status  : false ,
				code    : "AAA-E2002" ,
				message :'Password not matched please try with different password! ',
				payload : []
			});
		}
	} else {

        helper.errorHandler(res, {
			code    : 'AAA-E2001',
			message : 'Somthing went wrong.',
			status  : false
		}, 200);
	}
}

/**
 * 
 Anil Guleria
 */
auth.changePhoneNumber = async (req, res) => {

	let userId = helper.getUUIDByTocken(req);

	if ( userId && req && req.body && typeof (req.body.phone) =='string' ) {

       let result = await auth.checkPhoneNumberIsValid(req.body.phone);

		if ( result !='' ) {

			let countryCode  = req.body.countryCode,
		        phoneNumber  = req.body.phone,
			    resultOne    =  await authModel.sendActivationCodeOnPhone(countryCode + phoneNumber);

			if ( resultOne ) {

                helper.successHandler(res, {
					status  : true ,
					code    : 200 ,
					message :'Otp has send successfully..! ',
					payload : []
			    });

			} else {
				helper.errorHandler(res, {
					code    : 'AAA-E2001',
					message : 'Invalid OTP',
					status  : false
				}, 200);
			}
		} else {
			helper.errorHandler(res, {
				code    : 'AAA-E2002',
				message : 'Phone number is not valid please try again ..!',
				status  : false
			}, 200);
        }
	} else {
        helper.errorHandler(res, {
			code    : 'AAA-E2003',
			message : 'Somthing went wrong ....!',
			status  : false
		}, 200);
	}
}

/**
 * 
 Anil Guleria
 */
auth.checkPhoneNumberIsValid = async (number) => {

	if ( number && number !='' ) {

		let phoneno = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;

		if ( number.match(phoneno) ) {
			return true;
		} else {
			return false;
		}
    } else {
        helper.successHandler(res, {
			status  : false,
			code    : "AAA-E1000",
			message : 'Invalid Phone number!' 
		}, 200);
	}
}

/**
 * 
 * @param     :   
 * @returns   : 
 * @developer : Anil Guleria
 */
auth.sendEmailToken =  async (req , res) => {

	let userId = helper.getUUIDByTocken(req);

	if ( userId && req && req.body && req.body.email ) {

	   let isExit  	= await commonModel.getRowById(req.body.email, 'u_email','u_id', 'user');
	   let isValid  = await auth.IsEmail(req.body.email);

		if ( isValid ) {

			if ( isExit ) {

				let result = await authModel.sendEmailToken(req.body.email);
				
				if ( result ) {

					helper.successHandler(res, {
						status  : true ,
						code    : 200 ,
						message :'Token has send successfully please check your email id'
					});
				} else {
					helper.successHandler(res, {
						status  : false ,
						code    : 401 ,
						message :'Somthing want wrong, please try again.'
						
					});
				}
			} else {

				helper.successHandler(res, {
					status  : false,
					code    : "AAA-E1001",
					message : 'Email is not exit please try with diffrent email.' 
				}, 200);
			}
	    } else {
			helper.successHandler(res, {
					status  : false,
					code    : "AAA-E1002",
					message : 'Email is not valid.' 
			}, 200);
		}				
    } else {
        helper.successHandler(res, {
			status  : false,
			code    : "AAA-E1000",
			message : 'Somthing went wrong.' 
		}, 200);
	}
}

/**
 * 
 * @param     :  
 * @returns   : 
 * @developer : Anil Guleria
 */
auth.verifyPhoneNumber = async(req , res) => {

 let userId = helper.getUUIDByTocken(req);

	if ( userId && req && req.body ) {

		let userPhone   = req.body.phone ,
		    countryCode = req.body.countryCode,
		    tokenNumber = req.body.token,
			result 		= await authModel.verifyCodeWithPhone(countryCode+userPhone, tokenNumber);

		if ( result ) {

            let dataObj 	= {
					u_id        : userId ,
					countryCode : countryCode ,
					userPhone   : userPhone 
				},
				resultTwo = authModel.updateUserPhoneNumber(dataObj);

		    if ( resultTwo ) {

                helper.successHandler(res, {
					status  : true,
					code    : "200",
					message : 'Phone number updated successfully.' 
				}, 200);

		    } else {

				helper.successHandler(res, {
					status  : false,
					code    : "AAA-E1001",
					message : 'Somthing went wrong.' 
				}, 200);
			}
		} else {
			helper.successHandler( res, {
				status  : false,
				code    : "AAA-E1003",
				message : 'Somthing went wrong.' 
			}, 200);
        }
	} else {

        helper.successHandler(res, {
			status  : false,
			code    : "AAA-E1000",
			message : 'Somthing went wrong.' 
		}, 200);
	}
}

/**
 * 
 Anil Guleria
 */
auth.updateUserEmail = async (req , res) => {

 let userId = helper.getUUIDByTocken(req);

	if ( userId && req && req.body && typeof(req.body.email) =="string" ) {

		let isValid  = await auth.IsEmail(req.body.email);
		
		if ( isValid ) {

			let isExit = await commonModel.getRowById(req.body.email, 'u_email','u_id', 'user');
			
			if( isExit ) {

				helper.successHandler(res, {
					status  : false,
					code    : "AAA-E1000",
					message : 'Sorry this email is already in use. Please use another one.' 
				}, 200);

			} else {

				let result = await authModel.sendNewEmailToken(req.body.email , userId);
				
				if ( result ) {

					helper.successHandler(res, {
						status  : true,
						code    : "200",
						message : 'Otp has been send successfully on your new e-mail id.' 
					}, 200);

				} else {
					helper.successHandler(res, {
						status  : false,
						code    : "AAA-E1002",
						message : 'Somthing went wrong please try again.' 
					}, 200);
				}
			}
		} else {
            helper.successHandler(res, {
				status  : false,
				code    : "AAA-E1002",
				message : 'Email is not valid.' 
			}, 200);
		}	
    } else {
        helper.successHandler(res, {
			status  : false,
			code    : "AAA-E1000",
			message : 'Not authorised please try again.' 
		}, 200);
	}	
}

/**
 * 
 Anil Guleria
 */
auth.updateEmail = async (req , res) => {

	let userId = await helper.getUUIDByTocken(req);

	if ( userId && req && req.body && req.body.token && typeof(req.body.email) =="string" ) {
		
		let isValid  = await auth.IsEmail(req.body.email);

		if ( isValid ) {

         let isExit = await commonModel.getRowById(req.body.token, 'u_activation_token','u_id', 'user');

			if ( isExit ) {

				let result = await authModel.updateMailId(req.body);
				
				if ( result ) {
					
					helper.successHandler(res, {
						status  : true,
						code    : "200",
						message : 'Mail id has been update successfully ...!' 
					}, 200);

				} else {

					helper.successHandler(res, {
						status  : false,
						code    : "AAA-E1002",
						message : 'Somthing went wrong.' 
					}, 200);
				}
			} else {
				helper.successHandler(res, {
					status  : false,
					code    : "AAA-E1001",
					message : 'Invalid otp.' 
				}, 200);
			}
		} else {
            helper.successHandler(res, {
				status  : false,
				code    : "AAA-E1002",
				message : 'Email is not valid.' 
			}, 200);
		}
	} else {
		helper.successHandler(res, {
			status  : false,
			code    : "AAA-E1000",
			message : 'Not authorised please try again.' 
		}, 200);
	}
}

/**
 * Used to add user business data.
 * @params    : name, email, mobile, description
 * @returns   : 
 * @developer : Anil Guleria
 */
auth.addUserBusinessData = async (req , res) => {

	let userId = await helper.getUUIDByTocken(req);

	if ( userId && req && req.body && req.body.name ) {
		
		let resData  = await authModel.addUserBusinessData(userId, req.body);

		if ( resData ) {

			helper.successHandler(res, {
				status  : true,
				code    : "200",
				message : 'Business added successfully.' 
			}, 200);

			
		} else {
            helper.successHandler(res, {
				status  : false,
				code    : "AAA-E1002",
				message : 'Business not added, please try again later.' 
			}, 200);
		}
	} else {
		helper.successHandler(res, {
			status  : false,
			code    : "AAA-E1000",
			message : 'Not authorised please try again.' 
		}, 200);
	}
}


/**
 * 
 * @param     :   
 * @returns   : 
 * @developer : Anil Guleria
 */
auth.IsEmail = async( email ) => {

  let regex = /^([a-zA-Z0-9_\.\-\+])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

	if ( !regex.test(email) ) {
	   return false;
	} else {
	   return true;
	}
}

module.exports = auth;