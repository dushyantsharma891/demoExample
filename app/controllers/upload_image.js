


const q 				= require('q'),
fs 				 	= require('fs'),
path 				= require('path'),
AWS                 = require('aws-sdk'),
Busboy 				= require('busboy'),

_userModelObj 		= require('../models/user'),
helperObj		    = require('../../configCommon/helpers'),
constant            = require('../../configCommon/config/constants'),
config				= require('../../configCommon/config').init();

let userProfileObj      = {};


/**
* This function is used to upload user's profile image in AWS S3 bucket.
* @param     	:
* @developer 	: 
* @modified	    : Anil Guleria
*/
userProfileObj.uploadProfileImage = async (req, res) => {

let userId = await helperObj.getUUIDByTocken(req);
// console.log('userid====>>>>>', userId);
// console.log('req.headers =========== > ', req.headers);
if ( userId ) {

    let conObj = await constant.getConstant(),
        chunks = [], fName, fType, fEncoding,
        busboy = Busboy({ headers: req.headers });
        // busboy = new Busboy({ headers: req.headers });

    busboy.on('file', async (fieldname, file, filename, encoding, mimetype) => {
        // console.log('filename ====>>>>>', filename);
        // console.log('filename ====>>>>>', filename.filename);
        // console.log('encoding ====>>>>>', encoding);
        // console.log('mimetype ====>>>>>', mimetype);

        let ext = '';

        if ( filename && filename.filename ) {
            // console.log('filename.filename ====>>>>>', filename.filename);
            ext = (path.extname(filename.filename).toLowerCase());
            // console.log('ext ====>>>>>', ext);
        }

        // let ext = (path.extname(filename.filename).toLowerCase());

        if ( ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg' ) {
            // console.log('mimetype ====>>>>> iffffff ');

            
            let obj =  {
                status  : true,
                code    : "",
                message : "invalid extension!",
                payload : []
            };

            chunks.push(obj);
            file.resume();
        
        } else {

            // console.log('mimetype ====>>>>> elseeeeee');
            let newName = Date.now() + ext;
            // let newName = Date.now() + '-testaws' + ext;

            fName       = newName.replace(/ /g,"_");
            fType       = mimetype;
            fEncoding   = encoding;
            
            file.on('data', async (data) => {
                // console.log('datadatadatadata ====>>>>>', data);
                chunks.push(data);
            });
            
            file.on('end', async () => {
                // console.log('File [' + filename.filename + '] Finished');
            });
        }
    });

    busboy.on('finish', async () => {
        // console.log('finishfinishfinishfinishfinishfinishfinish ====>>>>> finish');


        let fileObj 	= {
            fileName    : fName,
            chunks      : chunks,
            encoding    : fEncoding,
            contentType : fType,
            uploadFolder: conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH
        };

        let returnObj 	= await userProfileObj.uploadFile(fileObj);
        // console.log("returnObj ================ ", returnObj);
        let obj 		= {};

        if ( returnObj ) {
            // console.log("returnObj ================ ifffffffffff");
            
            let image 	=  await _userModelObj.uploadImage(userId, fName);

            // console.log("returnObj ================  imaggggeeee ", image);
                
            if ( image ) {

                // console.log("returnObj ================  imaggggeeee 11111111");

                let returnRes 	= conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + fName;
            
                // if ( returnObj.Location ) {
                //     returnRes 	= returnObj.Location;
                // }

                obj.payload 	= returnRes;
            }

            chunks.push(obj);
        }

        helperObj.successHandler(res, obj);
    });

    return req.pipe(busboy);

} else {

    let obj = {
        status 		: false,
        code        : "UPI-E1001",
        message		: "Unauthorized Error."
    };

    helperObj.errorHandler(res, obj, 401);
}
}

/**
* Used to upload file in AWS S3 bucket.
* @modified    :
* @params      : 
* @developer   : Anil Guleria
*/
userProfileObj.uploadFile = async (fileObj) => {
// console.log('uploadFile ====>>>>> 11111111111 ', fileObj);

let defered = q.defer();

if ( fileObj && Object.keys(fileObj).length > 0 ) {
    // console.log('uploadFile ====>>>>> 22222222 ');

    let conObj      	= await constant.getConstant(),
        uploadFolder 	= '';

    if ( fileObj.uploadFolder ) {
        uploadFolder 	= fileObj.uploadFolder;
    }
    
    const S3        	= new AWS.S3({
            accessKeyId     : conObj.AWS_ACCESS_KEY,
            secretAccessKey : conObj.AWS_SECRET_ACCESS_KEY
            
        }),

        params = {
            Bucket          : conObj.AWS_BUCKET_NAME, // your s3 bucket name
            Key             : uploadFolder + `${fileObj.fileName}`, 
            Body            : Buffer.concat(fileObj.chunks), // concatinating all chunks
            // ACL             : 'public-read',
            ContentEncoding : fileObj.encoding, // optional
            ContentType     : fileObj.contentType // required
        };
    // we are sending buffer data to s3.
    S3.upload(params, async (err, s3res) => {

        if ( err ) {
            // console.log("uploadFile   ======= Image Error is : ", err);
            defered.resolve(false);
        } else {
            if ( s3res ) {
                let resData = s3res;
                // console.log("uploadFile   ======= Upload image data is : ", s3res);
                defered.resolve(resData);
            } else {
                // console.log('uploadFile ====>>>>> 4444444444444444 ');
                defered.resolve(false);
            }
        }
    });
} else {
    // console.log('uploadFile ====>>>>> 5555555555555555555555');
    defered.resolve(false);
}

return defered.promise;
}

/**
* Used to delete uploaded user's profile image
* @developer   : Anil Guleria
* @modified    :
* @params      : Image name
*/
userProfileObj.deleteProfileImage = async (req, res) => {

let userId = await helperObj.getUUIDByTocken(req);

if ( userId ) {

    if ( req && req.body ) {

        req.body.userId = userId;

        if ( req.body.imageName ) {

            let conObj      = await constant.getConstant(),
                videoObj    = {
                    fileName    : req.body.imageName,
                    folderName  : conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH 
                },
                resDelete   = await helperObj.deleteAWSFile(videoObj);


            if ( resDelete ) {

                let resData = await _userModelObj.deleteProfileImage(req.body);

                if ( resData ) {
                    helperObj.successHandler(res, {}, 200);
                } else {

                    let obj = {
                        code    : 'UELS-E1003',
                        message : 'Uploaded image data not deleted.',
                        status  : false
                    };

                    helperObj.successHandler(res, obj, 200);

                }

            } else {

                let obj = {
                    code    : 'UELS-E1003',
                    message : 'Image not deleted.',
                    status  : false
                };

                helperObj.successHandler(res, obj, 200);

            }

        } else {

            let obj = {
                code    : 'UELS-E1003',
                message : 'Please fill mandatory fields.',
                status  : false
            };

            helperObj.successHandler(res, obj);

        }

    } else {

        let obj = {
            code    : 'UELS-E1003',
            message : 'Please fill mandatory fields.',
            status  : false
        };

        helperObj.successHandler(res, obj);
    }

} else {

    let obj = {
        status  : false,
        code    : "UELS-E1000",
        message : "Unauthorized Error."
    };

    helperObj.errorHandler(res, obj, 401);
}
}

/**
* This function is used to upload upload Business Image in AWS S3 bucket.
* @param     	:
* @developer 	: 
* @modified	    : Anil Guleria
*/
userProfileObj.uploadBusinessImage = async (req, res) => {

    let userId = await helperObj.getUUIDByTocken(req);
    // console.log('userid====>>>>>', userId);
    // console.log('req.headers =========== > ', req.headers);
    if ( userId ) {
    
        let conObj = await constant.getConstant(),
            fields = {},
            chunks = [], fName, fType, fEncoding,
            busboy = Busboy({ headers: req.headers });
            // busboy = new Busboy({ headers: req.headers });
            busboy.on('field', async (fieldname, val) => {
            
                fields[fieldname] = val;
             
            });
    
        busboy.on('file', async (fieldname, file, filename, encoding, mimetype) => {
            // console.log('filename ====>>>>>', filename);
            // console.log('filename ====>>>>>', filename.filename);
            // console.log('encoding ====>>>>>', encoding);
            // console.log('mimetype ====>>>>>', mimetype);
    
            let ext = '';
    
            if ( filename && filename.filename ) {
                console.log('filename.filename ====>>>>>test test', filename);
                ext = (path.extname(filename.filename).toLowerCase());
                // console.log('ext ====>>>>>', ext);
            }
    
            // let ext = (path.extname(filename.filename).toLowerCase());
    
            if ( ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg' ) {
                // console.log('mimetype ====>>>>> iffffff ');
    
                
                let obj =  {
                    status  : true,
                    code    : "",
                    message : "invalid extension!",
                    payload : []
                };
    
                chunks.push(obj);
                file.resume();
            
            } else {
    
                // console.log('mimetype ====>>>>> elseeeeee');
                let newName = Date.now() + ext;
                // let newName = Date.now() + '-testaws' + ext;
    
                fName       = newName.replace(/ /g,"_");
                fType       = mimetype;
                fEncoding   = encoding;
                
                file.on('data', async (data) => {
                    // console.log('datadatadatadata ====>>>>>', data);
                    chunks.push(data);
                });
                
                file.on('end', async () => {
                    // console.log('File [' + filename.filename + '] Finished');
                });
            }
        });
    
        busboy.on('finish', async () => {
            // console.log('finishfinishfinishfinishfinishfinishfinish ====>>>>> finish');
    
            console.log('fields.type=======>>>',fields.type);
            let fileObj 	= {
                fileName    : fName,
                chunks      : chunks,
                encoding    : fEncoding,
                contentType : fType,
                uploadFolder: conObj.UPLOAD_PATH + conObj.BUSINESS_IMAGE_PATH + conObj.AWS_IMAGE_PATH
            };
            if( fields.type && fields.type != '' && fields.type == 'logo'  ){
                fileObj.uploadFolder = conObj.UPLOAD_PATH + conObj.BUSINESS_LOGO_PATH + conObj.AWS_IMAGE_PATH
            }
    
            let returnObj 	= await userProfileObj.uploadFile(fileObj);
            // console.log("returnObj ================ ", returnObj);
            let obj 		= {};
    
            if ( returnObj ) {
                // console.log("returnObj ================ ifffffffffff");
                
                let image 	=  await _userModelObj.uploadBusinessImage(userId, fName, fields.type);
    
                // console.log("returnObj ================  imaggggeeee ", image);
                    
                if ( image ) {
    
                    // console.log("returnObj ================  imaggggeeee 11111111");
    
                    let returnRes 	= conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.BUSINESS_IMAGE_PATH + conObj.AWS_IMAGE_PATH + fName;
                    if( fields.type && fields.type != '' && fields.type == 'logo'  ){
                         returnRes 	= conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.BUSINESS_LOGO_PATH + conObj.AWS_IMAGE_PATH + fName;

                    }
                    // if ( returnObj.Location ) {
                    //     returnRes 	= returnObj.Location;
                    // }
    
                    obj.payload 	= returnRes;
                }
    
                chunks.push(obj);
            }
    
            helperObj.successHandler(res, obj);
        });
    
        return req.pipe(busboy);
    
    } else {
    
        let obj = {
            status 		: false,
            code        : "UPI-E1001",
            message		: "Unauthorized Error."
        };
    
        helperObj.errorHandler(res, obj, 401);
    }
    }


    /**
* Used to delete uploaded user's profile image
* @developer   : Anil Guleria
* @modified    :
* @params      : Image name
*/
userProfileObj.deleteBusinessImage = async (req, res) => {

    let userId = await helperObj.getUUIDByTocken(req);
    
    if ( userId ) {
    
        if ( req && req.body ) {
    
            req.body.userId = userId;
    
            if ( req.body.imageName ) {
    
                let conObj      = await constant.getConstant(),
                    videoObj    = {
                        fileName    : req.body.imageName,
                        folderName  : conObj.UPLOAD_PATH + conObj.BUSINESS_IMAGE_PATH 
                    },
                    resDelete   = await helperObj.deleteAWSFile(videoObj);
    
    
                if ( resDelete ) {
    
                    let resData = await _userModelObj.deleteBusinessImage(req.body);
    
                    if ( resData ) {
                        helperObj.successHandler(res, {}, 200);
                    } else {
    
                        let obj = {
                            code    : 'UELS-E1003',
                            message : 'Uploaded image data not deleted.',
                            status  : false
                        };
    
                        helperObj.successHandler(res, obj, 200);
    
                    }
    
                } else {
    
                    let obj = {
                        code    : 'UELS-E1003',
                        message : 'Image not deleted.',
                        status  : false
                    };
    
                    helperObj.successHandler(res, obj, 200);
    
                }
    
            } else {
    
                let obj = {
                    code    : 'UELS-E1003',
                    message : 'Please fill mandatory fields.',
                    status  : false
                };
    
                helperObj.successHandler(res, obj);
    
            }
    
        } else {
    
            let obj = {
                code    : 'UELS-E1003',
                message : 'Please fill mandatory fields.',
                status  : false
            };
    
            helperObj.successHandler(res, obj);
        }
    
    } else {
    
        let obj = {
            status  : false,
            code    : "UELS-E1000",
            message : "Unauthorized Error."
        };
    
        helperObj.errorHandler(res, obj, 401);
    }
    }

module.exports = userProfileObj;