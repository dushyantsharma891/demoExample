



const passwordHash 		= require('password-hash'),
    pool 	            = require('../../configCommon/config/pool'),
    // spacetime           = require('spacetime'),
    q                   = require('q'),
    // fs                  = require('fs'),
    {v1: uuidv1}        = require('uuid'),
    chatController      = require('../controllers/chats'),
    common              = require('./configCommon'),
    axios               = require("axios"),
    constant            = require('../../configCommon/config/constants'),
    commonHelper        = require('../../configCommon/helpers/index'),
    helper			    = require('../../configCommon/helpers');
// const { updateData } = require('../../configCommon/helper/mongo_helper');

let chatModel = {};


/**
 * DESCTIPTION WILL BE HERE One to one chat 
 * @param     :  recvUuid 
 * @returns   : 
 * @developer : 
 */

 chatModel.chatOneToOne = async ( body , userId ) => {
    console.log('chatOneToOne model========>>>>>111111',body , userId);

    let deferred          = q.defer(),
        conObj            = await constant.getConstant(),
        convUuid          = uuidv1(Date.now()),
        nextDateTime      = await helper.increaseHours(24),
        convId            = '',
        convRecord        = [] ,
        replyMint         = conObj.TEXT_REPLY_MINUTES,
        isPrivate         = false,
        privateConversationPassword  = '',
        condition         = '', 
        // condition         = '',
        userUuid          = '';

        if ( body && body.recvUuId ){

            if ( userId && userId != '' ) {
                userUuid = await common.getRowById( userId , 'u_id', 'u_uuid', 'user');

            }

            if ( userUuid && userUuid != '' ) {

                let convRecord    = await  chatModel.checkIfAlreadyHasConvId( userUuid , body ); 

                if ( convRecord &&  convRecord.status && convRecord.conversationId != '' ) {

                    let andCon = '';
                        convId = convRecord.conversationId;
                        let updateSeenCount  = "UPDATE user_notifications SET un_isseen = ? WHERE un_fk_receiver_u_id = ? AND un_fk_reference_id = ? ",
                        result   = await common.commonSqlQuery(updateSeenCount,['1',userId,convId]);
                    let privateChat = await common.getRowById( convId , 'con_uuid', 'con_is_start_private_chat', 'conversation', true) ;
                    if( privateChat &&  privateChat == '1'){
                        isPrivate = true;
                    }
                                
                let privateConversationPasswordData = await common.getAll(body.recvUuId, 'cpo_fk_u_uuid',  'conversation_private_onetoone','cpo_password','AND cpo_fk_con_uuid = "'+convId+'"',true);

                if( privateConversationPasswordData  && privateConversationPasswordData.length > 0 ){
            
                    privateConversationPassword = privateConversationPasswordData[0].cpo_password;
            
                }
                    console.log('dsddsdasddadadadad=====================>>',privateConversationPassword);
                    let whereLast           = '',
                        id                  = '',
                        page                = 0,
                        records_per_page    = conObj.RECORDS_PER_PAGE;

                    if ( body ) {

                        if ( body.per_page ) {
                            records_per_page = body.per_page;
                        }
                
                        if ( body.page ) {
                            page = body.page;
                        }
                
                        if ( body.last ) {
                            whereLast  += ' AND co.co_id > ' + body.last;
                            whereMore  += ' AND co.co_id > ' + body.last;
                        }

                        let updateReadMsgSql = "UPDATE conversation_onetoone SET co_is_seen = '1' WHERE co_fk_con_uuid = ? AND co_is_seen = ? AND co_fk_receiver_u_uuid = ?";

                        let updateRead  =  await common.commonSqlQuery( updateReadMsgSql , [convId ,'0',userUuid], false);

                        if(  body.isPrivateChat  &&  body.isPrivateChat == 'YES' ){
                            condition = 'AND  co.co_is_private_chat = "1"'
                        } else {
                            condition = 'AND  co.co_is_private_chat = "0"'

                        }   

                    }  
                    let sql =` SELECT c.con_uuid,co.co_is_private_chat,c.con_is_start_private_chat,co.co_id, co.co_parent_id, co.co_uuid, co.co_is_chat_video ,co.co_fk_sender_u_uuid , co.co_msg_type , co.co_message , co.co_is_seen  ,co.co_created_at ,co.co_expire_time,co.co_owner_expire_time,co.co_message_price,co.co_is_paid,co.co_reply_paid_status,co.co_rating,co.co_rating_comment,u.u_name ,u.u_image,u.u_uuid , co.co_fk_cpm_id ,u.u_is_online FROM conversation_onetoone AS co 
                    LEFT JOIN user AS u ON u.u_uuid = co.co_fk_sender_u_uuid 
                    LEFT JOIN conversation AS c ON c.con_uuid = co.co_fk_con_uuid `+andCon+`  
                    WHERE co.co_fk_con_uuid = ? AND (co.co_delete_for_me IS NULL OR co.co_delete_for_me != ? ) `+condition+``  ;
                    totalRecordSql  = sql ;
                    let offset      = page * records_per_page;
                
                    totalRecordSql   += whereLast + "  ORDER BY co.co_id DESC ";
                    sql              += whereLast + "  ORDER BY co.co_id DESC LIMIT "+ offset + "," +records_per_page;

                    let  convMessage  = await common.commonSqlQuery(sql,[ convId  , userUuid], true),
                        resultOne    = await common.commonSqlQuery(totalRecordSql,[ convId , userUuid ]);

                    let timeText = '';

                    if ( convMessage && Object.keys(convMessage).length > 0 ) {
                        // console.log('chatOneToOne model========>>>>>8888888888',convMessage);

                        convMessage.sort(function(a, b) {
                            return parseFloat(a.co_id) - parseFloat(b.co_id);
                        });
                            
                        
                        for ( const convMessageOne of convMessage ) {

                            convMessageOne.created_date_time = await helper.getDateTimeFormat(convMessageOne.co_created_at);

                            convMessageOne.senderId                    = convMessageOne.con_sender_u_uuid;
                          
                            let userData =  await common.getAll(userId,'u_id','user','u_uuid,u_private_chat_password,u_private_chat_password_text');

                            if( userData ){
                                convMessageOne.u_private_chat_password      =  userData[0].u_private_chat_password;
                                convMessageOne.u_private_chat_password_text =  userData[0].u_private_chat_password_text;
                            }
                           

                            if ( convMessageOne.co_parent_id != null && convMessageOne.co_parent_id != ''  ){
                                    
                                convMessageOne.replyObj               = await chatModel.getMessageReply( convMessageOne.co_parent_id );

                                convMessageOne.replyStatus            = await chatModel.getReplyEarnedMsgStatus(convMessageOne.co_parent_id , convMessageOne.co_id);
                            }

                            if ( convMessageOne.co_msg_type == "IMAGE" || convMessageOne.co_msg_type == "VIDEO" ) {

                                let attachmentSql =" SELECT coa_video_thumbnail  AS coa_video_thumbnail ,coa_uuid AS coa_uuid, coa_attachments AS image FROM conversation_onetoone_attachments WHERE coa_fk_co_uuid = ? AND coa_fk_sender_uuid = ? ";

                                let dataArrayOne = [ convMessageOne.co_uuid,convMessageOne.co_fk_sender_u_uuid ];    

                                let  result  = await common.commonSqlQuery(attachmentSql ,dataArrayOne);

                                if ( result && result.length > 0 ) {
                             
                                    let filename = result[0].image,
                                        arr      = filename.split("."),
                                        videoFolder = arr[0];
                                     
                                    if ( result[0].image ) {

                                        if( convMessageOne.co_is_chat_video && convMessageOne.co_is_chat_video == '1'){


                                            if ( convMessageOne.co_msg_type == "VIDEO" ) {
                                                
                                                result[0].videoPath = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.AWS_ONE_TO_ONE_PATH + convMessageOne.con_uuid +'/'+ conObj.AWS_VIDEO_PATH + convMessageOne.co_uuid +'/'+ result[0].image; 
                        
                                            } 
                                            
                                        } else {

                                            if ( convMessageOne.co_msg_type == "VIDEO" ) {
                                                
                                                result[0].videoPath = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.AWS_ONE_TO_ONE_PATH + convMessageOne.con_uuid +'/'+ conObj.AWS_VIDEO_PATH + videoFolder +'/'+ result[0].image; 
                        
                                            } else {

                                            result[0].image = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.AWS_ONE_TO_ONE_PATH + convMessageOne.con_uuid +'/'+  conObj.AWS_IMAGE_PATH+ result[0].image;
                                            }
                                        }
                
                                    }
                                    if( convMessageOne.co_is_chat_video && convMessageOne.co_is_chat_video == '1'){
                                        if ( result[0].coa_video_thumbnail ) {
                                        
                                            result[0].coa_video_thumbnail =  conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.AWS_ONE_TO_ONE_PATH + convMessageOne.con_uuid +'/'+ conObj.AWS_VIDEO_PATH + convMessageOne.co_uuid +'/'+ result[0].coa_video_thumbnail; 
                                        }
                                    } else {
                                        if ( result[0].coa_video_thumbnail ) {
                                        
                                            result[0].coa_video_thumbnail =  conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.AWS_ONE_TO_ONE_PATH + convMessageOne.con_uuid +'/'+ conObj.AWS_VIDEO_PATH + videoFolder +'/'+ result[0].coa_video_thumbnail; 
                                        }

                                    }
                                    // console.log('dsdsdsdsdsdsdsdsds=======>>>',result)
                                    convMessageOne.imageArray = result;
                                    convMessageOne.placeholderImage = false;
                                }
                            }    
                            if ( convMessageOne.u_image ) {

                            
                                convMessageOne.u_image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + convMessageOne.u_image;

                            }

                            let simpleDate     = await helper.simpleDateFormat(convMessageOne.co_created_at);

                            if ( simpleDate != timeText ) {
                                convMessageOne.time = convMessageOne.created_date_time;
                                timeText            = simpleDate;
                            }
                            convMessageOne.co_created_at = await helper.agoTime(convMessageOne.co_created_at );

                            
                            
                        }

                        let obj = {

                            convUuid                    : convId ,
                            isPrivate                   : isPrivate,
                            privateConversationPassword : privateConversationPassword,
                            data                        : convMessage , 
                            time                        : timeText,
                            nextDayTime                 : await helper.expireDateFormat(nextDateTime),
                            more_records                : 0,
                            total_records               : resultOne.length,
                            last                        : id,

                    

                        };

                        // let sql = `SELECT uc_socket_id FROM user_connections WHERE uc_fk_u_uuid = ?`,
                        // toSocketId  = await common.commonSqlQuery(sql,[userUuid]);
                        // let sendObj = { 
                        //     action : 'SEND-NOTIFICATION-COUNT', 
                        //     data   : {
        
                        //         userUuid                : userUuid,
                        //         mySocketId              : toSocketId,
                        //         userId                  : userId
        
                        //     }
                        // };
                
                        // for ( var i = 0; i < toSocketId.length ; i++ ) {
        
                        //     io.to(toSocketId[i].uc_socket_id).emit('call' , sendObj);
                        // }

                        deferred.resolve( obj );

                    } else {

                        let obj = {

                            convUuid                    : convId ,
                            isPrivate                   : isPrivate,
                            privateConversationPassword : privateConversationPassword,
                            nextDayTime                 : await helper.expireDateFormat(nextDateTime),
                            time                        : '',
                            data                        : [], 
                            total                       : 0
        
                        };
                    deferred.resolve( obj ); 

                    }
                        
                } else {
                    let otherUserId = await common.getRowById(body.recvUuId,'u_uuid','u_id','user');
                    let followStatus = await common.getFollowStatus(otherUserId,userId);
                    let conType = 'ONE_TO_ONE';

                    if(followStatus == 'YES'){
                        conType = 'ONE_TO_ONE';

                    } else {

                        if( body.requestType && body.requestType != ''){
                            conType = body.requestType
                        }
                    }
                    
                    
                    let insertObj = {

                        "con_uuid"               : convUuid ,
                        "con_sender_u_uuid"	     : userUuid,
                        "con_receiver_u_uuid"    : body.recvUuId,
                        "con_last_message"       : '',
                        "con_type"               : conType,
                        "con_is_start"           : 'N',
                        "con_created_at"         :  await helper.getUtcTime()
                    }

                    let sql =" INSERT INTO conversation SET ? ";
                    let aa = pool.query(sql, [ insertObj ],  async (error, result) => {
                        // console.log('chatOneToOne model========>>>>>101010101010',aa.sql);

                        if (error) {
                            
                            deferred.resolve(false);
            
                        } else {
                            // console.log('chatOneToOne model========>>>>>11,111,111',result);

                            if ( result ) {

                                let conRecords = await common.getRowIdAll(result.insertId, 'con_id', 'conversation');
                                let obj = {

                                    convUuid                    : conRecords.con_uuid,
                                    data                        : [],
                                    total                       : 0
                                
                
                                };
                                // console.log('chatOneToOne model========>>>>>1212121212',conRecords, obj);
                                
                                deferred.resolve( obj );
            
                            } else {
                                console.log('chatOneToOne model========>>>>>1313131313');

                                deferred.resolve(false);
            
                            }
                        }
        
                    });

                }

            } else {
                console.log('chatOneToOne model========>>>>>1414414');

                deferred.resolve(false); 
            }
        

        } else {
            console.log('chatOneToOne model========>>>>>1515515');

            deferred.resolve(false);

        }
    
     return deferred.promise;
}



/**
 * DESCTIPTION WILL BE HERE -: check if already exit coneversations id 
 * @param     :   
 * @returns   : 
 * @developer : 
 */

 chatModel.checkIfAlreadyHasConvId =  async ( loginUserUuid , body ) => {
    let deferred  = q.defer();

    if ( body &&  loginUserUuid && body.recvUuId ) {

        let  sql = " SELECT con_uuid FROM conversation WHERE ( con_sender_u_uuid = ? AND con_receiver_u_uuid = ? ) || ( con_sender_u_uuid = ? AND con_receiver_u_uuid = ? ) ";
        
        pool.query( sql ,[ loginUserUuid , body.recvUuId , body.recvUuId , loginUserUuid ] , async ( error , result  ) => {
            
            if ( result  && result.length > 0 ) {

                let obj =  {
                    status         : true ,
                    conversationId : result[0].con_uuid
                }
                
                deferred.resolve( obj );

            } else {

                let obj = {

                    status         : false ,
                    conversationId : ''
                }

                deferred.resolve( obj )
            }
        });


    } else {

        deferred.resolve(false);
    }

    return deferred.promise;
}

/**
 * This function is using to 
 * @param     :
 * @returns   :
 * @developer :
 */
 chatModel.getMessageReply = async ( id ) => {
    let deferred = q.defer(),
        conObj   = await constant.getConstant();

    if ( id && id != '' ){


         let sql = " SELECT  co.co_reply_paid_status, co.co_id, co.co_message ,co.co_uuid,co.co_is_private_chat, co.co_fk_cpm_id, co.co_fk_attachment_uuid , co.co_parent_id, co.co_msg_type , u.u_name , u.u_image AS u_image,u_uuid FROM conversation_onetoone AS co LEFT JOIN user AS u ON u.u_uuid = co.co_fk_sender_u_uuid WHERE co.co_id = ? ";
        
        let result = await common.commonSqlQuery(sql,[id]);

        if ( result && result.length > 0 ) {

            let conUuid   = await common.getRowId(result[0].co_uuid, 'co_uuid', 'co_fk_con_uuid', 'conversation_onetoone' );

            if ( result[0].co_msg_type == 'IMAGE' ) {

                let imageName   = await common.getRowId(result[0].co_uuid, 'coa_fk_co_uuid', 'coa_attachments', 'conversation_onetoone_attachments' );
             
                if ( imageName && conUuid ) {


                    result[0].image = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.AWS_ONE_TO_ONE_PATH + conUuid +'/'+  conObj.AWS_IMAGE_PATH+ imageName;

                    result[0].image_url = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.AWS_ONE_TO_ONE_PATH + conUuid +'/'+  conObj.AWS_IMAGE_PATH+ imageName; 
                    
                }

            }

            if ( result[0].co_msg_type == 'VIDEO' ) {

                let thumbName   = await common.getRowId(result[0].co_uuid, 'coa_fk_co_uuid', 'coa_video_thumbnail', 'conversation_onetoone_attachments' );

                    let filename    = thumbName,
                    arr         = filename.split("."),
                    videoFolder = arr[0];  

                if ( thumbName ) {
                    
                    result[0].coa_video_thumbnail =  conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.AWS_ONE_TO_ONE_PATH + conUuid +'/'+ conObj.AWS_VIDEO_PATH + videoFolder +'/'+ result[0].thumbName; 

                    result[0].thumbnail_url = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.AWS_ONE_TO_ONE_PATH + conUuid +'/'+ conObj.AWS_VIDEO_PATH + videoFolder +'/'+ thumbName;
                }

            }

            if(  result[0].co_fk_cpm_id && result[0].co_fk_cpm_id != 'null' && result[0].co_fk_cpm_id != null && result[0].co_is_private_chat == '1' ){

                let wrongPasswordData = await chatModel.getMessageDefaultReply(result[0].co_fk_cpm_id);

                if ( result[0].co_msg_type == 'VIDEO' ) {

                    result[0].coa_video_thumbnail =  wrongPasswordData.thumbnail_url;
                    result[0].thumbnail_url       =  wrongPasswordData.thumbnail_url;
                }

                if ( result[0].co_msg_type == 'IMAGE' ) {
                    result[0].image               =  wrongPasswordData.image;
                    result[0].image_url           =  wrongPasswordData.image;
                }
            }

            if ( result[0].u_image ) {

                result[0].u_image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + result[0].u_image;
            }

            deferred.resolve(result[0]);

        } else {

            deferred.resolve({});
        }


    } 
    else {

        deferred.resolve(false);
    }


    return deferred.promise;
}

/**
 * This function is using to add new participants in a group
 * @param     :
 * @returns   :
 * @developer :
 */
 chatModel.getReplyEarnedMsgStatus = async ( parentId,chatId ) => {
    let deferred = q.defer();

    if ( parentId && chatId ){

        let sql = " SELECT co_id FROM conversation_onetoone  WHERE co_parent_id = ? ORDER BY co_id ASC LIMIT 1";

        let result = await common.commonSqlQuery(sql,[parentId]);

        if ( result && result.length > 0 ) {
            
            if ( result[0].co_id == chatId ) {

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
 * DESCTIPTION WILL BE HERE my chat group list data
 * @param     :   userId 
 * @returns   : 
 * @developer : 
 */
 chatModel.myChatList = async( body , userId) => {
    // console.log('myChatList model========>>>>>11111111',body, userId)

    let deferred        = q.defer();
    if ( body && userId && userId != undefined && userId != "null" ) {
        // console.log('myChatList model========>>>>>22222222')

        let conObj            = await constant.getConstant(),
            whereLast         = '',
            whereMore         = '',
            sortBy            = 'c.con_last_message_at',
            sortOrder         = 'DESC',
            page              = '0',
            addCondition      =  '',
            // addConditionGroup = ''
            recordsPerPage    = conObj.RECORDS_PER_PAGE;
       
        let userUuid = await common.getRowById(userId, 'u_id', 'u_uuid', 'user');
        if ( userUuid != '' ) {
            // console.log('myChatList model========>>>>>33333333',userUuid)

            if ( body.keywords && body.keywords != 'null' ) {
                
                whereLast += " AND ( u1.u_name LIKE '%" + body.keywords.trim() + "%' OR u2.u_name LIKE '%" + body.keywords.trim() + "%')";
                whereMore += " AND ( u1.u_name LIKE '%" + body.keywords.trim() + "%' OR u2.u_name LIKE '%" + body.keywords.trim() + "%')";
                // whereLast += " AND  u2.u_name LIKE '%" + body.keywords.trim() + "";

                // whereMore += " AND u2.u_name LIKE '%" + body.keywords.trim() + "";
            }
           

            if ( body.per_page ) {

                recordsPerPage = body.per_page;
            }
            
            if ( body.page && body.page != '' && body.page != null && body.page != 'null' ) {

                page = Number(body.page) + 1;

                if ( body.lastRecId != null && body.lastRecId != "null" && body.lastRecId != "" && sortOrder == "DESC" ) {
                }

            } else {

                checkNewRecord = true;
            }

            if ( body.type && body.type != 'null') {

                addCondition = 'AND c.con_type = "'+ body.type +'"';
            } else {
                addCondition = 'AND c.con_type = "ONE_TO_ONE"';
            }
           

            let sql = ` SELECT c.con_id , c.con_uuid , c.con_last_message , c.con_last_msg_type , c.con_price , co.co_created_at ,
             u1.u_name AS sender_name ,u1.u_uuid AS sender_uuid ,u1.u_id AS sender_id, u1.u_is_available AS sender_is_Available, u1.u_image AS sender_image ,  
            u2.u_name AS receiver_name ,c.con_sender_chat_delete,c.con_receiver_chat_delete,
            u2.u_is_online AS receiver_is_online , u2.u_image AS receiver_image , u2.u_is_available AS receiver_is_Available , u2.u_uuid AS receiver_uuid ,u2.u_id AS receiver_id, 
            c.con_sender_u_uuid , c.con_receiver_u_uuid , c.con_last_message_at 
           FROM conversation AS c  
           LEFT JOIN user AS u1 ON u1.u_uuid = c.con_sender_u_uuid
           LEFT JOIN user AS u2 ON u2.u_uuid = c.con_receiver_u_uuid 
           LEFT JOIN conversation_onetoone AS co ON co.co_fk_con_uuid = c.con_uuid AND co.co_reply_paid_status = '0'
           WHERE(c.con_sender_u_uuid = ? || c.con_receiver_u_uuid = ? ) AND c.con_is_start = ? AND c.con_is_delete = ? 
           ` + addCondition ;
        

            let totalRecordSql  = sql,
                offset          = page * recordsPerPage;
                
            totalRecordSql += whereLast + " GROUP BY c.con_id ORDER BY " + sortBy + " " + sortOrder;
            sql            += whereLast + " GROUP BY c.con_id ORDER BY " + sortBy + " " + sortOrder + " LIMIT " + offset + "," + recordsPerPage;

            let resultTwo = await common.commonSqlQuery(totalRecordSql, [userUuid, userUuid, 'Y' , '0']),
                result    = await common.commonSqlQuery(sql, [userUuid, userUuid, 'Y','0'],true);

                result = result.filter(resultData => {
                    if ((resultData.con_sender_chat_delete === '1' && resultData.con_sender_u_uuid == userUuid) || (resultData.con_receiver_chat_delete === '1' && resultData.con_receiver_u_uuid === userUuid) ) {
                      // Exclude this object
                      return false;
                    }
                    return true;
                  });
            if ( result ) {

                let conId = '';

                for ( const resultOne of result ) {
                   
                    if ( resultOne.con_last_message_at ) {

                        resultOne.con_created_at =  await helper.getDateTimeFormat(resultOne.con_last_message_at) ;
                        resultOne.con_last_message_at = await helper.agoTime( resultOne.con_last_message_at );
                    }

                    let u_name            = '',
                        user_image        = '',
                        user_uuid         = '',
                        user_is_available = '',
                        user_designation  = '',
                        verifiedType      = '',
                        sponsorType       = '',
                        user_is_online    = '' ;  

                        let obj= {
                            'con_uuid': resultOne.con_uuid,
                            'loginUser': userUuid
                        };
                        if ( resultOne.con_sender_u_uuid == userUuid ) {
                        
                            u_name            = resultOne.receiver_name;
                            user_is_online    = resultOne.receiver_is_online;
                            user_is_available = resultOne.receiver_is_Available;
                            user_uuid         = resultOne.receiver_uuid;
                            user_image        = resultOne.receiver_image;
                            user_designation  = resultOne.receiver_designation;

                            if ( user_image && user_image != '' ) {

                                user_image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + user_image;
                            }

                            if( resultOne.receiver_id ){

                                verifiedType = await common.getRowById(resultOne.receiver_id,'u_id','u_verified_account','user');
                                sponsorType = await common.getRowById(resultOne.receiver_id,'u_id','u_sponsor_account','user');
        
                            } 
                            
                            
                        } else if ( resultOne.con_receiver_u_uuid == userUuid ) {
                        
                            u_name            = resultOne.sender_name;
                            user_is_online    = resultOne.sender_is_online;
                            user_is_available = resultOne.sender_is_Available;
                            user_uuid         = resultOne.sender_uuid;
                            user_image        = resultOne.sender_image;
                            user_designation  = resultOne.sender_designation;

                            if ( user_image && user_image != '' ) {

                                user_image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + user_image;
                            }
                            if( resultOne.sender_id ){

                                verifiedType = await common.getRowById(resultOne.sender_id,'u_id','u_verified_account','user');
                                sponsorType = await common.getRowById(resultOne.sender_id,'u_id','u_sponsor_account','user');
        
                            } 
                        }
                        
                        resultOne.unSeenCount = await  chatModel.getMessageCount(obj);

                    
                    // remove from array
                    delete  resultOne.sender_image ;
                    delete  resultOne.sender_is_online;
                    delete  resultOne.sender_uuid;
                    delete  resultOne.sender_is_Available;
                    delete  resultOne.sender_designation;
                    delete  resultOne.receiver_name;
                    delete  resultOne.receiver_image;
                    delete  resultOne.con_sender_u_uuid;
                    delete  resultOne.con_receiver_u_uuid ;
                    delete  resultOne.receiver_is_online;
                    delete  resultOne.receiver_is_Available;
                    delete  resultOne.receiver_uuid;
                    delete  resultOne.receiver_designation;


                    resultOne.userRecords = {

                        user_name         :  u_name ,
                        user_uuid         :  user_uuid,
                        user_image        :  user_image,
                        user_is_online    :  user_is_online,
                        user_is_available :  user_is_available,
                        user_designation  :  user_designation,
                        sponsorType       :  sponsorType,
                        verifiedType      : verifiedType
                    } 
                }
                let lastRecordId = '';
                if ( conId ) {
                    let indexValue   = result.length - 1;
                    lastRecordId = result[indexValue].con_id;
                }
                
                let obj = {
                    data         : result,
                    more_records : 0,
                    total        : resultTwo.length,
                    lastRecId    : lastRecordId,
                    per_page     : recordsPerPage,
                    offset       : offset,
                    page         : page
                };
                // console.log('myChatList model========>>>>>66666666666666',obj)

                deferred.resolve(obj);

            } else {
                console.log('myChatList model========>>>>>7777777777777')

                deferred.resolve(false);
            }

        } else {
            console.log('myChatList model========>>>>>88888888888888')

            deferred.resolve(false);
        }

    } else {
        console.log('myChatList model========>>>>>999999999999999999')

        deferred.resolve(false);
    }

    return deferred.promise;
}

/**
 * This function is using to check user exist in group or not
 * @param     :   
 * @returns   : 
 * @developer : 
 */
 chatModel.getMessageCount =  async function( obj) {

    let deferred   =  q.defer();

    if ( obj ) {
        
        let sql = "SELECT COUNT(co_id) as unSeenCount  FROM conversation_onetoone WHERE co_fk_con_uuid = ? AND co_fk_receiver_u_uuid = ? AND co_is_seen = ?",
            res = await common.commonSqlQuery(sql, [obj.con_uuid, obj.loginUser , "0" ]);
        if ( res && res.length > 0 ) {

           deferred.resolve(res[0].unSeenCount);
        } else {

         deferred.resolve(false);

        }

    } else {
        
        deferred.resolve(false);
    }

    return deferred.promise; 
}

/**
 * This function is using to add new participants in a 
 * @param     :   
 * @returns   : 
 * @developer : 
 */
 chatModel.updateThumbnail =  async ( obj ) => {
    console.log('updateThumbnail in =======================>>>>>>>>>>11111111111',obj)

   let deferred          =  q.defer();
   if ( obj ) {
       console.log('updateThumbnail in =======================>>>>>>>>>>22222222222222222222')

       let sql = "SELECT coa_id FROM conversation_onetoone_attachments WHERE coa_fk_co_uuid = ? ",
           res = await common.commonSqlQuery(sql,[ obj.uuid ]);

         if ( res && res.length > 0 ) {

           console.log('updateThumbnail in =======================>>>>>>>>>>333333333333333333333333333')

           let updateSql = "UPDATE conversation_onetoone_attachments SET coa_video_thumbnail = ? WHERE coa_fk_co_uuid = ? ",
               updateData = await common.commonSqlQuery(updateSql, [ obj.thumbnail.imageName , obj.uuid ]);

           if ( updateData ) {
               console.log('updateThumbnail in =======================>>>>>>>>>>4444444444444444444444',obj)
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
 * This function is using to delete massage from both user
 * @param     : question uuid , user id  
 * @returns   : true , false 
 * @developer : 
 */
 chatModel.deleteMessages = async(object) =>{
    let deferred =  q.defer();
    if ( object && object != '' ) {

        let messgaeId   = '',
            userUuid    = '';

        if ( object.co_id ) {
            messgaeId = object.co_id ;
        }
       
        if ( object.userUuid ) {
            userUuid = object.userUuid; 
        }

        let checkSql = "SELECT co_id FROM conversation_onetoone WHERE co_id = ? AND co_delete_for_me !=''",
            res      = await common.commonSqlQuery(checkSql,[ messgaeId ] , false );

        if ( res && res.length > 0 ) {

            let deleteSQl = "DELETE FROM conversation_onetoone WHERE co_id = ? ",
                deleteRes = await common.commonSqlQuery(deleteSQl ,[ messgaeId ]);

            if ( deleteRes ) {
                deferred.resolve(true);
            } else {
                deferred.resolve(false);
            }

        } else {

            let updateSql = "UPDATE conversation_onetoone SET co_delete_for_me ='"+userUuid+"' WHERE co_id = ? AND (co_fk_sender_u_uuid = ? || co_fk_receiver_u_uuid = ?)",
                resOne    = await common.commonSqlQuery(updateSql,[ messgaeId , userUuid , userUuid ] , false );

            if ( resOne ) {
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
 * This function is using to delete massage from both user
 * @param     : question uuid , user id  
 * @returns   : true , false 
 * @developer : Dushyant Sarma
 */
 chatModel.deleteEveryoneMessages = async(object) =>{
    console.log('deleteEveryoneMessages innnnn ====>>>>......',object)
   let deferred =  q.defer();

   let conObj   = await constant.getConstant()

   if ( object && object != '' ) {

       let messgaeId   = '',
           userUuid    = '';

       if ( object.co_id ) {
           messgaeId = object.co_id ;
       }
      
       if ( object.userUuid ) {
           userUuid = object.userUuid; 
       }

       let checkSql = "SELECT co_id, co_uuid , co_fk_con_uuid, co_msg_type  FROM conversation_onetoone WHERE co_id = ? ",
           res      = await common.commonSqlQuery(checkSql,[ messgaeId ] , true );
      
       if ( res && res.length > 0 ) {

           console.log('res==============================>>>>',res)
           let attachId= await helper.getRowId(res[0].co_uuid,'coa_fk_co_uuid','coa_attachments','conversation_onetoone_attachments');
               console.log('attachId============>>',attachId)
           if( res[0].co_msg_type == 'VIDEO' ){
                   console.log('VIDEO in===========>>>>>>>>>11111')
                if( attachId && res[0].co_fk_con_uuid ){
                    console.log('VIDEO in===========>>>>>>>>>22222222',attachId)
                let fileName = attachId.split('.')[0] ;
                    console.log('VIDEO in===========>>>>>>>>>33333333',fileName)
                    fileObj = {
                        fileName  : fileName,
                        filePath : conObj.UPLOAD_PATH + conObj.AWS_ONE_TO_ONE_PATH + res[0].co_uuid +'/'+ conObj.AWS_VIDEO_PATH + fileName +'/' ,
                        // status: 'groups', 
                    };
                       
                }
                      console.log('VIDEO in===========>>>>>>>>>44444444',fileObj)
                       let deltedVideo = await helper.deleteFileToAwsBucket(fileObj); // work in pending
                   console.log('VIDEO in===========>>>>>>>>>55555555555555',deltedVideo)
                   if( deltedVideo ) {
               
                   deleteMsg = true;
               
                   } else {
               
                   deleteMsg = false;
               
                   }
               
               
            } else if( res[0].co_msg_type == 'IMAGE' ){
                console.log('IMAGE in===========>>>>>>>>>111111111')
                if( attachId && res[0].co_fk_con_uuid ){
                    console.log('IMAGE in===========>>>>>>>>>22222222',attachId)
                    fileObj  = {

                        filepath       : conObj.UPLOAD_PATH + conObj.AWS_ONE_TO_ONE_PATH + res[0].co_fk_con_uuid +'/'+  conObj.AWS_IMAGE_PATH ,
                        fileName       : attachId,
                    };
                    
                }
                console.log('IMAGE in===========>>>>>>>>>333333333',fileObj)
                let deltedImage = await helper.deleteFileToAwsBucket(fileObj)
                console.log('IMAGE in===========>>>>>>>>>44444444',deltedImage)
                if( deltedImage ) {
            
                deleteMsg = true;
            
                } else {
            
                deleteMsg = false;
                    
                }
            
            } else {
                deleteMsg = true;
            }

           let deleteSQl = "DELETE FROM conversation_onetoone WHERE co_id = ? ",
               deleteRes = await common.commonSqlQuery(deleteSQl ,[ messgaeId ]);

           if ( deleteRes ) {
               deferred.resolve(true);
           } else {
               deferred.resolve(false);
           }

           let updateSql = "UPDATE conversation_onetoone SET co_delete_for_me ='"+userUuid+"' WHERE co_id = ? AND (co_fk_sender_u_uuid = ? || co_fk_receiver_u_uuid = ?)",
                   resOne    = await common.commonSqlQuery(updateSql,[ messgaeId , userUuid , userUuid ] , false );
   
               if ( resOne ) {
                   deferred.resolve(true);
               } else {
                   deferred.resolve(false);
               }

       } else {

        //    let updateSql = "UPDATE conversation_onetoone SET co_delete_for_me ='"+userUuid+"' WHERE co_id = ? AND (co_fk_sender_u_uuid = ? || co_fk_receiver_u_uuid = ?)",
        //        resOne    = await common.commonSqlQuery(updateSql,[ messgaeId , userUuid , userUuid ] , false );

        //    if ( resOne ) {
        //        deferred.resolve(true);
        //    } else {
        //        deferred.resolve(false);
        //    }
        deferred.resolve(false);


       }
       
   } else {
     deferred.resolve(false);
   }

   return deferred.promise; 

}


/**
* This function is using to add text Chat  in table
* @param     : 
* @returns   :
* @developer : 
*/
chatModel.textMessage = async ( body,userId ) => {

    let deferred          =  q.defer(),
        uuid              = uuidv1(Date.now()),
        conUuid           = '',
        createConversation= '',
        conObj            = await constant.getConstant();

        if( body.requestType && body.requestType != ''){

            body.recvUuId = body.receiverUuid  
            console.log('sdfsdfsfsdf',body.recvUuId)
            createConversation = await chatModel.chatOneToOne( body, userId  );
            
        }
        console.log('createConversation============>>>',createConversation)

        if( body.conUuid && body.conUuid != ''){
            conUuid = body.conUuid 
        } else {
            conUuid = createConversation.convUuid
        }
        console.log('conUuid conUuid conUuid conUuid =>>>>>>>>>>>',conUuid)
        if ( body && userId && body.receiverUuid  && body.message && body.type  ) {

            

            let userUuid       = await common.getRowById(userId, 'u_id', 'u_uuid', 'user');
                // msgUserUuid    = await common.getRowById( userUuid,'co_id','co_fk_sender_u_uuid',"conversation_onetoone"),
                // recId          = await common.getRowById(body.receiverUuid, 'u_uuid', 'u_id', 'user');
                
            let object = {
                co_uuid                     : uuid,
                co_fk_con_uuid              : conUuid,
                co_fk_sender_u_uuid         : userUuid,
                co_message                  : body.message,
                co_msg_type                 : body.type,
                co_fk_receiver_u_uuid       : body.receiverUuid,
                co_created_at               :  await helper.getUtcTime(),
            }
        
            if ( body.messageId ) {
                object.co_parent_id = body.messageId;
        
            }
        
            let oneToOneUuid = "";
        
            let insertedId = await common.insert('conversation_onetoone', object);
        
            if ( insertedId && insertedId != false ) {
        
                oneToOneUuid = await common.getRowById(insertedId, 'co_id', 'co_uuid', 'conversation_onetoone');
                if ( oneToOneUuid ){
                    let conversationUpdate = {
                        con_last_msg_type    : body.type,
                        con_last_user_u_uuid : userUuid,
                        con_is_start         : 'Y',
                        con_last_message_at  : await helper.getUtcTime(),
            
                    };
                    let sql = "UPDATE conversation SET ? WHERE con_uuid = ? ";
            
                    let updatedResult = await helper.getDataOrCount(sql, [ conversationUpdate ,  conUuid ], 'U', true);
                    
                    if ( updatedResult ) {
                        
                        let attachmentSql = "SELECT co_message FROM conversation_onetoone WHERE co_uuid = ? AND co_fk_sender_u_uuid = ? ";
            
                        let dataArrayOne = [oneToOneUuid , userUuid ];    
            
                        let  result  = await common.commonSqlQuery(attachmentSql ,dataArrayOne);
                        let sqlUserData  =  "SELECT u_id , u_uuid , u_name , CONCAT('" + conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH +"', u_image ) FROM user  WHERE u_uuid = ? ";
                        let  resultUserData  = await common.commonSqlQuery(sqlUserData ,[body.receiverUuid],true);
                            // console.log('dzdfdfssfsdfsdf===================>>>>>>>>>>>>>>>>',resultUserData)
                        if ( result && result !='' ) {
                            console.log('result in model in mode ======>>>>11111',result);
                            deferred.resolve(result)
                    
                        } else {
                            console.log('result in model in mode ======>>>>11111');

                            deferred.resolve(false);
                        }
                    } else {
                        console.log('result in model in mode ======>>>>22222222222');

                        deferred.resolve(false);

                    }

                } else {

                    console.log('result in model in mode ======>>>>3333333333333333');
                    deferred.resolve(false);
                }
            } else {
                console.log('result in model in mode ======>>>>4444444444444444');

                deferred.resolve(false);

            } 
                        
        } else {
            console.log('result in model in mode ======>>>>5555555555555555');

            deferred.resolve(false)
        }     
    
    return deferred.promise;

}


/**
 * SET Private Chat  password
 * @param        :
 * @returns       :
  * @developer : Dushyant Sharma
 */
chatModel.endPrivateChat = async (userId, body) => {

    let deferred = q.defer();
    let obj      = {
        status : false

    };

    if(  body  && body.conUuId ){

        let  deletePrivateChat = await common.deleteDataFormTable(body.conUuId,'co_fk_con_uuid','conversation_onetoone','AND co_is_private_chat = "1"', true),
        deletePrivateChatPassword = await common.deleteDataFormTable(body.conUuId,'cpo_fk_con_uuid','conversation_private_onetoone','', true),
        updateConversation = "UPDATE  conversation SET con_is_start_private_chat = '0' WHERE con_uuid = ?",
        resultThree     = await common.commonSqlQuery(updateConversation,[body.conUuId], true);

        if ( resultThree && deletePrivateChatPassword && deletePrivateChat ) {

            obj.status = true
            deferred.resolve(obj);

        } else {
            console.log('setChatPassword==================>>>>>>>>>>>>44444444')

            deferred.resolve(obj);
        }
            
    } else {
        deferred.resolve(obj);
    }
   
    return deferred.promise;

}

/**
 * Used to update recorded file name to database.
 * @param       : broadcastUuid, contestUuid 
 * @returns     :  
 * @developer   : 
 */
chatModel.stopChatRecording = async ( body ) => {
    // console.log('We are hear ===================>>>>>>>stopChatRecording',body); 
let deferred            = q.defer();

if ( body ) {

    let conObj          = await constant.getConstant(),
        filePath        = conObj.UPLOAD_PATH,
        folderPath      = conObj.BROADCAST_UPLOAD_PATH,
        subFolderPath   = conObj.AWS_VIDEO_PATH;

    let sourcePath      = "streams",
        newFile         = '',
        fileMp4         = '';
    const resource      = body.resourceId,
        sid             = body.sid,
        agoraApiUrl     = conObj.AGORA_API_URL,
        appID           = conObj.AGORA_APP_ID,
        restKey         = conObj.AGORA_REST_KEY,
        restSecret      = conObj.AGORA_SECRET_KEY,
        mode            = "mix";
       
    try {

        const Authorization   = `Basic ${Buffer.from(`${restKey}:${restSecret}`).toString("base64")}`;
        // console.log('We are hear ===================>>>>>>>1111111111',Authorization);

        const stopOne            = await axios.post(
            `${agoraApiUrl}${appID}/cloud_recording/resourceid/${resource}/sid/${sid}/mode/${mode}/stop`,
            {

                cname : body.chatUuid,
                uid   : '1111111111',
                clientRequest: {
                    resourceExpiredHour: 24
                },

            },
            { headers: { Authorization } }
        );
        // console.log( 'stopOne=======>>>>>>>>>>stopOneppppppppppppp>>>>', stopOne );
        if ( stopOne && stopOne.data ) {

            if ( stopOne.data.resourceId ) {

                resourseId  = stopOne.data.resourceId;
            }

            if ( stopOne.data.sid ) {

                asid        = stopOne.data.sid;
            }

            if ( stopOne.data.serverResponse && stopOne.data.serverResponse.fileList && stopOne.data.serverResponse.fileList.length > 0 ) {

                fileMp4     =  stopOne.data.serverResponse.fileList[0].fileName;

                if ( fileMp4 ) {

                    let splitFile   = fileMp4.split('/');

                    // console.log( "splitFile=====>>>>>>>", splitFile );

                    if ( splitFile && splitFile.length > 0 ) {

                        if ( splitFile[1] ) {

                            newFile = splitFile[1];

                        }
                    }

                    filePath += conObj.AWS_ONE_TO_ONE_PATH + body.conUuid +'/'+ conObj.AWS_VIDEO_PATH + body.chatUuid +'/' ; ;
                
                    // console.log("filePathfilePathfilePath=======>>>>>>",filePath);

                    let crtFolderObj = {
                        
                        sourcePath      : sourcePath,  
                        destinationPath : filePath,
                        fileName        : stopOne.data.sid + '_' + body.chatUuid,
                        // moveName        : body.broadcastUuid,
                        
                    };
                    let copyFile = await helper.copyFileWithInAWSBucket( crtFolderObj );
                    // console.log('We are hear ===================>>>>>>>copyFile',copyFile);
                    if ( copyFile ) {
                        let thumbDataObj    = {
                            videoName       : newFile,
                            folderPath      : filePath,
                            folderUId       : body.chatUuid,
                        };
                        let thumbnailData   = await helper.createThumbnailAWSBucket( thumbDataObj );

                        // console.log( 'thumbnailData=========>>>>>>>', thumbnailData );

                        let addData = await chatModel.updateBroadcastFileName( body );

                        // console.log ("addData ===========>>>>>>>",addData);

                        if ( addData ) {

                            // console.log ("addData 111111=======1111====>>>>>>>",addData);

                            let objRemove = {

                                sId: stopOne.data.sid,
                                path: 'streams',

                            },
                            removeStatus =  helper.removeAgoraRecodedVideo( objRemove );

                            // console.log("removeStatus======--->>>>",removeStatus);
                            deferred.resolve(addData)

                            // if ( removeStatus ) {

                               
                            //     deferred.resolve(true)
                            // } else {

                            //     console.log("elseeee1111111111111");
                            //     deferred.resolve( true );

                            // }
                        } else {

                            console.log("elseeeeeeeeeee222222222");
                            deferred.resolve( false );

                        }

                    } else {

                        console.log("elseeeeee55555555555");
                        deferred.resolve( false );

                    }
                } else {

                    console.log("elseeeee666666666666");
                    deferred.resolve( false );

                }
            } else {

                console.log("elseeee777777777777");
                deferred.resolve( false );

            }
        } else {

            console.log("elseeeee8888888888");
            deferred.resolve( false );

        }

    } catch ( err ) {

        console.log("errrrrrr=======>>>>>", err );
        deferred.resolve( false );
        
    }
    
} else {

    deferred.resolve( false );
}
return deferred.promise;
}



/**
 * Used to update recorded file name to database.
 * @param       :
 * @returns     :  
 * @developer   : 
 */
chatModel.updateBroadcastFileName = async ( body ) => {

    let deferred            = q.defer(),
    conObj                  = await constant.getConstant();
    if ( body && body.chatUuid ) {
        
        console.log('innn iiiiiiiffffffffffffffffffffffffff ======================>>>>>>>>');

        let videoUuId       = body.sid + '_' + body.chatUuid,
            // broadcastStatus = body.status,
            videoExt        = '.m3u8',
            videoExtMp4     = '.mp4',
            thumbExt        = '.png',

            videoM3u8Name   = videoUuId + videoExt,
            // vidMp4Name      = videoUuId + videoExtMp4,
            vidMp4Name      = videoUuId,
            thumbName       = videoUuId + '_0' + thumbExt,
            updateObj2 = {

                coa_uuid                :  uuidv1(Date.now()),
                coa_fk_co_uuid          :  body.chatUuid , 
                coa_fk_sender_uuid	    :  body.receiverUuid ,
                coa_m3u8_name           :  videoM3u8Name,     
                coa_attachments         :  vidMp4Name + "_0" + videoExtMp4,
                coa_video_thumbnail     :  thumbName,
                coa_created_at          :   await helper.getUtcTime()
            },
            oneToOneInsertId =   await  common.insert('conversation_onetoone_attachments', updateObj2 );

         // console.log("updateData=======>>>>updatevideotodb>>>>>", updateRes );

        if ( oneToOneInsertId ) {

            let conUuid = await common.getRowById(body.chatUuid,'co_uuid','co_fk_con_uuid','conversation_onetoone');
         
            let mediaData =  await common.getAll(oneToOneInsertId,'coa_id','conversation_onetoone_attachments','coa_video_thumbnail  AS coa_video_thumbnail ,coa_uuid AS coa_uuid, coa_attachments AS image,coa_fk_co_uuid AS coa_fk_co_uuid ');

            if( mediaData && mediaData.length > 0 ){

                mediaData[0].coa_video_thumbnail =  conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.AWS_ONE_TO_ONE_PATH + conUuid +'/'+ conObj.AWS_VIDEO_PATH + mediaData[0].coa_fk_co_uuid +'/'+ mediaData[0].coa_video_thumbnail; 

                mediaData[0].videoPath = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.AWS_ONE_TO_ONE_PATH + conUuid +'/'+ conObj.AWS_VIDEO_PATH + mediaData[0].coa_fk_co_uuid +'/'+ mediaData[0].image; 
            } 

            let obj = {

                videoFullName   : videoM3u8Name,
                videoName       : videoUuId,
                agoraVidMp4Name : vidMp4Name,
                mediaData       : mediaData,
        
            };
            deferred.resolve(obj);

        } else {

            // console.log("updateData=======>>>>else>>>>>" );
            deferred.resolve( false );

        }

    } else {

        // console.log('innn elseseseseseeeeeeeeeeeeeeeeeeee ======================>>>>>>>>');
        deferred.resolve( false );

    } 

    return deferred.promise;
}

/**
 * Used to Set Chat Password 
 * @param       : updateColumn , converstionUuid
 * @returns     : True False 
 * @developer   : Dushyant Sharma
 */
chatModel.setChatPassword = async (body, userId) => {

    let deferred = q.defer();
    let obj      = {
        status : false
    };
    console.log('setChatPassword==================>>>>>>>>>>>>1111111',body);
    if ( body && body.type != ''  ){

        let hashedPassword = passwordHash.generate(body.password),
        insertDataObj         = {
            cpo_fk_con_uuid : body.conUuId,
            cpo_fk_u_uuid   : body.userUuId,
            cpo_password    : hashedPassword
        },
        insertData = '';
        

        if( body.type  && body.type  == 'SETEMOJI' ){

            sql        = `UPDATE user SET u_private_chat_password = ?, u_private_chat_password_text = ? WHERE u_id = ? `;
            data       = [hashedPassword,body.password, userId];
            insertData = await common.commonSqlQuery(sql, data, true);

            obj.payload = {
                privateConversationPassword : hashedPassword,
                privateConversationEmoji    : body.password
            }
            
        }
        if( body.type  && body.type  == 'SET' ){
            insertData      = await common.insert('conversation_private_onetoone',insertDataObj),
            
            updateConversation = "UPDATE  conversation SET con_is_start_private_chat = '1' WHERE con_uuid = ?",
            resultTwo      = await common.commonSqlQuery(updateConversation,[body.conUuId], true);

            obj.payload = {
                privateConversationPassword : hashedPassword
            }
        }

        if ( insertData && insertData != '' ) {

            // obj.data = results[0];
            obj.status = true
            deferred.resolve(obj);

        } else {
            console.log('setChatPassword==================>>>>>>>>>>>>44444444')

            deferred.resolve(obj);
        }
        
    }

    return deferred.promise;
    
}


/**
 * Used to Set Check Password 
 * @param       : body
 * @returns     : True False 
 * @developer   : Dushyant Sharma
 */
chatModel.checkPassword = async (body, userId) => {

    let deferred = q.defer();
    let imageArray = '';
    let obj      = {
        status : false
    };
    console.log('setChatPassword==================>>>>>>>>>>>>',body,userId);
    if ( body && body.type != ''  ){

        let otherUserPassword  = await common.getRowById(body.conUuId, 'cpo_fk_con_uuid', 'cpo_password', 'conversation_private_onetoone');

        if( body && body.type == 'FILECHECK' ){
            otherUserPassword =  await common.getRowById(userId, 'u_id', 'u_private_chat_password', 'user');
            imageArray =  await chatModel.getDefaultRecords();
            obj.payload = imageArray;
        }

        if( body && body.type == 'REMOVE' ){

            otherUserPassword =  await common.getRowById(userId, 'u_id', 'u_private_chat_password', 'user');

        }

        if( passwordHash.verify(body.password, otherUserPassword) ) {

            if( body && body.type == 'REMOVE' ){

            let  deletePassword =   await chatModel.removeChatPassword(userId);

                if( deletePassword ){

                    obj.status = true;
                    obj.message = 'Password delete successfully';
                    deferred.resolve(obj);

                } else {

                    obj.message = 'Something went wrong';
                    deferred.resolve(obj);
                }

            } else {
               
                obj.status = true;
                console.log('setChatPassword==================>>>>>>>>>>>>11111111FILECHECK',obj);
                deferred.resolve(obj);

            }
           

        } else {

            console.log('imageArray==========>>>>>>>>>>>12121212121121212121212112');

            if( body && body.type == 'FILECHECK' ){

                console.log('imageArray==========>>>>>>>>>>>',imageArray);

                if( imageArray && imageArray.length > 0){

                    if( body && body.chatId ){
                        let messageType = await common.getRowById(body.chatId,'co_id','co_msg_type','conversation_onetoone'),
                        dataArray = [imageArray[0].imageId,body.chatId];
                        if( messageType && messageType == 'VIDEO' ){
                            dataArray = [imageArray[0].videoId,body.chatId];
                        }
                        let updateDefaultId = 'UPDATE conversation_onetoone SET co_fk_cpm_id = ? WHERE co_id = ? ',
                        updateDefault       = await common.commonSqlQuery(updateDefaultId,dataArray);
                        console.log('updateDefault============>>>>>>>>>>>>',updateDefault);
    
                    }

                }

            }
            console.log('setChatPassword==================>>>>>>>>>>>>2222222222')
            obj.message = 'Wrong Password'

            deferred.resolve(obj);

        }
        
    }

    return deferred.promise;

}


/**
 * Forgot password model
 
 */
chatModel.forgotChatPassword = async function ( body ) {
    console.log('sfsdfsfsfsdf========>>>>.',body);
    let deferred = q.defer(),
        conObj   = await constant.getConstant();

    pool.query('SELECT user.u_uuid, user.u_email ,user.u_id, user.u_name, user.u_active, user.u_active_count FROM user WHERE user.u_email = ?  ', [ body.email ], async function ( error, results ) {

        if ( error ) {
            deferred.resolve(false);
        } else {

            if ( results && results.length > 0 ) {

                if ( results[0].u_active == 1 ) {

                    
                    let randomNumber = Math.floor(Math.random() * (9999 - 1000) + 1000);

                    pool.query('UPDATE user SET u_forgot_password_token = ?, u_forgot_password_count = 0 WHERE user.u_uuid = ?', [randomNumber,results[0].u_uuid], async function (error, row) {

                        if ( error ) {
                            deferred.resolve(false);
                        } else {

                            let emailArray = {
                                to      : results[0].u_email,
                                from    : conObj.SITE_EMAIL,
                                subject : 'Password reset request ',
                                body    : "Hi " + results[0].u_email + ", You have requested password reset in email. Here is your password reset code :   " + randomNumber + ", Please enter this code in password reset screen and reset your account password."
                            };

                            let date            = await commonHelper.getPstDateTime('timeDate'),
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


/**
 * Used to remove Chat Password
 * @param       : 
 * @returns     : True False 
 * @developer   : Dushyant Sharma
 */
chatModel.removeChatPassword = async (userUuid) => {

    let deferred = q.defer();
    let obj      = {
        status : false
    };
    if ( userUuid && userUuid != ''  ){

        sql        = `UPDATE user SET u_private_chat_password = ?, u_private_chat_password_text = ? WHERE u_id = ? `;
        data       = ['','', userUuid];
        updateObj  = await common.commonSqlQuery(sql, data, true);
        obj.payload = {
            privateConversationPassword : '',
            privateConversationEmoji    : ''
        };
        
        if ( updateObj && updateObj != '' ) {
            obj.status = true
            deferred.resolve(obj);

        } else {
            console.log('setChatPassword==================>>>>>>>>>>>>44444444')

            deferred.resolve(obj);
        }
        
    }

    return deferred.promise;
    
}


/**
 * This function is get Post data
 * @param     	:  body
 * @developer 	: Dushyant Sharma
 * @modified	: 
 */
chatModel.getDefaultRecords = async (body) => {
    console.log('sdfsdfsdfsdfsdfdsfsdfsdfsdfsdf')
    let deferred  = q.defer(),
        conObj    = await constant.getConstant(),
        sql       = ` SELECT cpm_id, cpm_uuid,cpm_title, cpm_attachment, cpm_attachment_m3u8,cpm_attachment_thumbnail,cpm_type, cpm_status,cpm_deleted, cpm_created
        FROM chat_private_message_default_data WHERE cpm_id != '' AND cpm_status != '0' AND cpm_type = ? ORDER BY rand() limit 1
        `,
        result    = await common.commonSqlQuery(sql, ['IMAGE']),
        resultOne = await common.commonSqlQuery(sql, ['VIDEO']),
        resultData = [{
            videoPath : '',
            coa_video_thumbnail : '',
            image : '',
            videoId :  '',
            imageId : '',
        }
        ];
            
        if ( result && result.sqlMessage ) { 
            deferred.resolve(resultData);
        } else {

            if ( result && resultOne && resultOne.length > 0 && result.length > 0 ) {
                                                
                if (  resultOne[0].cpm_attachment && resultOne[0].cpm_type == 'VIDEO' ) {
                    resultData[0].videoId    = resultOne[0].cpm_id;
                    resultData[0].videoPath = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.DEFAULT_IMG_VIDEO_UPLOAD_PATH + resultOne[0].cpm_uuid +'/'+conObj.AWS_VIDEO_PATH   +  resultOne[0].cpm_attachment; 

                    if ( result[0].cpm_attachment_thumbnail ) {

                        resultData[0].coa_video_thumbnail  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.DEFAULT_IMG_VIDEO_UPLOAD_PATH + resultOne[0].cpm_uuid +'/'+ conObj.AWS_VIDEO_PATH + resultOne[0].cpm_attachment_thumbnail ;
                    }

                }

                if ( result[0].cpm_attachment ) {
                    resultData[0].imageId = result[0].cpm_id;
                    resultData[0].image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.DEFAULT_IMG_VIDEO_UPLOAD_PATH + result[0].cpm_uuid +'/'+ conObj.AWS_IMAGE_PATH  + result[0].cpm_attachment;

                } 

                // console.log('dsadsdasdasdasd=========>>>>>',resultData);

                
                deferred.resolve(resultData);

            } else {
                deferred.resolve(resultData);
            }
        } 
    return deferred.promise;

}

/**
 * This function is get Post data
 * @param     	:  body
 * @developer 	: Dushyant Sharma
 * @modified	: 
 */
chatModel.getMessageDefaultReply = async (id) => {

    console.log('sdfsdfsdfsdfsdfdsfsdfsdfsdfsdf')
    let deferred  = q.defer(),
        conObj    = await constant.getConstant(),
        sql       = ` SELECT cpm_id, cpm_uuid,cpm_title, cpm_attachment, cpm_attachment_m3u8,cpm_attachment_thumbnail,cpm_type, cpm_status,cpm_deleted, cpm_created
        FROM chat_private_message_default_data WHERE cpm_id = ? 
        `,
        result    = await common.commonSqlQuery(sql, [id],true);
    
        if ( result && result.sqlMessage ) { 
            deferred.resolve([]);
        } else {

            if ( result && result.length > 0 ) {
                                                
                    if ( result[0].cpm_attachment && result[0].cpm_type == 'VIDEO' ) {

                        result[0].videoPath = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.DEFAULT_IMG_VIDEO_UPLOAD_PATH + result[0].cpm_uuid +'/'+conObj.AWS_VIDEO_PATH   +  result[0].cpm_attachment; 
                        if ( result[0].cpm_attachment_thumbnail ) {


                            result[0].thumbnail_url = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.DEFAULT_IMG_VIDEO_UPLOAD_PATH + result[0].cpm_uuid +'/'+ conObj.AWS_VIDEO_PATH + result[0].cpm_attachment_thumbnail ;

                        }


                    }

                 
                    if ( result[0].cpm_attachment && result[0].cpm_type == 'IMAGE' ) {

                        result[0].image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.DEFAULT_IMG_VIDEO_UPLOAD_PATH + result[0].cpm_uuid +'/'+ conObj.AWS_IMAGE_PATH  + result[0].cpm_attachment;

                    } 

                  
                deferred.resolve(result[0]);

            } else {
                deferred.resolve([]);
            }
        } 
    return deferred.promise;

}

/**
 * SET Private Chat  password
 * @param        :
 * @returns       :
  * @developer : Dushyant Sharma
 */
chatModel.deleteConversation = async (userId, body) => {
    console.log('deleteConversation===========================>>>>>>>>>>11111111',userId);

    let deferred = q.defer();
    let obj      = {
        status : false
    };

    if(  body  && body.conUuId ){

        let userUuid = await common.getRowById(userId,'u_id','u_uuid','user');
        let isSender = await common.getRowById(userUuid,'con_uuid = "'+body.conUuId+'" AND con_sender_u_uuid','con_id','conversation',true);
        let isReceiver = await common.getRowById(userUuid,'con_uuid ="'+body.conUuId+'" AND con_receiver_u_uuid','con_id','conversation',true);
        console.log('deleteConversation===========================>>>>>>>>>>222222222',userId,'==========>>>>>>>>....',isSender,'=========>>>>>>>',isReceiver);
        let updateObj = {
            con_receiver_chat_delete : '1'
        }
        let type = 'N'
        if( isSender && isSender != '' ){
            type = 'S'
            updateObj = {
                con_sender_chat_delete : '1'
            }
            
        }
        if(isReceiver && isReceiver != ''  ){
            type = 'R'
            updateObj = {
                con_receiver_chat_delete : '1'
            }
            
        }

       

        let messages  = await common.getAll(body.conUuId,'co_fk_con_uuid','conversation_onetoone','co_id','',true);
        console.log('deleteConversation===========================>>>>>>>>>>33333333',messages.length);

        if( messages && messages.length > 0){
            
            for ( let i = 0; i < messages.length ; i++ ) {
                
                let messageId = messages[i].co_id ;

                let obj = {
                        co_id    :  messageId,
                        userUuid :  userUuid
                };
                let result = await chatModel.deleteMessages(obj);

            }

        }

        let updateDataSql = 'UPDATE conversation SET ? WHERE con_uuid=?',
        updateData        =  await common.commonSqlQuery(updateDataSql,[updateObj,body.conUuId],true);
     

        if ( updateData ) {

            obj.status = true
            deferred.resolve(obj);

        } else {
            console.log('setChatPassword==================>>>>>>>>>>>>44444444')

            deferred.resolve(obj);
        }
            
    } else {
        deferred.resolve(obj);
    }
   
    return deferred.promise;

}



module.exports = chatModel;
