/**
 * Copyright (C) A Cube Technologies - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential. Dissemination of this information or reproduction 
 * of this material is strictly forbidden unless prior written permission is obtained
 * from A Cube Technologies.
--[[
              _____      _            _______        _                 _             _           
     /\      / ____|    | |          |__   __|      | |               | |           (_)          
    /  \    | |    _   _| |__   ___     | | ___  ___| |__  _ __   ___ | | ___   __ _ _  ___  ___ 
   / /\ \   | |   | | | | '_ \ / _ \    | |/ _ \/ __| '_ \| '_ \ / _ \| |/ _ \ / _` | |/ _ \/ __|
  / ____ \  | |___| |_| | |_) |  __/    | |  __/ (__| | | | | | | (_) | | (_) | (_| | |  __/\__ \
 /_/    \_\  \_____\__,_|_.__/ \___|    |_|\___|\___|_| |_|_| |_|\___/|_|\___/ \__, |_|\___||___/
                                                                                __/ |            
                                                                               |___/             
--]]                                                                                                                                                                                                                                                                                                                    
 * Written By  : Dushyant Sharma
 * Description : For All The Notification
 * Modified By :
 */


const nodeMailer        = require('nodemailer'),
    q 				    = require('q'),
    fs 				 	= require('fs'),
    path 				= require('path'),
    {v1: uuidv1}        = require('uuid'),
    helper				= require('../../configCommon/helpers'),
    config				= require('../../configCommon/config').init(),
    common              = require('../models/configCommon'),
    constant            = require('../../configCommon/config/constants'),
    fcm                 = require('fcm-node'),
    firebaseConfig      = {
        "type"                          : "service_account",
        "project_id"                    : "glimpsters-16e83",
        "private_key_id"                : "0e60cc5159bc2d8ed6a05bc7707272590466eb18",
        "private_key"                   : "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDIII2TU87qy64L\nGeFk9HIxbykNzg/exVXXQKs5g93Ks5HusvFWqb0edu0ymibbbQIKQ4Y7R1egVzqO\n7bh7uaNuXkjIS9tloBfVpc9tw2aR2HXCbEvyKj7Kaqr5VJPATSRKoTWAGb0gG87v\nuiA5Wddc3HtqAYNa9/Dl9RtfGWdVsquJrAz+Y8YPcv5Ay/Bo4Yxiv/8jKwMWEFjj\nswht3ehX6Vpt0bKQdquhaud7GFONNriFWIbBLqfWNLi8AbjxwbJpCaVZ+PyrbYzB\n7mp2bw0RNz7iEkF/Xg+Nxkrb5gKNMA7fRJXEBCOCojgIY4o9mpblOqyG7yunfCpz\nz2Xd3z8BAgMBAAECggEAGiu6TUA8zehRhp1yzptHl6lcFV8TejlqJAUOny3cbOvr\nXetus2ZCbLUhXb2vmSr52lJsP7JGW5nXTDuless9pmrpWlrOgngGGz1cu+joBT3p\nCxd9yFm37mE2ofZqf/pWkEqL+Yg5evUdVwI1wT+Qx1GvSJ88CJhl8LHgoMtsqlXA\n3erXR1SjkunATv1619WJVVB60cInydCH2FHWVkhY4SrP470x0Mx0N6ZacJ+lCZn9\nH5YgtrnfPtLNFT0Xn9PL5FgCj3TKD/0GYwtB/VeK4ikcmLi47POKggc0Djl5smLE\nVPFV+eDi8aGMOjlA2p52AhruNmCXfGuGdui6TCObJQKBgQDvObtqu6m5FHrjUi4h\n0LiyI7mDhLytkpouO3UGt7oZGl6LMzU3y2ifNzacA8SuCHWkx/QVePJ0g5GWtXWE\nW8jHOCJ+rWTMFtSBj1tU8DSu+WZFmdMW95L5CjUOEeko7fj5VBGW0oB3FUHj2UE6\nUDatIiNkgEYbx5uBFJEOeuHGKwKBgQDWKPpJPdIMrNQGZh1ZV+WW0rDPcsBK0h73\nBor5J61UEav0Pe8vMAr7N2CmV8BJIbuW0v29IzztnTt+vgv5u8GB5LTNYJkLDMOg\nuiW6LCSD+kjU00Y8br927caGHkQu4uruzOoLbEGa96l0vWSNe/ZwYaKlxTM6HvlC\nKBOzNmgFgwKBgA7BFsgMbvlVRAcFKIc5YkrKXUS5SRHDevLjA+K4LigiMjaPn/ai\n+v7m3t1cdiLtrqPNGUbBwOJiwvXylx7ksktnMOlzNEZKGi0rdEyWzAkGpMIiLJy8\nBDqL4J3PiPvXQYXPI46TyQyPKRMucRFxpQ2kj15BcxF/jB238QJdndMlAoGAWPzu\nA0EM5vdpor8LsvQzEli533lvLafh9gNh++Xgv+4X5YVWveTYq0p3fqc33yuFJ0bE\n6LKbvqB2+FM/5qV94tuFxVE+RrknEMJIqvNsuOpnGQgxRys9o81pkJFDA7iGpnO/\nTL/PAvWmFDwebCv2Wvw2+WrXvm7gY/0DMpSI5MECgYAYXO6Eh/YDSBUAwD+g622V\n0SqkKCQxIBUn7CXdO26QS3UdfM0kKFpXSN44HJB7l7h000EJDsDPenjwLe3ARBji\n8GpxJ7ZiW8V8vTbGYn/UzOAGa+3kC+K47GBsNt6wbwrZTlsxOcUkQXQxjwfV28S7\nbamT6MexJjUCv8I2mANlsg==\n-----END PRIVATE KEY-----\n",
        "client_email"                  : "firebase-adminsdk-h10oe@glimpsters-16e83.iam.gserviceaccount.com",
        "client_id"                     : "101480015761093498777",
        "auth_uri"                      : "https://accounts.google.com/o/oauth2/auth",
        "token_uri"                     : "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url"   : "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url"          : "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-h10oe%40glimpsters-16e83.iam.gserviceaccount.com",
        "universe_domain"               : "googleapis.com"
    },
    FCM = new fcm(firebaseConfig);

let notification = {}


/**
* This function is using to send Fcm Notification 
* @param     :  
* @returns   : 
* @developer : Dushyant Sharma
*/
notification.sendNotification = async  (req, res) => {
    console.log('asddadadasdadasdad=======>>>>>>>',req.body)
    const notificationObj = {
        registration_ids          : ['fIkX-1mPSSKJrQrU8ph127:APA91bGSF7WgBBzb3gU0zH1uQgzcI30YUGttW3Vx68uUO5OwFUC-26mCc-SZvx232y5PoLQADQAink6dzFLvOjGEbZG0kPau0dE_ZzN1ErXduQD0T2HdtaDWTR6Jw88lKlpLrw-DIOQ5','dZ8dURnjRSm7bZixkHMr94:APA91bEzI-PUe6YAwnHDDU3fQJrjQ64EEi8Rp9nyUMNK_Wei_-aDmM3MEdgFKV3eQco37PqbbBySYFdoX_hCVhBNwIzoEgYKCVMp70y-yYsOlmEqXUU1g1qtMDfdLm4p3tbM9HUpHGs8','cIA5UlkgSkaJ0xA9YOpPiw:APA91bE2eMqRIeroTIjE2pfjJCwL1gCvMlZFU7NHKLOCeXL7cj2SkUg3wAtuzpoJHKHGpQUsfYVWAIohr2hxZ0UeC-wenrVO-VhglP-nSOQ_TF2m3ifibwjDpjwk8gKsEA7p187T1LUB'],
        notification: {
            title: 'New Message',
            body: 'You have received a new message.',
            score           : '850',
            image_url: 'https://boomceleb.com/front/theme/img/logo_black.png',
            user_name: 'John Doe',
          },
          data: {
            score           : '850',
            image_url: 'https://boomceleb.com/front/theme/img/logo_black.png',
            user_name: 'John Doe',
          },
    };
    // notificationObj.registration_ids = req.body.devidceTokens;
    let devidceTokens  = [req.body.devidceTokens]
    let send = await notification.sendFcmNotification(notificationObj,devidceTokens);
    if( send ){
        res.send('done')
    }
}




/**
* This function is using to send Fcm Notification 
* @param     :  
* @returns   : 
* @developer : Dushyant Sharma
*/
notification.sendFcmNotification = async  (messageObj, devidceTokens) => {
   
     
    if ( devidceTokens && typeof( devidceTokens ) == 'object' && devidceTokens.length > 0 ) {

        FCM.send( messageObj, function(err, response) {

            if ( err ) {
                console.log('sendFcmNotification ==============>>>>>>>>>>> 111111111',err);
    
                return false;
            } else {
                // console.log('sendFcmNotification ==============>>>>>>>>>>> 2222222222',response);
                // console.log('sendFcmNotification ==============>>>>>>>>>>> 3333333333333',response.results);
                return true;
            }
        });
    

    } else {
      

        FCM.send( messageObj, function(err, response) {

            if ( err ) {
                console.log('sendFcmNotification ==============>>>>>>>>>>> else  111111111',err);
    
                return false;
            } else {
                // console.log('sendFcmNotification ==============>>>>>>>>>>> else  22222222',response);
    
                // console.log('sendFcmNotification ==============>>>>>>>>>>> else 33333333333',response.results);
                // console.log('sendFcmNotification ==============>>>>>>>>>>> else 4444444444',response.results.error);
    
    
                return true;
            }
        });
    

    }
}


/**
 * Used to insert data into notifications table.
 * @developer   : Dushyant Sharma
 * @modified    :
 */
notification.insertNotifications = async function (data, userId, receiverId) {
    // console.log('We are hear ===================>>>>>>>insertNotifications',data);
    let deferred = q.defer();
    if ( data && Object.keys(data).length > 0 && userId && receiverId ) {

        let message = '',
        type        = '',
        referenceId = '',
        title       = '';

        if ( data ) {

            if ( data.message ) {
                message = data.message;
            }

            if ( data.title ) {
                title = data.title;
            }
            if( data.type ){
                type = data.type;
            }
            if( data.referenceId ){
                referenceId = data.referenceId;
            }

        }

        if ( message && title ) {

            let notiuuid = uuidv1(Date.now()),
                post     = {
                    un_fk_u_id           : userId,
                    un_uuid              : notiuuid,
                    un_message           : message,
                    un_title             : title,
                    un_type              : type,
                    un_fk_reference_id   : referenceId,
                    un_fk_receiver_u_id  : receiverId,
                };
            let insertId = common.insert('user_notifications', post);
                // console.log('We are hear ===================>>>>>>>insertId',insertId);
            if ( insertId ) {
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
 * Used to insert data into notifications table.
 * @developer   : Dushyant Sharma
 * @modified    :
 */

notification.updateSeenCount = async (req, res) => {

    let userId      = await helper.getUUIDByTocken(req);

    if(userId){

        if ( req ) {

            let sql  = "UPDATE user_notifications SET un_isseen = ? WHERE un_fk_receiver_u_id = ? ",
            result   = await commonModel.commonSqlQuery(sql,['1',userId]);

            if(result ){
                helper.successHandler(res, {
					message: 'Operation performed successfully',
					status  : true,
					// payload : updateAddress
				}, 200);
        
            } else {

                helper.successHandler(res, {
					status  : false,
					message : 'Something went wrong.'
				}, 200);
        
            }

        } else {

            let obj = {
                status  : false,
                message : 'Please fill mandatory fields.',
                code    : 'CCS-E1002'
            }
            helper.successHandler(res, obj, 200);

        }

    }else {

        helper.errorHandler(res, {
            status  : false,
            message : 'Unauthorized Error',
            code    : 'KE-TU003'
        }, 401);

    }

}

    


module.exports = notification;