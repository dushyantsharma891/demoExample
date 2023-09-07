

const q             = require('q'), 
    chatObj         = {},
    helper          = require('../../../configCommon/helper'),
    constant        = require('../../../configCommon/config/constants'),
    chatModel       = require('../models/chat_model'),
    socket_constant = require('../../../configCommon/config/socket_constant'),
    constant_action = socket_constant.ACTION_TYPES,
    notificationObj = require('../../../app/controllers/notification'),
    appCommonModel  = require('../../../app/models/configCommon'),
    commonModel     = require('../models/common_model');



/**
 * 
 * @param: 
 * @returns:
 * @developer :  
 */
 chatObj.conRoomJoinLeave = async function(socket, data) {
    console.log('We are hear ===================>>>>>>>conRoomJoinLeave2222222',data);
    /**TODO 
     * Need to update in user IN CALL STATUS */
    let returnObj = helper.emitDataObj('ERROR');
    if ( data && data.converstionUuId ) {  
        if ( data.requestFor ) {
            if (data.requestFor == 'JOIN') {
                socket.join(data.converstionUuId);
                console.log('We are hear ===================>>>>>>>join');
            } else {
                console.log('We are hear ===================>>>>>>>leave');

                socket.leave(data.converstionUuId);
            }

        }
        returnObj = helper.emitDataObj('CON-ROOM-JOIN-LEAVE', data, [], true);

    }
    return returnObj;
}

/**
 * 
 * @param     : 
 * @returns   :
 * @developer :  
 */
 chatObj.oneToOneMessage = async function(socket, data) {
    // console.log('oneToOneMessageoneToOneMessageoneToOneMessage213456789008765432324567',data);
    let returnObj = helper.emitDataObj('ERROR');
    if (data && data.conUuid && data.receiverUuid) {
        
        let conObj = await constant.getConstant();
        let imagePath = conObj.SITE_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH;
        if (data) {
            // console.log('We are hear ===================>>>>>>>oneToOneMessage',data);
            let saveChat = await chatModel.saveOneToOneChat(data);

            if (saveChat && saveChat.length > 0) {

                saveChat[0].message          =  data.message  ;
                saveChat[0].mySocketId       =  data.mySocketId;
                saveChat[0].converstionUuId  =  data.conUuid;
                saveChat[0].SenderuserUuid   =  data.userUuid;
                // saveChat[0].fileArry         = [];
                saveChat[0].type             = data.type;
                saveChat[0].receiverUuid     = data.receiverUuid ;

                // console.log('controllwer saveChat 2345678876543214567876543',saveChat[0])
                let userId   = await commonModel.getRowId(data.receiverUuid,'u_uuid','u_id','user');
                let senderId  = await commonModel.getRowId(data.userUuid,'u_uuid','u_id','user');
                let userName = await commonModel.getRowId(data.userUuid,'u_uuid','u_name','user');
                let userImage = await commonModel.getRowId(data.userUuid,'u_uuid','u_image','user');
                userImage  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + userImage;
                let messageData = 'New message from ' + userName;

                let insertData = {
                        type    : 'C',
                        message : data.message,
                        title   : messageData,
                        referenceId : data.conUuid
                    };
                    let insertNotificationData = await notificationObj.insertNotifications(insertData, senderId , userId);
                    if( insertNotificationData ){
                        
                        let sql = `SELECT uc_socket_id FROM user_connections WHERE uc_fk_u_uuid = ?`,
                        toSocketId  = await commonModel.commonSqlQuery(sql,[data.receiverUuid]);
                        let getUnseenNotCount = await appCommonModel.getUnseenNotCount(userId, '1');
                        let sendObj = { 
                            action : 'SEND-NOTIFICATION-COUNT', 
                            data   : {
                                chatNotificationCount : (getUnseenNotCount && getUnseenNotCount != '') ? getUnseenNotCount : '0',
                                userUuid                : data.receiverUuid,
                                mySocketId              : toSocketId,
                                userId                  : userId
        
                            }
                        };
                
                        for ( var i = 0; i < toSocketId.length ; i++ ) {
        
                            io.to(toSocketId[i].uc_socket_id).emit('call' , sendObj);
                        
                        }
                    }

                let deviceTokenData = await commonModel.getUserDeviceTokens(userId);
                // console.log('deviceTokenData=====>>>>>>>>>>>222222',deviceTokenData);
               
                if( deviceTokenData && deviceTokenData.length > 0 ){

                    let memberDeviceToken = [];

                    for ( let i = 0; i < deviceTokenData.length; i++ ) {
                        memberDeviceToken.push(deviceTokenData[i].ud_token);
                    }

                    // console.log('deviceTokenData=====>>>>>>>>>>>3333333',deviceTokenData);
                    const notificationObjData = {
                        registration_ids          : memberDeviceToken,
                        notification: {
                            title: messageData,
                            body: (data.isPrivateChat && data.isPrivateChat == '1') ? '**********' : data.message ,
                            user_name: userName,
                            image_url: userImage,
                          },
                          data: {
                            score           : '850',
                            image_url       : userImage,
                            type            : 'C',
                            user_name       : userName,
                            title           : messageData,
                            body            : (data.isPrivateChat && data.isPrivateChat == '1') ? '**********' : data.message ,
                          },
                    };
                    let insertData = {
                        type        : 'C',
                        message     : data.message,
                        title       : messageData,
                        referenceId : data.conUuid
                    };
                    if( insertNotificationData ){
                        let sendNotification = notificationObj.sendFcmNotification(notificationObjData,deviceTokenData);
                    }
                    // console.log('deviceToken==============>>>>>>>>>',deviceTokenData);
                }
                let toSocketIds = [{ uc_socket_id: data.conUuid }];
                returnObj = helper.emitDataObj('CON-MESSAGE', saveChat[0], toSocketIds , true);
            }

        }
    }
    return returnObj;
}

/**
 * 
 * @param     : 
 * @returns   :
 * @developer :  
 */
chatObj.conPrivateChatMessage = async function(socket, data) {
    let returnObj = helper.emitDataObj('ERROR');

        if (data) {
            console.log('We are hear ===================>>>>>>>oneToOneMessage',data);
            let socketData = {
                mySocketId       :  data.mySocketId,
                converstionUuId  :  data.converstionUuId,
                type             :  data.type,
                otherUserUuId    :  data.otherUserUuId
            };
                
                console.log('controllwer saveChat 2345678876543214567876543',socketData)

                let toSocketIds = [{ uc_socket_id: data.conUuid }];
                returnObj = helper.emitDataObj('PRIVATE-MESSAGE', socketData, toSocketIds , true);
            // }

        }
    // }
    return returnObj;
}

/**
 * 
 * @param     : 
 * @returns   :
 * @developer :  
 */
chatObj.conTypingMessage = async function(socket, data) {
    let returnObj = helper.emitDataObj('ERROR');
        if (data) {
            console.log('We are hear ===================>>>>>>>oneToOneMessage',data);

            let toSocketIds = [{ uc_socket_id: data.conUuid }];
            returnObj = helper.emitDataObj('TYPING-MESSAGE', data, toSocketIds , true);
        }
    return returnObj;
}



/**
 * 
 * @param     : 
 * @returns   :
 * @developer :  
 */
chatObj.sendNotificationCount = async function(socket, data) {
    let returnObj = helper.emitDataObj('ERROR');

        if (data) {
            console.log('We are hear ===================>>>>>>>sendNotificationCount',data);
            let getUnseenNotCount = await appCommonModel.getUnseenNotCount(data.userId, '1');
            let socketData = {
                // mySocketId            :  data.mySocketId,
                chatNotificationCount : (getUnseenNotCount && getUnseenNotCount != '') ? getUnseenNotCount : '0',
                userId                : data.userId
            };
            
            let toSocketIds = [{ uc_socket_id: data.mySocketId }];
            returnObj = helper.emitDataObj('SEND-NOTIFICATION-COUNT', socketData, toSocketIds , true);
            // }

        }
    // }
    return returnObj;
}


/**
 * @developer : 
 * @modified  : 
 */
 chatObj.newMessageReceive = async function ( data ) {
    let returnObj = '';

    if ( data && data.recUserUuId  ) {
        let toSocketIds = await chatObj.getUserSocketIds( data.recUserUuId );

        if ( toSocketIds && toSocketIds.length > 0) { 

            returnObj = await helper.emitDataObj('NEW-MESSAGE' ,  {} , toSocketIds , true  );
                          
        }
    }
    return returnObj;
}

chatObj.getUserSocketIds = async function( userId , ownId = false ) {
    let userSocketIds = [];
    if ( userId && userId != '' ) {
        userSocketIds =  await commonModel.getUserSocketId( userId , ownId);
    }
    return await userSocketIds;
}


// /**
//  * 
//  * @param: 
//  * @returns:
//  * @developer :  
//  */
//  chatObj.onMessage = async function(data){

//     let returnObj = helper.emitDataObj('ERROR');
//     if ( data && data.meetingId ) {
//         let conObj    = await constant.getConstant(); 
//         let imagePath = conObj.SITE_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH;
//         if ( data ) {
            
//             let saveChat = await chatModel.saveChat(data);
            
//             if ( saveChat ) {

//                 let toSocketIds    = '';
//                 let unseenChatData = '';

//                 if ( data.type && data.type == 'Group-chat' ) {
                    
//                     //console.log('!!!!!1111111111111');
//                     if ( data.meetingType == "course") {
//                         let sessionData    = await commonModel.getRowIdAll( data.sessionId , 'cs_id' , 'course_sessions') ;
//                         toSocketIds     = [ {uc_socket_id : sessionData.cs_uuid} ];
//                     } else {
//                         toSocketIds     = [ {uc_socket_id : data.meetingId} ];
//                     }
                    
//                     unseenChatData  = await chatModel.getUnseenGroupChatMessage(data);
//                 } else {
//                     //console.log('!!!!!1222222222222');
//                     data.messageTo      = data.to;
//                     unseenChatData = await chatObj.getUnseenChatMessage(data);
//                     toSocketIds    = await commonModel.getUserBusySocketId(data.to , data.meetingId);
//                     // if ( data.meetingType == 'course' && data.sessionId != '') {
//                     //     let sessionData    = await commonModel.getRowIdAll( data.sessionId , 'cs_id' , 'course_sessions') ;  
//                     //         toSocketIds    = await commonModel.getUserBusySocketId(data.to , sessionData.cs_uuid);
//                     // } else {
//                     //     toSocketIds    = await commonModel.getUserBusySocketId(data.to , data.meetingId);
//                     // }
//                     if ( data.type && data.type == 'Chat' && data.meetingType == 'meeting') {
//                         toSocketIds     = [ {uc_socket_id : data.meetingId} ];
//                     }
//                 }
//                     //console.log(toSocketIds , 'MESSAGE TOOOOO');
//                     let senderData      = await commonModel.getRowIdAll( data.userUuid , 'u_uuid' , 'user' , 'u_name , u_image') ;
//                     let sendData = { 
//                         message: data.massage , 
//                         from : data.userUuid , 
//                         chat_unseen_count : unseenChatData ,
//                         from_name  : senderData.u_name,
//                         from_image : imagePath+senderData.u_image,
//                         chat_type  : data.type,
//                         dateTime   : data.dateTime
//                     };
//                     console.log(sendData , 'sendDatasendData');
//                     returnObj = helper.emitDataObj('MESSAGE' , sendData , toSocketIds);
//                     if ( toSocketIds.length == 0 ) {
//                         //console.log('MESSAGE GEYA GGGGGGGGG');
//                         returnObj = false;
//                     }
//             } else {
//                 returnObj = helper.emitDataObj('ERROR' , {message : 'DATA NOT SAVE'});
//             }
//         }
//     }
//         return returnObj;
// }


// /**
//  * 
//  * @param: 
//  * @returns:
//  * @developer : Diksha
//  */
//  chatObj.chatRoomJoinLeave = async function(socket, data) {
//     let returnObj = helper.emitDataObj('ERROR');

//     if ( data && data.groupUuid ) {

//         if ( data.requestFor ) {
//             if ( data.requestFor == 'JOIN' ) {
//                 socket.join(data.groupUuid);
//             } else {
//                 socket.leave(data.groupUuid);
//             }

//         }
//         returnObj = helper.emitDataObj('CHAT-ROOM-JOIN-LEAVE', data, [], true);

//     }
//     return returnObj;
// }

// /**
//  * 
//  * @param: 
//  * @returns:
//  * @developer : 
//  */

// /**
//  * 
//  * @param: 
//  * @returns:
//  * @developer :  
//  */
// chatObj.onHistory = async function(data){
    
//     let returnObj = helper.emitDataObj('ERROR');
//     if ( data && data.meetingId ) {
//         let getHistory = await chatModel.onHistory(data);
//         let sendData = { 
//                 history : '' ,
//                 chat_unseen_count : ''
//             };
//         if ( getHistory ) {
//             let unseenChatData = '';
//             sendData.history = getHistory ;
//             if ( data.meetingType == 'meeting' ) {
//                 sendData.chat_unseen_count = unseenChatData;
//                 unseenChatData = await chatObj.getUnseenChatMessage(data);
//             } else {
                
//                 unseenChatData = await chatModel.getUnseenGroupChatMessage(data);
//                 sendData.chat_unseen_count = unseenChatData;
//                 //console.log( unseenChatData , 'unseenChatDataunseenChatData');
//             }
//         }
//         returnObj = helper.emitDataObj('HISTORY' , sendData);
//     }
//     return returnObj;
// }

// /**
//  * 
//  * @param: 
//  * @returns:
//  * @developer :  
//  */
// chatObj.onChatEnableDisable = async function(data){
    
//     let returnObj = helper.emitDataObj('ERROR');
//     if ( data && data.meetingId ) {
//         let sessionData    = await commonModel.getRowIdAll( data.sessionId , 'cs_id' , 'course_sessions') ;
//         let meetingData  = await commonModel.getRowIdAll( data.meetingId , 'm_uuid' , 'meeting' , ' m_id '),
//             updateStremSql = `UPDATE meeting_user SET mu_chat_status = ?  WHERE mu_fk_m_id = ? `,
//             chatEnableDisable   = await helper.getDataOrCount( updateStremSql , [ data.chatStatus , meetingData.m_id ] , 'U' , true),
//             toSocketIds = [ {uc_socket_id :  sessionData.cs_uuid} ],
//             sendData = { 
//                 chatStatus : '',
//             };    
//         if ( chatEnableDisable ) {
//                 sendData.chatStatus = data.chatStatus ;
//                 returnObj = helper.emitDataObj('GROUP-CHAT-ENABLE-DISABLE' , sendData , toSocketIds );
//         }
//     }
//     return returnObj;
// }

// /**
//  * 
//  * @param: 
//  * @returns:
//  * @developer :  
//  */
// chatObj.onSeenChat = async function(data){
    
//     let returnObj = helper.emitDataObj('ERROR');
//     if ( data && data.meetingId ) {
//         let updateData = await chatObj.updateUnseenChatMessage(data);
//         if ( updateData ) {
//             returnObj = helper.emitDataObj('SEEN-CHAT' , {});
//         }
//     }
//     return returnObj;
// }

// /**
//  * 
//  * @param: 
//  * @returns:
//  * @developer :  
//  */
// chatObj.onSeenGroupChat = async function(data){
    
//     let returnObj = helper.emitDataObj('ERROR');
//     if ( data && data.meetingId ) {
//         let updateData = await chatModel.updateUnseenGroupChatMessage(data);
//         if ( updateData ) {
//             returnObj = helper.emitDataObj('SEEN-GROUP-CHAT' , {});
//         }
//     }
//     return returnObj;
// }

// /**
//  * 
//  * @param: 
//  * @returns:
//  * @developer :  
//  */
// chatObj.onGetAllUnSeenChat = async function(data){
    
//     let returnObj = helper.emitDataObj('ERROR');
//     if ( data && data.meetingId ) {
//         let getCount = await chatModel.getUnseenChatMessage(data);
//         //console.log( getCount ,'getCount');
//         returnObj = helper.emitDataObj('GET-ALL-PARTICIPANTS-UNSEENCOUNT' , { allParticipantsUnseen : getCount } );
//     }
//     return returnObj;
// }


// /**
//  * Used to get chat unseen messages.
//  * @param       : meetingId{string}, userId{int}
//  * @returns     :
//  * @developer   : Anil Guleria
//  */
// chatObj.getUnseenChatMessage = async function(data) {
    
//     let deferred        = q.defer(),
//         chatUnseenCount = 0;
    
//     if ( data ) {
        
//         let unseenChatData  = await chatModel.getUnseenChatMessage(data);
        
//         if ( unseenChatData ) {
//             chatUnseenCount = unseenChatData;
//         }
//     } 
//     deferred.resolve(chatUnseenCount);
//     return deferred.promise;
// }

// /**
//  * Used to update unseen chat messages.
//  * @param       : meetingId{string}, userId{int}
//  * @returns     :
//  * @developer   : Anil Guleria
//  */
// chatObj.updateUnseenChatMessage = async function(data) {
    
//     let deferred        = q.defer(),
//         chatUnseenCount = 0;
    
//     if ( data ) {
        
//         let updateData = await chatModel.updateUnseenChatMessage(data);
        
//         if ( updateData ) {
//             deferred.resolve(true);
//         } else {
//             deferred.resolve(false);
//         }
//     } 
    
//     return deferred.promise;
// }

// /**
//  * 
//  * @param: 
//  * @returns:
//  * @developer :  
//  */
// chatObj.getUserSocketIds = async function( userId ){
//     let userSocketIds = [];
//     if ( userId && userId != '' ) {
//         userSocketIds =  await commonModel.getUserSocketId( userId );
//     }
//      return await userSocketIds;
// }
module.exports = chatObj;