


const q 				= require('q'),

_postModelObj 		= require('../models/post'),
{v1: uuidv1}        = require('uuid'),
helper				= require('../../configCommon/helpers'),
config				= require('../../configCommon/config').init(),
busboyCon 		    = require('busboy'),
common              = require('../models/configCommon'),
constant            = require('../../configCommon/config/constants'),
path				= require('path'),
ThumbnailGenerator  = require('video-thumbnail-generator').default,
ffmpeg              = require('fluent-ffmpeg');


    
let posts = {};

/**
* This function is used to update user post data
* @param     	: text, postType, postAttachment
* @developer 	: Anil Guleria
* @modified	: 
*/
posts.userPost = async (req, res) => {

let userId = await helper.getUUIDByTocken(req);

if ( userId && userId != '' ) {

    if ( req && req.body && req.body.text && req.body.postType  ) {

        let userInfo = await _postModelObj.userPost(userId, req.body);

        if ( userInfo && userInfo != false ) {

            helper.successHandler(res, {
                status  : true,
                message : 'Post successfully uploaded'
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
* This function is get user post data
* @param     	: postType, postAttachment
* @developer 	: Anil Guleria
* @modified	: 
*/
posts.getPostData = async (req, res) => {

let userId = await helper.getUUIDByTocken(req);

if ( userId && userId != '' ) {

    if ( req && req.body ) {

        let userPostData = await _postModelObj.getPostData(userId,req.body);

        if ( userPostData && userPostData != false ) {

            helper.successHandler(res, {
                status : true,
                message : 'Post successfully uploaded',
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
* This function is using to add video Or Image  Post
* @param     : 
* @returns   :
* @developer : 
*/
posts.postImageVideo = async ( req , res ) => {
   console.log('postImageVideo=====>>>>>>>>>>>>1111')
    let	userId            = await helper.getUUIDByTocken(req),
        conObj            = await constant.getConstant(),
        uuid              = uuidv1(Date.now()),
        userUuid          = await common.getRowId(userId,'u_id','u_uuid','user');

    if ( userUuid ) {

        if ( req && req.body ) {
        
        
            const fields    = {},
            buffers         = {};
            console.log('postImageVideo=====>>>>>>>>>>>>1111',fields);

        let chunks          = [], fName, fType, fEncoding,
            imagesToUpload  = [],
            imageToAdd      = {},

            busboy = busboyCon({ 
                headers: req.headers 
            });
             
            busboy.on('field', async (fieldname, val) => {
            
                fields[fieldname] = val;
             
            });

            busboy.on('file', async function(fieldname, file, filename, encoding, mimetype) {

                buffers[fieldname] = [] ;
            //   console.log('ccsddsff',filename.filename)
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
                
              console.log('finishfinishfinishfinishfinishfinishfinishfinishfinish==========>>>>>>>>>>',fields)
                let object = {
                    p_uuid              : uuid,
                    p_fk_u_id           : userId,
                    p_post_type         : fields.type,
                    p_created           : await helper.getUtcTime(),
                    p_text              : fields.text,
                    p_sponsor_post      : fields.sponserPost ? fields.sponserPost : 'NO',
                    p_sponsor_post_type : '',
                    p_latitude          : fields.latitude ? fields.latitude : null,
                    p_longitude         : fields.longitude ? fields.longitude : null,
                    p_country           : fields.country ? fields.country : null,
                    p_address           : fields.address ? fields.address : null,
                    p_state             : fields.state ? fields.state : null,
                    p_miles             : fields.miles ? fields.miles : null 
                };
    
                if( fields.sponserPostType == 'Miles' ) {
                    object.p_sponsor_post_type = 'M'
                }  else if( fields.sponserPostType == 'Country' ) {
                    object.p_sponsor_post_type = 'C'
    
                } else if( fields.sponserPostType == 'State' ) {
                    object.p_sponsor_post_type = 'S'
                }
                 
                if( fields.title ){
                    object.p_title = fields.title
                    console.log('dfkjsdfjksdfksdjksf==========>>>>>>>>>>111111111',fields.title)

                }
                console.log('dfkjsdfjksdfksdjksf==========>>>>>>>>>>222222222222',object)

                let postUuid     = '',
                insertedId = await common.insert('post', object, true);
                console.log('post Id=====================================>>>>>>>>>>',insertedId)

                if( insertedId ){ 
                   
                    postUuid = await common.getRowById(insertedId, 'p_id', 'p_uuid', 'post',true);
                    console.log('post Id=====================================>>>>>>>>>>',postUuid)
                    let postCount = await _postModelObj.userPostCount(userId);

                    // if( postCount ){

                    //     deferred.resolve(true);
                    // } else {

                    //     deferred.resolve(false);

                    // }
                }
                
                imagesToUpload.forEach(async imageToBeUploaded   => {                        
                    
                    let fileObj = {

                            fileName        : imageToBeUploaded.fName,
                            chunks          : imageToBeUploaded.fileBuffer,
                            encoding        : imageToBeUploaded.fEncoding,
                            contentType     : imageToBeUploaded.fType,
                            uploadFolder    : conObj.UPLOAD_PATH + conObj.POST_UPLOAD_PATH + userUuid +'/'+  conObj.AWS_IMAGE_PATH

                    };
                        let ext     = imageToBeUploaded.ext;
                        if( ext == '.mp4' || ext == '.3gp' || ext == '.ogg' || ext == '.wmv' || ext == '.avi' || ext == '.flv' || ext == '.mov' ){

                            fileObj.uploadFolder = conObj.UPLOAD_PATH + conObj.POST_UPLOAD_PATH + userUuid +'/'+ conObj.AWS_VIDEO_PATH + postUuid +'/' ; 
                        }

                        console.log('extextextextextextextextextextext in ============>>>>>>>>22222222222',fileObj.uploadFolder)
                        // let returnObj 	= await helper.uploadFile( fileObj );
                        // console.log('extextextextextextextextextextext in ============>>>>>>>>3333333333',returnObj)

                    let object = {
                        fileObj      : fileObj ,
                        folderUuid   : userUuid,
                        ext          : imageToBeUploaded.ext,
                        postUuid     : postUuid,
                        postId       : insertedId

                    }

                   let  dataObj  = await posts.uploadFile(object);
                   if( dataObj ){
                    helper.successHandler(res,{},200);
                   } else{
                       helper.errorHandler(res,{status: false},500)
                   }
                });
                    
                    
            });
    
            return req.pipe(busboy);
    
        } else {

            let obj = {
                code 	: 'AAA-E1001',
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
* This function is using to get followers list
* @param     : 
* @returns   :
* @developer : 
*/
posts.uploadFile = async  ( object ) => {
    // console.log('uploadFile in  in =========================>>>>>>>>11111111111111',object)

    if ( object  ) {
        // console.log('uploadFile in  in =========================>>>>>>>>22222222222222')


        let updateObj = {

            uuid      : object.postUuid,
            name      : object.fileObj.fileName,
        };

        let updateObj2 = {

            pa_uuid                  :  uuidv1(Date.now()),
            pa_fk_p_id	             :  object.postId ,
            pa_attachment            :  object.fileObj.fileName,
            pa_created               :  await helper.getUtcTime()
        }

        let postAttachmentId =   await  common.insert('post_attachment', updateObj2, true ),
            returnObj ='';
        // console.log('sdasdasdassdasdassdadadasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasdas',postAttachmentId)
        if ( postAttachmentId ){
            updateObj.postAttachId  = postAttachmentId;
            object.postAttachId  = postAttachmentId;

            returnObj = await helper.uploadFile(object.fileObj);
            
        }
        //  console.log('return true',returnObj)
        if ( returnObj && object.ext == '.mp4' || object.ext == '.3gp' || object.ext == '.ogg' || object.ext == '.wmv' || object.ext == '.avi' || object.ext == '.flv' || object.ext == '.mov'  ) {
            
            // console.log('uploadFile in  in =========================>>>>>>>>333333333333333333',object.ext,object.postUuid)
            let thumbDataObj    = {
                videoName       : object.fileObj.fileName,
                folderPath      : object.fileObj.uploadFolder,
                folderUId       : object.folderUuid,
            },
            thumbnailData   = await posts.createThumbnailAWSBucket(thumbDataObj);

            let lambdaFunctionObj = {
                folderUId       : object.folderUuid,
                attachmentId    : object.postUuid,
                mp4FileName     : object.fileObj.fileName,
            };
            // createVideo = await helper.executeAWSLambdaFunction(lambdaFunctionObj);
            // console.log('createVideo createVideo createVideo===================================>>>>>>>>>>>>>>1111111111111111111',createVideo.status)
            // console.log('createVideo createVideo createVideo===================================>>>>>>>>>>>>>>2222222222222222222',lambdaFunctionObj)
                
            // if( createVideo.status ){
                
            //     let m3u8ID   = object.fileObj.fileName.split(".")[0]+'.m3u8';
            //     console.log('m3u8ID m3u8ID ===================================================>>>>>',m3u8ID)
            //     let updateDataM3u8Table  = await posts.updateDataM3u8Table( m3u8ID, object.postAttachId,'' );

            // }
        
            if ( thumbnailData ) {

                // console.log('uploadFile in  in =========================>>>>>>>>44444444444444444',updateObj)
                updateObj.thumbnail = thumbnailData;

                let thumbnail  = await _postModelObj.updateThumbnail( updateObj );

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
 posts.createThumbnailAWSBucket = async (thumbObj, attempt = 0 ) => {
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
            let resolution = await posts.getVideoResolution(fileName);

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
                    // console.log("--------create thumbnail---------------------555555",imageData);
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
                        // console.log('sdfsdfsdfsdfsdfsdfsdfsdfsdfsdf========================>>',data)
                    if ( data ) {
                        // console.log("--------create thumbnail---------------------666666",data);
                        if ( thumbObj.folderUId && thumbObj.folderUId != '' ) {

                            let dataObj = {
                                streamId    : thumbObj.folderUId,
                                thumbnail   : data
                            };
                            posts.updateThumbnailValue(dataObj);
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
            // console.log('dsddfsdfsdfsdfsfsdfsdf=sdf=sdf=sdf=sdf=sd=fsd=fsd=f>>>>>>>>>>>>>',error)
            if ( attempt <= 10 ) {
                intervalArray = setTimeout(async function () {

                    posts.createThumbnailAWSBucket(thumbObj, ++attempt);

                }.bind(posts), 2000);
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
posts.getVideoResolution = async (fileName) => {

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
 * Used to update uploaded video data.
 * @developer   : 
 * @modified    :
 * @params      : 
 */
 posts.updateThumbnailValue = async (bodyObj) => {
    // console.log("bodyObjbodyObjbodyObjbodyObj====>>>",bodyObj);
    let deferred       = q.defer();
    // console.log("bodyObjbodyObjbodyObjbodyObj====>>>",bodyObj.streamId , bodyObj.thumbnail);
    if ( bodyObj  && bodyObj.streamId  && bodyObj.thumbnail ) {
        
        let updateSql   = `UPDATE post_attachment SET  pa_attachment_thumbnail = ? WHERE  pa_fk_p_id = ?`,
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
 posts.updateDataM3u8Table = async ( m3u8ID, attachmentId ) => {
    console.log("updateDataM3u8Table in ==================>>>>111111111111111111111",attachmentId);
   let deferred  = q.defer(),
       sql       = '',
       obj       = '';

    if ( m3u8ID ) {
        console.log("updateDataM3u8Table in ==================>>>>>>2222222222222222222",attachmentId);

            sql  = `UPDATE post_attachment SET ? WHERE pa_id = ?`;
            obj = {
                pa_attachment_m3u8 : m3u8ID,
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

/**
*  This function is used to delete post 
* @param     : postId
* @returns   : 
* @developer : 
*/
posts.postDelete = async ( req , res ) => {

    let userId   = await helper.getUUIDByTocken(req);

    if ( userId ) {

        console.log('deleteMessgaeFromMe in ========================>>>>1111111111111111')

        if ( req && req.body && req.body.postId ) { 

            console.log('deleteMessgaeFromMe in ========================>>>>2222222222222222222',req.body.postId)

            let postId  =  req.body.postId ; 

            let userUuid    = await  common.getRowById( userId , 'u_id' , 'u_uuid', 'user');

            if ( userUuid ) {
                console.log('deleteMessgaeFromMe in ========================>>>>333333333333333333333333')

                let postData = [];

                if ( postId && postId.length > 0 ) {

                    console.log('deleteMessgaeFromMe in ========================>>>>444444444444444444444')

                    // let mIds         = postId ;
                    // let totalRecords  = mIds.length ;
                    // let totalValue   = 0;
                
                    // for ( let i = 0; i < mIds.length ; i++ ) {
                        // console.log('mIds.length=================>>>>',mIds[i])
                        // let postId = mIds[i].m_id ;
                        console.log('mIds.length=================>>>>',postId)

                        let obj = {
                            p_id     :  postId,
                            userUuid :  userUuid,
                            userId   :  userId
                        };
                        let result = await _postModelObj.postDelete(obj);
                        
                        // if ( result ) {

                        //     postData.push(postId);

                        //     totalValue++ ;

                        // }
                    // }

                    if ( result ) {

                        helper.successHandler(res, {
                            status : true,
                            message : ' Post Deleted successfully'
                            // payload : {
                            //     postIdArray : postData
                            // }
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
* This function is used to update user post data
* @param     	: text, postType, postAttachment
* @developer 	: Anil Guleria
* @modified	: 
*/
posts.userPostComment = async (req, res) => {

    let userId = await helper.getUUIDByTocken(req);
    
    if ( userId && userId != '' ) {
    
        if ( req && req.body && req.body.text && req.body.postUuid  ) {
    
            let userInfo = await _postModelObj.userPostComment(userId, req.body);
    
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
* @developer 	: Anil Guleria
* @modified	: 
*/
posts.getCommentData = async (req, res) => {

    let userId = await helper.getUUIDByTocken(req);
    
    if ( userId && userId != '' ) {
    
        if ( req && req.body && req.body.postUuid ) {
            console.log('userCommentData',req.body , req.body.postUuid)

            let userCommentData = await _postModelObj.getCommentData(userId,req.body);
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
* This function is used to update user post data
* @param     	: text, postType, postAttachment
* @developer 	: Anil Guleria
* @modified	: 
*/
posts.userPostLike = async (req, res) => {

    let userId = await helper.getUUIDByTocken(req);
    
    if ( userId && userId != '' ) {
    
        if ( req && req.body && req.body.type && req.body.postUuid  ) {
    
            let userInfo = await _postModelObj.userPostLike(userId, req.body);
    
            if ( userInfo  ) {
                console.log('ssdsdsdsddsdsdsdf',userInfo);
                helper.successHandler(res, {
                    status  : true,
                    message : 'like posted successfully',
                    payload : {postLikeCount :( userInfo && userInfo != 'NO' ? userInfo : '0' )}
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
* @developer 	: Anil Guleria
* @modified	: 
*/
posts.getLikeData = async (req, res) => {

    let userId = await helper.getUUIDByTocken(req);
    
    if ( userId && userId != '' ) {
    
        if ( req && req.body && req.body.postUuid ) {
            console.log('userCommentData',req.body , req.body.postUuid)

            let userCommentData = await _postModelObj.getLikeData(userId,req.body);
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
*  This function is used to delete post comment
* @param     : postId
* @returns   : 
* @developer : 
*/
posts.deletePostComment = async ( req , res ) => {

    console.log('deletePostComment in ========================>>>>')
let userId   = await helper.getUUIDByTocken(req);

if ( userId ) {

    console.log('deletePostComment in ========================>>>>1111111111111111')

    if ( req && req.body && req.body.commentId && req.body.postUuid) { 

        console.log('deletePostComment in ========================>>>>2222222222222222222',req.body.commentId)

        let commentId  =  req.body.commentId ,
            postId     = await common.getRowById(req.body.postUuid,'p_uuid','p_id','post' );

        if ( commentId && postId ) {

            console.log('deletePostComment in ========================>>>>444444444444444444444')

                console.log('commentId=================>>>>',commentId)

                let obj = {
                    pc_id    : commentId,
                    p_id     : postId,
                    userId   : userId
                };
                let result = await _postModelObj.deletePostComment(obj);

            if ( result ) {

                helper.successHandler(res, {
                    status : true,
                    message : 'Comment deleted successfully',
                    payload : {postCommentCount :( result && result != 'NO' ? result : '0' )}

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

/**
* This function is used to Share Post
* @param     	: postId
* @developer 	: Dushyant Sharma
* @modified	    : 
*/
posts.userPostShare = async (req, res) => {

    let userId = await helper.getUUIDByTocken(req);
    
    if ( userId && userId != '' ) {
        console.log('We are hear ===================>>>>>>>req.body',req.body);
        if ( req && req.body && req.body.postId  ) {
    
            let userInfo = await _postModelObj.userPostShare(userId, req.body);
            console.log('userInfo userInfo',userInfo)
            if ( userInfo && userInfo != false ) {
    
                helper.successHandler(res, {
                    status  : true,
                    message : 'Post Sheared Successfully'
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
* This function is using to add video Or Image  Post
* @param     : 
* @returns   :
* @developer : 
*/
posts.editPostImageVideo = async ( req , res ) => {
    console.log('postImageVideo=====>>>>>>>>>>>>1111')
     let	userId            = await helper.getUUIDByTocken(req),
         conObj            = await constant.getConstant(),
         uuid              = uuidv1(Date.now()),
         userUuid          = await common.getRowId(userId,'u_id','u_uuid','user'); 
     if ( userUuid ) {
 
         if ( req && req.body ) {
         
         
             const fields    = {},
             buffers         = {};
             console.log('postImageVideo=====>>>>>>>>>>>>1111',fields);
 
         let chunks          = [], fName, fType, fEncoding,
             imagesToUpload  = [],
             imageToAdd      = {},
 
             busboy = busboyCon({ 
                 headers: req.headers 
             });
              
             busboy.on('field', async (fieldname, val) => {
             
                 fields[fieldname] = val;
              
             });
 
             busboy.on('file', async function(fieldname, file, filename, encoding, mimetype) {
 
                 buffers[fieldname] = [] ;
             //   console.log('ccsddsff',filename.filename)
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
                 
               console.log('finishfinishfinishfinishfinishfinishfinishfinishfinish==========>>>>>>>>>>',fields)
                 let object = {};

                 if( fields.text ){
                    object.p_text  = fields.text;
                 }
     
                 if( fields.title ){
                     object.p_title = fields.title
                     console.log('dfkjsdfjksdfksdjksf==========>>>>>>>>>>111111111',fields.title)
 
                 }
                 console.log('dfkjsdfjksdfksdjksf==========>>>>>>>>>>222222222222',object)
 
                 let postUuid     = '',
                 insertedId = await common.insert('post', object, true);
                 console.log('post Id=====================================>>>>>>>>>>',insertedId)
 
                 if( insertedId ){ 
                    
                     postUuid = await common.getRowById(insertedId, 'p_id', 'p_uuid', 'post',true);
                     console.log('post Id=====================================>>>>>>>>>>',postUuid)
                 }
                 
                 imagesToUpload.forEach(async imageToBeUploaded   => {                        
                     
                     let fileObj = {
 
                             fileName        : imageToBeUploaded.fName,
                             chunks          : imageToBeUploaded.fileBuffer,
                             encoding        : imageToBeUploaded.fEncoding,
                             contentType     : imageToBeUploaded.fType,
                             uploadFolder    : conObj.UPLOAD_PATH + conObj.POST_UPLOAD_PATH + userUuid +'/'+  conObj.AWS_IMAGE_PATH
 
                     };
                         let ext     = imageToBeUploaded.ext;
                         if( ext == '.mp4' || ext == '.3gp' || ext == '.ogg' || ext == '.wmv' || ext == '.avi' || ext == '.flv' || ext == '.mov' ){
 
                             fileObj.uploadFolder = conObj.UPLOAD_PATH + conObj.POST_UPLOAD_PATH + userUuid +'/'+ conObj.AWS_VIDEO_PATH + postUuid +'/' ; 
                         }
 
                         console.log('extextextextextextextextextextext in ============>>>>>>>>22222222222',fileObj.uploadFolder)
                         // let returnObj 	= await helper.uploadFile( fileObj );
                         // console.log('extextextextextextextextextextext in ============>>>>>>>>3333333333',returnObj)
 
                     let object = {
                         fileObj      : fileObj ,
                         folderUuid   : userUuid,
                         ext          : imageToBeUploaded.ext,
                         postUuid     : postUuid,
                         postId       : insertedId
 
                     }
 
                    let  dataObj  = await posts.uploadFile(object);
                    if( dataObj ){
                     helper.successHandler(res,{},200);
                    } else{
                        helper.errorHandler(res,{status: false},500)
                    }
                 });
                     
                     
             });
     
             return req.pipe(busboy);
     
         } else {
 
             let obj = {
                 code 	: 'AAA-E1001',
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
 * Used to update uploaded video data.
 * @developer   : 
 * @modified    :
 * @params      : 
 */
 posts.editPostData = async (req, res) => {
    console.log('editPostData=====================>>>>>>>>',req.body)
    let userId = await helper.getUUIDByTocken(req);
    
    if ( userId && userId != '' ) {

        if( req && req.body ){

            let updatePost = await _postModelObj.editPostData(req.body);

            if ( updatePost && updatePost != false ) {
    
                helper.successHandler(res, {
                    status  : true,
                    message : 'Post Update Successfully',
                    payload : req.body.postText
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

}

/**
* Used to get post view count
* @developer   : Dushyant Sharma
* @modified    :
* @params      : postUuid
*/
posts.postViewCount = async ( req, res ) => {

    console.log( 'req.body=======>>>>>>', req.body );

    let userId = await helper.getUUIDByTocken( req );

    if ( req && req.body && req.body.postUuid ) {

        let postId = await common.getRowById(req.body.postUuid,'p_uuid' ,'p_id','post');
        console.log('postViewCount postViewCount postViewCount 11111',postId);
        let isExistSql = 'SELECT pv_id FROM post_views WHERE pv_fk_p_id = ? AND pv_fk_u_id = ?',
        isExistData = await common.commonSqlQuery(isExistSql,[postId,userId],true);
        console.log('postViewCount postViewCount postViewCount 11111222222',isExistData);

        if( isExistData == '' ){

            let postViewsCount = await _postModelObj.postViewCount( req.body, userId, postId );

            // console.log("postViewsCount=======>>>>>cccc>>>>", postViewsCount );
            
            if ( postViewsCount ) {

                helper.successHandler( res, { 

                    payload  : postViewsCount,

                });

            } else {

                helper.errorHandler( res, {

                    status      : false,
                    message     : 'No records found',

                }, 200 );
            }
            
        } else {
            helper.errorHandler( res, {

                status      : false,
                message     : 'Already Viewed',

            }, 200 );

        }

    } else {

        helper.errorHandler( res, {});
    }
}

module.exports = posts;
