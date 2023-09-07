

const q                 = require('q'),
    {v1: uuidv1}        = require('uuid'),
    helper              = require('../../../configCommon/helper'),
    commonModelObj      = require('./common_model'),
    constant            = require('../../../configCommon/config/constants'),
    commonConstant      = require('../../../configCommon/config/constants');

let chatModelObj        = {};

/**
 * 
 * @developer : 
 * @modified  : 
 */
chatModelObj.saveChat = async function(dataObj) {
    //console.log(dataObj , 'dataObj SAVE CHAT');
    let meetingId       = await commonModelObj.getRowById('m_id', 'meeting', 'm_uuid', dataObj.meetingId),
        sessionUuid     = '';
    let meetingDataAndCheckUser = await commonModelObj.checkUserAvailableInMeeting( dataObj.userId , meetingId , 'O');
        //console.log(meetingDataAndCheckUser , 'meetingDataAndCheckUser');
    let deferred        = q.defer();
    if ( meetingDataAndCheckUser &&  meetingDataAndCheckUser.m_entry_type ) {

        if ( dataObj && dataObj.meetingId && dataObj.massage ) {

            if ( dataObj.meetingType == "course" ) {
                sessionUuid              = await commonModelObj.getRowById('cs_uuid', 'course_sessions', 'cs_id', dataObj.sessionId);
            }
        
            let sql         = `INSERT INTO chat SET ?`,   
                insertValue = {
                "c_fk_m_uuid"           : dataObj.meetingId, 
                "c_fk_cs_uuid"          : sessionUuid, 
                "c_sender_fk_u_uuid"    : dataObj.userUuid ,
                "c_meeting_type"        : meetingDataAndCheckUser.m_entry_type,
                "c_device_id"           : dataObj.deviceId,
                "c_platform"            : dataObj.devicePlatform,
                "c_message"             : dataObj.massage,
                "c_date_time"           : dataObj.dateTime,
            };

            if ( dataObj.to && dataObj.to != '') {
                insertValue.c_receiver_fk_u_uuid = dataObj.to;
                insertValue.c_type               = 'S';
            } else {
                insertValue.c_type               = 'G';

            }

           let insertData  = await helper.getDataOrCount(sql, insertValue , 'U' , true);
           //let insertData = await commonModelObj.insert('chat', insertValue);

            if ( insertData && insertData.insertId > 0) {
            //if ( insertData && ! insertData.sqlMessage ) {  
                
                if ( insertValue.c_type == 'G' ) {

                    let courseMembersSql = "SELECT u_uuid FROM meeting_user LEFT JOIN user ON u_id =  IF(mu_fk_u_id_member != 0 , mu_fk_u_id_member , mu_fk_u_id_created ) WHERE mu_fk_m_id = ? AND mu_cancel_status = '0'",
                    allMeetingMembers  = await helper.getDataOrCount(courseMembersSql, meetingId , 'D' , true);

                    if ( allMeetingMembers ) {

                        allMeetingMembers.forEach( async function(element) { 
                            //console.log('HI HELLO');
                            let cnSql         = `INSERT INTO group_chat_notification SET ?`,   
                                cnInsertValue = {
                                    "gcn_fk_c_id"           : insertData.insertId, 
                                    "gcn_fk_m_uuid"         : dataObj.meetingId ,
                                    "gcn_fk_u_uuid"         : element.u_uuid,
                                    "gcn_fk_cs_uuid"        : sessionUuid
                                };

                            if ( element.u_uuid && element.u_uuid != dataObj.userUuid ) {
                                let insertData  = await helper.getDataOrCount(cnSql, cnInsertValue , 'U' , true);
                                //console.log(insertData , 'NOTIFICATION INSERTED'); 
                            }

                        }); 
                    }  
                }
                deferred.resolve(true);
            } else {
                //console.log('HI HELLO 111111111111')
                deferred.resolve(false);
            }
        } else {
            //console.log('HI HELLO 22222222')
            deferred.resolve(false);
        } 
    } else {
        //console.log('HI HELLO 3333333333')
        deferred.resolve(false);
    } 

    return deferred.promise;
}

/** This Function is used to save one to chat 
 *   
 * @developer : 
 * @modified  : 
 */
 chatModelObj.saveOneToOneChat = async function(dataObj) {
    console.log('We are hear ===================>>>>>>>saveOneToOneChat111111');
    let deferred          = q.defer(),
        recId             = await commonModelObj.getRowById(dataObj.receiverUuid , 'u_uuid', 'u_id', 'user')
        currentDateTime   = await helper.getPstDateTime('timeDate'),
        conObj            = await constant.getConstant();
        dataObj.recId = recId;  
    if ( dataObj && dataObj.conUuid && recId  ) { 


        let saveChat  = await  chatModelObj.saveChatFunctionOneToOne(dataObj);
        // console.log('We are hear ===================>>>>>>>22222222saveChat',saveChat);
        if ( saveChat && saveChat != false ) {
           
            deferred.resolve(saveChat);

        } else {
            deferred.resolve(false);
        }
        
            
    } else {
        deferred.resolve(false);
    } 

    return deferred.promise;
}

/**
 * 
 * @developer : Ashwani Kumar  
 * @modified  : 
 */
 chatModelObj.saveChatFunctionOneToOne = async function(dataObj) { 
    let deferred  = q.defer(),
        currentDateTime   = await helper.getPstDateTime('timeDate'),
        conObj    = await constant.getConstant();

    let sql         = `INSERT INTO conversation_onetoone SET ?`,   
        insertValue = {
        "co_uuid"               : uuidv1(Date.now()), 
        "co_fk_con_uuid"        : dataObj.conUuid, 
        "co_fk_sender_u_uuid"   : dataObj.userUuid ,
        "co_fk_receiver_u_uuid" : dataObj.receiverUuid,
        "co_is_seen"            : '0',
        "co_message"            : dataObj.message,
        'co_created_at'         : currentDateTime,
        'co_msg_type'           : dataObj.type,   
        'co_is_private_chat'    : dataObj.isPrivateChat && dataObj.isPrivateChat == '1' ? '1' : '0'
     
    };
    let isSender = await commonModelObj.getRowId(dataObj.conUuid,'con_uuid','con_sender_chat_delete','conversation');
    let isReceiver = await commonModelObj.getRowId(dataObj.conUuid,'con_uuid','con_receiver_chat_delete','conversation');
    console.log('isSender=============>>>>>>>>>>>>>>>',isSender,'isReceiver=========>>>>>',isReceiver);
    let updateObj = {
        con_receiver_chat_delete : '0',
        con_sender_chat_delete   : '0'
    };
    if( isSender && isSender == '1' || isReceiver && isReceiver == '1' ){

        let updateDataSql = 'UPDATE conversation SET ? WHERE con_uuid=?',
        updateData        =  await commonModelObj.commonSqlQuery(updateDataSql,[updateObj,dataObj.conUuid],true);

    }

    if (dataObj.messageId && dataObj.messageId != '' ) {
        insertValue.co_parent_id = dataObj.messageId;

    }

    let insertData  = await helper.getDataOrCount(sql, insertValue , 'U' );
    // console.log('We are hear ===================>>>>>>>insertData',insertData);
    if ( insertData && insertData.insertId > 0 ) {

        conversationUuid              = await commonModelObj.getRowById('co_fk_con_uuid', 'conversation_onetoone', 'co_id', insertData.insertId);
        // console.log('We are hear ===================>>>>>>>conversationUuid',conversationUuid);
        if ( conversationUuid ) {

            let sqlone  = `UPDATE  conversation SET ? WHERE con_uuid = ? `;
            let obj     = {
                'con_last_user_u_uuid'  : dataObj.userUuid,
                'con_last_message'      : dataObj.message ,
                'con_last_msg_type'     : 'TEXT',
                "con_is_start"          : 'Y',
                'con_last_message_at'   : currentDateTime,
            }
            

            let updateData  = await helper.getDataOrCount(sqlone, [obj,conversationUuid ], 'U' );
            // console.log('We are hear ===================>>>>>>>updateData',updateData);
            if ( updateData ) {
                
                let sqlTwo         =  "SELECT u_id , u_uuid , u_name ,  u_image  FROM user  WHERE u_uuid = ? ";
                let selectData  = await helper.getDataOrCount(sqlTwo, [ dataObj.userUuid ], 'U' );
                // console.log('We are hear ===================>>>>>>>selectData',selectData);
                if ( selectData ) {

                    if( selectData[0].u_image && selectData[0].u_image != '' ){

                        selectData[0].u_image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + selectData[0].u_image;


                    }

                    selectData[0].messageId       =  insertData.insertId;
                    selectData[0].isPrivateChat   =  dataObj.isPrivateChat;


                    deferred.resolve(selectData);

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


// /**
//  * 
//  * @developer : 
//  * @modified  : 
//  */
// chatModelObj.onHistory = async function(dataObj) {

//     let meetingId               = await commonModelObj.getRowById('m_id', 'meeting', 'm_uuid', dataObj.meetingId);
//     let meetingDataAndCheckUser = await commonModelObj.checkUserAvailableInMeeting( dataObj.userId , meetingId );
//         //console.log(meetingDataAndCheckUser , 'meetingDataAndCheckUser');
//     let conObj    = await constant.getConstant(); 
//     let imagePath = conObj.SITE_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH;
//     let deferred        = q.defer();
//     if ( meetingDataAndCheckUser ) {
//         if ( dataObj && dataObj.meetingId ) {
        
//             let sql           = '';
//             let recordPerPage = 10;
//             let offset        = 0;

//             if ( dataObj.page ) {
//                 offset = dataObj.page * recordPerPage;
//             }
//             if ( dataObj.participantsId) {
//                 sql = " SELECT * FROM  ( SELECT chat.* ,  sender.u_name as sender_name , CONCAT('"+imagePath+"', sender.u_image) as sender_image ,  reciver.u_name as reciver_name , CONCAT('https://www.knowex.com/uploads/profile_image/', reciver.u_image) as reciver_image FROM `chat` LEFT JOIN user AS sender ON chat.c_sender_fk_u_uuid = sender.u_uuid  LEFT JOIN user AS reciver ON chat.c_receiver_fk_u_uuid = reciver.u_uuid WHERE c_fk_m_uuid = ? AND ( ( c_sender_fk_u_uuid = '"+dataObj.participantsId+"' AND c_receiver_fk_u_uuid = '"+dataObj.userUuid+"') OR ( c_sender_fk_u_uuid = '"+dataObj.userUuid+"' AND c_receiver_fk_u_uuid = '"+dataObj.participantsId+"') ) ORDER BY `c_id` DESC LIMIT "+offset+" ,"+recordPerPage+") `chat` ORDER BY `c_id` ASC";
//             } else {
//                 let chatType = 'G';
//                 if ( dataObj.meetingType == 'meeting') {
//                     chatType = 'S'
//                 }
//                 sql = " SELECT * FROM  (SELECT chat.*, u_name , CONCAT('"+imagePath+"', u_image) as u_image FROM `chat` LEFT JOIN user ON chat.c_sender_fk_u_uuid = user.u_uuid WHERE c_fk_m_uuid = ? AND c_type = '"+chatType+"' ORDER BY `c_id` DESC LIMIT "+offset+" ,"+recordPerPage+") `chat` ORDER BY `c_id` ASC";
//             }
//             //console.log(sql , '%%%%%%%%%%%%');
//             let conitionsArray  = [ dataObj.meetingId ]
//             let chatHistory     = await helper.getDataOrCount(sql, conitionsArray , 'D' , true);
//             if ( chatHistory && chatHistory.length > 0) {
//                 deferred.resolve(chatHistory);
//             } else {
//                 deferred.resolve(false);
//             }
//         } else {
//             deferred.resolve(false);
//         } 
//     } else {
//         deferred.resolve(false);
//     } 

//     return deferred.promise;
// }

// /**
//  * Used to get unseen chat messages
//  * @developer : Anil Guleria
//  * @modified  : 
//  */
// chatModelObj.getUnseenChatMessage = async function(dataObj) {

//     let deferred        = q.defer();
//     let senderId        = dataObj.userUuid;
//     let addSql          = '';
//     let addCondition    = '';
//     if ( dataObj && dataObj.meetingId && dataObj.userUuid ) {

//         let reciverId = dataObj.userUuid;

//         if ( dataObj.messageTo ) {
//             reciverId = dataObj.messageTo;
//             addSql    =  "AND c_sender_fk_u_uuid = '"+senderId+"'" ;
//         }

//         if ( dataObj.meetingType == 'course' ) {

//             sessionUuid  = await commonModelObj.getRowById('cs_uuid', 'course_sessions', 'cs_id', dataObj.sessionId);

//             if ( sessionUuid ) {
//                 addCondition = " AND c_fk_cs_uuid = '"+sessionUuid+"'";
//             }

//         }

//         let sql         = `SELECT count(*) as messageCount FROM chat WHERE c_fk_m_uuid = ? AND c_receiver_fk_u_uuid = ? `+addSql+` AND c_is_seen = ? `+addCondition; 
//         // if ( dataObj.type == 'Group-chat') {
//         //     sql         = `SELECT count(*) as messageCount FROM group_chat_notification WHERE gcn_fk_m_uuid = ? AND gcn_fk_u_uuid = ? `
//         // }
        
//         let     dataArray   = [dataObj.meetingId, reciverId , '0'],
//                 chatCount   = await helper.getDataOrCount(sql, dataArray , 'D' , true);
        
//         if ( chatCount && chatCount.sqlMessage ) {
//             deferred.resolve(false);
//         } else {

//             if ( chatCount && chatCount.length > 0 ) {
//                 deferred.resolve(chatCount[0].messageCount);
//             } else {
//                 deferred.resolve(false);
//             }
//             /* //console.log(chatCount , 'chatCount');
//             deferred.resolve(chatCount[0].messageCount); */
//         }

//     } else {
//         deferred.resolve(false);
//     } 
    
//     return deferred.promise;
// }

// /**
//  * Used to get unseen chat messages
//  * @developer : Anil Guleria
//  * @modified  : 
//  */
// chatModelObj.getUnseenGroupChatMessage = async function(dataObj) {

//     let deferred        = q.defer();
    
//     if ( dataObj && dataObj.meetingId  ) {
//         let returnData          = {};
//         let meetingId           = await commonModelObj.getRowById('m_id', 'meeting', 'm_uuid', dataObj.meetingId),
            
//             courseMembersSql    = "SELECT u_uuid FROM meeting_user LEFT JOIN user ON u_id =  IF(mu_fk_u_id_member != 0 , mu_fk_u_id_member , mu_fk_u_id_created ) WHERE mu_fk_m_id = ? AND mu_cancel_status = '0'",
//             allMeetingMembers   = await helper.getDataOrCount(courseMembersSql, meetingId);

//         if ( allMeetingMembers && allMeetingMembers.length > 0 ) {
//             //console.log('111111111111111111 : ');
//             returnData = await chatModelObj.getCountDataObj(allMeetingMembers , dataObj);
//             //console.log('222222222222222222 : ', returnData);
//             /* for ( const element of allMeetingMembers ) {
//                 if ( element.u_uuid && element.u_uuid != dataObj.userUuid ) {

//                     let  sql         = `SELECT count(*) as messageCount FROM group_chat_notification WHERE gcn_fk_m_uuid = ? AND gcn_fk_u_uuid = ? `,
//                         dataArray   = [dataObj.meetingId, element.u_uuid , '0'],
//                         chatCount   = await helper.getDataOrCount(sql, dataArray , 'D' , true);

//                         if ( chatCount && chatCount.length > 0 ) {
//                             let count = chatCount[0].messageCount;
//                             returnData[element.u_uuid] = count;
//                         }
//                     //console.log(element.u_uuid , 'HI %%%%%%%%%%%%%%%%'); 
//                     //console.log(returnData , '%%%%%%%%%%%%%%%%'); 
//                 }
//                 returnData.push(returnData);
//             }
//             deferred.resolve(returnData); */
//             /* let loopLength = 0;
//             let allMeetingMembersLength = allMeetingMembers.length;
           
//             allMeetingMembers.forEach( async function(element) { 
//                 loopLength++;
//                 //console.log(allMeetingMembersLength , loopLength);
//                 if ( element.u_uuid && element.u_uuid != dataObj.userUuid ) {

//                     let  sql         = `SELECT count(*) as messageCount FROM group_chat_notification WHERE gcn_fk_m_uuid = ? AND gcn_fk_u_uuid = ? `,
//                         dataArray   = [dataObj.meetingId, element.u_uuid , '0'],
//                         chatCount   = await helper.getDataOrCount(sql, dataArray , 'D' , true);

//                         if ( chatCount && chatCount.length > 0 ) {
//                             let count = chatCount[0].messageCount;
//                             returnData[element.u_uuid] = count;
//                         }
//                     //console.log(element.u_uuid , 'HI %%%%%%%%%%%%%%%%'); 
//                     //console.log(returnData , '%%%%%%%%%%%%%%%%'); 
//                 }
//                 if ( allMeetingMembersLength == loopLength ) {
//                     deferred.resolve(returnData);
//                 }
//             });  */
//             deferred.resolve(returnData);
//         } 
//     } else {
//         deferred.resolve(false);
//     } 
    
//     return deferred.promise;
// }


// /**
//  * Used to update unseen chat messages
//  * @developer : Anil Guleria
//  * @modified  : 
//  */
// chatModelObj.getCountDataObj = async function(allMeetingMembers ,dataObj) {

//     let returnData      = {},
//         deferred        = q.defer(),
//         addCondition    = '';
    
    
//     if ( allMeetingMembers && allMeetingMembers.length > 0 && dataObj) {

//         for ( const element of allMeetingMembers ) {

//             if ( dataObj.meetingType == 'course' ) {

//                 sessionUuid  = await commonModelObj.getRowById('cs_uuid', 'course_sessions', 'cs_id', dataObj.sessionId);

//                 if ( sessionUuid ) {
//                     addCondition = " AND gcn_fk_cs_uuid = '"+sessionUuid+"'";
//                 }

//             }

//             let  sql         = `SELECT count(*) as messageCount FROM group_chat_notification WHERE gcn_fk_m_uuid = ? AND gcn_fk_u_uuid = ? `+addCondition,
//                 dataArray   = [dataObj.meetingId, element.u_uuid , '0'],
//                 chatCount   = await helper.getDataOrCount(sql, dataArray , 'D' , true);

//                 if ( chatCount && chatCount.length > 0 ) {
//                     let count = chatCount[0].messageCount;
//                     returnData[element.u_uuid] = count;
//                 }
//             //console.log(element.u_uuid , 'HI %%%%%%%%%%%%%%%%'); 
//             //console.log(returnData , '%%%%%%%%%%%%%%%%'); 
//         }
        
//     }
//     deferred.resolve(returnData);
//     return deferred.promise;
// }

// /**
//  * Used to update unseen chat messages
//  * @developer : Anil Guleria
//  * @modified  : 
//  */
// chatModelObj.updateUnseenChatMessage = async function(dataObj) {

//     let deferred        = q.defer();
    
//     if ( dataObj && dataObj.meetingId && dataObj.userUuid ) {
        
//         let dataUpdate  = {
//                 c_is_seen : '1'
//             },
//             updateSql   = helper.sqlUpdate('chat', dataUpdate);

//         updateSql.sql += 'WHERE c_fk_m_uuid = ?';
//         updateSql.val.push(dataObj.meetingId);
//         updateSql.sql += ' AND c_receiver_fk_u_uuid = ?';
//         updateSql.val.push(dataObj.userUuid);
//         updateSql.sql += ' AND c_is_seen = ?';
//         updateSql.val.push('0');
//         if ( dataObj.meetingType == "course" ) {
//             sessionUuid              = await commonModelObj.getRowById('cs_uuid', 'course_sessions', 'cs_id', dataObj.sessionId);
//             updateSql.sql += ' AND c_fk_cs_uuid = ?';
//             updateSql.val.push(sessionUuid);
//         }
//         if ( dataObj.participantsId ) {
//             updateSql.sql += ' AND c_sender_fk_u_uuid = ?';
//             updateSql.val.push(dataObj.participantsId );
//         }
    
//         // //console.log( updateSql , 'updateSqlupdateSql');
//         // let updateSql = 'UPDATE chat SET c_is_seen= "1" WHERE c_fk_m_uuid = ? AND c_receiver_fk_u_uuid = ? AND c_is_seen = ?'
//         // let updateData  = await helper.getDataOrCount( updateSql, [dataObj.meetingId , dataObj.userUuid , '0' ], 'U' , true );
//         let updateData  = await helper.getDataOrCount(updateSql.sql, updateSql.val, 'U' , true);
        
//         if ( updateData ) {
//             deferred.resolve(true);
//         } else {
//             deferred.resolve(false);
//         }
//     } else {
//         deferred.resolve(false);
//     } 
    
//     return deferred.promise;
// }

// /**
//  * Used to update unseen chat messages
//  * @developer : Anil Guleria
//  * @modified  : 
//  */
// chatModelObj.updateUnseenGroupChatMessage = async function(dataObj) {

//     let deferred        = q.defer(),
//         addSql          = "";
    
//     if ( dataObj && dataObj.meetingId && dataObj.userUuid ) {
//         if ( dataObj.meetingType == "course" ) {
//             sessionUuid              = await commonModelObj.getRowById('cs_uuid', 'course_sessions', 'cs_id', dataObj.sessionId);
//             addSql = " AND gcn_fk_cs_uuid = '"+sessionUuid+"'";
//         }
//         let deleteSql = 'DELETE FROM group_chat_notification WHERE gcn_fk_m_uuid = ? AND gcn_fk_u_uuid = ? '+addSql;
       
//         let deleteData  = await helper.getDataOrCount(deleteSql, [ dataObj.meetingId , dataObj.userUuid ] , 'U' , true);
        
//         if ( deleteData ) {
//             deferred.resolve(true);
//         } else {
//             deferred.resolve(false);
//         }
//     } else {
//         deferred.resolve(false);
//     } 
    
//     return deferred.promise;
// }

module.exports = chatModelObj;
