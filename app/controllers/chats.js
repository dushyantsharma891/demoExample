

const q 				= require('q'),
fs 				 	= require('fs'),
passwordHash 		= require('password-hash'),
path 				= require('path'),
AWS                 = require('aws-sdk'),
{v1: uuidv1}        = require('uuid'),
BusboyCon 		    = require('busboy'),
_chatModelObj 		= require('../models/chats_model'),
helper				= require('../../configCommon/helpers'),
config				= require('../../configCommon/config').init(),
common              = require('../models/configCommon'),
constant            = require('../../configCommon/config/constants'),
ThumbnailGenerator  = require('video-thumbnail-generator').default,
liveBroadcastModel  =  require('../models/live_broadcast_model'),
ffmpeg              = require('fluent-ffmpeg');
    
let chats = {};

/**
* This function is using to chat one to one user 
* @param     : userUuid 
* @returns   : 
* @developer : 
*/
chats.chatOneToOne =  async ( req , res  ) => {

    let userId = await helper.getUUIDByTocken( req ); 
    console.log('chatOneToOne========>>>>>111111111',userId)
    if ( userId  ) {

        if ( req.body ) {
            console.log('chatOneToOne========>>>>>2222',req.body)

            if ( req.body.recvUuId ) {
                console.log('chatOneToOne========>>>>>3333',req.body.recvUuId);

                let result = await _chatModelObj.chatOneToOne( req.body , userId );
                // console.log('chatOneToOne========>>>>>4444',result);

                if ( result ) {

                    let obj = {
                        payload : result  
                    };
    
                    helper.successHandler(res, obj);

                } else {
                    console.log('chatOneToOne========>>>>>5555');

                    let obj = {
                        code 	: 'CMP -E1000',
                        message : 'Something went wrong .. !',
                        status  : false
                    };
        
                    helper.successHandler(res, obj);

                }

            } else {
                console.log('chatOneToOne========>>>>>66666');

                let obj = {
                    code 	: 'CMP -E1001',
                    message : 'Something went wrong .. !',
                    status  : false
                };
    
                helper.successHandler(res, obj);

            }


        } else {
            console.log('chatOneToOne========>>>>>77777');

            let obj = {

                code 	: 'CMP -E1002',
                message : 'Something went wrong .',
                status  : false
            };
    
            helper.successHandler(res, obj);
    
        }


    } else {

        let obj = {
            status 		: false,
            code        : "CMP-E1003",
            message		: "Unauthorized Error."
        };

        helper.successHandler(res, obj, 401);  

    }

}

/**
* This function is using to add media  in table
* @param     : 
* @returns   :
* @developer : 
*/
chats.addMultipleMediaRecords = async ( req , res ) => {
    console.log('addMultipleMediaRecords==============>>>>>>>>private/chat/add-media-records',req.body);
    let	userId            = await helper.getUUIDByTocken(req),
        currentDateTime   = await helper.getPstDateTime('timeDate'),
        deferred          = q.defer(),
        ext               = '',
        uuid              = uuidv1(Date.now());


    if ( userId ) {

        if ( req && req.body ) {
        
        
            const fields    = {},
            buffers         = {};

        let chunks          = [], fName, fType, fEncoding,
            imagesToUpload  = [],
            imageToAdd      = {},

            busboy = BusboyCon({ 
                headers: req.headers 
            });

            busboy.on('field', async (fieldname, val) => {
            
                fields[fieldname] = val;
            
                
            });
            
            busboy.on('file', async function(fieldname, file, filename, encoding, mimetype) {

                buffers[fieldname] = [] ;

                let ext  = (path.extname(filename.filename).toLowerCase());
                    console.log('ext ext ext ext',ext);
                    console.log('fieldname fieldname',fieldname)

                if ( ext !== '.mp4' && ext !== '.3gp' && ext !== '.ogg' && ext !== '.wmv' && ext !== '.avi' && ext !== '.flv' && ext !== '.mov' && ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg' ) {
                    
                    let obj =  {
                        status  : true,
                        code    :  "",
                        message : "invalid extension!",
                        payload : []
                    };
    
                    chunks.push(obj);
                    file.resume();

                } else {
                    

                    let newName = uuid + ext;
                    // let newName = fields.con_uuid + ext;
                
                    fName       = newName.replace(/ /g,"_");
                    fType       = mimetype;
                    fEncoding   = encoding;
                    file.on('data', function(data) {

                        buffers[fieldname].push(data);
                    });
                    
                    imageToAdd = { 
                        fName, 
                        mimetype,
                        fEncoding,
                        fType,
                        ext,
                        fileBuffer:buffers[fieldname]
                    };
                    
                    imagesToUpload.push(imageToAdd);


                }

            });
        
            busboy.on('finish', async function() {

                let conObj    = await constant.getConstant();

                if ( fields.con_uuid ) {

                    let attachments_msg = '',
                        msgUserUuid     = '';

                    if ( fields.messageId ) {

                        msgUserUuid = await common.getRowById( fields.messageId,'co_id','co_fk_sender_u_uuid',"conversation_onetoone");

                    }
                    
                    if ( fields.attachments_msg ){

                        attachments_msg  =  fields.attachments_msg                        
                    }

                    let userUuid       = await common.getRowById(userId, 'u_id', 'u_uuid', 'user'),
                        recId          = await common.getRowById(fields.receiver_u_uuid, 'u_uuid', 'u_id', 'user');
                        
                    let object = {
                        co_uuid                     : uuid,
                        co_fk_con_uuid              : fields.con_uuid,
                        co_fk_sender_u_uuid         : userUuid,
                        co_message                  : attachments_msg,
                        co_msg_type                 : fields.type,
                        co_fk_receiver_u_uuid       : fields.receiver_u_uuid,
                        co_created_at               : currentDateTime,
                        co_is_private_chat          : fields.isPrivateChat && fields.isPrivateChat == '1' ? '1' : '0'
                    }
                    console.log('ssdfsdfsfsfsfsfsf==============>>>>>>',object);

                    if ( fields.messageId ) {
                        object.co_parent_id = fields.messageId;

                        let wrongImageId = await common.getRowById(fields.messageId,'co_id','co_fk_cpm_id','conversation_onetoone');
                        console.log('wrongImageId===============>>>>>>112121212212',wrongImageId);
                        if( wrongImageId && wrongImageId != '' ){
                            object.co_fk_cpm_id = wrongImageId;

                        }

                    }

                    let oneToOneUuid = "";

                    let insertedId = await common.insert('conversation_onetoone', object);

                    if ( insertedId && insertedId != false ) {
        
                        oneToOneUuid = await common.getRowById(insertedId, 'co_id', 'co_uuid', 'conversation_onetoone');

                        deferred.resolve(insertedId);

                    } else {

                        deferred.resolve(false);
                    }

                    
                        
                    let count = imagesToUpload.length;
                    
                    imagesToUpload.forEach(async imageToBeUploaded   => {      
                        
                        let fileObj = {

                            fileName        : imageToBeUploaded.fName,
                            chunks          : imageToBeUploaded.fileBuffer,
                            encoding        : imageToBeUploaded.fEncoding,
                            contentType     : imageToBeUploaded.fType,
                            uploadFolder    : conObj.UPLOAD_PATH + conObj.AWS_ONE_TO_ONE_PATH + fields.con_uuid +'/'+  conObj.AWS_IMAGE_PATH

                    };
                        let ext     = imageToBeUploaded.ext;
                        if( ext == '.mp4' || ext == '.3gp' || ext == '.ogg' || ext == '.wmv' || ext == '.avi' || ext == '.flv' || ext == '.mov' ){

                            fileObj.uploadFolder = conObj.UPLOAD_PATH + conObj.AWS_ONE_TO_ONE_PATH + fields.con_uuid +'/'+ conObj.AWS_VIDEO_PATH + oneToOneUuid +'/' ; 
                        }

                        console.log('extextextextextextextextextextext in ============>>>>>>>>22222222222',fileObj.uploadFolder);
                    
                        let object = {
                            fileObj      :  fileObj ,
                            folderUuid   : fields.con_uuid,
                            oneToOneUuid : oneToOneUuid ,
                            ext          : imageToBeUploaded.ext,
                            sender_uuid  : userUuid 

                        }

                        chats.uploadFile(object);
                    
                        count = count - 1;

                    });
                    
                    // if (  count == "0" ) {

                        let conversationUpdate = {
                            con_last_msg_type    : fields.type,
                            con_last_user_u_uuid : userUuid,
                            con_is_start         : 'Y',
                            con_last_message_at  :currentDateTime,

                        };
                        let sql = "UPDATE conversation SET ? WHERE con_uuid = ? ";

                        let updatedResult = await helper.getDataOrCount(sql, [ conversationUpdate ,  fields.con_uuid ], 'U', true);
                        
                        if ( updatedResult ) {

                            if ( fields.messageId ) {

                                if ( msgUserUuid != userUuid ) {

                                }
                
                            }
                            
                            let attachmentSql = "SELECT CONCAT('" + conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.AWS_ONE_TO_ONE_PATH + fields.con_uuid +'/'+  conObj.AWS_IMAGE_PATH + "', coa_attachments ) AS image , coa_video_thumbnail AS thumbnail FROM conversation_onetoone_attachments WHERE coa_fk_co_uuid = ? AND coa_fk_sender_uuid = ? ";

                            let dataArrayOne = [oneToOneUuid , userUuid ];    

                            let  result  = await common.commonSqlQuery(attachmentSql ,dataArrayOne);
                            let sqlUserData  =  "SELECT u_id , u_uuid , u_name , CONCAT('" + conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH +"', u_image ) FROM user  WHERE u_uuid = ? ";
                            let  resultUserData  = await common.commonSqlQuery(sqlUserData ,[fields.receiver_u_uuid],true);
                                // console.log('dzdfdfssfsdfsdf===================>>>>>>>>>>>>>>>>',resultUserData)
                            if ( result && result !='' ) {
                                let socketSendData =  {
                                    action: 'CON-MESSAGE',
                                    data:  {

                                        u_id             : resultUserData[0].u_id,
                                        u_uuid           : fields.receiver_u_uuid,
                                        u_name           : resultUserData[0].u_name,
                                        u_image          : resultUserData[0].u_image,
                                        message          : '',
                                        mySocketId       : ' ',
                                        converstionUuId  : fields.con_uuid,
                                        SenderuserUuid   : userUuid,
                                        fileArry         : result,
                                        fileType         : fields.type,
                                        // messagePrice     : userPriceData.up_message_price,
                                        isPrivateChat    : fields.isPrivateChat,
                                        messageIsPaid    : object.co_is_paid,
                                        senderUuid       : fields.receiver_u_uuid ,

                                    },
                                }

                                let socket = io.to(fields.con_uuid ).emit('call' , socketSendData);
                                // console.log('sockrt sockrt sockrt sockrt========================>>',socket)

                               let aa = chats.sendNewMessageSocket(fields.receiver_u_uuid);
                                // console.log('sendNewMessageSocket sendNewMessageSocket sendNewMessageSocket sendNewMessageSocket========================>>',aa)
                                helper.successHandler(res, { 
                                    status  : true ,
                                    payload :{
                                        convUuid         :fields.con_uuid ,
                                        imageArray       :result,
                                        // messagePrice     : userPriceData.up_message_price,
                                        messageIsPaid    : object.co_is_paid
                                    }
                                });

                            } else {

                                helper.successHandler(res, { 
                                    status  : true ,
                                    payload :{
                                        convUuid         : fields.con_uuid ,
                                        imageArray       : '',
                                        messagePrice     : '',
                                        messageIsPaid    : ''
                                    }
                                        
                                });
                                
                            }

                        } else {

                            let obj = {
                                code 	: 'AUS-E1000',
                                message : 'Something went wrong.',
                                status  : false
                            };
                            helper.successHandler(res, obj);


                        }
                        
                    // } else {
                    //     return false;
                    // }
                    

                } else {

                    let obj = {
                        code 	: 'AUS-E1000',
                        message : 'Something went wrong.',
                        status  : false
                    };
                    helper.successHandler(res, obj);
                        
                }
                    
                    
            });
    
            return req.pipe(busboy);
    
        } else {

            let obj = {
                code 	: 'AUS-E1001',
                message : 'Please fill mandatory fields.',
                status  : false
            };
            helper.successHandler(res, obj);

        }

    } else {

        helper.successHandler(res, {
            status 		: false,
            code        : "UIS-E1003",
            message		: "Unauthorized Error."
        }, 401);   

    }
}


/**
* This function is using to upload file
* @param     : 
* @returns   :
* @developer : 
*/
chats.uploadFile = async  ( object ) => {
    console.log('uploadFile in  in =========================>>>>>>>>11111111111111',object)
let  currentDateTime = await helper.getPstDateTime('timeDate'),
     conObj    = await constant.getConstant();


if ( object  ) {

    console.log('uploadFile in  in =========================>>>>>>>>2222222222222222222222222')
    let videoUId = object.fileObj.fileName.split(".")[0];
        // arr      = filename.split("."),
        // videoUId   = arr[0];


        console.log('object.fileObj.uploadFolder ==========================>>>>>>1111111111111',object.fileObj.uploadFolder)

        console.log('object.fileObj.uploadFolder ==========================>>>>>>222222222222',object.fileObj)

    let updateObj = {

        uuid    : object.oneToOneUuid,
        name    : object.fileObj.fileName

    };

    let updateObj2 = {

        coa_uuid                :  uuidv1(Date.now()),
        coa_fk_co_uuid          :  object.oneToOneUuid , 
        coa_fk_sender_uuid	    :  object.sender_uuid ,
        coa_attachments         :  object.fileObj.fileName,
        coa_created_at          :  currentDateTime
    }

    let oneToOneInsertId =   await  common.insert('conversation_onetoone_attachments', updateObj2 ),
        returnObj ='';
    let coaUuid = '';
    if ( oneToOneInsertId ){
        coaUuid = await common.getRowById(oneToOneInsertId,'coa_id','coa_uuid','conversation_onetoone_attachments');
        object.fileObj.coaUuid = coaUuid;
        returnObj = await helper.uploadFile(object.fileObj);
    }
    if ( returnObj && object.ext == '.mp4' || object.ext == '.3gp' || object.ext == '.ogg' || object.ext == '.wmv' || object.ext == '.avi' || object.ext == '.flv' || object.ext == '.mov'  ) {
        let uploadFolderPath =  conObj.UPLOAD_PATH + conObj.AWS_ONE_TO_ONE_PATH + object.folderUuid +'/'+ conObj.AWS_VIDEO_PATH + object.oneToOneUuid +'/' ;
        object.fileObj.uploadFolder =  uploadFolderPath 


        console.log('uploadFile in  in =========================>>>>>>>>333333333333333333',object.ext,videoUId)
        let thumbDataObj    = {
            videoName       : object.fileObj.fileName,
            videoUId        : videoUId,
            folderUId       : object.folderUuid,
            folderPath      : uploadFolderPath,
            coaUuid         : coaUuid
        },
      
        thumbnailData   = await chats.createThumbnailAWSBucket(thumbDataObj,'');

        // let lambdaFunctionObj = {
        //     folderUId       : object.folderUuid,
        //     attachmentId    : videoUId,
        //     mp4FileName     : object.fileObj.fileName,
        // };
    //    createVideo = await helper.executeAWSLambdaFunction(lambdaFunctionObj);
    //    console.log('createVideo createVideo createVideo===================================>>>>>>>>>>>>>>1111111111111111111',createVideo.status)
    //    console.log('createVideo createVideo createVideo===================================>>>>>>>>>>>>>>2222222222222222222',lambdaFunctionObj)
        // let thumbnailData =  await followObj.createThumbnail(object.fileObj.fileName, '','','GROUP');
        
        // if( createVideo.status ){
             
        //     let m3u8ID = object.fileObj.fileName.split(".")[0];
        //         // arr      = filename.split("."),
        //         // m3u8ID   = arr[0]+'.m3u8';
        //       console.log('m3u8ID m3u8ID ===================================================>>>>>',m3u8ID)
        //     let updateDataM3u8Table  = await chats.updateDataM3u8Table( m3u8ID, object.oneToOneUuid,'' );

        // }
    
        if ( thumbnailData ) {

            console.log('uploadFile in  in =========================>>>>>>>>44444444444444444',thumbnailData)
            return true ;

            // updateObj.thumbnail = thumbnailData;

            // let thumbnail  = await chats.updateThumbnailValue( updateObj );

            // if ( thumbnail ){


            //     return true;

            // } else {

            //     return false;
            // }

        } else {

            return false ;
        }

    }

    return true;

} else {
    return false;
}

}
/** NEW FUNCTION TO CREATE VIDEO THUMBNAIL //
 * This function is using to get live users list
 * @param     : fileFolderType : US, RC, UV, QD, UP, C, GC 
 * @returns   :
 * @developer : 
 */
 chats.createThumbnailAWSBucket = async (thumbObj, attempt = 0 ) => {
    console.log("--------create thumbnail---------------------11111111");
    let deferred = q.defer();

    if ( thumbObj && thumbObj.videoName && thumbObj.folderUId && thumbObj.folderPath) {
        console.log("--------create thumbnail---------------------222222");
        let conObj        = await constant.getConstant(),
            fullMediaPath = thumbObj.folderPath,
            fileName      =  conObj.AWS_CLOUDFRONT_URL + thumbObj.folderPath + thumbObj.videoName;
       
        /** code to create video thumbnail.*/

        clearInterVal();

        try {
            console.log("--------create thumbnail---------------------33333",fileName);
            let resolution = await chats.getVideoResolution(fileName);

            if ( resolution ) {
                console.log("--------create thumbnail---------------------44444",resolution);
                let newResu = resolution;

                const tg = new ThumbnailGenerator({

                    sourcePath      : fileName,
                    thumbnailPath   : 'uploads/',//conObj.UPLOAD_PATH,
                    size            : newResu
                });
                // console.log("tgggggggggggggggggggggggggggggggggg=======================",tg)
                let per         = Math.floor(Math.random() * Math.floor(100)),
                    imageData   = await tg.generateOneByPercent(per);
                    // console.log("--------create thumbnail---------------------555555111111",imageData);

                if ( imageData ) {
                    console.log("--------create thumbnail---------------------555555",imageData);
                    // let filename = thumbObj.videoName,
                    // arr          = filename.split("."),
                    // videoId      = arr[0];
                    // console.log("--------create thumbnail---------------------5555551111111",videoId);
                    let imageDataObj    = {
                        imageName       : imageData,
                        uploadFolder    : fullMediaPath,
                        videoUId        : thumbObj.videoName.split(".")[0]
                    },
                    data                = await helper.uploadThumbnailFileToAwsBucket(imageDataObj);
                        console.log('sdfsdfsdfsdfsdfsdfsdfsdfsdfsdf========================>>',data)
                    if ( data ) {
                        console.log("--------create thumbnail---------------------666666",data);
                        if ( thumbObj.coaUuid && thumbObj.coaUuid != '' ) {

                            let dataObj = {
                                streamId    : thumbObj.coaUuid,
                                thumbnail   : data
                            };
                            chats.updateThumbnailValue(dataObj);
                        }

                        deferred.resolve(data);

                    } else {
                        deferred.resolve(false);
                    }

                } else {

                    deferred.resolve(false);
                }
            } else {
                deferred.resolve(false);
            }
        } catch ( error ) {
            console.log('dsddfsdfsdfsdfsfsdfsdf=sdf=sdf=sdf=sdf=sd=fsd=fsd=f>>>>>>>>>>>>>',error)
            if ( attempt <= 10 ) {
                intervalArray = setTimeout(async function () {

                    chats.createThumbnailAWSBucket(thumbObj, ++attempt);

                }.bind(chats), 2000);
            } 
        }
    } else {
        deferred.resolve(false);
    }

    return deferred.promise;
}

/**
 * This function is usied to get video resolution.
 * @param      :
 * @returns    :
 * @developer  : Anil Guleria
 */
chats.getVideoResolution = async (fileName) => {

    let deferred = q.defer();

    if ( fileName && fileName != "" ) {

        console.log("chhhhhhhhchchchchhc========================",fileName);
        ffmpeg.ffprobe(fileName, function (err, metadata) {

            if ( err ) {
                console.log("ffmpeg.ffprobeffmpeg.ffprobe=========>>>>>",err);
              deferred.resolve(false);
            } else {
            console.log("jeeta swweeeettaaaaaasssss----------------------");
                // metadata should contain 'width', 'height' and 'display_aspect_ratio'
                if ( metadata && metadata.streams && metadata.streams[1] && metadata.streams[1].width && metadata.streams[1].height ) {

                    let resolution = '';

                    if ( (metadata.streams[1].rotation) && (metadata.streams[1].rotation == '-90' || metadata.streams[1].rotation == 90) ) {
                        
                        resolution = metadata.streams[1].height + "x" + metadata.streams[1].width;
                    } else {
                        
                        resolution = metadata.streams[1].width + "x" + metadata.streams[1].height;
                    }

                    deferred.resolve(resolution);
                } else if ( metadata && metadata.streams && metadata.streams[0] && metadata.streams[0].width && metadata.streams[0].height ) {

                    let resolution = '';
                    if ( (metadata.streams[0].rotation) && (metadata.streams[0].rotation == '-90' || metadata.streams[0].rotation == 90) ) {
                        
                      resolution = metadata.streams[0].height + "x" + metadata.streams[0].width;
                    } else {

                        resolution = metadata.streams[0].width + "x" + metadata.streams[0].height;
                    }

                    deferred.resolve(resolution);

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
 * Used to update uploaded video data.
 * @developer   : 
 * @modified    :
 * @params      : 
 */
 chats.updateThumbnailValue = async (bodyObj) => {
    console.log("bodyObjbodyObjbodyObjbodyObj====>>>",bodyObj);
    let deferred       = q.defer();
    console.log("bodyObjbodyObjbodyObjbodyObj====>>>",bodyObj.streamId , bodyObj.thumbnail);
    if ( bodyObj  && bodyObj.streamId  && bodyObj.thumbnail ) {
        
        let updateSql   = `UPDATE conversation_onetoone_attachments SET  coa_video_thumbnail = ? WHERE  coa_uuid = ?`,
            dataArray   = [ bodyObj.thumbnail.imageName,bodyObj.streamId],
            updateRes   = await common.commonSqlQuery(updateSql, dataArray,true);
        
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

/**
 * This function is using to get topics
 * @param        :
 * @returns       :
  * @developer : 
 */
 chats.updateDataM3u8Table = async ( m3u8ID, attachmentId ) => {
    console.log("updateDataM3u8Table in ==================>>>>111111111111111111111",attachmentId);
   let deferred  = q.defer(),
       sql       = '',
       obj       = '';

    if ( m3u8ID ) {
        console.log("updateDataM3u8Table in ==================>>>>>>2222222222222222222",attachmentId);

            sql  = `UPDATE conversation_onetoone_attachments SET ? WHERE coa_id = ?`;
            obj = {
                coa_m3u8_name : m3u8ID,
            };

       updateData 	= await helper.getDataOrCount( sql,[obj, attachmentId],'U',true );

       console.log("updateDataupdateData=====>>>>",updateData);
       if ( updateData ) {
        console.log("updateDataM3u8Table in ==================>>>>>444444444444444444444",updateData);

        deferred.resolve(false);

       } else {
        console.log("updateDataM3u8Table in ==================>>>>>555555555555555555555555",updateData);

        deferred.resolve(false);

       }

    } else {
        deferred.resolve(false);
    }

   return deferred.promise;

}


var intervalArray;

function clearInterVal() {

    if (intervalArray) {
        clearTimeout(intervalArray);
    }
}

/**
* This function is using to my chat group  section
* @param     : 
* @returns   : 
* @developer : 
*/
chats.myChatList = async (req ,  res) => {
 
    let userId   = await helper.getUUIDByTocken(req);
    // console.log('myChatList========>>>>>111111111',userId)

    if ( userId ) {
        // console.log('myChatList========>>>>>222222')

        let result = await _chatModelObj.myChatList( req.body , userId );
        // console.log('myChatList========>>>>>3333333',result)

        if ( result ) {

            helper.successHandler(res, { 
                status      : true,
                payload     : result 
            }, 200);

        } else {

            let obj = {
                code 	: 'GMP -E1001',
                message : 'Failed, Please try again.',
                status  : false
            };

            helper.successHandler(res, obj);
        } 

    } else {

        let obj = {
            status 		: false,
            code        : "GMP-E1000",
            message		: "Unauthorized Error."
        };

        helper.successHandler(res, obj, 401);  

    }

}


/**
*  This function is using to Update invitation status
* @param     : questions_id 
* @returns   : 
* @developer : 
*/
chats.deleteMessages = async ( req , res ) => {

    console.log('deleteMessgaeFromMe in ========================>>>> req.body', req.body);
let userId   = await helper.getUUIDByTocken(req);

if ( userId ) {

    console.log('deleteMessgaeFromMe in ========================>>>>1111111111111111')

    if ( req && req.body && req.body.messageid ) { 

        console.log('deleteMessgaeFromMe in ========================>>>>2222222222222222222')

        let messageIds  =  req.body.messageid ;

        let userUuid    = await  common.getRowById( userId , 'u_id' , 'u_uuid', 'user');

        if ( userUuid ) {
            console.log('deleteMessgaeFromMe in ========================>>>>333333333333333333333333')

            let newMesgArray = [];

            if ( messageIds && Object.keys(messageIds).length > 0 ) {

                if( req.body.type =="ME" ){

                    console.log('deleteMessgaeFromMe in ========================>>>>444444444444444444444')

                    let mIds         = messageIds ;
                    let totalReords  = mIds.length ;
                    let totalValue   = 0;
                    
                    for ( let i = 0; i < mIds.length ; i++ ) {
                        
                        let mesageId = mIds[i].m_id ;

                            let obj = {
                                    co_id    :  mesageId,
                                    userUuid :  userUuid
                            };
                            let result = await _chatModelObj.deleteMessages(obj);
                           
                            if ( result ) {

                                newMesgArray.push(mesageId);

                                totalValue++ ;

                            }

                        

                    }

                    if ( totalReords == totalValue ) {

                        helper.successHandler(res, {
                            payload : {
                                messageIdsArray : newMesgArray
                            }
                        });

                    } else {

                        helper.successHandler(res, {
                            code 	: 'UIS-E1000',
                            message : 'Somthing went wrong.',
                            status  : false
                        });

                    }

                } else {
                    console.log('deleteMessgaeFromMe in ========================>>>>777777777777')

                    let mIds         = messageIds ;
                    let totalReords  = mIds.length ;
                    let totalValue   = 0;
                
                    for ( let i = 0; i < mIds.length ; i++ ) {
                        console.log('deleteMessgaeFromMe in ========================>>>>8888888888888')

                        let mesageId = mIds[i].m_id ;
                       
                            console.log('deleteMessgaeFromMe in ========================>>>>9999999999999999999')

                            let obj = {
                                    co_id    :  mesageId,
                                    userUuid :  userUuid
                                };
                            // let result = await _chatModelObj.deleteMessagesAll(obj);
                            let result = await _chatModelObj.deleteEveryoneMessages(obj);
                            if ( result ) {

                                newMesgArray.push(mesageId);

                                totalValue++ ;

                            }

                        

                    }

                    if ( totalReords == totalValue ) {
                        console.log('deleteMessgaeFromMe in ========================>>>>0000000000000000000')

                        helper.successHandler(res, {
                            payload : {
                                messageIdsArray : newMesgArray
                            }
                        });

                    } else {

                        helper.successHandler(res, {
                            code 	: 'UIS-E1000',
                            message : 'Somthing went wrong.',
                            status  : false
                        });

                    }

                }

            }
            
        } else {

            helper.successHandler(res, {
                code    : 'UIS-E1003',
                message : 'somthing went wrong.',
                status  : false
            });   

        }
         
    } else {

        helper.successHandler(res, {
            code    : 'UIS-E1004',
            message : 'All fields are mandatory.',
            status  : false
        }); 

    }

} else {

    let obj = {
        status 		: false,
        code        : "UIS-E1005",
        message		: "Unauthorized Error."
    };

    helper.successHandler(res, obj, 401);

}


}

/**
 * Function     : sendNotificationUser
 * Description  : Common function for using send notification to user.
 * Developed By : 
 * Modified By  : 
 */
 chats.sendNewMessageSocket = async function ( receiverUuid  ) {

    let deferred    = q.defer();
    let toSocketId  = await common.getUserSocketId(receiverUuid , false);

    if ( toSocketId && toSocketId.length > 0 ) {

        let sendObj = { 
            action : 'NEW-MESSAGE', 
            data   : {}
        };

        for ( var i = 0; i < toSocketId.length ; i++ ) {
            io.to(toSocketId[i].uc_socket_id).emit('call' , sendObj);
        }
       
        deferred.resolve(true);

    } else {
        deferred.resolve(false);
    }
    return deferred.promise;
}

/**
* This function is using to add text  in table
* @param     : 
* @returns   :
* @developer : 
*/
chats.textMessage = async ( req , res ) => {

    let	userId            = await helper.getUUIDByTocken(req);

    if ( userId ) {

        if ( req && req.body ) {
            console.log('req.bodyreq.bodyreq.body====>>',req.body)
            let result = await _chatModelObj.textMessage(req.body, userId);
            console.log('result result result ==========>>>',result)
            if( result ){

                let obj = {
                    code 	: 'AUS-E1001',
                    message : 'Operation performed successfully.',
                    status  : true,
                    payload : {data :result}
                };
                helper.successHandler(res, obj);
    

            } else {

                let obj = {
                    code 	: 'AUS-E1001',
                    message : 'Something Went wrong',
                    status  : false
                };
                helper.successHandler(res, obj);
    

            }

        } else {

            let obj = {
                code 	: 'AUS-E1001',
                message : 'Please fill mandatory fields.',
                status  : false
            };
            helper.successHandler(res, obj);

        }

    } else {

        helper.successHandler(res, {
            status 		: false,
            code        : "UIS-E1003",
            message		: "Unauthorized Error."
        }, 401);   

    }
}

/**
 *  Set || Check Chat Password
 * @param        :
 * @returns       :
  * @developer : Dushyant Sharma
 */
chats.setCheckChatPassword = async function(req, res) {
    console.log('body===========================>>>>>>>>>>',req.body);
	let userId = await helper.getUUIDByTocken(req);

	if ( req && req.body && req.body.type && req.body.password && req.body.userUuId && req.body.conUuId && req.body.otherUserUuId   && req.body.otherUserUuId != 'null' ) {
		
		if ( userId != null && userId != '' ) {

            let result = '';

            if( req.body.type == 'CHECK'  || req.body.type == 'FILECHECK' ||  req.body.type == 'REMOVE' ){
                
               result =  await _chatModelObj.checkPassword(req.body,userId);
            }
            // console.log('result=================>>>>>>111',req.body,'asdasdsadasdasd=====>>',result)
            if ( req.body.type ==  'SET' ||  req.body.type == 'SETEMOJI'  ){

                result = await _chatModelObj.setChatPassword(req.body, userId);
            }
            
            // console.log('result ===================>>>>>>>>>>>>>.',result);
			if ( result && result.status != false ) {

                if( req.body.type =  'SET' ){

                    let socketSendData =  {
                        action: 'PRIVATE-MESSAGE',
                        data:  {
                    
                            converstionUuId  : req.body.conUuId,
                            otherUserUuId    : req.body.otherUserUuId,
                            type             : 'START',
                            senderUuid       : req.body.userUuId ,
                    
                        },
                    };
                    
                    let socket = io.to(req.body.conUuId).emit('call' , socketSendData);
                    // console.log('sockrt sockrt sockrt sockrt========================>>',socket)
                    
                    let aa = chats.sendNewMessagePrivateSocket(req.body.otherUserUuId);

                }
                
				helper.successHandler(res,{
                    payload : result.payload
                });

			} else {

				helper.successHandler(res, {
                    status  : false,
					message : result.message,
                    payload : result.payload

				}, 200);
			}
		} else {

			let obj = {
				code 	: 'CP-E1001',
				message : 'Something went wrong.',
				status  : false
			};
			helper.errorHandler(res, obj, 500);
		}
	} else {
		let obj = {
			code 	: 'AAA-E2001',
			message : 'All fields are required.',
			status  : false
		};
		helper.successHandler(res, obj, 200);
	}
}

/**
 * Function     : sendNotificationUser
 * Description  : Common function for using send notification to user.
 * Developed By : 
 * Modified By  : 
 */
chats.sendNewMessagePrivateSocket = async function ( receiverUuid  ) {
    console.log('sendNewMessagePrivateSocket=======>>>>>>',receiverUuid)
    let deferred    = q.defer();
    let toSocketId  = await common.getUserSocketId(receiverUuid , false);

    if ( toSocketId && toSocketId.length > 0 ) {

        let sendObj = { 
            action : 'PRIVATE-MESSAGE', 
            data   : {}
        };

        for ( var i = 0; i < toSocketId.length ; i++ ) {
            io.to(toSocketId[i].uc_socket_id).emit('call' , sendObj);
        }
       
        deferred.resolve(true);

    } else {
        deferred.resolve(false);
    }
    return deferred.promise;
}

/**
 * SET Private Chat  password 
 * @param        :
 * @returns       :
  * @developer : Dushyant Sharma
 */
chats.endPrivateChat = async function(req, res) {
    console.log('body===========================>>>>>>>>>>',req.body);
	let userId = await helper.getUUIDByTocken(req);

	if ( req && req.body  && req.body.conUuId ) {
		
		if ( userId != null && userId != '' ) {

			let result = await _chatModelObj.endPrivateChat(userId, req.body);
            console.log('result ===================>>>>>>>>>>>>>.',result);
			if ( result && result.status != false ) {

                let socketSendData =  {
                    action: 'PRIVATE-MESSAGE',
                    data:  {
            
                        converstionUuId  : req.body.conUuId,
                        otherUserUuId    : req.body.otherUserUuId,
                        type             : 'END',
                        senderUuid       : req.body.userUuId ,
                
                    },
                };
                
                let socket = io.to(req.body.conUuId).emit('call' , socketSendData);
                console.log('sockrt sockrt sockrt sockrt========================>>',socket)
                
                let aa = chats.sendNewMessagePrivateSocket(req.body.otherUserUuId);

				helper.successHandler(res);

			} else {

				helper.successHandler(res, {
                    status  : false,
				}, 200);
			}
		} else {

			let obj = {
				code 	: 'CP-E1001',
				message : 'Something went wrong.',
				status  : false
			};
			helper.errorHandler(res, obj, 500);
		}
	} else {
		let obj = {
			code 	: 'AAA-E2001',
			message : 'All fields are required.',
			status  : false
		};
		helper.successHandler(res, obj, 200);
	}
}


/**
* Used to channel broadcast Video.
* @developer   : Dushyant Sharma
* @modified    :
* @params      :
*/

chats.recordChatVideo = async  (req, res) => {

    console.log('body body  body  body  body recordChatVideo ===========>>',req.body);

    let userId  = await helper.getUUIDByTocken(req),
    conObj      = await constant.getConstant(),
    startData   = null;
    let uuid     = uuidv1(Date.now());


    if (userId) {

        let userUuid = await common.getRowId(userId,'u_id','u_uuid','user');

        if( req.body && req.body.conUuid && req.body.receiverUuid ){

            let agoraToken   =  helper.agoraToken({channelId : uuid,uid:userId,isPublisher:true});

            if ( agoraToken ) {

                let recordToken  = helper.agoraToken( {  channelId : uuid } );

                if ( recordToken && recordToken != null ) {

                    startData = await liveBroadcastModel.recordingAcquire( { token : recordToken.token, contestUuid : uuid } );

                }
                
                let data = {
                    agoraToken            : agoraToken.token,
                    agoraUid              : agoraToken.uid,
                    channelName           : agoraToken.channelName,
                    chatUuid              : uuid,
                    role                  : agoraToken.role,
                    startData             : startData,


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
 * This function is used to stop Chat Recording.
 * @param     : contestUuid, sid, resource, mode
 * @returns   :
 * @developer : 
 */
chats.stopChatRecording = async function(req, res) {

    // console.log('req.body 11111111 ================================111111======= >>>> ', req.body );

    let userId          = await helper.getUUIDByTocken(req),
    conObj                  = await constant.getConstant();
    let uuid     = uuidv1(Date.now());
    let  currentDateTime = await helper.getPstDateTime('timeDate');
    let userUuid = await common.getRowId(userId,'u_id','u_uuid','user');

    if ( req && req.body && req.body.conUuid && req.body.sid && req.body.resourceId  ) {

        let conUuid   = await common.getRowId(req.body.messageId,'co_parent_id', 'co_uuid', 'conversation_onetoone' );
        // console.log('conUuid=============>>>>>>>>>>>>>>>',conUuid);
        if( conUuid && conUuid != '' ){

            helper.successHandler(res, {
            
                status      : false,
                code 	    : "UELS-E1002",
                message		: "Already Record Video"
    
            });

        } else {

            let object = {
                co_uuid                     : req.body.chatUuid,
                co_fk_con_uuid              : req.body.conUuid,
                co_fk_sender_u_uuid         : req.body.receiverUuid,
                co_parent_id                : req.body.messageId,
                co_msg_type                 : 'VIDEO',
                co_fk_receiver_u_uuid       : userUuid,
                co_created_at               : currentDateTime,
                co_is_private_chat          : '1',
                co_is_chat_video            : '1',
    
            }
            if( req.body.messageId && req.body.messageId != ''){

                let wrongImageId = await common.getRowById(req.body.messageId,'co_id','co_fk_cpm_id','conversation_onetoone',true);
                console.log('wrongImageId===============>>>>>>1111111111111main',wrongImageId);
                if( wrongImageId && wrongImageId != '' ){
                    object.co_fk_cpm_id = wrongImageId;

                }
            }
             
            let insertedId = await common.insert('conversation_onetoone', object);
            if( insertedId  ){
    
                req.body.chatUuid = await common.getRowById(insertedId,'co_id','co_uuid','conversation_onetoone');            
                let stopBroadcast = await _chatModelObj.stopChatRecording( req.body, userUuid );
                // console.log('deleteMessageFromReceiver=======>>>11111111111',stopBroadcast);
    
                let obj = {
                    co_id    :  req.body.messageId,
                    userUuid :  userUuid
                };
                
                let result = await _chatModelObj.deleteMessages(obj);
              
                // console.log('deleteMessageFromReceiver=======>>>333333333',result);
                let sqlUserData  =  "SELECT u_id , u_uuid , u_name , CONCAT('" + conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH +"', u_image ) FROM user  WHERE u_uuid = ? ";
                let  resultUserData  = await common.commonSqlQuery(sqlUserData ,[userUuid],true);

                if ( stopBroadcast && stopBroadcast != false ) {

                    let socketSendData =  {
                        action: 'CON-MESSAGE',
                        data:  {

                            u_id             : resultUserData[0].u_id,
                            u_uuid           : userUuid,
                            u_name           : resultUserData[0].u_name,
                            u_image          : resultUserData[0].u_image,
                            message          : '',
                            mySocketId       : '',
                            converstionUuId  : req.body.conUuid,
                            SenderuserUuid   : userUuid,
                            fileArry         : stopBroadcast.mediaData,
                            fileType         : 'VIDEO',
                            isPrivateChat    : '1',
                            messageIsPaid    : '0',
                            senderUuid       : req.body.receiverUuid ,

                        },
                    }

                    let socket = io.to(req.body.conUuid).emit('call' , socketSendData);
                    // console.log('sockrt sockrt sockrt sockrt========================>>',socket)

                    let aa = chats.sendNewMessageSocket(req.body.receiverUuid);
    
                    helper.successHandler( res, {});
        
                } else {
        
                    helper.errorHandler( res, {
                        status : false
                    });
                }
    
            } else {
                helper.errorHandler( res, {
                    status : false
                });
    
            }
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
 * Fogot password controller
 * @param        :
 * @returns       :
  * @developer : 
 */
chats.forgotChatPassword = async (req, res) => {
    console.log('sdfsdfsfsfsfsfsdf=========>>>>',req)
	let userId          = await helper.getUUIDByTocken(req);
    console.log('sdfsdfsfsfsfsfsdfs===============>>>>>',userId);

      let  userUuid = await common.getRowId(userId,'u_id','u_uuid','user');
        console.log('sdfsdfsfsfsfsfsdfs===============>>>>>',userUuid);
	if ( req.body && req.body.email != '' ) {

		let result  = await _chatModelObj.forgotChatPassword(req.body);
        if( result ){
            helper.successHandler(res);

        } else {
            helper.errorHandler(res, {
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
 * Fogot password controller
 * @param        :
 * @returns       :
  * @developer : 
 */
chats.removeChatPassword = async (req, res) => {

    console.log('zxcczcxcxzccczczxczc==========>>>>>',req.body)
	let userId          = await helper.getUUIDByTocken(req),
        userUuid = await common.getRowId(userId,'u_id','u_uuid','user');

	if ( userUuid && userUuid != '' ) {

        let userPassword =  await common.getRowById(userId, 'u_id', 'u_private_chat_password', 'user');

        if( passwordHash.verify(req.body.password, userPassword) ) {

            let result  = await _chatModelObj.removeChatPassword(userId);

            if( result && result.status != false ){
                helper.successHandler(res,{
                    payload : result.payload
                });

            } else {
                helper.errorHandler(res, {
                    status  : false
                }, 200);
            } 
        } else {

            helper.errorHandler(res, {
                status  : false,
                message : 'Wrong Password'
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
 * SET Private Chat  password 
 * @param        :
 * @returns       :
  * @developer : Dushyant Sharma
 */
chats.deleteConversation = async function(req, res) {
    console.log('deleteConversation===========================>>>>>>>>>>',req.body);
	let userId = await helper.getUUIDByTocken(req);

	if ( req && req.body  && req.body.conUuId ) {
		
		if ( userId != null && userId != '' ) {

			let result = await _chatModelObj.deleteConversation(userId, req.body);
            console.log('deleteConversation ===================>>>>>>>>>>>>>.',result);
			if ( result && result.status != false ) {

				helper.successHandler(res);

			} else {

				helper.successHandler(res, {
                    status  : false,
				}, 200);
			}
		} else {

			let obj = {
				code 	: 'CP-E1001',
				message : 'Something went wrong.',
				status  : false
			};
			helper.errorHandler(res, obj, 500);
		}
	} else {
		let obj = {
			code 	: 'AAA-E2001',
			message : 'All fields are required.',
			status  : false
		};
		helper.successHandler(res, obj, 200);
	}
}





module.exports = chats;
