const passwordHash 		= require('password-hash'),
    pool 	            = require('../../configCommon/config/pool'),
    // spacetime           = require('spacetime'),
    q                   = require('q'),
    // fs                  = require('fs'),
    {v1: uuidv1}        = require('uuid'),
    common              = require('./configCommon'),
    constant            = require('../../configCommon/config/constants'),
    commonHelper        = require('../../configCommon/helpers/index'),
    helper			    = require('../../configCommon/helpers');
// const { updateData } = require('../../configCommon/helper/mongo_helper');

let userModel = {};

/**
 * This model will return user data
 
 */
userModel.me = async (userId) => {

    let deferred         = q.defer(),
        conObj           = await constant.getConstant();
        
    let results          = await userModel.executeQuery(userId);

    if ( results  && results.length > 0 && results[0].u_id ) {

        results[0].profileUrl   = results[0].u_image;

       if ( results[0].u_image != null && results[0].u_image != "" ) {

            results[0].u_image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + results[0].u_image;

        }
        if ( results[0].up_business_profile != null && results[0].up_business_profile != "" ) {

            results[0].up_business_profile  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.BUSINESS_IMAGE_PATH + conObj.AWS_IMAGE_PATH + results[0].up_business_profile;

        }
        if ( results[0].up_company_logo != null && results[0].up_company_logo != "" ) {

            results[0].up_company_logo  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.BUSINESS_LOGO_PATH + conObj.AWS_IMAGE_PATH + results[0].up_company_logo;

        }

        if( results[0].u_uuid && results[0].up_video  && results[0].up_video != '' &&  results[0].up_video_thumbnail && results[0].up_video_thumbnail != "" ){

             results[0].up_video_thumbnail = conObj.AWS_CLOUDFRONT_URL +  conObj.UPLOAD_PATH + conObj.BUSINESS_IMAGE_PATH + results[0].u_uuid +'/'+ conObj.AWS_VIDEO_PATH + results[0].up_video_thumbnail;

             results[0].up_video     = conObj.AWS_CLOUDFRONT_URL +  conObj.UPLOAD_PATH + conObj.BUSINESS_IMAGE_PATH + results[0].u_uuid +'/'+ conObj.AWS_VIDEO_PATH + results[0].up_video;
           
        }

        let getUnseenNotCount = await common.getUnseenNotCount(results[0].u_id, '1');
        console.log('sdfsdfsdfsfsfsfsd=======>>>>>>>',getUnseenNotCount);
            results[0].notificationCount = (getUnseenNotCount && getUnseenNotCount != '') ? getUnseenNotCount : '0';

       
        let commonData = {
            "u_id"                      : results[0].u_id,
            "u_uuid"                    : results[0].u_uuid, 
            "u_full_address"            : results[0].u_full_address,
            "u_name"                    : results[0].u_name,
            "u_email"                   : results[0].u_email,
            "u_description"             : results[0].u_description,
            "u_image"                   : results[0].u_image,
            "user_image"                : results[0].profileUrl,
            "u_latitude"                : results[0].u_latitude,
            "u_longitude"               : results[0].u_longitude,
            "u_phone"                   : results[0].u_phone,
            "u_country" 	            : results[0].u_country,
            "u_state" 	   	            : results[0].u_state,
            "u_post_count"              : results[0].u_post_count,
            "u_full_address"            : results[0].u_full_address,
            "u_is_available"            : results[0].u_is_available,
            "u_is_online"               : results[0].u_is_online,
            "state_name"	            : results[0].state,
            "country_name"              : results[0].country,
            "u_followers"               : results[0].u_followers,
            "u_following"               : results[0].u_following,
            "u_sponsor_account"         : results[0].u_sponsor_account,
            "u_verified_account"        : results[0].u_verified_account,
            "u_ads_points"              : results[0].u_ads_points,
            "u_stores_points"            : results[0].u_stores_points,
            "u_total_points"            : results[0].u_total_points,
            "u_contests_attended"       : results[0].u_contests_attended,
            "up_uuid"                  : results[0].up_uuid,  
            "up_account_type"          : results[0].up_account_type,
            "up_bio_name"              : results[0].up_bio_name,
            "up_bio_text"              : results[0].up_bio_text,
            "up_bio_profile"           : results[0].up_bio_profile,
            "up_business_name"         : results[0].up_business_name,
            "up_business_email"        : results[0].up_business_email,
            "up_drivers_count"         : results[0].up_drivers_count,
            "up_business_phone"        : results[0].up_business_phone,
            "u_rank"                   : results[0].u_rank,
            "u_free_contest"           : results[0].u_free_contest,
            "u_points_contest"         : results[0].u_points_contest,
            "u_sponsor_contest"        : results[0].u_sponsor_contest,
            "u_paid_contest"           : results[0].u_paid_contest,
            "up_business_description"  : results[0].up_business_description,
            // "up_title"                 : results[0].up_title,
            "up_business_bio"          : results[0].up_business_bio,
            "up_website"               : results[0].up_website,
            "up_business_profile"      : results[0].up_business_profile,
            "up_company_logo"          : results[0].up_company_logo,
            "up_isAllowSaveCard"       : results[0].up_isAllowSaveCard,
            "up_brief"                 : results[0].up_brief,
            "up_video"                 : results[0].up_video,
            "up_video_thumbnail"       : results[0].up_video_thumbnail,
            "up_video_link"            : results[0].up_video_link,
            "up_request_enabled"       : results[0].up_request_enabled,
            "up_video_view_count"      : results[0].up_video_view_count,
            "up_status"                : results[0].up_status,
            "up_type"                  : results[0].up_type,
            "userMessagePassword"      : results[0].u_private_chat_password_text,
            "profileUrl"               : results[0].profileUrl,
            "notificationCount"        : results[0].notificationCount,
        };

        commonData.u_profile_completed = 'Y';

        if ( commonData.u_rating && commonData.u_rating ) {

            commonData.u_rating  = parseFloat(commonData.u_rating ).toFixed(1) - 0;

        }

        deferred.resolve(commonData);

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}

/**
 * This function is using to get user topic
 
 */
userModel.executeQuery = async function( userId ) {

    let deferred    = q.defer(),
        conObj      = await constant.getConstant(),
        sql         = `SELECT user.u_id, user.u_uuid,user.u_private_chat_password, user.u_rank,  user.u_free_contest,user.u_points_contest,user.u_sponsor_contest,user.u_paid_contest,user.u_private_chat_password_text,user.u_full_address,  user.u_name, user.u_email, user.u_description, user.u_password, user.u_image, user.u_latitude, user.u_longitude, user.u_phone, user.u_gender, user.u_active_count, user.u_activation_token, user.u_post_count, user.u_followers, user.u_following ,user.u_active, user.u_is_online,user.u_is_available,user.u_sponsor_account,user.u_verified_account,user.u_ads_points,user.u_stores_points,user.u_total_points, user.u_contests_attended, countries.name as country_name, states.name as state_name, up.up_account_type, up.up_bio_name,up.up_bio_text,up.up_uuid, up.up_bio_profile,up.up_business_name, up.up_business_email, up.up_business_phone, up.up_business_description, up.up_business_bio ,up_request_enabled, up.up_website, up.up_business_profile, up.up_type, up.up_company_logo, up.up_isAllowSaveCard, up.up_brief,up.up_video, up.up_video_thumbnail ,up.up_video_link 
        FROM user 
        LEFT JOIN user_profile as up ON up.up_fk_u_id = user.u_id 
        LEFT JOIN countries ON countries.id = user.u_country 
        LEFT JOIN states ON states.id = user.u_state 
        WHERE u_id = ?`;

    if ( userId ) {

          pool.query(sql, [userId], async (error, results, fields) => {
            // console.log(abc.sql);
            if ( error ) {
                deferred.resolve(error);
            } else {

                if ( results && results.length > 0 ) {
                    deferred.resolve(results);
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
 * This function is using to get user topic
 
 */
userModel.userSecondaryEmails = async function( userId ) {

    let deferred = q.defer();
        sql      = "SELECT se_id, se_emails, se_verified FROM secondary_emails WHERE se_fk_u_id = ?";

    if ( userId ) {

        pool.query( sql, [ userId ], function( error, results, fields ) {

            if ( error ) {
                deferred.resolve( false );
            } else {

                if ( results && results.length > 0 ) {
                    deferred.resolve(results);
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
 * This model will return user array
 
 */

userModel.getRecords  = async function( body ) {

    let deferred = q.defer(),
        conObj   = await constant.getConstant(),
        sql      = 'SELECT user.u_uuid, user.u_rating, user.u_name, user.u_email, user.u_description, user.u_image, user.u_tmp_image, user.u_contests_attended, user.u_latitude, user.u_longitude, user.u_phone, user.u_gender, user_price.up_group, user_price.up_individual,user_price.up_online_price, user_price.up_in_person_price FROM user LEFT JOIN user_price ON user.u_id = user_price.up_fk_u_id WHERE 1 = 1';

    pool.query(sql2 [ body ], function ( error, results, fields ) {

        if ( error ) {
            deferred.resolve(false);
        } else {

            results[0].profileUrl   = conObj.SITE_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH

            if ( results && results.length > 0 && results[0].u_image != null && results[0].u_image != "" ) {

                results[0].u_image  = conObj.SITE_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + results[0].u_image;

            } 

            deferred.resolve(results);

        }

    });

    return deferred.promise;

}

/**
 * Get user table row
 * @param     : userUUID
 * @returns   :
 * @developer : Anil Guleria
 */
userModel.getRow  = async function(userUUID) {
    
    let deferred = q.defer(),
        conObj   = await constant.getConstant();
        sql      = `SELECT user.u_uuid, user.u_name, user.u_email, user.u_description, user.u_image,user.u_description, user.u_phone, user.u_dob ,user.u_latitude, user.u_longitude, user.u_full_address, user.u_phone,user.u_gender,user.u_contests_attended,  user.u_country, user.u_state, countries.name as country_name, states.name as state_name , up.up_account_type, up.up_bio_name,up.up_bio_text,up.up_uuid, up.up_bio_profile,up.up_business_name, up.up_business_email, up.up_business_phone, up.up_business_description, up.up_business_bio , up.up_website, up.up_business_profile, up.up_company_logo,up.up_isAllowSaveCard, up.up_brief,up.up_video, up.up_video_link FROM user 
        LEFT JOIN user_profile as up ON user.u_id = user_profile.up_fk_u_id 
        LEFT JOIN countries ON countries.id = user.u_country 
        LEFT JOIN states ON states.id = user.u_state 
        WHERE  user.u_id = ?`,

        results = await helper.getDataOrCount(sql, [userUUID], 'U');

    if ( results && Object.keys( results ).length > 0 ) {

        if ( typeof results.sqlMessage != 'undefined' ) {   
            deferred.resolve( 'error' ) 
        } else {

            if ( results && results.length > 0 ) {

                results[0].profileUrl   = conObj.SITE_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH;

                if ( results[0].u_image != null && results[0].u_image != "" ) {

                    results[0].u_image  = conObj.SITE_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + results[0].u_image;

                }
                    
                deferred.resolve( results[0] );

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
 * This model will return user array
 
 */
userModel.update  = function( data, uuid ) {
    
    let deferred = q.defer();
    
    if ( data ) {

        let ret = helper.sqlUpdate('user', data);

        if ( ret && ret.val && ret.val.length > 0 ) {

            if ( uuid ) {

                ret.sql +=' WHERE u_uuid = ?';
                ret.val.push(uuid);

                pool.query( ret.sql, ret.val, function ( error, results, fields ) {

                    if ( error ) {
                        deferred.reject(error);
                    } else {
                        deferred.resolve(results);
                    }

                });

            } else { 
            }

        } else {

        }

    } else {
        deferred.resolve(false);
    }
    
    return deferred.promise;

}

/**
 * User to change user's password.
 
 */
userModel.changePassword = async (userId, body) => {

    let deferred = q.defer();

    if( userId && body && body.oldPassword && body.newPassword ){

        let  sql  = 'SELECT user.u_id, user.u_name, user.u_password, user.u_private_chat_password FROM user WHERE user.u_id = ?',
        results   = await common.commonSqlQuery(sql,[userId],true);

        if ( results && results.length > 0 ) {
            let checkPassword = passwordHash.verify(body.oldPassword, results[0].u_password);
            if( body.type == 'MP'  ){
                checkPassword = passwordHash.verify(body.oldPassword, results[0].u_private_chat_password)
            }
            if ( checkPassword  ) {

                let hashedPassword = passwordHash.generate(body.newPassword),
                    updateSql      = "UPDATE user SET u_password = ? WHERE user.u_id = '?'";
                    if( body.type == 'MP'){
                        updateSql  = "UPDATE user SET u_private_chat_password = ? WHERE user.u_id = '?'";
                    }
                    resultOne      = await common.commonSqlQuery(updateSql,[hashedPassword,userId], true);

                if ( resultOne ) {

                    deferred.resolve(true);
                } else {

                    /*let date            = await helper.getPstDateTime('timeDate'),
                        joinDate        = await helper.dateFormat(date, 'n'),
                        activityObj     = {
                            userId          : results[0].u_id,
                            actionUserId    : results[0].u_id,  
                            description     : results[0].u_name + ' changed password at ' + joinDate, 
                            activityType    : 'PASSWORD', 
                            date            : date
                        };
                    
                    helper.insertUserActivityLogs(activityObj);*/
                    deferred.resolve(false);
                }
            } else {

                deferred.resolve({
                    code : 'AAA-E1009'
                });
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
 * This function is used to update user profile data
 * @param     	:
 * @developer 	: Anil Guleria
 * @modified	: 
 */
userModel.updateUserProfileData = async (userId, body) => {
    console.log('asdadadasadasasdads================>>>>>>>>>',body)
    let deferred        = q.defer();

    if ( userId && body && body.name != null && body.name != 'null' ) {

        let sql         = '',
            data        = [];
            
        if ( body.name && body.phone && body.phone != 'null' && body.description && body.description != 'null' ) {

            sql        = `UPDATE user SET u_name = ?, u_phone = ?, u_description = ? WHERE u_id = ? `;
            data       = [body.name, body.phone, body.description, userId];
            
        } else if ( body.name && body.phone && body.phone != 'null' ) {

            sql        = `UPDATE user SET u_name = ?, u_phone = ? WHERE u_id = ? `;
            data       = [body.name, body.phone, userId];
        
        }  else if ( body.name && body.description && body.description != 'null' ) {

            sql        = `UPDATE user SET u_name = ?, u_description = ? WHERE u_id = ? `;
            data       = [body.name, body.description, userId];
        
        } else if ( body.name ) {
            
            sql        = `UPDATE user SET u_name = ? WHERE u_id = ? `;
            data       = [body.name, userId];
        
        } else if ( body.phone && body.phone != 'null' ) {
            
            sql        = `UPDATE user SET u_phone = ? WHERE u_id = ? `;
            data       = [body.phone, userId];
        
        } else if ( body.description && body.description != 'null' ) {
            
            sql        = `UPDATE user SET u_description = ? WHERE u_id = ? `;
            data       = [body.description, userId];

        } else {

            sql        = `UPDATE user SET u_name = ? WHERE u_id = ? `;
            data       = [body.name, userId];
        }
        
        /* let sql        = `UPDATE user SET u_name = ? WHERE u_id = ? `,
            data       = [body.name, userId], */


        let updateData = await common.commonSqlQuery(sql, data, true);
        
        if ( body.messagePassword && body.messagePassword != 'null' ) {
                console.log('asdadasdadadadsadadada,,,,=======>>>>',body.messagePassword);
            let hashedPassword = passwordHash.generate(body.messagePassword);
            sql        = `UPDATE user SET u_private_chat_password = ?, u_private_chat_password_text = ? WHERE u_id = ? `;
            
            data       = [hashedPassword,body.messagePassword, userId];
            let updateData = await common.commonSqlQuery(sql, data, true);

        }
            
        if ( updateData && updateData != false ) {

            deferred.resolve(true);

        } else {

            deferred.resolve(false);
        };  
    } else {

        deferred.resolve(false);

    };

    return deferred.promise; 
};
 

/**
 * This model is using to update image
 * @param        :
 * @returns       :
  * @developer : 
 */
userModel.uploadImage = async (userId, imageName) => {

    // console.log('uploadImageModel ============= 1111');

    let deferred = q.defer();

    if ( userId && imageName ) {

        // console.log('uploadImageModel ============= 222222222');

        // user.u_tem_image change to user.u_image
        let aa = pool.query('UPDATE user SET user.u_image = ? WHERE user.u_id = ?', [imageName, userId], async function(error, row, fields) {

            // console.log('aaSql =======>>>>>>', aa.sql)
            if ( error ) {

                // console.log('uploadImageModel ============= 333333 error === ', error);

                deferred.resolve(false);
            } else {

                // console.log('row===>>>>>', row)
                if ( row ) {

                    deferred.resolve(row);
                    
                } else {
                    // console.log('uploadImageModel ============= 555555555');

                    let getUserDetail   = await userModel.executeQuery(userId),
                        userName        = '';

                    if ( getUserDetail && getUserDetail.length > 0 ) {
                        // console.log('uploadImageModel ============= 66666666666');

                        userName            = getUserDetail[0].u_name;
                        let date            = await helper.getPstDateTime('timeDate'),
                            joinDate        = await helper.dateFormat(date, 'n'),
                            activityObj     = {
                                userId          : userId,
                                actionUserId    : userId,  
                                description     : userName + ' updated profile picture at ' + joinDate, 
                                activityType    : 'PROFILE', 
                                date            : date
                            };
                        
                        helper.insertUserActivityLogs(activityObj);
                    } else {
                        // console.log('uploadImageModel ============= 7777777777');
                    }
                    
                    deferred.resolve(false);
                }
            }
        });

    } else {
        // console.log('uploadImageModel ============= 888888888');
        deferred.resolve(false);
    }

    return deferred.promise;
}

/**
 * Get user table row
 * @param     : userUUID
 * @returns   :
 * @developer : Anil Guleria
 */
userModel.getUserTypeRow  = async (userUUID) => {
    
    let deferred = q.defer(),
        sql      = `SELECT user.u_uuid, u_login_type
        FROM user 
        WHERE u_id = ?`,

        results = await helper.getDataOrCount(sql, [userUUID], 'U');

    if ( results && Object.keys(results).length > 0 ) {

        if ( typeof results.sqlMessage != 'undefined' ) {   
            deferred.resolve(false); 
        } else {

            if ( results && results.length > 0 ) {

                deferred.resolve(results[0]);

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
 * This function is using to update available status of user
 * @param        :
 * @returns       :
  * @developer : 
 */
userModel.updateAvailableStatus = function(userId, status) {

    let deferred = q.defer();

    if ( userId ) {

        if ( status == 1 ) {
            status = '1';
        } else {
            status = '0';
        }

        pool.query('SELECT u_uuid, u_is_available, u_is_online FROM user WHERE user.u_id = ?', [userId], function(error, results, fields) {

            if ( error ) {
                deferred.resolve(false);
            } else {

                if ( results && results.length > 0 ) {

                    pool.query("UPDATE user SET u_is_available = ? WHERE user.u_id = ? ", [ status, userId ], async function(error, row, fields) {

                        if ( error ) {
                            deferred.resolve(false);
                        } else {

                            let socketData = {
                                "u_is_online"       : '1',
                                "u_is_available"   	: status,
                                "u_uuid"           	: results[0].u_uuid, 
                            };

                            io.emit('USER-PRESENCE', socketData);

                            let getUserDetail   = await userModel.executeQuery(userId),
                                userName        = '';

                            if ( getUserDetail && getUserDetail.length > 0 ) {
                                
                                let avilableStatus = 'not available';

                                if ( status == '1' ) {
                                    avilableStatus = 'available';
                                }

                                userName            = getUserDetail[0].u_name;
                                let date            = await helper.getPstDateTime('timeDate'),
                                    joinDate        = await helper.dateFormat(date, 'n'),
                                    activityObj     = {
                                        userId          : userId,
                                        actionUserId    : userId,  
                                        description     : userName + ' updated availability status to ' + avilableStatus + ' at ' + joinDate, 
                                        activityType    : 'PROFILE', 
                                        date            : date
                                    };
                                
                                helper.insertUserActivityLogs(activityObj);
                            }

                            deferred.resolve(true);
                        }

                    });

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
 * This function is using to update online status of user
 * @param        :
 * @returns       :
  * @developer : 
 */
userModel.updateOnlineStatus = function(userId, status) {
    let deferred = q.defer();

    if ( userId && status ) {

        pool.query('SELECT u_uuid FROM user WHERE user.u_id = ?', [ userId ], function ( error, results, fields ) {

            if ( error ) {
                deferred.resolve(false);
            } else {

                if ( results && results.length > 0 ) {

                    pool.query("UPDATE user SET u_is_online = ? WHERE user.u_id = ? ", [ status, userId ], async function(error, row, fields) {

                        if ( error ) {
                            deferred.resolve(false);
                        } else {

                            let getUserDetail   = await userModel.executeQuery(userId),
                            userName        = '';

                            if ( getUserDetail && getUserDetail.length > 0 ) {
                                
                                let avilableStatus = 'offline';

                                if ( status == '1' ) {
                                    avilableStatus = 'online';
                                }

                                userName            = getUserDetail[0].u_name;
                                let date            = await helper.getPstDateTime('timeDate'),
                                    joinDate        = await helper.dateFormat(date, 'n'),
                                    activityObj     = {
                                        userId          : userId,
                                        actionUserId    : userId,  
                                        description     : userName + ' updated online status to ' + avilableStatus + ' at ' + joinDate, 
                                        activityType    : 'PROFILE', 
                                        date            : date
                                    };
                                
                                helper.insertUserActivityLogs(activityObj);
                            }
                            deferred.resolve(true);
                        }

                    });
                   
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
 * This function is using to add secondary emails
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : 
 */
userModel.sendVerifyEmail = async function(email, userId) {

    let deferred        = q.defer();

    if ( email &&  userId ) {

        let activationCode  = Math.floor(Math.random() * (+9876 - +1234)) + +1234;

        pool.query("UPDATE secondary_emails SET se_verify_token = ?, se_verify_token_count = '0' WHERE se_emails = ? AND se_fk_u_id = ? ", [activationCode, email, userId], async function(error, row) {

            if ( error ) {
                deferred.resolve(false);
            } else {

                if ( row ) {

                    if ( userModel.sendEmail(email, activationCode) ) {
                        deferred.resolve(true);
                    } else {
                        deferred.resolve(false);
                    }
                    
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
 * This function is using to add secondary emails
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : 
 */
userModel.sendEmail = async function( email, activationCode ) {

    let to        = email,
        conObj    = await constant.getConstant();
        dataEmail = '',
        from      = conObj.SITE_EMAIL;


    let sub    = 'Verify Account';
    dataEmail += 'Here is your activation Token: '+ activationCode;
    
    dataEmail += '<br /><br /><strong>Thank you,</strong><br /><strong> Glimpsters Team </strong>';

    let emailArray = {
        to      : to,
        from    : from,
        subject : sub,
        body    : dataEmail
    };

    if ( common.sendEmails( emailArray ) ) {
        common.insertSentEmailData(emailArray);
        return true;
    } else {
       return false;
    }
    
}

/**
 * Used to delete uploaded video data from table
 * @developer   : Anil Guleria
 * @modified    :
 * @params      : 
 */
userModel.deleteProfileImage = async (bodyObj) => {

    let deferred        = q.defer();
    
    if ( bodyObj && bodyObj.userId ) {
        
        let updateSql   = `UPDATE user SET u_image = ? 
            WHERE u_id = ? `,
            dataArray   = ['', bodyObj.userId],
            updateRes   = await helper.getDataOrCount(updateSql, dataArray, 'U');
            
        if ( updateRes ) {

            let getUserTypeData = await userModel.getUserTypeRow(bodyObj.userId);

                if ( getUserTypeData && getUserTypeData.u_login_type && getUserTypeData.u_login_type != 'null' ) {

                    if ( getUserTypeData.u_login_type  == 'BUSINESS' ) {

                        let sqlOne      = 'UPDATE user_business SET ubs_image = ? WHERE ubs_fk_u_id = ?',
                            updResOne   = await helper.getDataOrCount(sqlOne, dataArray, 'U');

                    } else if ( getUserTypeData.u_login_type  == 'DRIVER' ) {

                        let sqlOne      = 'UPDATE user_business_driver_detail SET ubdd_image = ? WHERE ubdd_fk_driver_u_id = ?',
                            updResOne   = await helper.getDataOrCount(sqlOne, dataArray, 'U');

                    }
                }
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
 * This function is get user post data
 * @param     	: userId, body
 * @developer 	: 
 * @modified	: 
 */
 userModel.getUsersData = async (userId, body) => {
    
    let deferred                = q.defer(),
        conObj                  = await constant.getConstant(),
        imgUrl                  = conObj.SITE_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH;

        // console.log('getPostData == 111111111111111111111111',userId, body);

    if ( userId && body ) {

        let userDataSql = 'SELECT u_latitude, u_longitude FROM user WHERE u_id = ?',
        userDataData    = await common.commonSqlQuery(userDataSql, [userId]);

        let sql = `SELECT (3959 *  acos( cos( radians(`+userDataData[0].u_latitude+`))* cos( radians( user.u_latitude))*
        cos( radians( user.u_longitude ) - radians(`+userDataData[0].u_longitude+`))  + sin( radians(`+userDataData[0].u_latitude+`))*
       sin( radians( user.u_latitude ) ))) AS distance ,user.u_id, user.u_uuid, user.u_full_address,  user.u_name, user.u_email, user.u_description, user.u_password, user.u_image, user.u_latitude, user.u_longitude, user.u_phone, user.u_gender, user.u_active_count, user.u_contests_attended, user.u_activation_token, user.u_post_count, user.u_active,user.u_sponsor_account,user.u_verified_account, user.u_is_online,user.u_is_available, countries.name as country_name, states.name as state_name, up.up_account_type, up.up_bio_name,up.up_bio_text,up.up_uuid, up.up_bio_profile,up.up_business_name, up.up_business_email, up.up_business_phone, up.up_business_description, up.up_business_bio ,up_request_enabled, up.up_website, up.up_business_profile, up.up_type, up.up_company_logo,up.up_isAllowSaveCard, up.up_brief,up.up_video, up.up_video_thumbnail ,up.up_video_link 
        FROM user 
        LEFT JOIN user_profile as up ON up.up_fk_u_id = user.u_id 
        LEFT JOIN countries ON countries.id = user.u_country 
        LEFT JOIN states ON states.id = user.u_state 
        WHERE u_id != ? AND u_deleted = ? AND u_enable = ? AND u_active = ? AND up_type != '5'  AND (user.u_latitude OR user.u_longitude) IS NOT NULL  ORDER BY distance ASC `,
       result = await common.commonSqlQuery(sql, [userId, '0','1', '1'], true);

        if( result && result.length > 0 ){
            for( let resultData of result ){

                if( resultData.up_type == '2'){
                    // console.log('resultData.up_type',resultData.up_type);
                    let checkCardRequest =  await common.getRowById(resultData.u_id,'cr_fk_receiver_u_id','cr_status','card_request',true);  
                    // console.log('checkCardRequest',checkCardRequest);
                    if( checkCardRequest ){
                        resultData.businessRequestType = checkCardRequest
                    }   
                    // 'SELECT cr_status card_request WHERE cr_fk_sender_u_id = ?'
                }
                
                if( resultData.u_image ) {
                        
                    resultData.u_image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + resultData.u_image;

                }
                if ( resultData.up_business_profile != null && resultData.up_business_profile != "" ) {

                    resultData.up_business_profile  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.BUSINESS_IMAGE_PATH + conObj.AWS_IMAGE_PATH + resultData.up_business_profile;
        
                }
                if ( resultData.up_company_logo != null && resultData.up_company_logo != "" ) {

                    resultData.up_company_logo  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.BUSINESS_LOGO_PATH + conObj.AWS_IMAGE_PATH + resultData.up_company_logo;
        
                }
        
                if( resultData.u_uuid && resultData.up_video  && resultData.up_video != '' &&  resultData.up_video_thumbnail && resultData.up_video_thumbnail != "" ){
        
                     resultData.up_video_thumbnail = conObj.AWS_CLOUDFRONT_URL +  conObj.UPLOAD_PATH + conObj.BUSINESS_IMAGE_PATH + resultData.u_uuid +'/'+ conObj.AWS_VIDEO_PATH + resultData.up_video_thumbnail;
        
                     resultData.up_video     = conObj.AWS_CLOUDFRONT_URL +  conObj.UPLOAD_PATH + conObj.BUSINESS_IMAGE_PATH + resultData.u_uuid +'/'+ conObj.AWS_VIDEO_PATH + resultData.up_video;
                   
                }
                if(  resultData.u_latitude &&  resultData.u_longitude ){
                    let Obj          = {
                        uLatitude  : resultData.u_latitude,
                        uLongitude : resultData.u_longitude,
                        userId     : userId
                    }
                    // console.log('obj================>>>',Obj);
                    let userDistance = await userModel.userIsNearLocation(Obj);
                    // console.log('userDistance ========>>>',userDistance);
                    if(  userDistance ){
                        resultData.userDistance = userDistance;
                    }


                }
                resultData.cr_user_address = '' ;
                resultData.cr_note         = '';
                  
               
               let followStatus = await userModel.getFollowStatus(resultData.u_id,userId);
               if( followStatus && followStatus != '' ){
                resultData.followStatus = followStatus;
               }

            }
            obj={
                data : result,
                page : 0
            }

            deferred.resolve(obj);
        } else {
            
            deferred.resolve(false);
        }


    } else {
        // console.log('getPostData == 1231231234234243243242343243');
        deferred.resolve(false);
    }
    
    return deferred.promise;
}


/** TODO : FUNCTION NEED TO BE REFINED.
 * This function is using to  
 
 */
 userModel.getOtherUserProfile = async (uuid, loginUserId) => {

    let deferred = q.defer();

    if ( uuid ) {

        let conObj  = await constant.getConstant();
         sql = 'SELECT user.u_id, user.u_uuid, user.u_full_address,  user.u_name, user.u_rank, user.u_email, user.u_description, user.u_image, user.u_latitude, user.u_contests_attended, user.u_longitude, user.u_phone, user.u_gender,user.u_active, user.u_post_count, user.u_followers,user.u_following, user.u_is_online FROM user WHERE user.u_id = ? AND user.u_deleted = ? AND user.u_enable = ? '
         results = await common.commonSqlQuery(sql, [uuid,'0','1' ], true);
            
            // console.log(results,"results");

            if ( results && results.length > 0  ) {
               
                    results[0].followStatus = await userModel.getFollowStatus(uuid, loginUserId);
                    if( results[0].u_image ){
                        results[0].u_image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + results[0].u_image;

                    }
                    if( results[0].u_id ){

                        results[0].verifiedType = await common.getRowById(results[0].u_id,'u_id','u_verified_account','user');
                        results[0].sponsorType = await common.getRowById(results[0].u_id,'u_id','u_sponsor_account','user');

                    } 
                    // results[0].block_user            = await _commonModel.getBlockedUserStatus(uuid, loginUserId);
                    deferred.resolve(results);

               
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
 userModel.getFollowStatus = async (userId, loginUserId) => {
    let deferred = q.defer();

    if ( userId && loginUserId ) {

        let sql     = `SELECT uf_fk_u_id , uf_follower_u_id FROM user_follow WHERE uf_follower_u_id = ? AND uf_fk_u_id = ?`,
        result = await common.commonSqlQuery(sql, [userId,loginUserId]);

        if ( result && result.length > 0 ) {
            deferred.resolve('YES');
        } else {
            deferred.resolve('NO');
        }

    } else {
        deferred.resolve('NO');
    }

    return deferred.promise;

}


/** This function is use to update User Profile Type Account Type
 * @param     : profileType, accountType
 * @returns   : 
 * @developer :  
 */

 userModel.updateActiveProfile = async function( body ,userId ) {
    // console.log('updateActiveProfile',body)

    let deferred = q.defer(),
        sql      = "UPDATE user_profile SET ? WHERE up_fk_u_id = ?";
    if( userId && body ){
        let obj = {};

        if( body.accountType ){

             obj      = {
                up_account_type : body.accountType  ,                                                                               
            }
        }

        if( body.profileType ){

            obj      = {
                up_type         : body.profileType 
            }

        }
        

        result  = await common.commonSqlQuery(sql,[obj,userId],true);

        if( result ){
            deferred.resolve(result);
        } else {
            deferred.resolve(false);

        }
    } else {

        deferred.resolve(false);
    }
    

    return deferred.promise;

}



/** This function is use to update User longitude, latitude
 * @param     : longitude, latitude
 * @returns   : 
 * @developer :  
 */

 userModel.updateUserLocation = async function( body ,userId ) {
//   console.log('updateUserLocation',body)
console.log('CountryStateobj===========>>>>',body);

    let deferred = q.defer(),
        sql      = "UPDATE user SET ? WHERE u_id = ?";
    if( userId && body ){
        let obj      = {
            u_latitude  : body.latitude  ,                                                                               
            u_longitude : body.longitude ,
            u_state     : body.stateName,
            u_country   : body.CountryName
        },

        result  = await common.commonSqlQuery(sql,[obj,userId],true);

        if( result  ){
            deferred.resolve(result);
        } else {
            deferred.resolve(false);

        }
    } else {

        deferred.resolve(false);
    }
    

    return deferred.promise;

}

/** This function is use to update User Bio
 * @param     : bioName, bioText
 * @returns   : 
 * @developer :  
 */

 userModel.updateUserBio = async function( body ,userId ) {
    // console.log('updateUserBio',body)

    let deferred = q.defer(),
        sql      = "UPDATE user_profile SET ? WHERE up_fk_u_id = ?";
    if( userId && body ){
        let obj      = {
            up_bio_name : body.bioName ,                                                                               
            up_bio_text : body.bioText 
        },

        result  = await common.commonSqlQuery(sql,[obj,userId],true);

        if( result  ){
            deferred.resolve(result);
        } else {
            deferred.resolve(false);

        }
    } else {

        deferred.resolve(false);
    }
    

    return deferred.promise;

}

/** This function is use to update User Business
 * @param     : companyName, companyBio, companyPhone, companyEmail
 * @returns   : 
 * @developer :  
 */

 userModel.updateUserBusiness = async function( body ,userId ) {
    // console.log('updateUserBusiness',body)

    let deferred = q.defer(),
        sql      = "UPDATE user_profile SET ? WHERE up_fk_u_id = ?";
    if( userId && body ){
        let obj      = {
            up_business_name                 : body.companyName ,                                                                               
            up_business_bio                  : body.companyBio ,
            up_business_phone                : body.companyPhone ,                                                                            
            up_business_email                : body.companyEmail ,
            up_business_description          : body.companyLogoDes,
            up_isAllowSaveCard               : body.isAllowSaveCard
        },

        result  = await common.commonSqlQuery(sql,[obj,userId],true);

        if( result  ){
            deferred.resolve(result);
        } else {
            deferred.resolve(false);

        }
    } else {

        deferred.resolve(false);
    }
    

    return deferred.promise;

}

/**
 * This model is using to upload Business Image
 * @param        :
 * @returns       :
  * @developer : 
 */
 userModel.uploadBusinessImage = async (userId, imageName, type) => {

    // console.log('uploadImageModel ============= 1111');

    let deferred = q.defer();

    if ( userId && imageName ) {
        let Obj = {
            up_business_profile : imageName
        }
        if( type && type == 'logo' ){
            Obj = {
                up_company_logo : imageName
            }
        }
        // console.log('uploadImageModel ============= 222222222');

        // user.u_tem_image change to user.u_image
        let aa = pool.query('UPDATE user_profile SET ? WHERE user_profile.up_fk_u_id = ?', [Obj, userId], async function(error, row, fields) {

            // console.log('aaSql =======>>>>>>', aa.sql)
            if ( error ) {

                // console.log('uploadImageModel ============= 333333 error === ', error);

                deferred.resolve(false);
            } else {

                // console.log('row===>>>>>', row)
                if ( row ) {

                    deferred.resolve(row);
                    
                } else {
                    // console.log('uploadImageModel ============= 555555555');

                    let getUserDetail   = await userModel.executeQuery(userId),
                        userName        = '';

                    if ( getUserDetail && getUserDetail.length > 0 ) {
                        // console.log('uploadImageModel ============= 66666666666');

                        userName            = getUserDetail[0].u_name;
                        let date            = await helper.getPstDateTime('timeDate'),
                            joinDate        = await helper.dateFormat(date, 'n'),
                            activityObj     = {
                                userId          : userId,
                                actionUserId    : userId,  
                                description     : userName + ' updated business image at ' + joinDate, 
                                activityType    : 'PROFILE', 
                                date            : date
                            };
                        
                        helper.insertUserActivityLogs(activityObj);
                    } else {
                        // console.log('uploadImageModel ============= 7777777777');
                    }
                    
                    deferred.resolve(false);
                }
            }
        });

    } else {
        // console.log('uploadImageModel ============= 888888888');
        deferred.resolve(false);
    }

    return deferred.promise;
}

/**
 * Used to delete uploaded video data from table
 * @developer   : Anil Guleria
 * @modified    :
 * @params      : 
 */
 userModel.deleteBusinessImage = async (bodyObj) => {

    let deferred        = q.defer();
    
    if ( bodyObj && bodyObj.userId ) {
        
        let updateSql   = `UPDATE user_profile SET up_business_profile = ? 
            WHERE up_fk_u_id = ? `,
            dataArray   = ['', bodyObj.userId],
            updateRes   = await helper.getDataOrCount(updateSql, dataArray, 'U');
            
        if ( updateRes ) {

            deferred.resolve(true);
        } else {
            deferred.resolve(false);
        }
    } else {
        deferred.resolve(false);
    }

    return deferred.promise;
}


/** This function is use to update Enable Disable Follow
 * @param     : followStatus
 * @returns   : 
 * @developer :  
 */

 userModel.enableDisableFollow = async function( body ,userId ) {
    // console.log('enableDisableFollow',body)

    let deferred = q.defer(),
        sql      = "UPDATE user_profile SET ? WHERE up_fk_u_id = ?";
    if( userId && body ){
        let obj      = {
            up_request_enabled : body.followStatus                                                                             
        },

        result  = await common.commonSqlQuery(sql,[obj,userId],true);

        if( result  ){
            deferred.resolve(result);
        } else {
            deferred.resolve(false);

        }
    } else {

        deferred.resolve(false);
    }
    

    return deferred.promise;

}


/** This function is use to update Enable Disable Follow
 * @param     : followStatus
 * @returns   : 
 * @developer :  
 */

 userModel.updateAddress = async function( body ,userId ) {
    // console.log('updateAddress',body)

    let deferred = q.defer(),
        sql      = "UPDATE user SET ? WHERE u_id = ?";
    if( userId && body ){
        let obj = {};
        if( body.userName && body.userName != ''){
            obj      = {
                u_full_address : body.userAddress ,
                u_name    : body.userName                                                                            
            };
        } else {

            obj      = {
                u_full_address : body.userAddress                                                                             
            };

        }

        result  = await common.commonSqlQuery(sql,[obj,userId],true);

        if( result  ){
            deferred.resolve(result);
        } else {
            deferred.resolve(false);

        }
    } else {

        deferred.resolve(false);
    }
    

    return deferred.promise;

}



/**
 * This function is using Business Card Request
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : 
 */
 userModel.businessCardRequest = async (otherUserId ,userId,body) => {
    // console.log('businessCardRequestbusinessCardRequestbusinessCardRequestbusinessCardRequestbusinessCardRequest',otherUserId ,userId )

    let deferred  = q.defer(),
        date      = await commonHelper.getPstDateTime('timeDate'),
        uuid      = uuidv1(Date.now());

    if ( otherUserId && userId && body ) {

       let objData = {
            cr_uuid               : uuid,
            cr_fk_sender_u_id     : userId,
            cr_fk_receiver_u_id   : otherUserId,
            cr_status             : body.type,
            cr_created            : date,
            cr_updated            : date,
            cr_user_address       : body.address ? body.address : '',
            cr_note               : body.note    ? body.note    : ''

        }
        console.log('objData======>>>>>>>',objData);
        let insertedId = await common.insert('card_request',objData,true);
        if ( insertedId && insertedId > 0 ) {
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
 * This function is get user Business Card Data
 * @param     	: userId, body
 * @developer 	: 
 * @modified	: 
 */

 userModel.getBusinessCardData = async (userId, body) => {
     console.log('body=====>>>getBusinessCardData',body)
    let deferred                = q.defer(),
        conObj                  = await constant.getConstant(),
        obj                     = {
            data                : '',
            more_records        : 0,
            total_records       : 0,
            last                : 0,
            lastRecId           : 0,
            page                : 0,
            user_profile_url    : conObj.SITE_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH,
        };

    if ( userId && body ) {
        // console.log('getBusinessCardData == 22222222222222');

        let whereLast               = '',
            whereMore               = '',
            id                      = '',
            sortBy                  = 'cr_id',
            sortOrder               = 'DESC',
            page                    = 0,
            checkNewRecord          = false,
            additionalNewCondition  = '',
            addCondition            = '',
            dataArray               = '',
            records_per_page        = conObj.RECORDS_PER_PAGE;

        if ( body.per_page && body.per_page != 'null' ) {
            records_per_page        = body.per_page;
        } 

        if ( body.page && body.page != '' && body.page != null && body.page != 'null' ) {
            //  console.log('sdffdfdsfsf',body.page)
            page = Number(body.page) + 1;

            if ( body.lastRecId != null && body.lastRecId != "null" && body.lastRecId != "" && sortOrder == "DESC") {
                // console.log(body.lastRecId)
                additionalNewCondition = " AND cr_id <= " + body.lastRecId;
            }
        } else {
            // console.log('new last id ');
            checkNewRecord  = true;
        }

        if ( body.last && body.last != 'null' ) {
            whereLast       += 'AND cr_id <= ' + body.last;
            whereMore       += 'AND cr_id > ' + body.last;
        }

        if ( body.sortOrder && body.sortOrder != 'null' ) {
            sortOrder       = body.sortOrder;
        }

        if ( body.sortBy && body.sortBy != 'null' ) {
            sortBy          = body.sortBy;
        }

        if ( body.keyword && body.keyword != 'null' ) {
            whereLast       +=  " AND u_name LIKE '%" + body.keyword + "%'";
            whereMore       +=  " AND u_name LIKE '%" + body.keyword + "%'";
        }

        whereLast           += additionalNewCondition;
        if( body.type == 'P' ){
            dataArray = [ '0', '0', '1', 'P',userId ]
            addCondition = ` LEFT JOIN user_profile ON up_fk_u_id = cr_fk_sender_u_id LEFT JOIN user ON  card_request.cr_fk_sender_u_id =  user.u_id WHERE u_deleted = ? AND  u_deactivated = ?  AND u_enable = ? AND cr_status = ? AND cr_fk_receiver_u_id = ?`;
            // r
        } else {
            addCondition        = `LEFT JOIN user_profile ON up_fk_u_id = cr_fk_receiver_u_id LEFT JOIN user  ON  card_request.cr_fk_receiver_u_id =  user.u_id WHERE u_deleted = ? AND  u_deactivated = ?  AND u_enable = ? AND cr_status = ? AND cr_fk_sender_u_id = ?`
            dataArray       = [ '0', '0', '1', 'A',userId ];

        }
        
        let sql  = ` SELECT u_id,u_name, u_image, u_uuid, cr_id, cr_uuid, cr_user_address,cr_note, cr_status,cr_created,up_business_profile,up_business_bio,up_business_name,up_business_email,up_company_logo,up_business_description,up_isAllowSaveCard,up_business_phone FROM card_request   
          ` + addCondition;
            // dataArray       = [ '0', '0', '0', '1', '1' ];
            // dataArray       = '',
        let getLastRecIdSql = sql + " GROUP BY cr_id ORDER BY cr_id DESC",
            moreRecordSql   = sql;
            
        let offset          = page * records_per_page;
        moreRecordSql       += whereMore + " GROUP BY cr_id ORDER BY " + sortBy + " " + sortOrder;
        sql                 += whereLast + " GROUP BY cr_id ORDER BY " + sortBy + " " + sortOrder + " LIMIT " + offset + "," + records_per_page;

        let result          = await common.commonSqlQuery(sql, dataArray, true);

        // console.log('getBusinessCardData == 33333333333333 result === ', result);
            
        if ( result && result.sqlMessage ) { 
            // console.log('getBusinessCardData == 444444444444 result === ');
            deferred.resolve(false);
        } else {

            // console.log('getBusinessCardData == 555555555555555555 result === ');

            if ( result && result.length > 0 ) {

                for ( let  resultData of result ) {

                    if( resultData.cr_created ){
                        resultData.cr_created = await helper.agoTime( resultData.cr_created );
                    }
                    if( resultData.u_image ) {
                        
                        resultData.u_image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + resultData.u_image;
                    }
                    if( resultData.up_business_profile ) {
                        
                        resultData.up_business_profile  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.BUSINESS_IMAGE_PATH + conObj.AWS_IMAGE_PATH + resultData.up_business_profile;
                    }
                    if ( resultData.up_company_logo != null && resultData.up_company_logo != "" ) {

                        resultData.up_company_logo  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.BUSINESS_LOGO_PATH + conObj.AWS_IMAGE_PATH + resultData.up_company_logo;
            
                    }

                    console.log(' resultData.up_company_logo========>', resultData.up_business_description);

                
                }
                // console.log('data data data',result)
                obj.data            = result;
                // obj.total_records   = resultOne.length;
                obj.last            = result[0].cr_id;
                obj.page            = page;

                if ( checkNewRecord ) {
                    // console.log("hi i am in");

                    let getLastRecId = await common.commonSqlQuery(getLastRecIdSql, dataArray, false);
                    // console.log("getLastRecId obj is : ", getLastRecId);
                    if ( getLastRecId && getLastRecId.length > 0 ) {
                        obj.lastRecId = getLastRecId[0].cr_id;
                    } 
                } 

                deferred.resolve(obj);

            } else {
                deferred.resolve(obj);
            }
        }

    } else {
        // console.log('getBusinessCardData == 1231231234234243243242343243');
        deferred.resolve(obj);
    }
    
    return deferred.promise;
}

/**
 * This function is using Business Card Request
 * @param       : otherUserId,type
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : 
 */
 userModel.businessCardAcceptCancel = async ( body ) => {

    let deferred  = q.defer(),
        date      = await commonHelper.getPstDateTime('timeDate'),
        objData   = {};

    if ( body && body.businessId && body.type  ) {

        if( body.type == 'A'){
            objData = { 

                cr_status             : 'A',
                cr_updated            : date,
            }
            let updateDataSql = 'UPDATE card_request SET ? WHERE cr_id = ?',
            updateData    = await common.commonSqlQuery(updateDataSql,[objData,body.businessId],true);

            if ( updateData ) {

                deferred.resolve(true);

            } else {
                deferred.resolve(false);
            }

        } else {


            let deleteSql = 'DELETE FROM card_request WHERE cr_id = ?',
            deleteData    = await common.commonSqlQuery(deleteSql,[body.businessId],true);

            if ( deleteData ) {

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



/** This function is use to get All User Latitude And Longitude
 * @param     :  
 * @returns   : 
 * @developer :  
 */

 userModel.getAllUserLatitudeAndLongitude = async function( userId ) {
    // console.log('updateActiveProfile',body)
    let deferred = q.defer(),
    conObj       = await constant.getConstant();

    if( userId ){

        // let sql = 'SELECT user.u_id, user.u_uuid,user.u_name, user.u_active, user.u_image, user.u_latitude, user.u_longitude FROM user WHERE  u_longitude IS NOT NULL AND u_latitude IS NOT NULL '
        //     data = await common.commonSqlQuery(sql,'', true);
        let sql = 'SELECT DISTINCT u_uuid,u_name,u_image,u_active,u_latitude,u_longitude FROM user_follow LEFT JOIN user ON user.u_id = user_follow.uf_follower_u_id OR user.u_id = user_follow.uf_fk_u_id WHERE (user_follow.uf_fk_u_id = ? OR user_follow.uf_follower_u_id = ?) AND user.u_id != ? '
        data = await common.commonSqlQuery(sql,[userId,userId,userId], true);
            console.log(' data data data data data data data data data data',data);
        if( data && data.length > 0 ){


            for( let resultData of data ){

                if( resultData.u_image ) {
                        
                    resultData.u_image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + resultData.u_image;
    
                }

            }

            deferred.resolve(data);

        } else {

            deferred.resolve(false);

        }

    } else {

        deferred.resolve(false);
    }
    
    return deferred.promise;

}

/** This function is use to update User Account  Type
 * @param     :  sponsorType, verifiedType
 * @returns   : 
 * @developer :  
 */

 userModel.updateAccountType = async function( body ,userId ) {
    // console.log('updateActiveProfile',body)

    let deferred = q.defer(),
        sql      = "UPDATE user SET ? WHERE u_id = ?";
    if( userId && body ){
        let obj = {};

        if( body.sponsorType ){
            // console.log('body.sponsorType ',body.sponsorType)
            obj      = {
                u_sponsor_account : body.sponsorType  ,                                                                               
            }
             
        }

        if( body.verifiedType ){
            // console.log('body.verifiedType ',body.verifiedType)

            obj      = {
                u_verified_account : body.verifiedType 
            }

        }
        

        result  = await common.commonSqlQuery(sql,[obj,userId],true);

        if( result ){
            let verifiedType = '',
            sponsorType      = '';
            if( body.verifiedType ){
                verifiedType = await common.getRowById(userId,'u_id','u_verified_account','user');
            } 
            if( body.sponsorType ){
                sponsorType = await common.getRowById(userId,'u_id','u_sponsor_account','user');

            }
            let obj = {
                verifiedType : verifiedType,
                sponsorType : sponsorType
            }
            // console.log('dasdasdasdadadasdasd',obj);
            deferred.resolve(obj);
        } else {
            deferred.resolve(false);

        }
    } else {

        deferred.resolve(false);
    }
    
    return deferred.promise;

}

/** This function is use to get User Points History
 * @param     : videoLink
 * @returns   : 
 * @developer :  
 */
userModel.getUserPointsHistory  = async ( body,userId) => {
    console.log('getUserPointsHistory body=====>>>',body)
    let deferred                = q.defer(),
        conObj                  = await constant.getConstant(),
        obj                     = {
            data                : '',
            more_records        : 0,
            total_records       : 0,
            last                : 0,
            lastRecId           : 0,
            page                : 0,
            user_profile_url    : conObj.SITE_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH,
        };
    if ( body ) {
        console.log('getPostData == 22222222222222');

        let whereLast               = '',
            whereMore               = '',
            id                      = '',
            sortBy                  = 'ph_id',
            sortOrder               = 'DESC',
            page                    = 0,
            checkNewRecord          = false,
            additionalNewCondition  = '',
            addCondition            = '',
            dataArray               = '',
            records_per_page        = conObj.RECORDS_PER_PAGE;

        if ( body.per_page && body.per_page != 'null' ) {
            records_per_page        = body.per_page;
        } 

        if ( body.page && body.page != '' && body.page != null && body.page != 'null' ) {
            page = Number(body.page) + 1;
            // page = body.page;

            if ( body.lastRecId != null && body.lastRecId != "null" && body.lastRecId != "" && sortOrder == "DESC") {
                // console.log(body.lastRecId)
                additionalNewCondition = " AND id <= " + body.lastRecId;
            }
        } else {
            // console.log('new last id ');
            checkNewRecord  = true;
        }
        if ( body.last && body.last != 'null' ) {
            whereLast       += 'AND ph_id <= ' + body.last;
            whereMore       += 'AND ph_id > ' + body.last;
        }

        if ( body.sortOrder && body.sortOrder != 'null' ) {
            sortOrder       = body.sortOrder;
        }

        if ( body.sortBy && body.sortBy != 'null' ) {
            sortBy          = body.sortBy;
        }

        if ( body.keyword && body.keyword != 'null' ) {
            whereLast       +=  " AND name LIKE '%" + body.keyword + "%'";
            whereMore       +=  " AND name LIKE '%" + body.keyword + "%'";
        }

        whereLast           += additionalNewCondition;

        let sql  = ` SELECT ph_id , ph_point AS getPoints, ma_id AS id , ma_uuid AS uuid, ma_title AS name ,ma_points AS points, ma_detail AS detail, ma_attachment, ma_thumbnail,	ma_type , ph_created AS createdAt
        FROM point_history LEFT JOIN marketing_ads ON ph_fk_ma_id = ma_id WHERE ph_fk_u_id	 = ? AND ph_type = 'ADS' 
        ` + addCondition;

        if( body.historyType == 'STORE') {
            sql  =  `SELECT ph_id , ph_point AS getPoints, s_id AS id , s_uuid AS uuid , s_name AS name , s_detail AS detail, s_points AS points, s_address AS address, s_image ,s_latitude AS latitude,s_longitude AS longitude , ph_created AS createdAt
            FROM point_history LEFT JOIN stores ON ph_fk_s_id = s_id WHERE ph_fk_u_id	 = ? AND ph_type = 'STORE' 
            ` + addCondition ;
        }
        dataArray           = [userId]
        
        let getLastRecIdSql = sql + "  ORDER BY ph_id DESC",
            moreRecordSql   = sql;

        let offset          = page * records_per_page;
        moreRecordSql       += whereMore + "  ORDER BY " + sortBy + " " + sortOrder;
        sql                 += whereLast + "  ORDER BY " + sortBy + " " + sortOrder + " LIMIT " + offset + "," + records_per_page;

        let result          = await common.commonSqlQuery(sql, dataArray, true);
            
        if ( result && result.sqlMessage ) { 

            deferred.resolve(false);

        } else {

            if ( result && result.length > 0 ) {

                for ( let  resultData of result ) {

                    // if( resultData.createdAt ){
                    //     resultData.createdAt = await commonHelper.dateFormat( resultData.createdAt );
                    // }

                    if( body.historyType == 'ADS' ){
                            if ( resultData.ma_type == 'IMAGE' || resultData.ma_type ==  'VIDEO' ) {
                                                        
                                if (  resultData.ma_attachment && resultData.ma_type == 'IMAGE' ) {
                                    resultData.image = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.ADS_UPLOAD_PATH + resultData.uuid +'/'+ conObj.AWS_IMAGE_PATH  +  resultData.ma_attachment; 
                                }
        
                                if ( resultData.ma_thumbnail && resultData.ma_type ==  'VIDEO' ) {
                                    resultData.image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.ADS_UPLOAD_PATH + resultData.uuid +'/'+ conObj.AWS_VIDEO_PATH + resultData.ma_thumbnail ;
                                }
        
                                if ( resultData.ma_attachment && resultData.ma_type ==  'VIDEO' ) {
        
                                    resultData.videoPath  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.ADS_UPLOAD_PATH + resultData.uuid +'/'+ conObj.AWS_VIDEO_PATH + resultData.ma_attachment;
            
                                } 
                            }
                    }

                    if( body.historyType == 'STORE' ){
                        if (  resultData.s_image ) {
                            
                            resultData.image = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.STORES_UPLOAD_PATH + resultData.uuid +'/'+ conObj.AWS_IMAGE_PATH  +  resultData.s_image; 
                        }
                    }
                    
                    
                    

                }

                obj.data            = result;
                obj.last            = result[0].id;
                obj.page            = page;

                if ( checkNewRecord ) {

                    let getLastRecId = await common.commonSqlQuery(getLastRecIdSql, dataArray, false);
                    if ( getLastRecId && getLastRecId.length > 0 ) {
                        obj.lastRecId = getLastRecId[0].id;
                    } 
                } 

                deferred.resolve(obj);

            } else {

                deferred.resolve(obj);
            }
        }

    } else {
        deferred.resolve(obj);
    }
   
   return deferred.promise;
}


/**
 * This function is using to insert Viewer Data
 * @param     :   
 * @returns   : 
 * @developer : 
 */
userModel.userIsNearLocation =  async ( dataObj )=> {

    const distFrom = require('distance-from');
    let deferred   =  q.defer();
   
    if ( dataObj.uLatitude && dataObj.uLongitude && dataObj.userId  ) {
        let userDataSql = 'SELECT u_latitude, u_longitude FROM user WHERE u_id = ?',
        userDataData    = await common.commonSqlQuery(userDataSql, [dataObj.userId]);

        if( userDataData && userDataData.length > 0 ){

            let userLat    = userDataData[0].u_latitude,
            userLog        = userDataData[0].u_longitude,
            userLatLng     = [userDataData[0].u_latitude,userDataData[0].u_longitude],
            otherUserLatLng    = [dataObj.uLatitude,dataObj.uLongitude],
            calculatedDistance = distFrom(userLatLng).to(otherUserLatLng).in('mi'); 
            // console.log('calculatedDistance=======>>>>>>',calculatedDistance);
            deferred.resolve(calculatedDistance);

        } else {

            deferred.resolve(false);

        }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise; 
}




/** This function is use to update Video Link
 * @param     : videoLink
 * @returns   : 
 * @developer :  
 */

userModel.updateVideoLink = async function( body ,userId ) {
    // console.log('updateAddress',body)

    let deferred = q.defer(),
        sql      = "UPDATE user_profile SET ? WHERE up_fk_u_id = ?";
    if( userId && body ){
        let obj = {};
        if( body.videoLink && body.videoLink != ''){
            obj      = {
                up_video_link : body.videoLink ,
            };
        } 

        result  = await common.commonSqlQuery(sql,[obj,userId],true);

        if( result  ){
            deferred.resolve(result);
        } else {
            deferred.resolve(false);

        }
    } else {

        deferred.resolve(false);
    }
    

    return deferred.promise;

}




module.exports = userModel;
