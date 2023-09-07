



const { async } = require('q');
const { result } = require('underscore');

const passwordHash 		= require('password-hash'),
    AWS                 = require('aws-sdk'),
    q                   = require('q'),
    spacetime           = require('spacetime'),
    {v1: uuidv1}        = require('uuid'),

    config				= require('../../configCommon/config').init(),
    connectionManager 	= require('../../configCommon/config/db'),
    pool 	            = require('../../configCommon/config/pool'),
    common              = require('./configCommon'),
    constant            = require('../../configCommon/config/constants'),
    commonHelper        = require('../../configCommon/helpers/index'),
    // updateModel         = require('../models/update_users_count'),
    helper              = require('../../configCommon/helpers/index');
    // email_template      = require('./email_templates');
        

let authModel           = {};

/**
 * This function is used to signup
 * @param        :
 * @returns      :
 * @developer    :
 * @modification : Anil Guleria
 */
authModel.signup = async function( body ) {
  
    let deferred = q.defer(),
        conObj   = await constant.getConstant();
    // console.log('model 111111111=================');
    if ( body && body.email && body.name && body.password ) {
        // console.log('model 222222222222=================');
        let hashedPassword  = passwordHash.generate(body.password),
            activationCode  = Math.floor(Math.random() * (+9876 - +1234)) + +1234,
            uuid            = uuidv1(Date.now()),
            insertedDate    = new Date(),
            insertQuery     = "INSERT INTO user SET ?",
            name            = await commonHelper.capitalizeFirstLetter(body.name),
            date            = await commonHelper.getPstDateTime('timeDate'),
            // joinDate        = await commonHelper.dateFormat(date, 'n'),
            insertData      = {
                u_uuid                    : uuid,
                u_email                   : body.email,
                u_name                    : name,
                u_phone                   : body.mobile,
                u_password                : hashedPassword,
                u_activation_token        : activationCode,
                u_created                 : insertedDate,
                u_is_online               : '1',
                u_is_available            : '1',
                u_created                 : date
            };
            // console.log('datedatedate==========>>>>>',date)

        pool.query(insertQuery, insertData, async ( error, results, fields ) => {

            if ( error ) {
                // console.log('model 33333333333333 error ================= ', error);
                deferred.resolve(false);
            } else {
                // console.log('model 444444444444444 =================');
                if ( results && Object.keys(results).length > 0 && results.insertId ) {
                    // console.log('model 55555555555555555=================');
                    let userId = results.insertId;
                    common.addPrimaryEmail(body.email,userId); 

                    if ( userId && userId != '' ) {

                        let activityObj = {
                            userId          : userId,
                            actionUserId    : userId,  
                            description     : name + 'joined on dated ' + Date.now(), 
                            activityType    : 'SIGNUP', 
                            date            : date
                        };
                        
                        // commonHelper.insertUserActivityLogs(activityObj);
                        // console.log('sfdhjasgjdfgjshdfggsjzdfghdsjzfds', body);

                        let insertQuery1 = 'INSERT INTO user_profile ( up_fk_u_id, up_created ) VALUES (?,?)';

                        pool.query( insertQuery1, [userId, insertedDate], async (error, result) => {
                            
                            if( error ){
                                deferred.resolve(error);
                            } else {
                                // console.log('body, activationCode',body, activationCode)
                            // authModel.sendNewUserNotification(userId);
                            let sendActivationEmail = await authModel.sendActivationEmail( body, activationCode );
                            console.log('aa====================>>>>>',sendActivationEmail)
                            deferred.resolve(true);
                            }
                        });
                        // }, function() {
                        //     deferred.resolve(error);
                        // });

                    } else {
                        // console.log('model 4235354353453456354545=================');
                        deferred.resolve(false);
                    }

                }

            }
        
        });

    }
    
    return deferred.promise;
}

/**
 * 
 * @param {*} userId 
 * @param {*} bodyObj 
 * @returns 
 */
authModel.sendDriverActivationCode = async (body) => {

    let deferred = q.defer();

    if ( body && body.email ) {
        // console.log('resObjresObjresObjresObjresObj =====  11111111111111111111111');

        let randomNumber    = Math.floor(Math.random() * (9999 - 1000) + 1000),
            conObj          = await constant.getConstant(),
            updateQuery     = 'UPDATE user SET user.u_activation_token = ?, user.u_active_count = ? WHERE user.u_email = ?';

        pool.query(updateQuery, [randomNumber, 0, body.email], async (error, row, fields) => {

            if ( error ) {
                // deferred.reject(error);
                // console.log('resObjresObjresObjresObjresObj ===== 22222222 error === ', error);
                deferred.resolve(false);
            } else {

                // console.log('resObjresObjresObjresObjresObj ===== 3333333333 ');

                let emailArray = {
                    to      : body.email,
                    from    : conObj.SITE_EMAIL,
                    subject : 'Login Token ',
                    body    : "Hi, here is your login code to login to your your account " + randomNumber,
                };

                /** TODO: WELCOME EMAIL TO USER. */
                common.sendEmails(emailArray);
                // common.insertSentEmailData(emailArray);
                deferred.resolve(true);
               /*  deferred.resolve({
                    message: 'Account login code has been sent to your email.'
                }); */
            }
        });
    } else {
        // console.log('resObjresObjresObjresObjresObj =====  444444');
        deferred.resolve(false);
    }

    return deferred.promise;

}

/**
 * Used to insert data in user business table
 * @returns     : 
 * @developer   : Anil Guleria
 */
authModel.addUserBusinessData = async (userId, bodyObj) => {
// console.log('asfsfsadfsdf', userId);
// console.log('asfsfsadfsdf', bodyObj);
    let deferred = q.defer();

    if ( userId && bodyObj ) {
        // console.log('asfsfsadfsdf');

        let uuBusinessId    = uuidv1(Date.now()),
            name            = await commonHelper.capitalizeFirstLetter(bodyObj.name),
            date            = await commonHelper.getPstDateTime('timeDate'),
            insertQuery     = "INSERT INTO user_business SET ?",

            insBusinessObj  = {

                ubs_fk_u_id     : userId,
                ubs_uuid        : uuBusinessId,
                ubs_name        : name,
                ubs_email       : bodyObj.email,
                ubs_mobile      : bodyObj.mobile,
                ubs_is_active   : '1',
                ubs_created_at  : date
                // ubs_description :  
            };

            pool.query(insertQuery, insBusinessObj, async (error, results, fields) => {

                if ( error ) {
                    // console.log('model 33333333333333 error ================= ', error);
                    // deferred.reject(error);
                    deferred.resolve(false);
                } else {
                    // console.log('model 444444444444444 =================');
                    if ( results && Object.keys(results).length > 0 && results.insertId ) {
                        // console.log('model 55555555555555555=================');
                        
                        deferred.resolve(true);
                    } else {
                        deferred.resolve(false);
                    }
                }
            });
    } else {
        deferred.resolve(false);
    }

    return deferred.promise;
}

/**
 * This function is using to 
 * @param        :
 * @returns      :
 * @developer    :
 * @modification :  
 */
authModel.updateActiveStatus = async () => {

    let deferred            = q.defer();
        /* updateTopics        = await updateModel.updateTopicUserCountLoop(),
        updateCom           = await updateModel.updateAllComUsersCountLoop(),
        updateCat           = await updateModel.updateAllCatUsersCountLoop() ;*/
    deferred.resolve(true);
    return deferred.promise;
}

/**
 * This function is using to login
 * @param        :
 * @returns      :
 * @developer    : 
 */
 authModel.login = async (body, type = '') => {

       let deferred       = q.defer(),
           d              = spacetime.now('America/Los_Angeles'),
           dDate          = d.unixFmt('yyyy-MM-dd'),
           conObj         = await constant.getConstant(),
           addCondition   = ' u_email = ? ',
           dTime          = d.unixFmt('hh:mm:ss');
       
        if ( body && body.email && body.password ) {
    
            if ( type && type == 'PHONE' ) {
                addCondition   = ' u_phone = ? ';
            }
    
            let stepOne         = `SELECT user.u_id, user.u_uuid, user.u_full_address, user.u_name, user.u_rank,u_free_contest,u_points_contest,u_sponsor_contest,u_paid_contest, user.u_email, user.u_description, user.u_password, user.u_image,  user.u_latitude, user.u_longitude, user.u_phone, user.u_gender, user.u_country, user.u_state, user.u_full_address, user.u_is_online, user.u_is_available, user.u_active_count, user.u_activation_token, user.u_active, countries.name as country_name, states.name as state_name
            FROM user 
            LEFT JOIN countries ON countries.id = user.u_country 
            LEFT JOIN states ON states.id = user.u_state 
            WHERE`  + addCondition;
    
            let stepSeven       = 'UPDATE user SET u_device_token = ? ,  u_device_id = ?,  u_device_platform = ?, u_is_online = ? WHERE u_id = ?';
            
            let getUserStepOne  =  await commonHelper.getDataOrCount( stepOne, [ body.email], 'D' ,true );
            if ( getUserStepOne && getUserStepOne.length > 0 && getUserStepOne[0] &&  getUserStepOne[0].u_id ) {
        
                let loginUserData      = getUserStepOne[0] ;
    
                if ( loginUserData.u_password && passwordHash.verify(body.password, loginUserData.u_password ) ) {
    
                    loginUserData.u_profile_completed = 'N';
    
                    if ( loginUserData.u_name != '' && loginUserData.u_phone != '' && loginUserData.u_image != '' && loginUserData.full_address != '' && loginUserData.u_full_address != '' ) {
                        loginUserData.u_profile_completed = 'Y';
                    }
    
                    let removeDeviceIfExistsLet = await authModel.removeDeviceIfExists( loginUserData.u_id, body.device_id );
                    console.log('33333333333333333333 : ', removeDeviceIfExistsLet);
                    if ( removeDeviceIfExistsLet == true ) {
                       
                        /** TOO DO need to remove update device  */
                        let updateDevice = await commonHelper.getDataOrCount( stepSeven,   [ body.device_token, body.device_id, body.device_platform, '1', loginUserData.u_id] , 'U');
                        console.log('44444444444444 : updateDevice ', updateDevice);
                        let deviceObj = {
                            'ud_fk_u_id'    : loginUserData.u_id,
                            'ud_device_id'  : body.device_id,
                            'ud_token'      : body.device_token,
                            'ud_type'       : 'W',
                            'ud_platform'   : body.device_platform,
                        };
    
                        if ( body.voipToken ) {
                            deviceObj.ud_voip = body.voipToken;
                        }
                        if ( body.bundleId ) {
                            deviceObj.ud_bundle_id = body.bundleId;
                        }
                        if ( body.device_platform == 'Android' || body.device_platform == 'iOS') {
                            deviceObj.ud_type = 'M';
                        }
                        console.log(' loginDevice : ', deviceObj);

                        let loginDevice =  await authModel.addDeviceIfNotExists(deviceObj);

                             await authModel.updateLastLoginTime(loginUserData.u_id);

                        if ( loginDevice &&  updateDevice ) {

    
                            if ( loginUserData.u_is_online ) {
        
                                loginUserData.u_is_online = '1';
                            }
    
                            deferred.resolve(loginUserData);
    
                        } else {
                            // console.log('66666666666666666');
                            deferred.resolve(false);
                        }                       
        
                    } else {
                        deferred.resolve(false);
                    }
    
                } else {
                    deferred.resolve(false);
                }
            
            } else {
                // console.log('asfdasfddsfsdfgdsfdsfdsf');
                deferred.resolve(false);
            }
    
        } else {
            deferred.resolve(false);
        }
        
       return deferred.promise;
   
   }
/**
 * This function is using to login
 * @param        :
 * @returns      :
 * @developer    :
 * @modification :  Anil Guleria
 */
authModel.loginDriver = async (body, type = '') => {

    let deferred       = q.defer();
        
    
    if ( body && body.email && body.token && body.token != 'null' ) {

        let d              = spacetime.now('America/Los_Angeles'),
            dDate          = d.unixFmt('yyyy-MM-dd'),
            conObj         = await constant.getConstant(),
            addCondition   = ' u_email = ? AND u_activation_token = ? ',
            dTime          = d.unixFmt('hh:mm:ss');

        if ( type && type == 'PHONE' ) {
            addCondition   = ' AND u_phone = ' + type + ' ';
        }

        let stepOne        = `SELECT user.u_id, user.u_uuid, user.u_full_address, 
        user.u_name, user.u_email, user.u_description, user.u_password, user.u_image,  user.u_latitude, user.u_longitude, user.u_phone, user.u_gender, user.u_country, user.u_state, user.u_full_address, user.u_is_online, user.u_is_available, user.u_active_count, user.u_activation_token, user.u_active, user.u_login_type, user_address.ua_state, user_address.ua_country, user_wallet.uw_balance,countries.name as country_name, states.name as state_name,
        ubs.ubs_uuid, ubs.ubs_name, ubs.ubs_description, ubs.ubs_address, ubs.ubs_email, ubs.ubs_image, ubs.ubs_mobile, ubs.ubs_drivers_count, ubs.ubs_created_at,
        ubdd.ubdd_uuid, ubdd.ubdd_licence_number, ubdd.ubdd_driver_name, ubdd.ubdd_email, ubdd.ubdd_mobile, ubdd.ubdd_image, ubdd.ubdd_vehicle_name, ubdd.ubdd_vehicle_number 
        FROM user 
        LEFT JOIN user_address ON user_address.ua_fk_u_id = user.u_id 
        LEFT JOIN countries ON countries.id = user.u_country 
        LEFT JOIN states ON states.id = user.u_state 
        LEFT JOIN user_wallet ON user_wallet.uw_fk_u_id = user.u_id 
        LEFT JOIN user_business AS ubs ON ubs.ubs_fk_u_id = user.u_id
        LEFT JOIN user_business_driver_detail AS ubdd ON ubdd.ubdd_fk_driver_u_id = user.u_id
        
        WHERE ` + addCondition;

        let stepSeven       = 'UPDATE user SET u_device_token = ? ,  u_device_id = ?,  u_device_platform = ?, u_is_online = ? WHERE u_id = ?',
        
            getUserStepOne  =  await commonHelper.getDataOrCount(stepOne, [body.email, body.token] );
        // console.log("getUserStepOnegetUserStepOnegetUserStepOne : ", getUserStepOne);
        if ( getUserStepOne && getUserStepOne.length > 0 && getUserStepOne[0] &&  getUserStepOne[0].u_id ) {

            console.log('111111111111111111111111111');

            let loginUserData      = getUserStepOne[0] ;
            
            loginUserData.u_profile_completed = 'N';

            if ( loginUserData.u_name != '' && loginUserData.u_phone != '' && loginUserData.u_image != '' && loginUserData.full_address != '' && loginUserData.u_full_address != '' ) {
                loginUserData.u_profile_completed = 'Y';
            }

            let removeDeviceIfExistsLet = await authModel.removeDeviceIfExists( loginUserData.u_id, body.device_id );
            // console.log('33333333333333333333 : ', removeDeviceIfExistsLet);
            if ( removeDeviceIfExistsLet == true ) {
                // console.log('44444444444444');
                /** TOO DO need to remove update device  */
                let updateDevice = await commonHelper.getDataOrCount(stepSeven, [body.device_token, body.device_id, body.device_platform, '1', loginUserData.u_id] , 'U');
                // console.log('44444444444444 : updateDevice ', updateDevice);
                let deviceObj = {
                    'ud_fk_u_id'    : loginUserData.u_id,
                    'ud_device_id'  : body.device_id,
                    'ud_token'      : body.device_token,
                    'ud_type'       : 'W',
                    'ud_platform'   : body.device_platform,
                };

                if ( body.voipToken ) {
                    deviceObj.ud_voip = body.voipToken;
                }
                if ( body.bundleId ) {
                    deviceObj.ud_bundle_id = body.bundleId;
                }
                if ( body.device_platform == 'Android' || body.device_platform == 'iOS' ) {
                    deviceObj.ud_type = 'M';
                }

                let loginDevice =  await authModel.addDeviceIfNotExists(deviceObj);
                    authModel.updateLastLoginTime(loginUserData.u_id);
                    // console.log('55555555555555 loginDevice : ', loginDevice);
                if ( /* loginDevice &&  */updateDevice ) {

                    if ( loginUserData.u_is_online ) {
                        loginUserData.u_is_online = '1';
                    }

                    deferred.resolve(loginUserData);

                } else {
                    // console.log('66666666666666666');
                    deferred.resolve(false);
                }                       
            } else {
                deferred.resolve(false);
            }
        } else {
            // console.log('asfdasfddsfsdfgdsfdsfdsf');
            deferred.resolve(false);
        }
    } else {
        deferred.resolve(false);
    }
     
    return deferred.promise;
}

/**
 * This function is using 
 Anil Guleria
 */
authModel.addDeviceIfNotExists = async (data) => {

    if ( data && data.ud_device_id && data.ud_fk_u_id && data.ud_token && data.ud_type && data.ud_platform ) { 

        let stepOne    = "INSERT INTO user_devices SET ?",
            removeData = await authModel.removeUserDevice(  data.ud_device_id ,data.ud_bundle_id);

        if ( removeData ) {

            let inserData  = await commonHelper.getDataOrCount( stepOne, data , 'U' , true);

            if ( inserData ) {
                return true;
            } else {
                return false;
            }

        } else {
            return false;
        }

    } else {
        return false;
    }
        
}

/**
 * This function is using 
 
 */
authModel.removeDeviceIfExists = async (_uId, _deviceId) => {

    let deferred = q.defer();

    pool.query('SELECT u_id from user WHERE u_device_id = ? AND u_id != ?', [_deviceId ,_uId] , async (err, res) => {

        if ( err ) {
            deferred.reject(err);
        } else {

            if ( res && res.length > 0 ) {

                pool.query('UPDATE user SET u_device_token = ?, u_device_id = ?, u_device_platform = ?  WHERE u_id = ?', [ '', '', '' ,res[0].u_id ] , function ( error, result ) {

                    if ( error ) {
                        deferred.reject(error);
                    } else {

                        if ( result ) {
                            deferred.resolve(true);
                        } else {
                            deferred.resolve(true);
                        }

                    }

                });

            } else {
                deferred.resolve(true);
            }

        }

    });

    return deferred.promise;

}

/**
 * This function is using 
 Anil Guleria
 */
authModel.removeUserDevice = async (_deviceId, bundleId = '') => {

    let deferred        = q.defer(),
        addDevCon       = '',
        addConnCon      = '';

    if ( bundleId && bundleId != '' ) {

        addDevCon += " AND ud_bundle_id = '"+bundleId+"'";

        addConnCon += " AND uc_bundle_id = '"+bundleId+"'";

    }
    let sqlDevice       = 'DELETE FROM user_devices WHERE ud_device_id = ? '+ addDevCon,
        sqlconnection   = 'DELETE FROM user_connections WHERE uc_device_id = ? '+addConnCon;

    if ( _deviceId ) {

        let deleteDevice    = await common.commonSqlQuery(sqlDevice , [_deviceId] ,true);

        if ( deleteDevice ) {

            let deleteConnection =  await common.commonSqlQuery(sqlconnection , [_deviceId] ,true);

            if ( deleteConnection ) {
                deferred.resolve(true);
            } else {
                deferred.resolve(false);
            }

        } else {
            deferred.resolve(false);
        }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}

/**
 * This function is using 
 Anil Guleria
 */
authModel.updateOnlineStatus = async ( _userId) => {

    let deferred        = q.defer(),
        sqlDevice       = 'SELECT * FROM `user_devices` WHERE `ud_fk_u_id` = ?',
        updateUser      = 'UPDATE `user` SET `u_is_online` = ?,`u_is_available` = ? WHERE `u_id` = ?',
        sqlUserData     = 'SELECT u_uuid , u_is_online ,u_is_available FROM `user` WHERE `u_id` = ?';

    if ( _userId ) {

        let checkuserAvailability    = await commonHelper.getDataOrCount(sqlDevice , [_userId] , 'L');

        if ( !checkuserAvailability ) {

            let updateUserStatus = await common.commonSqlQuery(updateUser , ['0' ,'0', _userId ]);

            if ( updateUserStatus ) {

                let userData   = await commonHelper.getDataOrCount(sqlUserData , [_userId] );

                if ( userData ) {
                    io.emit('USER-PRESENCE',userData[0]);
                    deferred.resolve(true);
                }

            } else {
                deferred.resolve(false);
            }

        } else {
            deferred.resolve(true);
        }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;
    
}

/**
 * This function is using 
 
 */
authModel.sendActivationEmail = async (body, activationCode) => {
    console.log('We are hear ===================>>>>>>>sendActivationEmail',body,activationCode);
    let to       = body.email,
        conObj   = await constant.getConstant(),
        from     = conObj.SITE_EMAIL,
        username = '';
        
    if ( body.name ) {
        username = body.name;
    }

    let sub         = 'Activation Account';
        /* text        = await common.getEmailText('ACTIVATE ACCOUNT'),
        dataEmail   = text.replace('USERNAME', username);
        dataEmail   = dataEmail.replace('CODE', activationCode); */
        
    let emailArray = {
        to      : to,
        from    : from,
        subject : sub,
        body    : "Hi " + username + ", <br> Welcome to Glimpsters. Here is your activation code to activate your account  : " + activationCode,
    };
    console.log('We are hear ===================>>>>>>>emailArray',emailArray);

    if ( common.sendEmails( emailArray ) ) {
        // common.insertSentEmailData(emailArray);
        return true;
    }

    return false;

}

/**
 * This function is using 
 
 */
authModel.checkEmailExist = async ( _email) => {

    let deferred    = q.defer(),
        selectQuery = "SELECT u_id FROM user WHERE u_email = ?";

    pool.query(selectQuery, [_email], async (error, results) => {

        if ( error ) {
            deferred.reject(error);
        } else {

            if ( results.length > 0 ) {
                deferred.resolve( true );
            } else {
                deferred.resolve( false );
            }

        }

    });

    return deferred.promise;

}

/**
 * This function is using 
 
 */
authModel.checkUserExist = async ( _email) => {

    let deferred    = q.defer(),
        selectQuery = "SELECT u_id, u_email, u_gender, u_dob, u_image, u_uuid, u_name FROM user WHERE u_email = ?";

    pool.query(selectQuery, [ _email ], async (error, results) => {

        if ( error ) {
            deferred.reject(error);
        } else {

            if ( results.length > 0 ) {
                deferred.resolve(results[0]);
            } else {
                deferred.resolve( false );
            }

        }

    });

    return deferred.promise;

}

/**
 * This function is using 
 
 */
authModel.isAccountActivated = async ( _email ) => {

    let deferred    = q.defer(),
        selectQuery = "SELECT u_id FROM user WHERE u_email = ? AND u_active = ?";

    connectionManager.getConnection().then(async (connection) => {

        connection.query(selectQuery, [ _email,'1' ], async (error, results) => {

            if ( results.length > 0 ) {
                deferred.resolve( true );
            } else {
                deferred.resolve( false );
            }

        });

    }).catch(error => { 
        deferred.reject(error); 
    });

    return deferred.promise;

}

/**
 * This function is using 
 
 */
authModel.updateFbUser = async (data) => {

    let deferred    = q.defer(),
        selectQuery = "UPDATE user set u_name = ? AND u_active = ?";

    connectionManager.getConnection().then(async (connection) => {

        connection.query(selectQuery, [ _email,'1' ], async (error, results, fields) => {

            if ( results.length > 0 ) {
                deferred.resolve( true );
            } else {
                deferred.resolve( false );
            }

        });

    }).catch(error => { 
        deferred.reject(error); 
    });

    return deferred.promise;
    
}

/**
 * Activate account model
 
 */  
authModel.activateAccount = async (data) => {
    
    let deferred = q.defer(),
        d        = spacetime.now('America/Los_Angeles'),
        dDate    = d.unixFmt('yyyy-MM-dd'),
        dTime    = d.unixFmt('hh:mm:ss');
    /** TODO : validation */
    // let selectQuery = `SELECT user.u_id, user.u_uuid, user.u_full_address,  user.u_name, user.u_email, user.u_description, user.u_password, user.u_image, user.u_latitude, user.u_longitude, user.u_phone, user.u_gender, user.u_active_count, user.u_activation_token, user.u_active, user.u_is_online,user.u_is_available, user.u_login_type, user.u_login_type, user_address.ua_state, user_address.ua_country, user_wallet.uw_balance, countries.name as country_name, states.name as state_name
    // FROM user 
    // LEFT JOIN user_address ON user_address.ua_fk_u_id = user.u_id 
    // LEFT JOIN countries ON countries.id = user.u_country 
    // LEFT JOIN states ON states.id = user.u_state  
    // LEFT JOIN user_wallet ON user_wallet.uw_fk_u_id = user.u_id 
    // WHERE u_email = ?`;
    let selectQuery = `SELECT user.u_id, user.u_uuid, user.u_full_address,  user.u_name, user.u_email, user.u_description, user.u_password, user.u_image, user.u_latitude, user.u_longitude, user.u_phone, user.u_gender, user.u_active_count, user.u_activation_token, user.u_active, user.u_is_online,user.u_is_available, countries.name as country_name, states.name as state_name
    FROM user 
    LEFT JOIN countries ON countries.id = user.u_country 
    LEFT JOIN states ON states.id = user.u_state  
    WHERE u_email = ?`;


    let results = await authModel.getTotalRec(selectQuery, [data.email]);
    // console.log('resultsresultsresultsresults : ', results);
    if ( results && results.sqlMessage ) {
        deferred.resolve(false);
    } else {
        // console.log('11111111111111111111 : ');
        if ( results && results.length > 0 ) {
            // console.log('22222222 : ');
            if ( results[0].u_active_count < 3 ) {
                
                if ( results[0].u_active == '1' ) {

                    let _res = {
                        status  : false,
                        code    : "AAA-E1012",
                        message : 'Account already active. Please login with your credentials.',
                        payload : {}
                    };
                    deferred.resolve( _res );
                    return deferred.promise;

                }

                let increase_count = results[0].u_active_count + 1;
                
                let updateQuery    = 'UPDATE user SET u_active_count = ? WHERE u_email = ?';
                
                pool.query(updateQuery, [increase_count, data.email], function ( error, results1 ) {
                    
                    if ( error ) {
                        deferred.resolve(false);
                    } else {
                        // console.log(data.token,"data.tokendata.tokendata.tokendata.tokendata.tokendata.tokendata.tokendata.tokendata.tokendata.token");
                        // console.log(results[0].u_activation_token,"results[0].u_activation_tokenresults[0].u_activation_tokenresults[0].u_activation_tokenresults[0].u_activation_tokenresults[0].u_activation_tokenresults[0].u_activation_tokenresults[0].u_activation_tokenresults[0].u_activation_tokenresults[0].u_activation_token");
                        if ( results[0].u_activation_token == data.token ) {

                            let updateQuery1 = 'UPDATE user set u_active = ?, u_active_count = ? WHERE u_email = ?';
                            
                            pool.query(updateQuery1, [ '1', 0, data.email ], async function ( error, results2 ) {
                                
                                common.verifyPrimaryEmail(data.email,results[0].u_id);
                                let tokenData = {
                                    iat         : Date.now(),
                                    "orgId"     : results[0].u_id, 
                                    "userId"    : results[0].u_uuid,
                                    "email"     : results[0].u_email
                                };
                                let token      = jwt.sign(tokenData,config.secret);
                                results[0].token = token;
                                let emailObj   = await common.getSecondaryEmailObj(results[0].u_id);
                                let channelObj = await common.getUserChannelData(results[0].u_id);
                                let commonData = {
                                    "u_uuid"                 : results[0].u_uuid, 
                                    "u_full_address"         : results[0].u_full_address,
                                    "u_name"                 : results[0].u_name,
                                    "u_email"                : results[0].u_email,
                                    "u_description"          : results[0].u_description,
                                    "u_image"                : results[0].u_image,
                                    "u_latitude"             : results[0].u_latitude,
                                    "u_longitude"            : results[0].u_longitude,
                                    "u_phone"                : results[0].u_phone,
                                    "u_gender"               : results[0].u_gender,
                                    "u_is_online"            : results[0].u_is_online,
                                    "u_is_available"         : results[0].u_is_available,
                                    "uw_balance"             : results[0].uw_balance,
                                    "state_name"             : results[0].state_name,
                                    "country_name"           : results[0].country_name,
                                    "token"                  : results[0].token,
                                    "u_login_type"           : results[0].u_login_type,
                                }

                                commonData.u_profile_completed = 'N';

                                if (results[0].u_name &&  results[0].u_phone   && results[0].u_image  && results[0].u_full_address  ) {
                                    commonData.u_profile_completed = 'Y';
                                }

                                let date            = await commonHelper.getPstDateTime('timeDate'),
                                    // joinDate        = await commonHelper.dateFormat(date, 'n'),
                                    activityObj     = {
                                        userId          : results[0].u_id,
                                        actionUserId    : results[0].u_id,  
                                        // description     : results[0].u_name + ' activated account on dated ' + joinDate,
                                        description     : results[0].u_name + ' activated account on dated ' + Date.now(), 
                                        activityType    : 'SIGNUP', 
                                        date            : date
                                    };
                                
                                commonHelper.insertUserActivityLogs(activityObj);
                                /** TODO: WELCOME EMAIL TO USER. */
                                // authModel.sendWelcomeEmail(results[0].u_id);

                                let deviceObj = {
                                    'ud_fk_u_id'    : results[0].u_id,
                                    'ud_device_id'  : data.device_id,
                                    'ud_token'      : data.device_token,
                                    'ud_type'       : 'W',
                                    'ud_platform'   : data.device_platform,
                                };

                                if ( data.device_platform == 'Android' || data.device_platform == 'iOS') {
                                    deviceObj.ud_type = 'M';
                                }

                                if ( data.voipToken ) {
                                    deviceObj.ud_voip = data.voipToken;
                                }
                                if ( data.bundleId ) {
                                    deviceObj.ud_bundle_id = data.bundleId;
                                }
                                let addDevice  = await authModel.addDeviceIfNotExists(deviceObj);


                                let _res = {
                                    status  : true,
                                    code    : "",
                                    message : 'Thanks for verifying your account.',
                                    payload : commonData
                                };

                                deferred.resolve( _res );

                            });

                        } else {

                            let _res = {
                                status  : false,
                                code    : "AAA-E1010",
                                message : 'Wrong activation code.',
                                payload : {}
                            };
                            deferred.resolve( _res );

                        }

                    }

                });

            } else {

                let _res = {
                    status  : false,
                    code    : "AAA-E1012",
                    message : 'Activation code has been expired.',
                    payload : {}
                };
                deferred.resolve( _res );
            }

        } else {
            deferred.resolve(false);
        }

    }
    
    return deferred.promise;

}

/**
 * Activate account model
 * @param        :
 * @returns       :
  * @developer : 
 */  
authModel.getTotalRec = async function( totalRecordSql, dataArray ){
    
    let dd  = q.defer();
    
    pool.query(totalRecordSql, dataArray, function(err, result) {

        if ( err ) {
            dd.resolve(err);
        } else {
            dd.resolve(result);
        }

    });

    return dd.promise;

}

/**
 * Forgot password model
 
 */
authModel.forgotPassword = async function ( email ) {

    let deferred = q.defer(),
        conObj   = await constant.getConstant();

    pool.query('SELECT user.u_uuid, user.u_id, user.u_name, user.u_active, user.u_active_count FROM user WHERE user.u_email = ?  ', [ email ], async function ( error, results ) {

        if ( error ) {
            deferred.resolve(false);
        } else {

            if ( results && results.length > 0 ) {

                if ( results[0].u_active == 1 ) {

                    
                    /* THIS CODE IS FOR APPROACH WHEN WE SEND PASSWORD IN EMAIL 
                    let randomNumber = await makeRandomPassword(8);
                    // let randomNumber = Math.floor(Math.random() * (99999999 - 10000000) + 10000000),
                        hashedPassword  = passwordHash.generate(randomNumber);

                    pool.query('UPDATE user SET u_password = ? WHERE user.u_uuid = ?', [ hashedPassword, results[0].u_uuid], async function ( error, row ) { */
                    
                    // THIS CODE IS USED TO SEND RESET PASSWORD TOKEN IN EMAIL //
                    let randomNumber = Math.floor(Math.random() * (9999 - 1000) + 1000);

                    pool.query('UPDATE user SET u_forgot_password_token = ?, u_forgot_password_count = 0 WHERE user.u_uuid = ?', [randomNumber,results[0].u_uuid], async function (error, row) {

                        if ( error ) {
                            deferred.resolve(false);
                        } else {

                            // let template = await email_template.forgotPassword({code : randomNumber, name : results[0].u_name});

                            let emailArray = {
                                to      : email,
                                from    : conObj.SITE_EMAIL,
                                subject : 'Password reset request ',
                                body    : "Hi " + results[0].u_name + ", You have requested password reset in email. Here is your password reset code :   " + randomNumber + ", Please enter this code in password reset screen and reset your account password."
                            };

                            let date            = await commonHelper.getPstDateTime('timeDate'),
                                // joinDate        = await commonHelper.dateFormat(date, 'n'),
                                activityObj     = {
                                    userId          : results[0].u_id,
                                    actionUserId    : results[0].u_id,  
                                    description     : results[0].u_name + ' forgot password and requested a new password at ' + Date.now(), 
                                    activityType    : 'SIGNUP', 
                                    date            : date
                                };
                            
                            commonHelper.insertUserActivityLogs(activityObj);
                            
                            common.sendEmails( emailArray );
                            // common.insertSentEmailData(emailArray);
                            
                            deferred.resolve({
                                message: 'Forgot password token sent to your email'
                            });
                        }
                    });
                } else {

                    deferred.resolve({
                        code: 'AAA-E1002'
                    });
                }
            } else {

                deferred.resolve({
                    code: 'AAA-E1013'
                });
            }
        }
    });

    return deferred.promise;
}

function makeRandomPassword(length) {
    let result           = '';
    let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
}

/**
 * Reset password model
 
 */
authModel.resetPassword = async function ( body ) {

    let deferred = q.defer();

    pool.query('SELECT user.u_id, user.u_name, user.u_forgot_password_count, user.u_forgot_password_token FROM user WHERE user.u_email = ?', [body.email], async function (error, results, fields) {
        
        if ( error ) {
            deferred.reject(error);
        } else {

            if ( results && results.length > 0 ) {

                if ( results[0].u_forgot_password_count < 3 ) {

                    let increase_count = results[0].u_forgot_password_count + 1,
                        hashedPassword = passwordHash.generate(body.password);

                    pool.query('UPDATE user SET u_forgot_password_count = ? WHERE user.u_id = ?', [ increase_count, results[0].u_id ], function ( error, row, fields ) {

                        if ( error ) {
                            deferred.reject(error);
                        } else {

                            if ( results[0].u_forgot_password_token == body.code ) {

                                if(body.chatPassword && body.chatPassword == 'YES' ){

                                    pool.query('UPDATE user SET u_private_chat_password = ?, u_private_chat_password_text = ? WHERE user.u_id = ?', [ hashedPassword,body.password, results[0].u_id ], async function ( error, row, fields ) {

                                        if ( error ) {
                                            deferred.reject(error);
                                        } else {
    
                                            let date            = await commonHelper.getPstDateTime('timeDate'),
                                                // joinDate        = await commonHelper.dateFormat(date, 'n'),
                                                activityObj     = {
                                                    userId          : results[0].u_id,
                                                    actionUserId    : results[0].u_id,  
                                                    description     : results[0].u_name + ' forgot password and requested to reset password at ' + Date.now(), 
                                                    activityType    : 'SIGNUP', 
                                                    date            : date
                                                };
                                            
                                            commonHelper.insertUserActivityLogs(activityObj);
                                            deferred.resolve(true);
                                        }
                                    });
    

                                } else {
                                    pool.query('UPDATE user SET u_password = ? WHERE user.u_id = ?', [ hashedPassword, results[0].u_id ], async function ( error, row, fields ) {

                                        if ( error ) {
                                            deferred.reject(error);
                                        } else {
    
                                            let date            = await commonHelper.getPstDateTime('timeDate'),
                                                // joinDate        = await commonHelper.dateFormat(date, 'n'),
                                                activityObj     = {
                                                    userId          : results[0].u_id,
                                                    actionUserId    : results[0].u_id,  
                                                    description     : results[0].u_name + ' forgot password and requested to reset password at ' + Date.now(), 
                                                    activityType    : 'SIGNUP', 
                                                    date            : date
                                                };
                                            
                                            commonHelper.insertUserActivityLogs(activityObj);
                                            deferred.resolve(true);
                                        }
                                    });
    

                                }
                              
                            } else {

                                deferred.resolve({
                                    code: 'AAA-E1010'
                                });
                            }
                        }
                    });

                } else {

                    deferred.resolve({
                        code: 'AAA-E1012'
                    });
                }
            } else {

                deferred.resolve({
                    code: 'AAA-E1013'
                });
            }
        }
    });

    return deferred.promise;
}


/**
 * 
 
 */
authModel.resendActivationCode = async function (email) {

    let deferred = q.defer(),
        conObj   = await constant.getConstant();

    pool.query('SELECT user.u_id, user.u_name, user.u_active, user.u_forgot_password_count, user.u_forgot_password_token ,u_name FROM user WHERE user.u_email = ?', [email], function (error, results, fields) {

        if ( error ) {
            deferred.resolve(false);
        } else {

            if ( results && results.length > 0 ) {

                if ( results[0].u_active == '0' ) {

                    let randomNumber = Math.floor(Math.random() * (9999 - 1000) + 1000),
                        updateQuery  = 'UPDATE user SET user.u_activation_token = ?, user.u_active_count = ? where user.u_email = ?';

                    pool.query(updateQuery, [randomNumber, 0, email], async function( error, row, fields) {

                        if ( error ) {
                            deferred.reject(error);
                        } else {

                           /*  let text        = await common.getEmailText('RESEND CODE');
                                dataEmail   = text.replace('USERNAME',results[0].u_name);
                                dataEmail   = dataEmail.replace('CODE',randomNumber); */

                            let emailArray = {
                                to      : email,
                                from    : conObj.SITE_EMAIL,
                                subject : 'Resending Account Activation ',
                                body    : "Hi, here is your activation code to activate your account " + randomNumber,
                            };

                            let date            = await commonHelper.getPstDateTime('timeDate'),
                                // joinDate        = await commonHelper.dateFormat(date, 'n'),
                                activityObj     = {
                                    userId          : results[0].u_id,
                                    actionUserId    : results[0].u_id,  
                                    description     : results[0].u_name + ' requested new activation code at ' + Date.now(), 
                                    activityType    : 'SIGNUP', 
                                    date            : date
                                };
                            
                            commonHelper.insertUserActivityLogs(activityObj);
                            /** TODO: WELCOME EMAIL TO USER. */

                            common.sendEmails(emailArray);
                            // common.insertSentEmailData(emailArray);
                            
                            deferred.resolve({
                                message: 'Resend Account Activation code sent to your email.'
                            });
                        }
                    });
                } else {

                    deferred.resolve({
                        code: 'AAA-E1014'
                    });
                }
            } else {

                deferred.resolve({
                    code: 'AAA-E1013'
                });
            }
        }
    });

    return deferred.promise;
}

/**
 * Update user
 
 */
authModel.updateUser = function ( body, userDataId ) {
    let deferred = q.defer();

    pool.query( body.sql, userDataId, function ( error, results ) {

        if ( error ) {
            deferred.reject(false);
        } else {
            deferred.resolve(true);
        }

    });

    return deferred.promise;

}

/**
 * This function is using 
 
 */
authModel.getPages = function ( req ) {
    let deferred = q.defer();
        sql      = '';

    if ( req.query.type == 'W' ) {
        sql = "select p_id,p_name,p_web from pages where p_url = ?";
    } else {
        sql = "select p_id,p_name,p_mobile from pages where p_url = ?"; 
    }

    pool.query( sql,[req.params.pageName], function ( error, results, fields ) {

        if ( error ) {
            deferred.reject(error);
        } else {

            if ( results.length > 0 ) {
                deferred.resolve(results);
            } else {
                deferred.resolve(error);
            }
            
        }

    });

    return deferred.promise;

}
/**
 * This function is using 
 
 */
authModel.checkPhoneExist = function( _phone ) {
    
    let deferred    = q.defer(),
        selectQuery = "SELECT u_id, u_email, u_gender, u_dob, u_image, u_uuid, u_name FROM user WHERE u_phone = ?";

    pool.query(selectQuery, [ _phone ], function ( error, results, fields ) {

        if ( error ) {
            deferred.reject(error);
        } else {

            if ( results.length > 0 ) {
                deferred.resolve(results[0]);
            } else {
                deferred.resolve( false );
            }

        }

    });
    return deferred.promise;
}
/**
 * This function is using 
 
 */
authModel.insertEmailMarketingData = async function( obj ) {
    let deferred    = q.defer(),
        uuid        = uuidv1(Date.now()),
        emId        = await common.getRowId(obj.email , 'em_email', 'em_id', 'email_marketing'),
        dateTime    = await commonHelper.getPstDateTime('timeDate');

    if ( emId ) {
        deferred.resolve(false);
    } else {

        let insertQuery     = "INSERT INTO email_marketing SET ?",
            insertData      = {
                em_fk_u_id    : obj.userId, 
                em_uuid       : uuid,
                em_email      : obj.email,
                em_name       : obj.name,
                em_added_by   : 'SIGN-UP',
                em_sent_on    : dateTime,
                em_created    : dateTime,
                em_updated    : dateTime
            };
    
        pool.query( insertQuery, insertData, function ( error, results ) {

            if ( error ) {
                deferred.reject(error);
            } else {

                if ( results ) {
                    deferred.resolve(true);
                } else {
                    deferred.resolve(false);
                }

            }

        });

    }
    
    return deferred.promise;

}
/**
 * This function is using 
 
 */
authModel.sendWelcomeEmail = async function( userId ) {

    let deferred  = q.defer();
    // let emailText = await authModel.getWelcomeEmailText(userId);

    let objEmail = {
        userId    : userId,
        emailType : 'WELCOME EMAIL',
        text      : "Welcome to the bobotracker, please login to your account with your login credentials."
    }

    let result = await common.sendMasterEmail(objEmail); 

    if ( result ) {
        deferred.resolve(true);
    } else {
        deferred.resolve(false);
    }

}
/**
 * This function is using 
 
 */
authModel.getWelcomeEmailText = async function( userId ) {

    let deferred       = q.defer();

    if ( userId ) {

        let userName    = await common.getRowId(userId , 'u_id', 'u_name', 'user');
            text        = await common.getEmailText('WELCOME EMAIL');
            dataEmail   = text.toString().replace('USERNAME',userName);
            
        deferred.resolve(dataEmail); 

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}
/**
 * This function is using 
 
 */
authModel.updateEmailMarketingStatus = async function( userId ) {

    let deferred  = q.defer();

    if ( userId ) {

        let sql      = 'UPDATE email_marketing SET em_added_by = ? WHERE em_fk_u_id = ? AND em_added_by = ? ';
            result  = await common.commonSqlQuery(sql,['ACCOUNT-ACTIVATED',userId,'SIGN-UP']);

        if ( result ) {
            deferred.resolve(true);
        } else {
            deferred.resolve(false);
        }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}
/**
 * This function is using 
 
 */
authModel.checkAppleTokenExist = function( token ) {
    let deferred    = q.defer();
    let selectQuery = "SELECT u_id, u_gender, u_dob, u_image, u_uuid, u_name FROM user WHERE u_apple_id_token = ?";

    pool.query(selectQuery, [ token ], function ( error, results, fields ) {

        if ( error ) {
            deferred.resolve(false);
        } else {

            if ( results &&  results.length > 0 ) {
                deferred.resolve(results[0]);
            } else {
                deferred.resolve( false );
            }
        }

    });

    return deferred.promise;

}
/**
 * This function is using to signup
 * @param        :
 * @returns      :
 * @developer    :
 * @modification :  
 */
authModel.signupRequestUser = async function( body,userId ) {

    let deferred = q.defer();

    if ( body && body.name && body.password && userId ) {

        let hashedPassword  = passwordHash.generate(body.password),
            activationCode  = Math.floor(Math.random() * (+9876 - +1234)) + +1234,
            updateQuery     = "UPDATE user SET u_name = ?,u_phone = ?,u_password = ?,u_activation_token = ?,u_updated = ?,u_logged_in_by = ? WHERE u_id = ?",
            name            = await commonHelper.capitalizeFirstLetter(body.name),
            date            = await commonHelper.getPstDateTime('timeDate'),
            updateArray     = [ name,body.mobile,hashedPassword,activationCode,date,'A',userId],
            results         = await common.commonSqlQuery(updateQuery,updateArray);

        if ( results ) {

            authModel.sendActivationEmail( body, activationCode );
            authModel.sendNewUserNotification(userId);
            deferred.resolve(true);

        } else {
            deferred.resolve(false);
        }

    } else {
        deferred.resolve(false);
    }
    
    return deferred.promise;

}
/**
 * This function is using to send notification 
 
 * @modified  : 
 */
authModel.sendNewUserNotification = async function( userId ) {
    let deferred   = q.defer();

    if ( userId ) {

        let deviceTokens      = await common.getUserDeviceTokens(userId),
            userName          = await common.getRowId(userId , 'u_id', 'u_name', 'user'),
            memberDeviceToken = '';   

        if ( deviceTokens && deviceTokens.length > 0 ) {
            
            for ( let i = 0; i < deviceTokens.length; i++ ) {
                if ( memberDeviceToken ) {
                    memberDeviceToken += ',' + deviceTokens[i].ud_token;
                } else {
                    memberDeviceToken += deviceTokens[i].ud_token;
                }
            }
        }
        
        let obj = {
            title             : 'Profile Update',
            body              :  '<b> '+userName +' </b>,Please complete your profile.',
            memberDeviceToken :  memberDeviceToken,
            userId            :  userId,
            receiverId        :  userId,
            referenceId       :  userId,
            homeView          :  '1',
            type              :  'U',
            topicId           :  0
        }
        deferred.resolve( true );
        
    } else {
        deferred.resolve( false );
    }

    return deferred.promise;

}
/**
 * This function is using 
 
 */
authModel.updateLastLoginTime = async function( userId ) {

    let deferred  = q.defer(),
        date      = await commonHelper.getPstDateTime('timeDate');

    if ( userId ) {

        let sql      = 'UPDATE user SET u_last_login = ? WHERE u_id = ?  ',
            result  = await common.commonSqlQuery(sql,[date,userId]);

        if ( result ) {
            deferred.resolve(true);
        } else {
            deferred.resolve(false);
        }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}


/**
 * Activate account model
 * @param     :
 * @returns   :
 * @developer :
 **/

authModel.activateAccountViaPhone = async function ( data ) {
    let deferred = q.defer();
    /** TODO : validation */
    if ( data ) {
        
        let selectQuery = "SELECT user.u_id FROM user  WHERE u_phone = ? ",
            results     = await common.commonSqlQuery(selectQuery, [data.phone],true);

        // console.log('we are hererrererereerrerere------------',results);

        if ( results && results.length > 0 ) {

            let codeVerify = await authModel.verifyCodeWithPhone(data.countryCode+data.phone,data.token);
            // console.log(codeVerify,"codeVerifycodeVerifycodeVerifycodeVerifycodeVerifycodeVerifycodeVerify")
            if ( codeVerify ) {

               let dataObj = {
                    t_id           : '47',
                    u_id           : results[0].u_id,
                    current_points : '0',
                    total_points   : '0' 
                }
                await helper.addUserEarningPoints(dataObj);


                let sql      = 'UPDATE user SET u_phone_verified = ? WHERE u_phone = ?  ',
                    result   = await common.commonSqlQuery(sql,['1',data.phone]);
    
                if ( result ) {
                   
                    let _res = {
                        status  : true,
                        code    : "200",
                        message : 'Thanks for verifying your account.',
                    };

                    deferred.resolve(_res);

                } else {
                    deferred.resolve(false);
                }

            } else {

                let _res = {
                    status  : false,
                    code    : "AAA-E1010",
                    message : 'Wrong activation code.',
                    payload : {}
                };
                deferred.resolve(_res);
            }

        } else {

            deferred.resolve(false);

        }

    } else {

        deferred.resolve(false);

    }
    return deferred.promise;
}
/**
 * This function is using to signup
 * @param        :
 * @returns      :
 * @developer    :
 * @modification :  
 */
authModel.signupWithPhone = async function( body ) {
  
    let deferred = q.defer();
   
    if ( body && body.mobile && body.name && body.password ) {
      
        let hashedPassword  = passwordHash.generate(body.password),
            uuid            = uuidv1(Date.now()),
            name            = await commonHelper.capitalizeFirstLetter(body.name),
            date            = await commonHelper.getPstDateTime('timeDate'),
            insertData      = {
                // u_fk_ut_id              : '2', 
                u_uuid                  : uuid,
                u_name                  : name,
                u_phone                 : body.mobile,
                u_phone_country_code    : body.countryCode,
                u_password              : hashedPassword,
                u_is_online             : '1',
                u_is_available          : '1',
                u_created               : date
            };

            if ( body.userType == 'BUSINESS' ) {
                insertData.u_login_type = 'BUSINESS';
            }
            // joinDate          = await commonHelper.dateFormat(date, 'n');
            let insertedId    = await common.insert('user', insertData, true);

        if ( insertedId ) {

            let userId = insertedId;

            if ( userId && userId != '' ) {
                
                let activityObj = {
                    userId          : userId,
                    actionUserId    : userId,  
                    description     : name + ' joined on dated ' + Date.now(), 
                    activityType    : 'SIGNUP', 
                    date            : date
                };
                
                commonHelper.insertUserActivityLogs(activityObj);

                authModel.insertUserData(userId,body);

                let sendOtp = await authModel.sendActivationCodeOnPhone( body.countryCode+body.mobile );

                if ( sendOtp ) {

                    deferred.resolve(true);
                } else {
                    deferred.resolve(false);
                }

            } else {
                deferred.resolve(false);
            }

        } else {
            deferred.resolve(false);
        }

           
    }
    
    return deferred.promise;

}
/**
 * This function is using 
 
 */
authModel.sendActivationCodeOnPhone = async function( phone ) {
    let deferred   =  q.defer();

    if ( phone ) {

        const accountSid    = 'ACb893f43e24f08d558e8abd1d69214071';
		const authToken     = '3b0405fe285b193b26ec8c98b80f2a87';
		const client        = require('twilio')(accountSid, authToken);
        // console.log(phone,"------------------------your phone number ")
        client.verify.services('VA4f757ff4afa67ef20da577e2d4156cae').verifications.create(
            {
                to      : phone, 
                channel : 'sms'
            }
        ).then(verification => {
            // console.log(verification,"verificationverificationverificationverificationverification");
            deferred.resolve(true);
        });

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}
/**
 * This function is using 
 
 */
authModel.verifyCodeWithPhone = async function( phone,token ) {
    let deferred   =  q.defer();

    if ( phone && token ) {

        const accountSid    = 'ACb893f43e24f08d558e8abd1d69214071';
		const authToken     = '3b0405fe285b193b26ec8c98b80f2a87';
		const client        = require('twilio')(accountSid, authToken);
      
        let result = await client.verify.services('VA4f757ff4afa67ef20da577e2d4156cae').verificationChecks.create({  
            to      : phone, 
            code    : token
        });

        // console.log(result,'verification.statusverification.statusverification.statusverification.statusverification.statusverification.statusverification.status');
        if ( result && result.status == 'approved' ) {
            // console.log('we are herererrererererere.');
            deferred.resolve(true);
        }  else {
            // console.log('we are herererrererererere12345678.');
            deferred.resolve(false);
        }
            
    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}
/**
 * This function is using 
 
 */
authModel.insertUserData = async function( userId,body ) {
    let deferred     =  q.defer(),
        insertedDate =  await commonHelper.getPstDateTime('timeDate'),
        conObj       =  await constant.getConstant();

    if ( userId ) {

        let price      = conObj.EXPERT_MIN_PRICE/60,
            replyPrice = price * conObj.TEXT_REPLY_MINUTES;

        let insertQuery1 = 'INSERT INTO user_address ( ua_fk_u_id, ua_created ) VALUES (?,?)';
            res          = await common.commonSqlQuery(insertQuery1,[userId,insertedDate]);

        let insertQuery2 = 'INSERT INTO user_price ( up_fk_u_id, up_group, up_individual,up_in_person_price, up_online_price,up_instant_call_price,up_video_answer_price,up_text_answer_price,up_message_price,up_hourly_price,up_created ) VALUES (?,?,?,?,?,?,?,?,?,?,?)';
            resOne       = await common.commonSqlQuery(insertQuery2,[ userId, conObj.EXPERT_MIN_PRICE, conObj.EXPERT_MIN_PRICE,conObj.EXPERT_MIN_PRICE, conObj.EXPERT_MIN_PRICE ,price, price,replyPrice, replyPrice ,conObj.EXPERT_MIN_PRICE,insertedDate ]);

        let insertQuery3 = 'INSERT INTO user_bio ( ub_fk_u_id, ub_created ) VALUES (?,?)';
            resThree     = await common.commonSqlQuery(insertQuery3,[ userId,insertedDate ]);

        let insertQuery4 = 'INSERT INTO user_wallet ( uw_fk_u_id, uw_created ) VALUES (?,?)';
            resFour      = await common.commonSqlQuery(insertQuery4,[ userId,insertedDate ]);

                            
        if ( body.appType && body.appType == 'knowex_bitcoin' ) {

            let topicId = await common.getRowById(conObj.BITCOIN_UUID, 't_uuid', 't_id', 'topic');
            common.addExpertData(userId,topicId);
            
        }

        let data = await authModel.sendNewUserNotification(userId);

        if ( data ) {
            deferred.resolve(true);
        } else {
            deferred.resolve(false);
        }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}
/**
 * Resend Activation Code model
 * @param        :
 * @returns       :
  * @developer : 
 */
authModel.sendActivationCode = async function ( email,phone ) {
    let deferred = q.defer();
        conObj   = await constant.getConstant();

    if ( email && phone ) {

        let sql      = 'SELECT user.u_id, user.u_name, user.u_active, user.u_forgot_password_count, user.u_forgot_password_token ,u_name FROM user WHERE user.u_phone = ?',
            results  = await common.commonSqlQuery(sql,[phone]);

        if ( results && results.length > 0 ) {

            if ( results[0].u_active == '0' ) {

                let randomNumber = Math.floor(Math.random() * (9999 - 1000) + 1000),
                    updateQuery  = 'UPDATE user SET user.u_activation_token = ?,user.u_email = ?, user.u_active_count = ? where user.u_phone = ?';
                    resultOne    = await common.commonSqlQuery(updateQuery,[ randomNumber,email, 0, phone]);

                if ( resultOne ) {

                    let emailObj    = {
                            name  : results[0].u_name,
                            email : email,
                        },
                    resOne          = await authModel.sendActivationEmail(emailObj,randomNumber);

                    if ( resOne ) {
                        
                        deferred.resolve(true); 

                    } else {

                        deferred.resolve({
                            code: 'AAA-E1000'
                        });
    
                    }
                    

                } else {

                    deferred.resolve({
                        code: 'AAA-E1010'
                    });

                }

               

            } else {

                deferred.resolve({
                    code: 'AAA-E1014'
                });

            }

        } else {

            deferred.resolve({
                code: 'AAA-E1013'
            });

        }

    } else {

        deferred.resolve({
            code: 'AAA-E1010'
        });
        

    }

    return deferred.promise;

}
/**
 * Resend Activation Code model
 * @param        :
 * @returns       :
  * @developer : 
 */
authModel.updateUserData = async function ( body ) {
    let deferred = q.defer();
        conObj   = await constant.getConstant();

    if ( body ) {

        let sql      = 'SELECT user.u_id, user.u_name, user.u_active, user.u_forgot_password_count, user.u_forgot_password_token ,u_name FROM user WHERE user.u_phone = ?',
            results  = await common.commonSqlQuery(sql,[body.mobile]);

        if ( results && results.length > 0 ) {
            let hashedPassword  = passwordHash.generate(body.password);

            let updateQuery  = 'UPDATE user SET user.u_phone_country_code = ?,user.u_name = ?,user.u_password = ? WHERE user.u_phone = ?';
                resultOne    = await common.commonSqlQuery(updateQuery,[ body.countryCode,body.name,hashedPassword, body.mobile]);

            if ( resultOne ) {

                let sendOtp = await authModel.sendActivationCodeOnPhone(body.countryCode+body.mobile);

                if ( sendOtp ) {
                    deferred.resolve(true);
                } else {
                    deferred.resolve(false);
                }
                

            } else {

                deferred.resolve(false);

            }

        } else {

            deferred.resolve(false);

        }

    } else {

        deferred.resolve(false);

    }

    return deferred.promise;

}
/**
 * Forgot password model
 * @param        :
 * @returns       :
  * @developer : 
 */
 authModel.forgotPasswordWithPhoneOrEmail = async function ( email,type ) {
    let deferred     = q.defer(),
        conObj       = await constant.getConstant(),
        addCondition = " user.u_email = ? ";

    if ( type == 'PHONE' ) {
        addCondition = " user.u_phone = ? ";
    }

    let sql     = 'SELECT user.u_uuid, user.u_id, user.u_name, user.u_active,user.u_phone_country_code, user.u_active_count,user.u_email,user.u_phone,user.u_phone_verified FROM user WHERE '+addCondition, 
        results =  await common.commonSqlQuery(sql,[email],true);

    if ( results && results.length > 0 ) {

        if ( results[0].u_active == 1 && type == 'PHONE' && results[0].u_phone_verified == '1' ) {

            let sendData = await authModel.sendActivationCodeOnPhone(results[0].u_phone_country_code+email);

            if ( sendData ) {

                deferred.resolve({
                    message: 'Forgot password token sent to your phone.'
                });

            } else {

                deferred.resolve({
                    code: 'AAA-E1000'
                });

            }
            

        } else if ( type == 'EMAIL' && results[0].u_active == 1 ) {

            let randomNumber = Math.floor(Math.random() * (9999 - 1000) + 1000);
            let updateQuery  = 'UPDATE user SET u_forgot_password_token = ?, u_forgot_password_count = 0 WHERE user.u_uuid = ?',
                updateData   = await common.commonSqlQuery(updateQuery,[ randomNumber,results[0].u_uuid ]);

            if ( updateData ) {

                // let template = await email_template.forgotPassword({code : randomNumber, name : results[0].u_name});

                let emailArray = {
                    to      : email,
                    from    : conObj.SITE_EMAIL,
                    subject : 'Password reset request ',
                    body    : "Hi you have requested to reset you password."
                };

                let date            = await commonHelper.getPstDateTime('timeDate'),
                    // joinDate        = await commonHelper.dateFormat(date, 'n'),
                    activityObj     = {
                        userId          : results[0].u_id,
                        actionUserId    : results[0].u_id,  
                        description     : results[0].u_name + ' forgot password and requested to reset password at ' + Date.now(), 
                        activityType    : 'SIGNUP', 
                        date            : date
                    };
                
                commonHelper.insertUserActivityLogs(activityObj);
                
                common.sendEmails( emailArray );
                common.insertSentEmailData(emailArray);
                
                deferred.resolve({
                    message: 'Forgot password token sent to your email'
                });

            } else {
                deferred.resolve({
                    code: 'AAA-E1000'
                });
            }
            
        } else {

            deferred.resolve({
                code: 'AAA-E1002'
            });

        }
        
    } else {

        deferred.resolve({
            code: 'AAA-E1013'
        });

    }

    return deferred.promise;

}
/**
 * Reset password model
 * @param        :
 * @returns       :
  * @developer : 
 */
authModel.resetPasswordWithPhoneOrEmail = async function ( body ) {
    let deferred     = q.defer(),
        addCondition = " user.u_email = ? ";

    if ( body.accountType == 'PHONE' ) {
        addCondition = " user.u_phone = ? ";
    }
    let sql     = "SELECT user.u_id, user.u_name, user.u_forgot_password_count,user.u_phone_country_code, user.u_forgot_password_token FROM user WHERE "+addCondition,
        results = await common.commonSqlQuery(sql,[body.email]);
  
        if ( results && results.length > 0 ) {

            if ( body.accountType == 'EMAIL' ) {

                if ( results[0].u_forgot_password_count < 3 ) {

                    let increase_count = results[0].u_forgot_password_count + 1;
                   
                    let updateSql  = "UPDATE user SET u_forgot_password_count = ? WHERE user.u_id = ?",
                        updateData = await common.commonSqlQuery(updateSql,[ increase_count, results[0].u_id ]);

                    if ( updateData ) {
                        
                        if ( results[0].u_forgot_password_token == body.code ) {

                            let updatePass =  await  authModel.updateUserPassword(body,results[0]);

                            if ( updatePass ) {
                                deferred.resolve(true);
                            } else {

                                deferred.resolve({
                                    code: 'AAA-E1000'
                                });

                            }
                         

                        } else {

                            deferred.resolve({
                                code: 'AAA-E1010'
                            });

                        }

                    } else {

                        deferred.resolve({
                            code: 'AAA-E1012'
                        });

                    }
                        
                } else {

                    deferred.resolve({
                        code: 'AAA-E1012'
                    });

                }

            } else {

                let sendData = await authModel.verifyCodeWithPhone(results[0].u_phone_country_code+body.email,body.code);

                if ( sendData ) {
    
                    let updatePass =  await  authModel.updateUserPassword(body,results[0]);

                    if ( updatePass ) {
                        deferred.resolve(true);
                    } else {

                        deferred.resolve({
                            code: 'AAA-E1000'
                        });

                    }
    
                } else {
    
                    deferred.resolve({
                        code: 'AAA-E1010'
                    });

                }


            }

        } else {

            deferred.resolve({
                code: 'AAA-E1013'
            });

        }

    return deferred.promise;

}
/**
 * Reset password model
 * @param        :
 * @returns       :
  * @developer : 
 */
 authModel.updateUserPassword = async function ( body,userData ) {
    let deferred     = q.defer();

    if ( body && userData ) {

        let hashedPassword = passwordHash.generate(body.password);
        let updateQuery    = 'UPDATE user SET u_password = ? WHERE user.u_id = ?',
            result         =  await common.commonSqlQuery(updateQuery,[ hashedPassword, userData.u_id ]);

        if ( result ) {

            let date            = await commonHelper.getPstDateTime('timeDate'),
                // joinDate        = await commonHelper.dateFormat(date, 'n'),
                activityObj     = {
                    userId          : userData.u_id,
                    actionUserId    : userData.u_id,  
                    description     : userData.u_name + ' forgot password and requested to reset password at ' + Date.now(), 
                    activityType    : 'SIGNUP', 
                    date            : date
                };
            
            commonHelper.insertUserActivityLogs(activityObj);
            deferred.resolve(true);

        } else {
            deferred.resolve(false);
        }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}
/**
 * Resend Activation Code model
 * @param        :
 * @returns       :
  * @developer : 
 */
authModel.updateUserPhoneNumber = async function ( body ) {
    let deferred = q.defer();

    if ( body ) {

        let updateQuery  = 'UPDATE user SET user.u_phone_country_code = ?,user.u_phone = ? WHERE user.u_email = ?';
            resultOne    = await common.commonSqlQuery(updateQuery,[ body.countryCode,body.mobile, body.email]);

        if ( resultOne ) {

            deferred.resolve(true);
            

        } else {

            deferred.resolve(false);

        }


    } else {

        deferred.resolve(false);

    }

    return deferred.promise;

}
/**
 * Activate account model
 * @param     :
 * @returns   :
 * @developer :
 */  

 authModel.activateAccountWithPhoneCode = async function( data ) {
    
    let deferred = q.defer(),
        d        = spacetime.now('America/Los_Angeles'),
        dDate    = d.unixFmt('yyyy-MM-dd'),
        dTime    = d.unixFmt('hh:mm:ss');
 
    let selectQuery = `SELECT user.u_id, user.u_uuid, user.u_full_address,  user.u_name, user.u_email, user.u_description, user.u_password, user.u_image, user.u_latitude, user.u_longitude, user.u_phone, user.u_gender, user.u_active_count, user.u_activation_token, user.u_active, user.u_is_online,user.u_is_available, user.u_login_type, user_address.ua_state, user_address.ua_country, user_wallet.uw_balance, countries.name as country_name, states.name as state_name
    FROM user 
    LEFT JOIN user_address ON user_address.ua_fk_u_id = user.u_id 
    LEFT JOIN countries ON countries.id = user.u_country 
    LEFT JOIN states ON states.id = user.u_state 
    LEFT JOIN user_wallet ON user_wallet.uw_fk_u_id = user.u_id 
    WHERE u_phone = ?`;

    let results = await authModel.getTotalRec(selectQuery, [data.mobile]);
    
    if ( results && results.sqlMessage ) {
        deferred.resolve(false);
    } else {

        if ( results && results.length > 0 ) {

            let codeVerify = await authModel.verifyCodeWithPhone(data.countryCode+data.mobile,data.token);

            if ( codeVerify ) {

                let dataObj = {
                    t_id           : '47',
                    u_id           : results[0].u_id,
                    current_points : '0',
                    total_points   : '0' 
                }
                           
                helper.addUserEarningPoints(dataObj);
    
                let secondQuery = "SELECT * from user_topic WHERE user_topic.ut_fk_u_id = ?";
                /** TODO : validation */
                let record      = await authModel.getTotalRec(secondQuery, [results[0].u_id]);
                
                if ( record && record.sqlMessage ) {
                    deferred.resolve(false);
                } else {
    
                    if ( record && record.length > 0 ) {
                        results[0].user_topic = record.length;
                    } else {
                        results[0].user_topic = 0;
                    }
                    
                }
                
                let thirdQuery =  "SELECT m_id from meeting WHERE m_type = ? AND  m_fk_u_id= ? AND TIMESTAMP(m_date, m_end_time) > '"+dDate+ " "+ dTime+"'";
                let dataMeeting = await authModel.getTotalRec(thirdQuery, ['G',results[0].u_id]);
                
                if ( dataMeeting && dataMeeting.sqlMessage ) {
                    deferred.resolve(false);
                } else {
    
                    let meetingCount = 0;
    
                    if ( dataMeeting && dataMeeting.length > 0 ) {
                        meetingCount = dataMeeting.length;
                    }
    
                    results[0].user_meeting = meetingCount;
    
                }
    
                let sqlQuery = "SELECT m_id , meeting_user.mu_fk_u_id_created , meeting_user.mu_fk_m_id ,  meeting_user.mu_status from meeting LEFT JOIN meeting_user ON meeting.m_id = meeting_user.mu_fk_m_id where meeting_user.mu_status = 'N' AND meeting.m_date >= ? AND TIMESTAMP(meeting.m_date, meeting.m_start_time) > '"+dDate+ " "+ dTime+"' AND (meeting_user.mu_fk_u_id_member = ? OR meeting_user.mu_fk_u_id_created = ?) GROUP BY meeting_user.mu_fk_m_id";
    
                let dataSql = await authModel.getTotalRec(sqlQuery, [dDate, dTime, results[0].u_id, results[0].u_id]);
    
                if ( dataSql && dataSql.sqlMessage ) {
                    deferred.resolve(false);
                } else {
    
                    let meetingCountData = 0;
    
                    if ( dataSql && dataSql.length > 0 ) {
                        meetingCountData = dataSql.length;
                    }
    
                    results[0].meeting_count = meetingCountData;
    
                }
    
                
    
                console.log(codeVerify,"codeVerifycodeVerifycodeVerifycodeVerifycodeVerifycodeVerifycodeVerify")
                
                // if ( codeVerify ) {
    
                let updateQuery = 'UPDATE user SET u_phone_verified = ? WHERE u_phone = ?';
                    updateData = await common.commonSqlQuery(updateQuery,[ '1',data.mobile ]);
                    
                    
                let tokenData = {
                    iat         : Date.now(),
                    "orgId"     : results[0].u_id, 
                    "userId"    : results[0].u_uuid,
                    "email"     : results[0].u_email
                };
                let token        = jwt.sign(tokenData,config.secret);
                results[0].token = token;

                

                let commonData = {
                    "u_uuid"                 : results[0].u_uuid, 
                    "u_full_address"         : results[0].u_full_address,
                    "u_name"                 : results[0].u_name,
                    "u_email"                : results[0].u_email,
                    "u_description"          : results[0].u_description,
                    "u_image"                : results[0].u_image,
                    "u_latitude"             : results[0].u_latitude,
                    "u_longitude"            : results[0].u_longitude,
                    "u_phone"                : results[0].u_phone,
                    "u_gender"               : results[0].u_gender,
                    "up_group"               : results[0].up_group,
                    "up_individual"          : results[0].up_individual,
                    "up_online_price"        : results[0].up_online_price,
                    "up_in_person_price"     : results[0].up_in_person_price,
                    "u_is_online"            : results[0].u_is_online,
                    "u_is_available"         : results[0].u_is_available,
                    "uw_balance"             : results[0].uw_balance,
                    "state_name"             : results[0].state_name,
                    "country_name"           : results[0].country_name,
                    "token"                  : results[0].token,
                }

                commonData.u_profile_completed = 'N';

                if ( results[0].u_name &&  results[0].u_phone  && results[0].u_image  && results[0].u_full_address  ) {
                    commonData.u_profile_completed = 'Y';
                }

                
                

                let deviceObj = {
                    'ud_fk_u_id'    : results[0].u_id,
                    'ud_device_id'  : data.device_id,
                    'ud_token'      : data.device_token,
                    'ud_type'       : 'W',
                    'ud_platform'   : data.device_platform,
                };

                if ( data.device_platform == 'Android' || data.device_platform == 'iOS') {
                    deviceObj.ud_type = 'M';
                }

                if ( data.voipToken ) {
                    deviceObj.ud_voip = data.voipToken;
                }

                if ( data.bundleId ) {
                    deviceObj.ud_bundle_id = data.bundleId;
                }
                authModel.addDeviceIfNotExists(deviceObj);
                
                let _res = {
                    status  : true,
                    message : 'Thanks for verifying your phone number.',
                    payload : commonData
                };

                deferred.resolve( _res );

            } else {

                let _res = {
                    status  : false,
                    code    : "AAA-E1010",
                    message : 'Wrong activation code.',
                };
                deferred.resolve( _res );

            }

        } else {
            deferred.resolve(false);
        }

    }
    
    return deferred.promise;

}
/**
 * Activate account model
 * @param     : password  , user id 
 * @returns   : true , false 
 * @developer : 
 */  

authModel.validatePassword = async ( body , userId )=> {
    let deferred = q.defer();
    if(body && userId ){
        let selectSql   = "SELECT user.u_id , user.u_password FROM user WHERE user.u_id = ?",
            userRecord  =  await commonHelper.getDataOrCount( selectSql,[userId]);
        if( userRecord && userRecord[0] && userRecord[0].u_password !='' ){
            if ( userRecord[0].u_password && passwordHash.verify(body.password, userRecord[0].u_password ) ) {
                deferred.resolve(true);
            } else {
                deferred.resolve(false);
            }
        } else {
            deferred.resolve(false);
        }
    } else {
        deferred.resolve(false);
    }
  return deferred.promise;
}


authModel.sendEmailToken = async ( emailId ) => {
    let deferred        = q.defer(),
        conObj          = await constant.getConstant(),
        activationCode  = Math.floor(Math.random() * (+9876 - +1234)) + +1234;
               
    if(emailId){
        let updateSql       = "UPDATE user SET u_activation_token = ? WHERE u_email = ?",
            selectSql       = "SELECT u_name FROM user WHERE u_email = ?",
            updateToken     = await common.commonSqlQuery( updateSql , [ activationCode , emailId ]);
            if(updateToken){
                let userRecord  = await common.commonSqlQuery( selectSql , [emailId]),
                    text        = await common.getEmailText('VERIFY ACCOUNT'),
                    userName    = '';
                    if(userRecord && userRecord[0].u_name !=''){
                       userName = userRecord[0].u_name ;
                    }

                let from        = conObj.SITE_EMAIL,
                    to          = emailId ,
                    sub         = 'Verify Account';
                    /* dataEmail   = text.replace('USERNAME', userName);
                    dataEmail   = dataEmail.replace('CODE', activationCode); */
                let emailArray  = {
                    to      : to,
                    from    : from,
                    subject : sub,
                    body    : "Hi " + userName + " Here is you email token code : " + activationCode + ", Please enter this code to verify your email in the app.",
                };

                if ( common.sendEmails( emailArray ) ) {
                    // common.insertSentEmailData(emailArray);
                    return true;
                } 

            } else {
                deferred.resolve(false);
            }
    } else {
        deferred.resolve(false);
    }
 return deferred.promise;
}
/**
 * this function is used update to user phone no. after verify token 
 * @param     : password  , user id 
 * @returns   : true , false 
 * @developer : 
 */  

authModel.updateUserPhoneNumber = async ( object ) => {
    let deferred        = q.defer();
    if( object ){
        let userid      = '',
            countryCode = '',
            phone       = '',
            updateSql   ="UPDATE user SET ? WHERE `u_id` = ?";
           
        if(object.u_id){
            userid      = object.u_id ;
        }
        if(object.countryCode){

            countryCode = object.countryCode ;
        }

        if( object.userPhone ){

            phone = object.userPhone ;
        }
        let obj = {
            "u_phone_country_code" : countryCode ,
            "u_phone"              : phone 
        },
        updatePhone = await common.commonSqlQuery( updateSql , [obj,userid], true);
        if(updatePhone){
            deferred.resolve(true);
        } else {
            deferred.resolve(false);
        }
    } else {
        deferred.resolve(false);
    }
  return deferred.promise;
}
/**
 * this function is used to send token to user email to verify
 * @param     : email id 
 * @returns   : true , false 
 * @developer : 
 */  

authModel.sendNewEmailToken = async (emailId , userId  ) => {
    let deferred        = q.defer(),
        conObj          = await constant.getConstant(),
        activationCode  = Math.floor(Math.random() * (+9876 - +1234)) + +1234;
               
    if(emailId){
        let updateSql       = "UPDATE user SET u_activation_token = ? WHERE u_id = ?",
            selectSql       = "SELECT u_name FROM user WHERE u_id = ?",
            updateToken     = await common.commonSqlQuery( updateSql , [ activationCode , userId ]);
            if( updateToken ){
                let userRecord  = await common.commonSqlQuery( selectSql , [userId]),
                    text        = await common.getEmailText('VERIFY EMAIL'),
                    userName    = '';
                    if(userRecord && userRecord[0].u_name !=''){
                       userName = userRecord[0].u_name ;
                    }

                let from        = conObj.SITE_EMAIL,
                    to          = emailId ,
                    sub         = 'Verify Account';
                    /* dataEmail   = text.replace('USERNAME', userName);
                    dataEmail   = dataEmail.replace('CODE', activationCode); */
                let emailArray  = {
                    to      : to,
                    from    : from,
                    subject : sub,
                    body    : "Hi " + userName + " Here is you email token code : " + activationCode + ", Please enter this code to verify your email in the app.",
                };

                if ( common.sendEmails( emailArray ) ) {
                    // common.insertSentEmailData(emailArray);
                    return true;
                } 

            } else {
                deferred.resolve(false);
            }
    } else {
        deferred.resolve(false);
    }
 return deferred.promise;
}

/**
 * this function is used to 
 
 */  
authModel.updateMailId = async( body )=> {
let deferred        = q.defer();
    if(body){
        // console.log(body ,'sdfsdfsdfsdfs');
        let token = '',
            email = '';
        if(body.token){
           token = body.token ;
        }
        if(body.email){
           email = body.email ;
        }
        let updateSql = "UPDATE user SET u_activation_token = ? , u_email = ? WHERE u_activation_token = ?",
        updateEmail = await common.commonSqlQuery( updateSql , [ null , email , token ] , true);
        if(updateEmail){
            // console.log('updatemail data=>>>',updateEmail)
            deferred.resolve(true);
        } else {
          deferred.resolve(false);
        }

    } else {
        deferred.resolve(false);
    }
    return deferred.promise;
}

/** THIS FUNCTION IS UNDER DEVELOPMENT.
 * This function is used to disconnect user's facebook account. 
 Anil Guleria
 */
authModel.disconnectFacebookAccount = async function(userId, userEmail) {

    let deferred        = q.defer();

    if ( userId && userEmail ) {

        let sql         = 'UPDATE user SET u_logged_in_by = ? WHERE u_id = ? AND u_email = ?',
            result      = await common.commonSqlQuery(sql, ['A', userId, userEmail]);

        if ( result ) {
            deferred.resolve(true);
        } else {
            deferred.resolve(false);
        }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}

module.exports = authModel;
