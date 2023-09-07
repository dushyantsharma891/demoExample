


const passwordHash 		= require('password-hash'),
    pool 	            = require('../../configCommon/config/pool'),
    // spacetime           = require('spacetime'),
    q                   = require('q'),
    // fs                  = require('fs'),
    {v1: uuidv1}        = require('uuid'),
    axios               = require("axios"),
    common              = require('./configCommon'),
    constant            = require('../../configCommon/config/constants'),
    commonHelper        = require('../../configCommon/helpers/index'),
    notificationObj     = require('../controllers/notification'),
    helper			    = require('../../configCommon/helpers');
// const { updateData } = require('../../configCommon/helper/mongo_helper');

let liveBroadcastModel = {};

/**
* Used to contest insert broadcast Data
* @developer   : Dushyant Sharma
* @modified    :
* @params      :
*/
liveBroadcastModel.insertContestBroadcast = async (body, userId) => {

    let deferred            = q.defer(),
          uuid              = uuidv1(Date.now()),
          insertedDate      = new Date();

  
    if( body && userId ) {
  
      let userUuid = await common.getRowId(userId,'u_id','u_uuid','user'),
           object   = {
  
          lb_fk_ct_uuid : body.contestUuid,
          lb_fk_u_uuid  : userUuid,
          lb_uuid       : uuid,
          lb_status     : body.status ? body.status : 'LIVE',
          lb_created	: insertedDate
         };
        
          let insertedId = await common.insert('live_broadcast',object, true );
  
          console.log('insertedId insertedId insertedId',insertedId );
  
          if ( insertedId && insertedId > 0 ){
  
              body.userType   = 'H';
              let result      =   await liveBroadcastModel.insertJoinBroadcast(body, userId);
  
              console.log('result result result result result result result ',result)
              deferred.resolve( insertedId );
  
          } else {
  
              deferred.resolve( false );
  
          }
  
     
    } else {
  
      deferred.resolve( false );
    }
  
    return deferred.promise
}

 /**
* Used to channel insert broadcast Data
* @developer   : Dushyant Sharma
* @modified    :
* @params      :
*/
liveBroadcastModel.insertJoinBroadcast = async (body, userId) => {

    let deferred            = q.defer(),
          uuid              = uuidv1(Date.now()),
          insertedDate      = new Date();;
  
    if( body && userId ) {
  
        let userUuid       = await common.getRowId(userId,'u_id','u_uuid','user'),
            broadCastSql   = 'SELECT lb_uuid FROM live_broadcast WHERE lb_fk_ct_uuid = ? AND lb_status ="LIVE"',
            broadCastUuid  = await common.commonSqlQuery(broadCastSql,[body.contestUuid]);
        if( broadCastUuid && broadCastUuid != ''  ){

            object   = {
    
                lbud_fk_ct_uuid : body.contestUuid,
                lbud_fk_lb_uuid : broadCastUuid[0].lb_uuid,
                lbud_fk_u_uuid  : userUuid,
                lbud_uuid       : uuid,
                lbud_user_type  : body.userType ? body.userType : 'V',
                //   lbud_status     : body.status,
                lbud_created	  : insertedDate
            };

            let sql = 'SELECT lbud_id FROM live_broadcast_users_detail WHERE lbud_fk_ct_uuid = ? AND lbud_fk_lb_uuid = ? AND lbud_fk_u_uuid = ? AND lbud_status = "live"'
                isExist = await common.commonSqlQuery(sql,[body.contestUuid,broadCastUuid[0].lb_uuid,userUuid],true);

            if( isExist == '' ){
        
                let insertedId = await common.insert('live_broadcast_users_detail',object);

                if ( insertedId ){
                    
                 deferred.resolve( insertedId );
        
                } else {
        
                 deferred.resolve( false );
        
                }
                
            } else {

                deferred.resolve( true );

            }
        } else {

            deferred.resolve( false );

        }
    
  
    } else {
  
      deferred.resolve( false );
    }
  
    return deferred.promise
}


/**
* Used to  broadcast  acquire
* @developer   : 
* @modified    :
* @params      : channelUuid, uid
*/

liveBroadcastModel.recordingAcquire = async ( body ) => {
    // console.log('We are hear ===================>>>>>>>recordingAcquire',body);

    if ( body ) {

        let conObj   = await constant.getConstant();

            agoraApiUrl = conObj.AGORA_API_URL,
            appID       = conObj.AGORA_APP_ID,
            restKey     = conObj.AGORA_REST_KEY,
            restSecret  = conObj.AGORA_SECRET_KEY;
            
        const Authorization = `Basic ${Buffer.from(`${restKey}:${restSecret}`).toString("base64")}`;
        
        try {

            const acquire 		= await axios.post(

            `${agoraApiUrl}${appID}/cloud_recording/acquire`,

            {
                cname   : body.contestUuid,
                uid		: '1111111111',

                clientRequest: {

                resourceExpiredHour: 24,
                },
            },
            { headers: { Authorization } }
            );
          
            body.resourceId =  acquire.data.resourceId
            let starts = await liveBroadcastModel.startVideoRecording( body );

            // console.log( "starts======>>>>>>>>", starts )
            return starts
     
        } catch (err) {
            console.log( "er================.....>>>>>>>>>", err );
            return false;

        } 
    } else {

        return false;
    }
}

/**
 * This function is used to start video recording.
 * @param     : resourceId, contestUuid, uid
 * @returns   :
 * @developer :
 **/

liveBroadcastModel.startVideoRecording = async ( body ) => {

    if ( body ) {
        // console.log('AAAAAAAAAA =========================> ', body);
        
        let conObj      = await constant.getConstant(),
            agoraApiUrl = conObj.AGORA_API_URL,
            appID       = conObj.AGORA_APP_ID,
            restKey     = conObj.AGORA_REST_KEY,
            restSecret  = conObj.AGORA_SECRET_KEY;
        
        const Authorization = `Basic ${Buffer.from(`${restKey}:${restSecret}`).toString("base64")}`;
       
        const resource      = body.resourceId,
        token               = body.token,
        mode                = 'mix';
   
        let data            = JSON.stringify({
            "cname"         : body.contestUuid,
            "uid"           : "1111111111",
            "clientRequest" : {
                "token"             : token,
                "recordingConfig"   : {
                    "channelType"       : 0,
                    "streamTypes"       : 2,
                    "audioProfile"      : 1,
                    "videoStreamType"   : 0,
                    "maxIdleTime"       : 120,
                    "transcodingConfig" : {
                        "width"             : 1080,
                        "height"            : 1920,
                        "fps"               : 30,
                        "bitrate"           : 3000,
                        "maxResolutionUid"  : "1",
                        "mixedVideoLayout"  : 1,                          
                    },
                    
                },
                "recordingFileConfig" : {
                    "avFileType"        : ["hls", "mp4"],
                },
                "storageConfig"     : {
                    "vendor"            : 1,
                    "region"            : 0,
                    "bucket"            : conObj.AWS_BUCKET_NAME,
                    "accessKey"         : conObj.AWS_ACCESS_KEY,
                    "secretKey"         : conObj.AWS_SECRET_ACCESS_KEY,
                    "fileNamePrefix"    : ["streams"]
                }
            }
        }),
        
            config = {
                method  : 'post',
                url     : agoraApiUrl + appID + '/cloud_recording/resourceid/' + resource + '/mode/' + mode + '/start',
                headers : { 
                    'Content-Type'    : 'application/json', 
                    'Authorization'   : Authorization
                },
                data    : data
            },

            start = await axios(config);
        // console.log('CCCCCCCCCCCCCCCCCCCCCCCCC start : =========================> ', start.data);
        return start.data;

        
    } else {
        return false;
    }
}


/**
 * Used to update recorded file name to database.
 * @param       : broadcastUuid, contestUuid 
 * @returns     :  
 * @developer   : 
 */
 liveBroadcastModel.stopLiveBroadcast = async ( body ) => {
        console.log('We are hear ===================>>>>>>>stopLiveBroadcast',body); 
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

                    cname : body.broadcastUuid,
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
    
                        filePath += folderPath + body.contestUuid + '/' + body.broadcastUuid + '/' + subFolderPath;
                    
                        // console.log("filePathfilePathfilePath=======>>>>>>",filePath);
    
                        let crtFolderObj = {
                            
                            sourcePath      : sourcePath,  
                            destinationPath : filePath,
                            fileName        : stopOne.data.sid + '_' + body.broadcastUuid,
                            // moveName        : body.broadcastUuid,
                            
                        };
                        let copyFile = await helper.copyFileWithInAWSBucket( crtFolderObj );
                        // console.log('We are hear ===================>>>>>>>copyFile',copyFile);
                        if ( copyFile ) {

                            // let thumbDataObj    = {
                            //     videoName       : newFile,
                            //     folderPath      : filePath,
                            //     folderUId       : body.contestUuid,
                            // };

                            // console.log("thumbDataObj===========>",thumbDataObj);

                            // let thumbnailData   = await helper.createThumbnailAWSBucket( thumbDataObj );

                            // // console.log( 'thumbnailData=========>>>>>>>', thumbnailData );

                            // if ( thumbnailData ) {

                                let addData = await liveBroadcastModel.updateBroadcastFileName( body );

                                // console.log ("addData ===========>>>>>>>",addData);

                                if ( addData && addData != '' ) {

                                    // console.log ("addData 111111=======1111====>>>>>>>",addData);

                                    let objRemove = {

                                        sId: stopOne.data.sid,
                                        path: 'streams',

                                    },
                                    removeStatus = await helper.removeAgoraRecodedVideo( objRemove );

                                    // console.log("removeStatus======--->>>>",removeStatus);

                                    if ( removeStatus ) {

                                        let thumbDataObj    = {
                                            videoName       : newFile,
                                            folderPath      : filePath,
                                            folderUId       : body.contestUuid,
                                        };
                                        let thumbnailData   = await helper.createThumbnailAWSBucket( thumbDataObj );

                                        console.log( 'thumbnailData=========>>>>>>>', thumbnailData );
                                        deferred.resolve( true );

                                    } else {

                                        console.log("elseeee1111111111111");
                                        deferred.resolve( false );

                                    }
                                } else {

                                    console.log("elseeeeeeeeeee222222222");
                                    deferred.resolve( false );

                                }

                            // } else {

                            //     console.log("elseeeeeeeeee3333333333333");
                            //     deferred.resolve( false );

                            // }
    
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
 liveBroadcastModel.updateBroadcastFileName = async ( body ) => {

    let deferred            = q.defer();
    
    // console.log( 'BODYBODYBODYBODYBODYBODYBODYBODYBODYBODYBODYBODYBODYBODY====================> ', body );

    if ( body && body.broadcastUuid ) {
        
        // console.log('innn iiiiiiiffffffffffffffffffffffffff ======================>>>>>>>>');

        let videoUuId       = body.sid + '_' + body.broadcastUuid,
            // broadcastStatus = body.status,
            videoExt        = '.m3u8',
            videoExtMp4     = '.mp4',
            thumbExt        = '.png',

            videoM3u8Name   = videoUuId + videoExt,
            // vidMp4Name      = videoUuId + videoExtMp4,
            vidMp4Name      = videoUuId,
            thumbName       = videoUuId + '_0' + thumbExt,

            sql             = 'UPDATE live_broadcast SET lb_attachment = ?, lb_video_thumbnail = ?  WHERE lb_uuid = ?';
            
            // console.log( "sqlQuery====>>>>>>>", sql );

        let updateRes   = await common.commonSqlQuery( sql, [ videoM3u8Name, thumbName, body.broadcastUuid ], true );

         // console.log("updateData=======>>>>updatevideotodb>>>>>", updateRes );

        if ( updateRes ) {

            let obj = {

                videoFullName   : videoM3u8Name,
                videoName       : videoUuId,
                agoraVidMp4Name : vidMp4Name,
        
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
 * This function is using to stop Broadcast 
 * @param     :   
 * @returns   : 
 * @developer : 
 */
 liveBroadcastModel.stopBroadcast =  async function( body ) {

    let deferred   =  q.defer();

    if ( body && body.contestUuid && body.broadcastUuid ) {
        
        let sql     = "UPDATE live_broadcast SET ? WHERE lb_fk_ct_uuid= ? AND lb_uuid = ?",
            obj     = {
                lb_status : 'ENDLIVE'
            },
            res     = await common.commonSqlQuery(sql,[obj,body.contestUuid,body.broadcastUuid],true);
        //    console.log('res res res ',res)
        if ( res ) {

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
 * This function is using to check Live Or Not 
 * @param     :   
 * @returns   : 
 * @developer : 
 */
 liveBroadcastModel.checkLiveOrNot =  async ( body, userId ) => {
    console.log('checkLiveOrNot===============>>>>>',body);
    let deferred   =  q.defer();

    if ( userId && body && body.contestUuid ) {

        let sql          = 'SELECT ct_id, ct_uuid, ct_views_require, ct_point_type_earn, ct_contestType,ct_points, ct_views,ct_viewer_count, ct_is_location_based, ct_latitude, ct_longitude, ct_contest_distance FROM contests WHERE ct_uuid = ?',
            contestData  = await common.commonSqlQuery(sql,[body.contestUuid],true),
            isLiveOrNot  = await common.getRowId(body.contestUuid,'lb_fk_ct_uuid','lb_status','live_broadcast'),
            obj          = {};
        if( contestData && contestData.length > 0 ){

            let  sql = 'SELECT ctv_id FROM contest_viewers WHERE ctv_fk_u_id = ? AND ctv_fk_ct_id = ?',
                userData = await common.commonSqlQuery(sql,[userId,contestData[0].ct_id]);
            if( userData && userData != '' ){

                deferred.resolve(true);

            } else {

                let letLngObj = {
                    contestLat        : contestData[0].ct_latitude,
                    contestLog        : contestData[0].ct_longitude,
                    userId            : userId,
                    contestsDistance  : contestData[0].ct_contest_distance,
                },
                userOnLocation = await liveBroadcastModel.userIsNearLocation(letLngObj);
    
                let userAdsPoints     = await common.getRowId(userId,'u_id','u_ads_points','user');
                let userStoresPoints  = await common.getRowId(userId,'u_id','u_stores_points','user');

                    console.log('userPoints userPoints userPoints=====>>>>>>',userAdsPoints,userStoresPoints);
                if( contestData[0].ct_views_require == 'YES' || contestData[0].ct_contestType == 'POINTS' || contestData[0].ct_is_location_based == 'YES' ) {
    
                    let  isFullOrNot = 'NOTFULL';
    
                    if( contestData[0].ct_views_require == 'YES' ){
    
                        let  sql = 'SELECT ctv_id FROM contest_viewers WHERE ctv_fk_u_id = ? AND ctv_fk_ct_id = ?',
                        userData = await common.commonSqlQuery(sql,[userId,contestData[0].ct_id]);
    
                        if( userData && userData.length > 0 ){
    
                            isFullOrNot == 'NOTFULL'
    
                        } else {
    
                            if( contestData[0].ct_views != contestData[0].ct_viewer_count ){
    
                                isFullOrNot = 'NOTFULL';
        
                            } else {
        
                                isFullOrNot = 'FULL';
        
                            }
    
                        }
                        
                       
                    }
                   
                    if( isFullOrNot == 'NOTFULL' ){
     
                        if( contestData[0].ct_contestType == 'POINTS' && contestData[0].ct_is_location_based == 'YES'  ){
                            console.log('checkLiveOrNot===============>>>>>1111111111111111');
                            if( contestData[0].ct_point_type_earn == 'STORE' ){

                                if( userStoresPoints != '0' &&  userStoresPoints >= contestData[0].ct_points ){
        
                                    if( contestData[0].ct_contest_distance >= userOnLocation ){
        
                                        let insertViewerData = await liveBroadcastModel.insertViewerData(userId, contestData[0].ct_id);
            
                                        if( insertViewerData ){
                                            
                                            obj = {
                                                status  : true,
                                                message : 'Contest Join successfully',
                                                data    : {userJoinedContest : 'YES'}
                                            };
                                            deferred.resolve(obj)
                    
                                        } else {
                    
                                            if ( isLiveOrNot && isLiveOrNot == 'LIVE' ) {
                                                obj = {
                                                    status  : true,
                                                    message : 'Some One is Live',
                                                    code    : 'AAA-0005'
                                                };
                                                deferred.resolve(obj)
                                    
                                            } else {
                                    
                                                obj = {
                                                    status  : false,
                                                    message : 'Contest Not Started Yet'
                                                };
                                                deferred.resolve(obj)
            
                                            };
                    
                                        }
                                    } else {
        
                                        obj = {
                                            status  : false,
                                            message : 'Please reach the contest location to join this contest . ',
                                        };
                                        deferred.resolve(obj);
            
            
                                    }
        
                                } else {
        
                                    obj = {
                                        status  : false,
                                        message : 'You have insufficient points to join this contest. Please reach the store location to get points.'
                                    };
        
                                    deferred.resolve(obj)
                                    
                                }

                            } else {

                                if( userAdsPoints != '0' &&  userAdsPoints >= contestData[0].ct_points ){
        
                                    if( contestData[0].ct_contest_distance >= userOnLocation ){
        
                                        let insertViewerData = await liveBroadcastModel.insertViewerData(userId, contestData[0].ct_id);
            
                                        if( insertViewerData ){
                                            
                                            obj = {
                                                status  : true,
                                                message : 'Contest Join successfully',
                                                data    : {userJoinedContest : 'YES'}
                                            };
                                            deferred.resolve(obj)
                    
                                        } else {
                    
                                            if ( isLiveOrNot && isLiveOrNot == 'LIVE' ) {
                                                obj = {
                                                    status  : true,
                                                    message : 'Some One is Live',
                                                    code    : 'AAA-0005'
                                                };
                                                deferred.resolve(obj)
                                    
                                            } else {
                                    
                                                obj = {
                                                    status  : false,
                                                    message : 'Contest Not Started Yet'
                                                };
                                                deferred.resolve(obj)
            
                                            };
                    
                                        }
                                    } else {
        
                                        obj = {
                                            status  : false,
                                            message : 'Please reach the contest location to join this contest . ',
                                        };
                                        deferred.resolve(obj);
            
            
                                    }
        
                                } else {
        
                                    obj = {
                                        status  : false,
                                        message : 'You have insufficient points to join this contest. Please watch ads to earn points'
                                    };
                                
                                    deferred.resolve(obj)
                                    
                                }
                            }
    
                        } else if ( contestData[0].ct_is_location_based == 'YES' ){
                            console.log('checkLiveOrNot===============>>>>>22222222222222222');
    
                            if(contestData[0].ct_contest_distance >= userOnLocation){
                              
                                let insertViewerData = await liveBroadcastModel.insertViewerData(userId, contestData[0].ct_id);
    
                                if( insertViewerData ){
        
                                    obj = {
                                        status  : true,
                                        message : 'Contest Join successfully',
                                        data    : {userJoinedContest : 'YES'}
                                    };
                                    deferred.resolve(obj)
            
                                } else {
            
                                    if ( isLiveOrNot && isLiveOrNot == 'LIVE' ) {
                                        obj = {
                                            status  : true,
                                            message : 'Some One is Live',
                                            code    : 'AAA-0005'
                                        };
                                    deferred.resolve(obj)
                            
                                    } else {
                            
                                        obj = {
                                            status  : false,
                                            message : 'Contest Not Started Yet'
                                        };
                                        deferred.resolve(obj)
        
                                    };
            
                                }
    
                            } else {
                                obj = {
                                    status  : false,
                                    message : 'Please reach the contest location to join this contest . ',
                                };
                                deferred.resolve(obj);
                            }
                           
    
                        } else if( contestData[0].ct_contestType == 'POINTS' ){
                            console.log('checkLiveOrNot===============>>>>>3333333333333');
                            if( contestData[0].ct_point_type_earn == 'STORE' ){

                                if( userStoresPoints != '0' && userStoresPoints >= contestData[0].ct_points ){
    
                                    let insertViewerData = await liveBroadcastModel.insertViewerData(userId, contestData[0].ct_id);
        
                                    if( insertViewerData ){
        
                                        obj = {
                                            status  : true,
                                            message : 'Contest Join successfully',
                                            data    : {userJoinedContest : 'YES'}
                                        };
                                    deferred.resolve(obj)
                
                                    } else {
                
                                        if ( isLiveOrNot && isLiveOrNot == 'LIVE' ) {
                                            obj = {
                                                status  : true,
                                                message : 'Some One is Live',
                                                code    : 'AAA-0005'
                                            };
                                        deferred.resolve(obj)
                                
                                        } else {
                                
                                            obj = {
                                                status  : false,
                                                message : 'Contest Not Started Yet'
                                            };
                                            deferred.resolve(obj)
        
                                        };
                
                                    }
    
                                } else {

                                    obj = {
        
                                        status  : false,
                                        message : 'You have insufficient points to join this contest. Please reach the store location to get points.'
                                    };

                                    deferred.resolve(obj)
                                    
                                }
                            } else {

                                if( userAdsPoints != '0' && userAdsPoints >= contestData[0].ct_points ){
    
                                    let insertViewerData = await liveBroadcastModel.insertViewerData(userId, contestData[0].ct_id);
        
                                    if( insertViewerData ){
        
                                        obj = {
                                            status  : true,
                                            message : 'Contest Join successfully',
                                            data    : {userJoinedContest : 'YES'}
                                        };
                                    deferred.resolve(obj)
                
                                    } else {
                
                                        if ( isLiveOrNot && isLiveOrNot == 'LIVE' ) {
                                            obj = {
                                                status  : true,
                                                message : 'Some One is Live',
                                                code    : 'AAA-0005'
                                            };
                                        deferred.resolve(obj)
                                
                                        } else {
                                
                                            obj = {
                                                status  : false,
                                                message : 'Contest Not Started Yet'
                                            };
                                            deferred.resolve(obj)
        
                                        };
                
                                    }
    
                                } else {
                                    obj = {
        
                                        status  : false,
                                        message : 'You have insufficient points to join this contest . Please watch ads to earn points'
                                    };

                                    deferred.resolve(obj)
                                    
                                }

                            }
    
    
                        }  else {
    
                            console.log('We are hear ===================>>>>>>>in else');
    
                        }
    
                    } else {
                        obj = {
                            status  : false,
                            message : 'contest IS Full'
                        };
                        deferred.resolve(obj);
    
                    }
    
                } else {
                    console.log('checkLiveOrNot===============>>>>>else else else ');
    
                    let insertViewerData = await liveBroadcastModel.insertViewerData(userId, contestData[0].ct_id);
    
                    if( insertViewerData ){
    
                        obj = {
                            status  : true,
                            message : 'Contest Join successfully',
                            data    : {userJoinedContest : 'YES'}
                        };
                        deferred.resolve(obj)
    
                    } else {
    
                        if ( isLiveOrNot && isLiveOrNot == 'LIVE' ) {
                            obj = {
                                status  : true,
                                // message : 'Some One is Live'
                            };
                            deferred.resolve(obj)
                
                        } else {
                
                            obj = {
                                status  : false,
                                message : 'Contest Not Started Yet'
                            };
                            deferred.resolve(obj)
    
                        };
    
                    }
    
                }      

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
 * This function is using to insert Viewer Data
 * @param     :   
 * @returns   : 
 * @developer : 
 */
 liveBroadcastModel.userIsNearLocation =  async ( dataObj )=> {

    console.log('userIsNearLocation userIsNearLocation userIsNearLocation',dataObj);
   
    let deferred   =  q.defer();
    const distFrom = require('distance-from');
			
    if ( dataObj.contestLat && dataObj.contestLog && dataObj.userId && dataObj.contestsDistance ) {

        let userDataSql = 'SELECT u_latitude, u_longitude FROM user WHERE u_id = ?',
        userDataData    = await common.commonSqlQuery(userDataSql, [dataObj.userId]);

        if( userDataData && userDataData.length > 0 ){
            let latLng1 = [dataObj.contestLat,dataObj.contestLog],
                latLng2 = [userDataData[0].u_latitude,userDataData[0].u_longitude];
            let calculatedDistance = distFrom(latLng1).to(latLng2).in('m'); 
            // km || kilometer || kilometers 
            //  m || meter || meters
            // cm || centimeter || centimeters
            // mi || mile || miles
            // ft || feet
            // in || inch || inches
            // yd || yard || yards

            console.log('calculatedDistance ======>>>>',calculatedDistance)
            deferred.resolve(calculatedDistance);


        } else {

            deferred.resolve(false);
        }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise; 
}


function distance(lat1, lon1, lat2, lon2, unit) {
    console.log('====>>',lat1, lon1, lat2, lon2, unit)

	if ((lat1 == lat2) && (lon1 == lon2)) {
		return 0;
	}
	else {
		var radlat1 = Math.PI * lat1/180;
		var radlat2 = Math.PI * lat2/180;
		var theta = lon1-lon2;
		var radtheta = Math.PI * theta/180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;
		if (unit=="K") { dist = dist * 1.609344 }
		if (unit=="N") { dist = dist * 0.8684 }
        if (unit=="M") { dist = dist * 1000 }
        // var e = d * 1000 //m
		return dist;
    }
    
}


/**
 * This function is using to insert Viewer Data
 * @param     :   
 * @returns   : 
 * @developer : 
 */
 liveBroadcastModel.insertViewerData =  async ( userId, contestId )=> {
    console.log('insertViewerData============>>>>>>>',userId, contestId)
    let deferred   =  q.defer(),
    conObj         = await constant.getConstant();

    if ( userId && contestId ) {

        let insertData = {
            ctv_fk_u_id  :  userId,
            ctv_fk_ct_id :	contestId
        },
        isExistSql =  'SELECT ctv_id FROM contest_viewers WHERE ctv_fk_ct_id = ? AND ctv_fk_u_id =? ',
        isExist    =  await common.commonSqlQuery(isExistSql, [contestId,userId]);
        if( isExist && isExist.length > 0 && isExist != '' ){
            deferred.resolve(false);
            console.log('asdsadadadsdasdadasddsad')
        } else {

            let  insert    = await common.insert('contest_viewers',insertData);
        
            if( insert && insert != '' ){

                let reserverUserId = await common.getRowId(contestId,'ct_id','ct_fk_u_id','contests');
                let contestName    = await common.getRowId(contestId,'ct_id','ct_name','contests');
                let userName       = await common.getRowId(userId,'u_id','u_name','user');
                let userImage      = await common.getRowId(userId,'u_id','u_image','user');
                userImage  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + userImage;

                let deviceTokenData = await common.getUserDeviceTokens(reserverUserId);
                console.log('deviceTokenData=====>>>>>>>>>>>222222',deviceTokenData);

                if( deviceTokenData && deviceTokenData.length > 0 ){

                    let memberDeviceToken = [];

                    for ( let i = 0; i < deviceTokenData.length; i++ ) {
                        memberDeviceToken.push(deviceTokenData[i].ud_token);
                    }

                    console.log('deviceTokenData=====>>>>>>>>>>>3333333',deviceTokenData);
                    let messageData = userName + ' joined ' + contestName + ' contest.';
                
                    const notificationObjData = {
                        registration_ids          : memberDeviceToken,
                        notification: {
                            title: 'Join Contest',
                            body:  messageData,
                            user_name: userName,
                            image_url: userImage,
                          },
                          data: {
                            score           : '850',
                            image_url       : userImage,
                            user_name       : userName,
                            title           : 'Join Contest',
                            body            :  messageData,
                          },
                    };

                    let sendNotification = notificationObj.sendFcmNotification(notificationObjData,deviceTokenData)
                }
                let viewsCountSql = 'SELECT ctv_id FROM contest_viewers WHERE ctv_fk_ct_id = ? '
                countData      = await helper.getDataOrCount(viewsCountSql,[contestId], 'L');

                if( countData && countData != '0' ){

                    let contestSql = 'SELECT ct_points, ct_contestType,ct_point_type_earn, ct_fk_u_id FROM contests WHERE ct_id = ?',
                    contestData = await common.commonSqlQuery(contestSql,[contestId]);

                    if( contestData && contestData.length > 0 ){

                        if(contestData[0].ct_contestType == 'POINTS' ){

                            let userStoresPoints = await common.getRowById(userId,'u_id','u_stores_points','user');
                            let userAdsPoints    = await common.getRowById(userId,'u_id','u_ads_points','user');
                            let updateUserPoints = 'UPDATE user SET ? WHERE u_id = ?'
                            if( contestData[0].ct_point_type_earn == 'ADS' ){

                                let userAdsPoint   = userAdsPoints - contestData[0].ct_points,
                                userTotalPoints    = userAdsPoint + userStoresPoints,
                                dtaObj             = {
                                    u_ads_points : userAdsPoint,
                                    u_total_points : userTotalPoints
                                };
                                console.log('userAdsPoint=============>>>>>>',userAdsPoint,'1111=====>>',userTotalPoints,'222222=======>>>>',dtaObj);
                                updatePoints     = await common.commonSqlQuery(updateUserPoints,[dtaObj,userId],true); 
                                console.log('updatePoints===========>>>',updatePoints);

                            }

                            if( contestData[0].ct_point_type_earn == 'STORE' ){

                               let userStoresPoint = userStoresPoints - contestData[0].ct_points,
                                userTotalPoints    = userStoresPoint  + userAdsPoints,
                                dtaObj             = {
                                    u_stores_points   : userStoresPoint,
                                    u_total_points    : userTotalPoints

                                },
                                updatePoints     = await common.commonSqlQuery(updateUserPoints,[dtaObj,userId],true); 
                                console.log('updatePoints===========>>>',updatePoints);
                            }
                            
                        } else {
                            console.log('We are hear ===================>>>>>>>ELSE ELSE 111111111111');

                        }

                    } else {
                        console.log('We are hear ===================>>>>>>>ELSE ELSE 222222222222');

                    }
            
                    let updateSql  = 'UPDATE contests SET ct_viewer_count = ? WHERE ct_id = ?'
                        updateData = await common.commonSqlQuery(updateSql,[countData,contestId]),
                        userData   = await common.getAll(userId,'ctv_fk_u_id','contest_viewers','ctv_id');

                        if( userData && userData.length ){
                            console.log('userData=============================>>>>>',userData.length);
                            let  updateUserSql  = 'UPDATE user SET u_contests_attended = ? WHERE u_id = ?',
                            updateUserData = await common.commonSqlQuery(updateUserSql,[userData.length,userId],true);
                            console.log('userData=============================>>>>>',updateUserData);


                        }

                    if( updateData  ){
                        deferred.resolve(true);
                    }
            
                }
            }
        }
       

    } else {
        deferred.resolve(false);
    }

    return deferred.promise; 
}



module.exports = liveBroadcastModel;