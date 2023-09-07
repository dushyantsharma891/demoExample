


const q 			= require('q'),
fs 				 	= require('fs'),
path 				= require('path'),
AWS                 = require('aws-sdk'),
Busboy 				= require('busboy'),
common              = require('../models/configCommon'),
helper   		    = require('../../configCommon/helpers'),
constant            = require('../../configCommon/config/constants'),
config				= require('../../configCommon/config').init(),
axios               = require("axios"),
notificationObj     = require('./notification'),
liveBroadcastModel  =  require('../models/live_broadcast_model');

let liveBroadcast      = {};

/**
* Used to channel broadcast Video.
* @developer   : Dushyant Sharma
* @modified    :
* @params      :
*/

liveBroadcast.liveBroadcast = async  (req, res) => {

    console.log('body body  body  body  body liveBroadcast ===========>>',req.body);

    let userId  = await helper.getUUIDByTocken(req),
    conObj      = await constant.getConstant(),
    startData   = null;

    if (userId) {

        let userUuid = await common.getRowId(userId,'u_id','u_uuid','user');

        if( req.body && req.body.contestUuid ){
             
            let contestId  =  await common.getRowId(req.body.contestUuid,'ct_uuid','ct_id', 'contests');

            if( req.body.status == 'CHECK' ){

                let insertedId = await liveBroadcastModel.insertJoinBroadcast(req.body,userId)

                if( insertedId ){
                    let isPublisher = '';
                    if( req.body.isPublisher ){
                        isPublisher = req.body.isPublisher;
                    } 
                   
                    let broadcastSql   = `SELECT u_name AS broadcasterName,u_image AS broadcasterImage, u_uuid AS broadcasterUuid,lb_id, lb_uuid,lb_views_count,lb_comments_count  FROM live_broadcast LEFT JOIN user ON lb_fk_u_uuid = u_uuid WHERE lb_fk_ct_uuid = ? AND lb_status = 'LIVE'`; 
                        broadcastUid   = await common.commonSqlQuery( broadcastSql, [ req.body.contestUuid ],true ),
                        streamId       = await common.getRowId(broadcastUid[0].lb_id,'lb_id','lb_uuid','live_broadcast'),
                        agoraToken     =  helper.agoraToken({channelId : streamId, uid:userId,isPublisher : isPublisher});
                        console.log('streamId streamId streamId streamId',streamId,agoraToken)

                    if( agoraToken ){
                

                        let    userTypeSql       = 'SELECT lbud.lbud_user_type AS userType FROM live_broadcast_users_detail as lbud WHERE lbud.lbud_fk_ch_uuid = ? AND lbud.lbud_fk_lb_uuid = ? AND lbud_fk_u_uuid = ? ',
                        userType      = await common.commonSqlQuery(userTypeSql,[req.body.contestUuid,streamId,userUuid] )
                        userBroadcastType = '';

                        if( userType && userType.length > 0 ){

                            userBroadcastType =  userType[0].userType

                        }

                    

                        if(broadcastUid[0].broadcasterImage ){
    
                            broadcastUid[0].broadcasterImage  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + broadcastUid[0].broadcasterImage;
            
                        }
                        let requestSql = 'SELECT ctbv_request_live FROM contest_broadcast_viewers  WHERE ctbv_fk_ct_uuid = ?   AND ctbv_fk_u_uuid = ?'
                        let requestData    = await common.commonSqlQuery( requestSql, [ req.body.contestUuid, userUuid ],true );
                        let requestStatus = false;
                        let joinedUserSql = 'SELECT ctbv_fk_u_uuid , u_name , u_image FROM contest_broadcast_viewers LEFT JOIN  user ON user.u_uuid = ctbv_fk_u_uuid  WHERE ctbv_fk_ct_uuid = ?   AND ctbv_request_live = "A"'
                        let joinedUserDataArray    = await common.commonSqlQuery( joinedUserSql, [ req.body.contestUuid ],true );
                        console.log('dasdasdasdasdasdadasdaadasaa===========================>>>>>>>>>>>',joinedUserDataArray);
                           let  joinedUserData   = [];
                            
                            if( joinedUserDataArray &&  joinedUserDataArray.length > 0 ){
                    
                    
                                for( let resOne of joinedUserDataArray ){
                    
                                    if( resOne.u_image ){
                    
                                                    
                                        resOne.u_image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + resOne.u_image;
                                    }     
                                }
                    
                                joinedUserDataArray.unshift({u_name : broadcastUid[0].broadcasterName, u_image : broadcastUid[0].broadcasterImage });

                    
                            joinedUserData   = joinedUserDataArray;
                    
                            } else {

                                joinedUserData   = [];

                            }

                            console.log('dasdasdasdasdasdadasdaadasaa===========================>>>>>>>>>>>',joinedUserDataArray);


                        if( requestData && requestData.length > 0 ){

                            if( requestData[0].ctbv_request_live == 'P' ){
                                requestStatus = true
                            }

                        }
        
                        let data = {
                            agoraToken            : agoraToken.token,
                            agoraUid              : agoraToken.uid,
                            channelBroadcastName  : agoraToken.channelName,
                            role                  : agoraToken.role,
                            userType              : userBroadcastType,
                            liveViewCount         : broadcastUid[0].lb_views_count,
                            liveCommentCount      : broadcastUid[0].lb_comments_count,
                            broadcasterName       : broadcastUid[0].broadcasterName,
                            broadcasterUuid       : broadcastUid[0].broadcasterUuid,
                            broadcasterImage      : broadcastUid[0].broadcasterImage,
                            requestStatus         : requestStatus,
                            isPublisher           : req.body.isPublisher,
                            broadcastUuid         : streamId,
                            startData             : startData,
                            joinedUserData        : joinedUserData,
                        }

                        console.log('liveToken liveTokenliveToken',data)

                        let obj = {
                            status  : true,
                            message : "Someone is Live",
                            payload : data
                        };
                        helper.successHandler(res, obj, 200);
                        
                    } else {

                        let obj = {
                            status  : false,
                            message : "Something Went Wrong",
                            payload : {}
                        };
                        helper.successHandler(res, obj, 200);
                    }

                } else {
                    console.log('Something Went Wrong...1111111111111111111111111')
                    let obj = {
                        status  : false,
                        message : "Something Went Wrong...",
                        payload : {}
                    };
                    helper.successHandler(res, obj, 200);

                }
                 
            } else {

                let memberDeviceToken = []; 
                let insertedId = await liveBroadcastModel.insertContestBroadcast(req.body,userId);

                if( insertedId ){

                    let isPublisher = '';
                    if( req.body.isPublisher ){
                        isPublisher = req.body.isPublisher;
                    } 

                    let streamId     = await common.getRowId(insertedId,'lb_id','lb_uuid','live_broadcast');
                    let agoraToken   =  helper.agoraToken({channelId : streamId,uid:userId,isPublisher:isPublisher});

                    if ( agoraToken ) {

                        let recordToken  = helper.agoraToken( {  channelId : streamId } );

                        if ( recordToken && recordToken != null ) {

                            startData = await liveBroadcastModel.recordingAcquire( { token : recordToken.token, contestUuid : streamId } );

                        }
                        
                        let sql           = 'SELECT lb_views_count,lb_comments_count  FROM live_broadcast WHERE lb_id = ?';

                            broadcastData = await common.commonSqlQuery(sql,[insertedId]);
            
                        let userTypeSql       = 'SELECT lbud.lbud_user_type AS userType FROM live_broadcast_users_detail as lbud WHERE lbud.lbud_fk_ct_uuid = ? AND lbud.lbud_fk_lb_uuid = ? AND lbud_fk_u_uuid = ? ',
                        userType      = await common.commonSqlQuery(userTypeSql,[req.body.contestUuid,streamId,userUuid] )
                        userBroadcastType = '';

                        if( userType && userType.length > 0 ){

                            userBroadcastType =  userType[0].userType

                        }
                        let updatedLiveInContest = await common.updateContestLive(req.body.contestUuid,'L');
                        
                        let broadcastSql   = `SELECT u_name AS broadcasterName,u_image AS broadcasterImage, u_uuid AS broadcasterUuid,lb_id, lb_uuid,lb_views_count,lb_comments_count  FROM live_broadcast LEFT JOIN user ON lb_fk_u_uuid = u_uuid WHERE lb_fk_ct_uuid = ? AND lb_status = 'LIVE'`; 
                        broadcastUid   = await common.commonSqlQuery( broadcastSql, [ req.body.contestUuid ],true );

                        if(broadcastUid[0].broadcasterImage ){
    
                            broadcastUid[0].broadcasterImage  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + broadcastUid[0].broadcasterImage;
            
                        }
                        let joinedUserSql = 'SELECT ctbv_fk_u_uuid , u_name , u_image,u_id FROM contest_broadcast_viewers LEFT JOIN  user ON user.u_uuid = ctbv_fk_u_uuid  WHERE ctbv_fk_ct_uuid = ?   AND ctbv_request_live = "A"'
                        let joinedUserDataArray    = await common.commonSqlQuery( joinedUserSql, [ req.body.contestUuid ],true );
                        console.log('dasdasdasdasdasdadasdaadasaa===========================>>>>>>>>>>>',joinedUserDataArray);
                           let  joinedUserData   = [];

                            if( joinedUserDataArray &&  joinedUserDataArray.length > 0 ){


                                for( let resOne of joinedUserDataArray ){
                    
                                    if( resOne.u_image ){
                    
                                                    
                                        resOne.u_image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + resOne.u_image;
                                    }
                                

    
                                }
                                joinedUserDataArray.unshift({u_name : broadcastUid[0].broadcasterName, u_image : broadcastUid[0].broadcasterImage });

                                joinedUserData   = joinedUserDataArray;
                    
                            } else {

                                joinedUserData   = [];

                            }
                            let contestName    = await common.getRowId( req.body.contestUuid,'ct_uuid','ct_name','contests');
                            let contestId    = await common.getRowId( req.body.contestUuid,'ct_uuid','ct_id','contests');
                            let joinedContestUserData = await common.getAll(contestId,'ctv_fk_ct_id','contest_viewers','ctv_id,ctv_fk_u_id');
                            console.log('joinedContestUserData==========>>>>>>>>',joinedContestUserData);
                            if( joinedContestUserData && joinedContestUserData.length > 0){

                                for( let joinedContestUserId of joinedContestUserData ){

                                    let deviceTokenData = await common.getUserDeviceTokens(joinedContestUserId.ctv_fk_u_id);

                                    if( deviceTokenData && deviceTokenData.length > 0){

                                        for ( let i = 0; i < deviceTokenData.length; i++ ) {
                                            memberDeviceToken.push(deviceTokenData[i].ud_token);
                                        }

                                        console.log('deviceTokenData=====>>>>>>>>>>>3333333',deviceTokenData);
                                        let messageData = broadcastUid[0].broadcasterName + ' starting broadcasting in ' + contestName + '.' ;

                                        const notificationObjData = {
                                            registration_ids          : memberDeviceToken,
                                            notification: {
                                                title: 'Live Broadcast',
                                                body:  messageData,
                                                user_name:  broadcastUid[0].broadcasterName,
                                                image_url:  broadcastUid[0].broadcasterImage,
                                            },
                                            data: {
                                                score           : '850',
                                                image_url:  broadcastUid[0].broadcasterImage,
                                                user_name: broadcastUid[0].broadcasterName,
                                                title: 'Live Broadcast',
                                                body:  messageData,
                                            },
                                        };
                    
                                        let sendNotification = notificationObj.sendFcmNotification(notificationObjData,deviceTokenData);
                                    }

                                }
                            }
                            
                                console.log('joinedUserData==============================>>>>>>>>>>',joinedUserData);
                        let data = {
                            agoraToken            : agoraToken.token,
                            agoraUid              : agoraToken.uid,
                            channelBroadcastName  : agoraToken.channelName,
                            role                  : agoraToken.role,
                            userType              : userBroadcastType,
                            liveViewCount         : broadcastData[0].lb_views_count,
                            liveCommentCount      : broadcastData[0].lb_comments_count,
                            broadcasterName       : broadcastUid[0].broadcasterName,
                            broadcasterUuid       : broadcastUid[0].broadcasterUuid,
                            broadcasterImage      : broadcastUid[0].broadcasterImage,
                            requestStatus         : false,
                            isPublisher           : req.body.isPublisher,
                            broadcastUuid         : streamId,
                            startData             : startData,
                            joinedUserData        : joinedUserData,

                        };
                        // console.log('liveBroadcastVideoAudio ===========>>44444444444444444',data)
        
                        let obj = {
                            status: true,
                            message: "Operation Perform successfully",
                            payload : data
                        };

                        helper.successHandler(res, obj, 200);

                    } else {

                        let obj = {
                            status: false,
                            message: "Something went wrong",
                            code: 'CHB-E10013'
                        };
                        helper.errorHandler(res, obj, 200);
                    }

                } else {
                    let obj = {
                        status: false,
                        message: "Something went wrong",
                        code: 'CHB-E10013'
                    };
                    helper.errorHandler(res, obj, 200);
                }
            }
        } else {

            let obj = {
                status: false,
                message: "All fields are required",
                code: 'CHB-E10013'
            };
            helper.errorHandler(res, obj, 200);
        }

    } else {

        let obj = {
            status: false,
            code: "CCS-E1000",
            message: "Unauthorized Error."
        };
        helper.errorHandler(res, obj, 401);
    }
}


/**
 * This function is used to stop Channel Broadcast.
 * @param     : contestUuid, sid, resource, mode
 * @returns   :
 * @developer : 
 */
 liveBroadcast.stopLiveBroadcast = async function(req, res) {

    console.log('req.body 11111111 ================================111111======= >>>> ', req.body );

    let userId          = await helper.getUUIDByTocken(req);

    if ( req && req.body && req.body.broadcastUuid && req.body.sid && req.body.resourceId && req.body.mode ) {

        let stopBroadcast = await liveBroadcastModel.stopLiveBroadcast( req.body, userId );

        if ( stopBroadcast && stopBroadcast != false ) {

            helper.successHandler( res, {});

        } else {

            helper.errorHandler( res, {
                status : false
            });
        }

    } else {
        
        helper.successHandler(res, {
            
            status      : false,
            code 	    : "UELS-E1002",
            message		: "All fields are mandatory."

        });
    }
}

/**
* This function is using to check Some one is live or not
* @param     	: 
* @developer 	: 
* @modified	    : 
*/
liveBroadcast.checkLiveOrNot = async (req, res) => {

    let userId = await helper.getUUIDByTocken(req);
    
    if ( userId && userId != '' ) {
    
        if ( req && req.body && req.body.contestUuid ) {

            let result = await liveBroadcastModel.checkLiveOrNot(req.body,userId);

            if(result && result != ''){

                helper.successHandler(res, {
    
                    status 	: result.status,
                    message : result.message,
                    code    : result.code ? result.code : 'AAA-0001',
                    payload : result.data
                }, 200);


            } else {

                helper.errorHandler(res, {
    
                    status 	: false,
                    code 	: 'AAA-E1002',
                    message : 'Something went wrong.'
                }, 200);

            }
              
        } else {
    
            helper.errorHandler(res, {
    
                status 	: false,
                code 	: 'AAA-E1002',
                message : 'Something went wrong.'
            }, 200);
        };
    } else {
        
        helper.errorHandler(res, {
            status 		: false,
            code        : "AAA-E1001",
            message		: "Unauthorized Error."
        }, 200);
    };
};

/**
* This function is using to stop Broadcast
* @param     : userUuid 
* @returns   : 
* @developer : 
*/
liveBroadcast.stopBroadcast = async ( req , res ) => {

    let userId = await helper.getUUIDByTocken( req ); 

    console.log('req.body=============1=1=1===1=1', req.body );

    if ( userId ) {

        if( req.body && req.body.contestUuid && req.body.broadcastUuid ){

            let result =  await liveBroadcastModel.stopBroadcast(req.body);
            // console.log('result result result result',result)
            if( result ){

                let updatedLiveInContest = await common.updateContestLive(req.body.contestUuid,'C');

                if( updatedLiveInContest ){

                    let  resultOne  = await liveBroadcastModel.stopLiveBroadcast({ contestUuid : req.body.contestUuid, broadcastUuid : req.body.broadcastUuid, resourceId : req.body.resource, sid : req.body.sid });
                        console.log('resultOne resultOne resultOne',resultOne);

                    let obj = {
                        status 		: false,
                        code        : "UELS-E1003",
                        message		: "Leave Successfully",
                        payload     : { contestEnd : 'COMPLETE'}
                    };
            
                    helper.successHandler(res, obj, 200); 
    

                }
                
            } else {

                let obj = {
                    status 		: false,
                    code        : "UELS-E1003",
                    message		: "Something went wrong"
                };
        
                helper.successHandler(res, obj, 401); 

            }

        } else {

            let obj = {
                status 		: false,
                code        : "UELS-E1003",
                message		: "All fields are required."
            };
    
            helper.successHandler(res, obj, 401); 

        }
    } else {

        let obj = {
            status 		: false,
            code        : "UELS-E1003",
            message		: "Unauthorized Error."
        };

        helper.successHandler(res, obj, 401);  

    }

}

/**
* This function is using to stop Broadcast
* @param     : userUuid 
* @returns   : 
* @developer : 
*/
// only testing 
liveBroadcast.insertViewerData = async ( req , res ) => {

    let updatedLiveInContest = await liveBroadcastModel.insertViewerData(req.body.userId, req.body.contestId);

    if( updatedLiveInContest && updatedLiveInContest != ''){

        helper.successHandler(res, {
            message : 'Done.'
        }, 200);


    } else {

        helper.errorHandler(res, {

            status 	: false,
            code 	: 'AAA-E1002',
            message : 'Something went wrong.'
        }, 200);

    }

}


module.exports = liveBroadcast;
