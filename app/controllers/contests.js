



const 	request 		= require('request'),
    AWS                 = require('aws-sdk'),
    passwordHash 		= require('password-hash'),
    payloadChecker 		= require('payload-validator'),
    path				= require('path'),
    https				= require('https'),
    Stream				= require('stream'),
    fs					= require('fs'),
    // download            = require('image-downloader'),
    {v1: uuidv1}        = require('uuid'),
    q                   = require('q'),
    Busboy              = require('busboy'),
    config				= require('../../configCommon/config').init(),
    contestsModel	    = require('../models/contests_model'),
    commonModel		    = require('../models/configCommon'),
    helper				= require('../../configCommon/helpers/index'),
    ThumbnailGenerator  = require('video-thumbnail-generator').default,
    ffmpeg              = require('fluent-ffmpeg'),
    constant 			= require('../../configCommon/config/constants');
// ALTER TABLE `user` CHANGE `u_id` `u_id` INT(11) NOT NULL AUTO_INCREMENT, add PRIMARY KEY (`u_id`);			

let contests = {}



/**
*  This function is using to add contest
* @param         :
* @returns       :
* @developer     :  
* @modification  : Anil Guleria
*/
contests.addContests = async ( req, res ) => {
    
    let userId = await helper.getUUIDByTocken(req)

    if( userId && userId != ''){
        console.log('result======================>>>>>>>>>>>',req.body);

        if ( req && req.body && req.body.contestName  && req.body.startTime && req.body.endTime && req.body.contestType ) {

            let result = await  contestsModel.addContests(req.body,userId);

            if( result && result != '' ) {
               console.log('result======================>>>>>>>>>>>',result);
                // let dataObj = {
                //     contestId : result
                // }
                let obj = {
                    code    : "AAA-E2001",
                    message : result.message,
                    status  : result.status,
                    payload : { contestId : result.insertedId }
                };
                helper.successHandler(res,obj);

            } else {
                let obj = {
                    message : 'Something went wrong.' ,
                    status : false
                };
                helper.successHandler(res,obj);

            }
          
        } else {

            let obj = {
                code : "AAA-E2001",
                message : 'All fields are required' ,
                status : false
            };
            helper.successHandler(res,obj);
        }
    } else {
    
        helper.errorHandler(res, {
            status 		: false,
            code        : "AAA-E1001",
            message		: "Unauthorized Error."
        }, 200);
    };
}


/**
* This function is used to upload contest image in AWS S3 bucket.
* @param     	:
* @developer 	: 
* @modified	    : Anil Guleria
*/
contests.uploadContestImage = async (req, res) => {
console.log('uploadContestImage=>>>>>>');
    let	userId            = await helper.getUUIDByTocken(req),
        conObj            = await constant.getConstant(),
        type              = 'IMAGE',
        deferred          = q.defer(),
        currentDateTime   = await helper.getPstDateTime('timeDate');

    if ( userId ) {
        
        const fields    = {},
        buffers         = {};

        let chunks          = [], fName, fType, fEncoding,
        imagesToUpload      = [],
        imageToAdd          = {},
        contestId           = '',
        contestUid          = '';

        let busboy = Busboy({ 
            headers: req.headers 
        });

        busboy.on('field', async (fieldname, val) => {
        
            fields[fieldname] = val;
        
        });

        busboy.on('file', async function(fieldname, file, filename, encoding, mimetype) {

            buffers[fieldname] = [] ;
            console.log('contestImageVideo=====>>>>>>>>>>>>1111',fields);
            let ext  = (path.extname(filename.filename).toLowerCase());
                
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

                contestId = fields.contestId,   
                contestUid = await commonModel.getRowById(contestId,'ct_id','ct_uuid','contests')   
               let  uuid              = uuidv1(Date.now());

                let newName = uuid + ext;                
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

            imagesToUpload.forEach(async imageToBeUploaded  => {

                let fileObj = {

                    fileName        : imageToBeUploaded.fName,
                    chunks          : imageToBeUploaded.fileBuffer,
                    encoding        : imageToBeUploaded.fEncoding,
                    contentType     : imageToBeUploaded.fType,
                    uploadFolder    : conObj.UPLOAD_PATH + conObj.CONTESTS_UPLOAD_PATH + contestUid +'/'+  conObj.AWS_IMAGE_PATH

                },
                ext     = imageToBeUploaded.ext;
                fileObj.type  = 'IMAGE';
                if( ext == '.mp4' || ext == '.3gp' || ext == '.ogg' || ext == '.wmv' || ext == '.avi' || ext == '.flv' || ext == '.mov' ){

                    fileObj.uploadFolder = conObj.UPLOAD_PATH + conObj.CONTESTS_UPLOAD_PATH + contestUid +'/'+ conObj.AWS_VIDEO_PATH  ; 
                    fileObj.type              = 'VIDEO';

                } 

                let object = {
                    fileObj        : fileObj ,
                    folderUuid     : contestUid,
                    ext            : ext,
                    contestUid     : contestUid,
                    contestId      : contestId

                }
                let  dataObj  = await contests.uploadFile(object);
                console.log('dataObj dataObj dataObj dataObj====>>>',dataObj)
                if( dataObj ){
                    deferred.resolve(true);
                } else{
                    deferred.resolve(false);
                }

            });
        
        });

        return req.pipe(busboy);

    } else {
        deferred.resolve(false);
       
    }
    return deferred.promise;
}


/**
* This function is using to get followers list
* @param     : 
* @returns   :
* @developer : 
*/
contests.uploadFile = async  ( object ) => {

    if ( object  ) {

        let updateObj = {

            uuid      : object.contestUid,
            name      : object.fileObj.fileName,
        };
        let ctaUuId   = uuidv1(Date.now())
       
        let obj ={

            ca_fk_ct_id    : object.contestId,
            ca_uuid	       : ctaUuId,
            ca_attachment  : object.fileObj.fileName,
            ca_created	   : await helper.getUtcTime(),
            ca_type        : object.fileObj.type
            };
        let contestAttachmentId =   await commonModel.insert('contests_attachment', obj, true),
            returnObj ='';
            if( object.fileObj.uploadFolder ){
                if(object.ext == '.mp4' || object.ext == '.3gp' || object.ext == '.ogg' || object.ext == '.wmv' || object.ext == '.avi' || object.ext == '.flv' || object.ext == '.mov'  ){
                    object.fileObj.uploadFolder = object.fileObj.uploadFolder + ctaUuId + '/';

                }
            }
       
        if ( contestAttachmentId ){
            
            updateObj.contestAttachmentId  = contestAttachmentId;
            returnObj = await helper.uploadFile(object.fileObj);
            
        }
        if ( returnObj && object.ext == '.mp4' || object.ext == '.3gp' || object.ext == '.ogg' || object.ext == '.wmv' || object.ext == '.avi' || object.ext == '.flv' || object.ext == '.mov'  ) {
            
            let thumbDataObj    = {
                videoName       : object.fileObj.fileName,
                folderPath      : object.fileObj.uploadFolder,
                folderUId       : object.folderUuid,
            },
            thumbnailData   = await contests.createThumbnailAWSBucket(thumbDataObj);

            if ( thumbnailData ) {

                updateObj.thumbnail = thumbnailData;

                let thumbnail  = await contestsModel.updateThumbnailValue( updateObj );

                if ( thumbnail ){

                    return true;

                } else {

                    return false;
                }

            } else {

                return false ;
            }

        } 

        return true;

    } else {
        return false;
    }

}

/**
* This function is get user contests data
* @param     	: 
* @developer 	: Anil Guleria
* @modified	: 
*/
contests.getContestsData = async (req, res) => {

    let userId = await helper.getUUIDByTocken(req);
    
    if ( userId && userId != '' ) {
    
        if ( req && req.body ) {
    
            let userPostData = await contestsModel.getContestsData(userId,req.body);
    
            if ( userPostData && userPostData != false ) {
    
                helper.successHandler(res, {
                    status : true,
                    message : 'Operation  successfully  Performed',
                    payload : userPostData
                }, 200);
    
            } else {
    
                helper.successHandler(res, {
                    status  : false,
                    message : 'Something went wrong.'
                }, 200);
            };
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
* This function is get user contests Detail 
* @param     	: 
* @developer 	: 
* @modified	    : 
*/
contests.getContestsDetail = async (req, res) => {

    let userId = await helper.getUUIDByTocken(req);
    
    if ( userId && userId != '' ) {
    
        if ( req && req.body ) {
    
            let userPostData = await contestsModel.getContestsDetail(userId,req.body);
    
            if ( userPostData && userPostData != false ) {
    
                helper.successHandler(res, {
                    status : true,
                    message : 'Operation  successfully  Performed',
                    payload : userPostData
                }, 200);
    
            } else {
    
                helper.successHandler(res, {
                    status  : false,
                    message : 'Something went wrong.'
                }, 200);
            };
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
*  This function is used to delete contests 
* @param     : contestUuid
* @returns   : 
* @developer : 
*/
contests.contestsDelete = async ( req , res ) => {

    let userId   = await helper.getUUIDByTocken(req);

    if ( userId ) {

        console.log('deleteContests in ========================>>>>1111111111111111');

        if ( req && req.body && req.body.contestUuid ) { 

            console.log('deleteContests in ========================>>>>2222222222222222222',req.body.contestUuid)

            let contestUuid  =  req.body.contestUuid ; 

            let userUuid    = await  commonModel.getRowById( userId , 'u_id' , 'u_uuid', 'user');

            if ( userUuid ) {
                console.log('deleteContests in ========================>>>>333333333333333333333333');

                let obj = {
                    contestUuid   :  contestUuid,
                    userUuid      :  userUuid,
                    userId        :  userId
                };
                let result = await contestsModel.contestsDelete(obj);

                if ( result ) {

                    helper.successHandler(res, {
                        status : true,
                        message : ' Contest Deleted successfully'
                    });

                } else {

                    helper.successHandler(res, {
                        code 	: 'UIS-E1000',
                        message : 'something went wrong.',
                        status  : false
                    });

                }

                
            } else {

                helper.successHandler(res, {
                    code    : 'UIS-E1003',
                    message : 'something went wrong.',
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
*  This function is using to add contest
* @param         :
* @returns       :
* @developer     :  
* @modification  : Dushyant Sharma
*/
contests.updateContests = async ( req, res ) => {
    
    let userId = await helper.getUUIDByTocken(req)

    if( userId && userId != ''){
        console.log('result======================>>>>>>>>>>>',req.body);

        if ( req && req.body  && req.body.contestUuid ) {

            let result = await  contestsModel.updateContests(req.body,userId);

            if( result && result != '' ) {
               console.log('result======================>>>>>>>>>>>',result);
                // let dataObj = {
                //     contestId : result
                // }
                let obj = {
                    code    : "AAA-E2001",
                    message : 'Contest Update Successfully ' ,
                    status  : true,
                    payload : { contestId : result }
                };
                helper.successHandler(res,obj);

            } else {
                let obj = {
                    message : 'Something went wrong.' ,
                    status : false
                };
                helper.successHandler(res,obj);

            }
          
        } else {

            let obj = {
                code : "AAA-E2001",
                message : 'All fields are required' ,
                status : false
            };
            helper.successHandler(res,obj);
        }
    } else {
    
        helper.errorHandler(res, {
            status 		: false,
            code        : "AAA-E1001",
            message		: "Unauthorized Error."
        }, 200);
    };
}

var intervalArray;

function clearInterVal() {

    if (intervalArray) {
        clearTimeout(intervalArray);
    }
}

/** NEW FUNCTION TO CREATE VIDEO THUMBNAIL //
 * This function is using to get live users list
 * @param     : fileFolderType : US, RC, UV, QD, UP, C, GC 
 * @returns   :
 * @developer : 
 */
 contests.createThumbnailAWSBucket = async (thumbObj, attempt = 0 ) => {
    // console.log("--------create thumbnail---------------------11111111");
    let deferred = q.defer();

    if ( thumbObj && thumbObj.videoName && thumbObj.folderUId && thumbObj.folderPath) {
        // console.log("--------create thumbnail---------------------222222");
        let conObj        = await constant.getConstant(),
            fullMediaPath = thumbObj.folderPath,
            fileName      =  conObj.AWS_CLOUDFRONT_URL + thumbObj.folderPath + thumbObj.videoName;
       
        /** code to create video thumbnail.*/

        clearInterVal();

        try {
            // console.log("--------create thumbnail---------------------33333",fileName);
            let resolution = await contests.getVideoResolution(fileName);

            if ( resolution ) {
                // console.log("--------create thumbnail---------------------44444",resolution);
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
                   
                    let imageDataObj    = {
                        imageName       : imageData,
                        uploadFolder    : fullMediaPath,
                        videoUId        : thumbObj.videoName.split(".")[0]
                    },
                    data                = await helper.uploadThumbnailFileToAwsBucket(imageDataObj);
                    if ( data ) {
                        console.log("--------create thumbnail---------------------666666",data);
                      
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
            if ( attempt <= 10 ) {
                intervalArray = setTimeout(async function () {

                    contests.createThumbnailAWSBucket(thumbObj, ++attempt);

                }.bind(contests), 2000);
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
 contests.getVideoResolution = async (fileName) => {

    let deferred = q.defer();

    if ( fileName && fileName != "" ) {

        // console.log("chhhhhhhhchchchchhc========================",fileName);
        ffmpeg.ffprobe(fileName, function (err, metadata) {

            if ( err ) {
                // console.log("ffmpeg.ffprobeffmpeg.ffprobe=========>>>>>",err);
              deferred.resolve(false);
            } else {
            // console.log(" chhhhhhhhchchchchhc----------------------");
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
 * This function is used to Delete Contests Image
 * @param      :
 * @returns    :
  * @developer : 
 */
contests.deleteContestsMedia = async function (req, res) {

    let userId = await helper.getUUIDByTocken(req)

    if( userId && userId != ''){

        if ( req.body.contestMediaUuid ) {

            result = await contestsModel.deleteContestsMedia(req.body, userId);

            if (result) {

                helper.successHandler(res, {
                    status : true,
                    message : 'Operation Perform successfully'
                });

            } else {

                helper.errorHandler(res, {
                    status: false,
                    message: "Something Went Wrong"
                }, 500);
            }


        } else {
            helper.errorHandler(res, {
                status: false,
                message: "Failed, Please try again."
            }, 500);
        }

    } else {
        helper.errorHandler(res, {
            status: false,
            message: "You are not authorized !!"
        }, 401);
    }
}






/**
* This function is used to comment a contest video comment 
* @param     	: 
* @developer 	: Anshu Salaria 
* @modified	: 
*/
contests.contestsVideoPostComment = async (req, res) => {

    let userId = await helper.getUUIDByTocken(req);
    
    if ( userId && userId != '' ) {
    
        if ( req && req.body && req.body.text && req.body.contestsUuid  ) {
    
            let userInfo = await contestsModel.contestVideoPostComment(userId, req.body);
    
            if ( userInfo && userInfo != false ) {
                console.log('ssdsdsdsddsdsdsdf',userInfo);
                helper.successHandler(res, {
                    status  : true,
                    message : 'comment posted successfully',
                    payload  : {commentCount  : userInfo}
                }, 200);
    
            } else {
    
                helper.successHandler(res, {
    
                    status  : false,
                    message : 'Something went wrong.'
                }, 200);
            };
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
* This function is get user post comment data
* @param     	: 
* @developer 	: Anshu Salaria
* @modified	: 
*/
contests.getCommentData = async (req, res) => {

    let userId = await helper.getUUIDByTocken(req);
    
    if ( userId && userId != '' ) {
    
        if ( req && req.body && req.body.contestsUuid ) {
            console.log('userCommentData',req.body , req.body.contestsUuid)

            let userCommentData = await contestsModel.getCommentData(userId,req.body);
                 console.log('userCommentData',userCommentData)
            if ( userCommentData && userCommentData != false ) {
    
                helper.successHandler(res, {
                    status       : true,
                    message      : 'comment list successfully ',
                    payload      : userCommentData
                }, 200);
    
            } else {
    
                helper.successHandler(res, {
                    status  : false,
                    message : 'Something went wrong.'
                }, 200);
            };
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
* This function is delete comment 
* @param     	: 
* @developer 	: Anshu Salaria
* @modified	: 
*/
contests.deleteComment = async ( req , res ) => {

    console.log('deletePostComment in ========================>>>>',req.body)
let userId   = await helper.getUUIDByTocken(req);

if ( userId ) {

    console.log('deletePostComment in ========================>>>>1111111111111111')

    if ( req && req.body && req.body.commentId && req.body.contestsUuid) { 

        console.log('deletePostComment in ========================>>>>2222222222222222222',req.body.commentId)

        let commentId  =  req.body.commentId ,
        contestId          = await commonModel.getRowId(req.body.contestsUuid,'ct_uuid','ct_id','contests');
            // postId     = await common.getRowById(req.body.contestsUuid,'p_uuid','p_id','post' );

        if ( commentId && contestId ) {

            console.log('deletePostComment in ========================>>>>444444444444444444444')

                console.log('commentId=================>>>>',commentId)

                let obj = {
                    cbvc_id   : commentId,
                    c_id      : contestId,
                    userId    : userId
                };
                let result = await contestsModel.deleteComment(obj);

            if ( result ) {

                helper.successHandler(res, {
                    status : true,
                    message : 'Comment deleted successfully',
                    // payload : {postCommentCount :( result && result != 'NO' ? result : '0' )}

                });

            } else {

                helper.successHandler(res, {
                    code 	: 'UIS-E1000',
                    message : 'Oops! something went wrong',
                    status  : false
                });

            }

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



module.exports = contests;