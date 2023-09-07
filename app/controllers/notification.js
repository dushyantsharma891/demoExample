


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
        "project_id"                    : "example-16e83",
        "private_key_id"                : "0e60cc5159bc2d8ed6a05bc7707272590466eb18",
        "private_key"                   : "-----BEGIN PRIVATE KEY-----\example\n-----END PRIVATE KEY-----\n",
        "client_email"                  : "firebase-adminsdk-h10oe@example-16e83.iam.gserviceaccount.com",
        "client_id"                     : "101480015761093498777",
        "auth_uri"                      : "https://accounts.google.com/o/oauth2/auth",
        "token_uri"                     : "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url"   : "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url"          : "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-h10oe%40example-16e83.iam.gserviceaccount.com",
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