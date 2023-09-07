


const q 				= require('q'),

	_userModelObj 		= require('../models/user'),
	helper				= require('../../configCommon/helpers'),
	config				= require('../../configCommon/config').init(),
	common              = require('../models/configCommon'),
    constant            = require('../../configCommon/config/constants'),
	Busboy 		        = require('busboy'),
	path				= require('path'),
	ThumbnailGenerator  = require('video-thumbnail-generator').default,
	{v1: uuidv1}        = require('uuid'),
	ffmpeg              = require('fluent-ffmpeg');
		
let user = {};


/**
 * This function is used to get user's data
 
 */
user.getRow = async (req, res) => {
	
	let userId = await helper.getUUIDByTocken(req);
	
	if ( userId ) {
		
		let result = await _userModelObj.me(userId);
		
		if ( result && typeof(result) == 'object' ) {

			let payload = {
				iat      : Date.now(),
				"orgId"  : result.u_id,
				"userId" : result.u_uuid,
				"email"  : result.u_email
			};

			result.token  = jwt.sign(payload, config.secret);

			let returnObj = {
				payload : result
			};
			// console.log('result result result result result',result);
			helper.successHandler(res, returnObj, 200);

		} else {
			let returnObj = {
				status 	: false,
				code 	: 'AAA-E1001',
				message : 'Something went wrong.'
			}
			helper.successHandler(res, returnObj, 200);
		}
	} else {
		let returnObj = {
			status 	: false,
			code 	: 'AAA-E1002',
			message : 'Unauthorized Error.'
		}
		helper.errorHandler( res, returnObj, 401 );
	}
}

/**
 * Change user password controller
 
 */
user.changePassword = async function(req, res) {
	
	let userId = await helper.getUUIDByTocken(req),

	expectedPayload = {
			"oldPassword": "",
			"newPassword": ""
		};

	/* let result = payloadChecker.validator(req.body, expectedPayload, ["oldPassword", "newPassword"], true);
	if ( result && result.success ) { */
	if ( req && req.body && req.body.oldPassword && req.body.newPassword ) {
		
		if ( userId != null && userId != '' ) {

			let row = await _userModelObj.changePassword(userId, req.body);

			if ( row && row.code == 'AAA-E1009' ) {
				let obj = {
					code 	: 'AAA-E1009',
					message : 'Old password not match.',
					status  : false
				};
				helper.successHandler(res, obj, 200);
			} else {

				helper.successHandler(res, {
					message : 'Password changed successfully.'
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
 * This function is used to update user profile data
 * @param     	:
 * @developer 	: Anil Guleria
 * @modified	: 
 */
user.updateUserProfileData = async (req, res) => {

	let userId = await helper.getUUIDByTocken(req);

	// console.log('updateUserProfileData ================ userId ==== ', userId);
	
	if ( userId && userId != '' ) {

		// console.log('updateUserProfileData ================ 11111111111 ==== req.body ', req.body);

		if ( req && req.body && req.body.name && req.body.name != 'null' && req.body.name != null ) {

			let userInfo = await _userModelObj.updateUserProfileData(userId, req.body);

			if ( userInfo && userInfo != false ) {

				helper.successHandler(res, {}, 200);

			} else {

				helper.successHandler(res, {

					status  : true,
					message : 'Something went wrong.'
				}, 200);
			};
		} else {

			helper.errorHandler(res, {
	
				status 	: false,
				code 	: 'AAA-E1002',
				message : 'Please fill mandatory fields.'
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
user.getUsersData = async (req, res) => {

	let userId = await helper.getUUIDByTocken(req);
	
	// console.log('getPostData ================ userId ==== ', userId);
	
	if ( userId && userId != '' ) {
	
		// console.log('getPostData ================ 11111111111 ==== req.body ', req.body);
	
		if ( req && req.body ) {
	
			let userPostData = await _userModelObj.getUsersData(userId,req.body);
	
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

/** This function is use to get other User Profile
  
 */

 user.otherUserProfile = async (req, res) => {

    let userId      = await helper.getUUIDByTocken(req);

    if(userId){

        if ( req && req.body && req.body.userId ) {
        
            let userRecord = await common.getRowById(req.body.userId, 'u_uuid', 'u_id', 'user');
            //console.log(userRecord,"userRecord")
			userProfile = await _userModelObj.getOtherUserProfile(userRecord,userId);

            if( userProfile ){

				helper.successHandler(res, {
					status  : true,
					payload : userProfile
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



/** This function is use to update User Profile Type Account Type
 * @param     : profileType, accountType
 * @returns   : 
 * @developer :  
 */

 user.updateActiveProfile = async (req, res) => {

    let userId      = await helper.getUUIDByTocken(req);

    if(userId){

        if ( req && req.body ) {
        
			let userProfile = await _userModelObj.updateActiveProfile(req.body,userId);
            // console.log('userProfile',userProfile)

            if( userProfile ){

				helper.successHandler(res, {
					message : 'Profile updated successfully',
					status  : true,
					// payload : userProfile
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


/** This function is use to update User longitude, latitude
 * @param     : longitude, latitude
 * @returns   : 
 * @developer :  
 */

user.updateUserLocation = async (req, res) => {
console.log('updateUserLocation====================>>>>',req.body)
    let userId      = await helper.getUUIDByTocken(req);

    if(userId){
            //  console.log('updateUserLocation updateUserLocation',req.body)
        if ( req && req.body && req.body.longitude && req.body.latitude ) {
        
			let userLocation = await _userModelObj.updateUserLocation(req.body,userId);
    // console.log('updateUserLocation',userLocation)

            if( userLocation ){

				helper.successHandler(res, {
					message : 'Location updated successfully',
					status  : true,
					// payload : userLocation
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



/** This function is use to update User Bio
 * @param     : bioName, bioText
 * @returns   : 
 * @developer :  
 */

 user.updateUserBio = async (req, res) => {

    let userId      = await helper.getUUIDByTocken(req);

    if(userId){

        if ( req && req.body ) {
        
			let userBio = await _userModelObj.updateUserBio(req.body,userId);
			// console.log('userBio',userBio)

            if( userBio ){

				helper.successHandler(res, {
					message: 'Updated user bio successfully',
					status  : true,
					// payload : userBio
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


/** This function is use to update User Business
 * @param     : companyName, companyBio, companyPhone, companyEmail
 * @returns   : 
 * @developer :  
 */

 user.updateUserBusiness = async (req, res) => {

    let userId      = await helper.getUUIDByTocken(req);

    if(userId){

        if ( req && req.body ) {
        
			let userBusiness = await _userModelObj.updateUserBusiness(req.body,userId);
			// console.log('userBusiness',userBusiness)

            if( userBusiness ){

				helper.successHandler(res, {
					message : 'Business updated successfully',
					status  : true,
					payload : userBusiness
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

/** This function is use to update Enable Disable Follow
 * @param     : followStatus
 * @returns   : 
 * @developer :  
 */

 user.enableDisableFollow = async (req, res) => {

    let userId      = await helper.getUUIDByTocken(req);

    if(userId){

        if ( req && req.body ) {
        
			let enableDisableFollow = await _userModelObj.enableDisableFollow(req.body,userId);
			// console.log('enableDisableFollow',enableDisableFollow)

            if( enableDisableFollow ){

				helper.successHandler(res, {
					message: 'Operation performed successfully',
					status  : true,
					// payload : enableDisableFollow
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

/** This function is use to update Enable Disable Follow
 * @param     : followStatus
 * @returns   : 
 * @developer :  
 */

 user.updateAddress = async (req, res) => {

    let userId      = await helper.getUUIDByTocken(req);

    if(userId){

        if ( req && req.body ) {
        
			let updateAddress = await _userModelObj.updateAddress(req.body,userId);
			// console.log('updateAddress',updateAddress)

            if( updateAddress ){

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

/**
* This function is using to add video Or Image  Post
* @param     : 
* @returns   :
* @developer : 
*/
user.userImageVideo = async ( req , res ) => {
	// console.log('userImageVideo=====>>>>>>>>>>>>1111')
	 let userId            = await helper.getUUIDByTocken(req),
		 conObj            = await constant.getConstant(),
		 uuid              = uuidv1(Date.now()),
		 userUuid          = await common.getRowId(userId,'u_id','u_uuid','user'),
		 currentDateTime   = await helper.getPstDateTime('timeDate');
 
	if ( userUuid ) {
 
		if ( req && req.body ) {
		
		
			const fields    = {},
			buffers         = {};
			// console.log('userImageVideo=====>>>>>>>>>>>>1111',fields);

		let chunks          = [], fName, fType, fEncoding,
			imagesToUpload  = [],
			imageToAdd      = {},

			busboy = Busboy({ 
				headers: req.headers 
			});
			
			busboy.on('field', async (fieldname, val) => {
			
				fields[fieldname] = val;
			
			});

			busboy.on('file', async function(fieldname, file, filename, encoding, mimetype) {

				buffers[fieldname] = [] ;
			//   console.log('filename ==== >>>>>>',filename.filename)
				let ext  = (path.extname(filename.filename).toLowerCase());
					
				if ( ext !== '.mp4' && ext !== '.3gp' && ext !== '.ogg' && ext !== '.wmv' && ext !== '.avi' && ext !== '.flv' && ext !== '.mov' ) {
					
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
				
			
			let fileObj = {

				fileName        : imagesToUpload[0].fName,
				chunks          : imagesToUpload[0].fileBuffer,
				encoding        : imagesToUpload[0].fEncoding,
				contentType     : imagesToUpload[0].fType,
				uploadFolder    : conObj.UPLOAD_PATH + conObj.BUSINESS_IMAGE_PATH + userUuid +'/'+ conObj.AWS_VIDEO_PATH  

			}; 
				// console.log('fsdfsdfsfsdfsdfsdfsdf===========>>',fileObj)
			let object = {
				fileObj      : fileObj ,
				folderUuid   : userUuid,
				ext          : imagesToUpload[0].ext,
				userId       : userId
			}
			// console.log('fsdfsdfsfsdfsdfsdfsdf11111===========>>',object)

			let  dataObj  = await user.uploadFile(object);
			// console.log('fsdfsdfsfsdfsdfsdfsdf22222222222222===========>>',dataObj)

			if( dataObj ){
                
				let sql = 'UPDATE user_profile SET  up_video = ? WHERE  up_fk_u_id = ?',
                    result = await common.commonSqlQuery(sql,[fileObj.fileName,userId],true);
					// console.log('result result ===================>>',result);

					if( result ){
						let sqlOne = 'SELECT up_video, up_video_thumbnail FROM user_profile  WHERE  up_fk_u_id = ?',
						resultOne = await common.commonSqlQuery(sqlOne,userId,true);
						// console.log('resultOne resultOne resultOne resultOne ',resultOne);

						if( resultOne && resultOne.length > 0 ){

							let thumbnail = conObj.AWS_CLOUDFRONT_URL +  conObj.UPLOAD_PATH + conObj.BUSINESS_IMAGE_PATH + userUuid +'/'+ conObj.AWS_VIDEO_PATH + resultOne[0].up_video_thumbnail,
							    video     = conObj.AWS_CLOUDFRONT_URL +  conObj.UPLOAD_PATH + conObj.BUSINESS_IMAGE_PATH + userUuid +'/'+ conObj.AWS_VIDEO_PATH + resultOne[0].up_video,
								obj       = {
									thumbnail : thumbnail,
									video     : video
								}
								// console.log('obj ====================>>>>>>',obj)
							helper.successHandler(res,{
								status  : true,
								message : 'Video Upload Successfully',
								payload : {obj}

							},200);

						} else {
						helper.errorHandler(res,{status: false},500)
						}

					} else {
						helper.errorHandler(res,{status: false},500)
					}
			 
			} else{
				helper.errorHandler(res,{status: false},500)
			}	 
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
user.uploadFile = async  ( object ) => {
	 // console.log('uploadFile in  in =========================>>>>>>>>11111111111111',object)
	 let  currentDateTime = await helper.getPstDateTime('timeDate');
 
	if ( object  ) {
		 // console.log('uploadFile in  in =========================>>>>>>>>22222222222222')
 
 
		 let updateObj = {
 
			 uuid      : object.postUuid,
			 name      : object.fileObj.fileName,
		 },

         returnObj = await helper.uploadFile(object.fileObj);
            
        // console.log('sdfsdfsdfsdfsdfsdfsdfsdf111111111=======>>>>',returnObj)
 
		 //  console.log('return true',returnObj)
		if ( returnObj && object.ext == '.mp4' || object.ext == '.3gp' || object.ext == '.ogg' || object.ext == '.wmv' || object.ext == '.avi' || object.ext == '.flv' || object.ext == '.mov'  ) {
			 
			 // console.log('uploadFile in  in =========================>>>>>>>>333333333333333333',object.ext,object.postUuid)
			let thumbDataObj    = {
				videoName       : object.fileObj.fileName,
				folderPath      : object.fileObj.uploadFolder,
				folderUId       : object.folderUuid,
				userId          : object.userId
			},
			thumbnailData   = await user.createThumbnailAWSBucket(thumbDataObj);
			// console.log('sdfsdfsdfsdfsdfsdfsdfsdf2222222222222=======>>>>',thumbnailData)

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
			//     let updateDataM3u8Table  = await user.updateDataM3u8Table( m3u8ID, object.postAttachId,'' );

			// }
		
			if ( thumbnailData ) {

				// console.log('uploadFile in  in =========================>>>>>>>>44444444444444444',updateObj)
				// updateObj.thumbnail = thumbnailData;

				// let thumbnail  = await _postModelObj.updateThumbnail( updateObj );

				// if ( thumbnail ){


					return true;

				// } else {

				// 	return false;
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
user.createThumbnailAWSBucket = async (thumbObj, attempt = 0 ) => {
	//  console.log("--------create thumbnail---------------------11111111",thumbObj);
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
			let resolution = await user.getVideoResolution(fileName);

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
						if ( thumbObj.userId && thumbObj.folderUId != '' ) {

							let dataObj = {
								streamId    : thumbObj.userId,
								thumbnail   : data
							};
							user.updateThumbnailValue(dataObj);
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

					user.createThumbnailAWSBucket(thumbObj, ++attempt);

				}.bind(user), 2000);
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
user.getVideoResolution = async (fileName) => {
 
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
user.updateThumbnailValue = async (bodyObj) => {
	 // console.log("bodyObjbodyObjbodyObjbodyObj====>>>",bodyObj);
	 let deferred       = q.defer();
	 // console.log("bodyObjbodyObjbodyObjbodyObj====>>>",bodyObj.streamId , bodyObj.thumbnail);
	if ( bodyObj  && bodyObj.streamId  && bodyObj.thumbnail ) {
		
		let updateSql   = `UPDATE user_profile SET  up_video_thumbnail = ? WHERE  up_fk_u_id = ?`,
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
* This function is using to Send Business card Request 
* @param     :
* @returns   :
* @developer : 
*/
user.businessCardRequest = async (req, res) => {
  console.log('We are hear ===================>>>>>>>businessCardRequest',req.body);
    let userId = await helper.getUUIDByTocken(req);

    if (userId) {

        if ( req && req.body && req.body.otherUuid ) {

            let otherUserId = await common.getRowById(req.body.otherUuid, 'u_uuid', 'u_id', 'user');

            if (otherUserId) {

                let result = await _userModelObj.businessCardRequest(otherUserId,userId,req.body);
                //   console.log('dsdasdadadad',result)
                if (result) {
					console.log('We are hear ===================>>>>>>>businessCardRequest',req.body.type);

                    helper.successHandler(res, {
                        payload: {
                            businessRequestType : req.body.type
                        }
                    }, 200);

                } else {

                    let obj = {
                        code: 'FUE -E1001',
                        message: 'Failed,Please try again.',
                        status: false
                    };
                    helper.successHandler(res, obj);

                }

            } else {

                let obj = {
                    code: 'FUE-E1002',
                    message: 'Expert does not exist.',
                    status: false
                };
                helper.successHandler(res, obj);

            }

        } else {

            let obj = {
                code: 'FUE-E1003',
                message: 'Please fill mandatory fields.',
                status: false
            };
            helper.successHandler(res, obj);

        }

    } else {

        let obj = {
            status: false,
            code: "FUE-E1001",
            message: "Unauthorized Error."
        }
        helper.errorHandler(res, obj, 401);

    }  

}

/**
* This function is get Business Card Data
* @param     	: requestType, 
* @developer 	: Anil Guleria
* @modified	: 
*/
user.getBusinessCardData = async (req, res) => {

	let userId = await helper.getUUIDByTocken(req);

	if ( userId && userId != '' ) {

		if ( req && req.body ) {

			let businessCardData = await _userModelObj.getBusinessCardData(userId,req.body);

			if ( businessCardData && businessCardData != false ) {

				helper.successHandler(res, {
					status : true,
					message : 'Post successfully uploaded',
					payload : businessCardData
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


/** This function is use to Accept Or Decline Card Request
 * @param     : otherUuid,type
 * @returns   : 
 * @developer :  
 */

 user.businessCardAcceptCancel = async (req, res) => {

    let userId      = await helper.getUUIDByTocken(req);

    if(userId){

		if ( req && req.body && req.body.businessId && req.body.type ) {


			let result = await _userModelObj.businessCardAcceptCancel(req.body);
				// console.log('dsdasdadadad',result)
			if (result) {

				helper.successHandler(res, {
					payload: {}
				}, 200);

			} else {

				let obj = {
					code: 'FUE -E1001',
					message: 'Failed,Please try again.',
					status: false
				};
				helper.successHandler(res, obj);

			}

		} else {

			let obj = {
				code: 'FUE-E1003',
				message: 'Please fill mandatory fields.',
				status: false
			};
			helper.successHandler(res, obj);

		}
	} else {

		helper.errorHandler(res, {
			status 		: false,
			code        : "AAA-E1001",
			message		: "Unauthorized Error."
		}, 500);

	}

}
 

/** This function is use to update User Account  Type
 * @param     :  sponsorType, verifiedType
 * @returns   : 
 * @developer :  
 */

 user.updateAccountType = async (req, res) => {

    let userId      = await helper.getUUIDByTocken(req);

    if(userId){

        if ( req && req.body ) {
        
			let userAccountType = await _userModelObj.updateAccountType(req.body,userId);
            // console.log('userAccountType',userAccountType)

            if( userAccountType ){

				helper.successHandler(res, {
					message : 'Profile updated successfully',
					status  : true,
					payload : userAccountType
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



/**
 * This function is used to get user's data
 
 */
 user.getAllUserLatitudeAndLongitude = async (req, res) => {
	
	let userId = await helper.getUUIDByTocken(req);
	
	if ( userId ) {
		
		let result = await _userModelObj.getAllUserLatitudeAndLongitude(userId);
		
		if ( result && result.length > 0 ) {

			
			helper.successHandler(res, {
				status : true,
				message : 'Operation performed successfully',
				payload : {data : result}
			}, 200);

		} else {
			let returnObj = {
				status 	: false,
				code 	: 'AAA-E1001',
				message : 'Something went wrong.'
			}
			helper.successHandler(res, returnObj, 200);
		}
	} else {
		let returnObj = {
			status 	: false,
			code 	: 'AAA-E1002',
			message : 'Unauthorized Error.'
		}
		helper.errorHandler( res, returnObj, 401 );
	}
}

//  /**
//   * This function is using to get topics
//   * @param     :
//   * @returns   :
//   * @developer : 
//   */
// user.updateDataM3u8Table = async ( m3u8ID, attachmentId ) => {
// 	 console.log("updateDataM3u8Table in ==================>>>>111111111111111111111",attachmentId);
// 	let deferred  = q.defer(),
// 		sql       = '',
// 		obj       = '';
 
// 	if ( m3u8ID ) {
// 		console.log("updateDataM3u8Table in ==================>>>>>>2222222222222222222",attachmentId);

// 			sql  = `UPDATE post_attachment SET ? WHERE pa_id = ?`;
// 			obj = {
// 				pa_attachment_m3u8 : m3u8ID,
// 			};

// 	updateData 	= await helper.getDataOrCount( sql,[obj, attachmentId],'U',true );

// 	console.log("updateDataupdateData=====>>>>",updateData);
// 	if ( updateData ) {
// 		console.log("updateDataM3u8Table in ==================>>>>>444444444444444444444",updateData);

// 		deferred.resolve(false);

// 	} else {
// 		console.log("updateDataM3u8Table in ==================>>>>>555555555555555555555555",updateData);

// 		deferred.resolve(false);

// 	}

// 	} else {
// 		deferred.resolve(false);
// 	}

// 	return deferred.promise;
 
//  }
 

/** This function is use to update Video Link
 * @param     : videoLink
 * @returns   : 
 * @developer :  
 */

 user.updateVideoLink = async (req, res) => {

    let userId      = await helper.getUUIDByTocken(req);
	console.log('updateAddress',req.body)
    if(userId){

        if ( req && req.body ) {
        
			let update_video_link = await _userModelObj.updateVideoLink(req.body,userId);
			// console.log('updateAddress',updateAddress)

            if( update_video_link ){

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


/** This function is use to get User Points History
 * @param     : videoLink
 * @returns   : 
 * @developer :  
 */

user.getUserPointsHistory = async (req, res) => {

    let userId      = await helper.getUUIDByTocken(req);

    if(userId){

        if ( req && req.body && req.body.historyType ) {
        
			let result = await _userModelObj.getUserPointsHistory(req.body,userId);

            if( result ){

				helper.successHandler(res, {
					message: 'Operation performed successfully',
					status  : true,
					payload : result
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


module.exports = user;
