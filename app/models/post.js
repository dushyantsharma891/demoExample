


const pool 	            = require('../../configCommon/config/pool'),
    // spacetime           = require('spacetime'),
    q                   = require('q'),
    // fs                  = require('fs'),
    {v1: uuidv1}        = require('uuid'),
    common              = require('./configCommon'),
    constant            = require('../../configCommon/config/constants'),
    commonHelper        = require('../../configCommon/helpers/index'),
    helper			    = require('../../configCommon/helpers'),
    path				= require('path');
const commonModel = require('./configCommon');

// const { updateData } = require('../../configCommon/helper/mongo_helper');

let postModel = {};


/**
 * This function is used to update user post data
*  @developer   : Anil Guleria
 * @modified    :
 * @params      : userId , body
 */

postModel.userPost = async ( userId,body ) => {
    console.log('body========================>>>',body)
    let deferred        = q.defer();
       
    if( body && userId && body.text ){

        let uuid            = uuidv1(Date.now()),
            insertQuery     = "INSERT INTO post SET ?",
            insertData      = {
                p_fk_u_id           : userId,
                p_uuid              : uuid,
                p_text              : body.text,
                p_created           : await helper.getUtcTime(),
                p_sponsor_post      : body.sponserPost ? body.sponserPost : 'NO',
                p_sponsor_post_type : '',
                p_latitude          : body.latitude ? body.latitude : null,
                p_longitude         : body.longitude ? body.longitude : null,
                p_country           : body.country ? body.country : null,
                p_address           : body.address ? body.address : null,
                p_state             : body.state ? body.state : null,
                p_miles             : body.miles ? body.miles : null 
            };

            if( body.sponserPostType == 'Miles' ) {
                insertData.p_sponsor_post_type = 'M'
            }  else if( body.sponserPostType == 'Country' ) {
                insertData.p_sponsor_post_type = 'C'

            } else if( body.sponserPostType == 'State' ) {
                insertData.p_sponsor_post_type = 'S'
            }

        pool.query(insertQuery, insertData, async (error, result)=> {

            if( error ) {

                deferred.resolve(false);
            } else {
                if( result ){
                    let postCount = await postModel.userPostCount(userId);

                    if( postCount ){

                        deferred.resolve(true);
                    } else {

                        deferred.resolve(false);

                    }
                } else {
                    deferred.resolve(false);
                }
            }

        });
    } else {

        deferred.resolve(false)
    }

   return deferred.promise;
}

/**
 * This function is using to get  count
 * @param        :
 * @returns      :
 * @developer    : 
 * @modification :  
 */

 postModel.userPostCount = async (userId,) => {

    let deferred     = q.defer();

    if(  userId ) {

        let countSql = 'SELECT p_id FROM post WHERE p_fk_u_id = ? AND p_deleted = ?',
        getPostCount = await helper.getDataOrCount(countSql, [userId,'0'], 'L'),
        dataObj      = {};
        if ( getPostCount ) {

                updateData    =  'UPDATE user SET ? WHERE u_id = ?',
                dataObj         = {
        
                    u_post_count : getPostCount
                };
            
            let updatePostCount =  await common.commonSqlQuery(updateData, [dataObj, userId ]);

            if( updatePostCount ){

                deferred.resolve(updatePostCount);

            } else {
                
                deferred.resolve(false)
            }
            
        } else {
            deferred.resolve(false)
        } 

    } else {

        deferred.resolve(false)
    }
    return deferred.promise
}

/**
 * This function is get user post data
 * @param     	: userId, body
 * @developer 	: 
 * @modified	: 
 */
 postModel.getPostData = async (userId, body) => {
     console.log('getPostData body=====>>>',body)
    let deferred                = q.defer(),
        conObj                  = await constant.getConstant(),
        obj                     = {
            data                : '',
            more_records        : 0,
            total_records       : 0,
            last                : 0,
            lastRecId           : 0,
            page                : 0,
            user_profile_url    : conObj.SITE_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH,
        };

    if ( userId && body ) {
        // console.log('getPostData == 22222222222222');

        let whereLast               = '',
            whereMore               = '',
            id                      = '',
            sortBy                  = 'p_id',
            sortOrder               = 'DESC',
            page                    = 0,
            checkNewRecord          = false,
            additionalNewCondition  = '',
            addCondition            = '',
            dataArray               = '',
            records_per_page        = conObj.RECORDS_PER_PAGE;

        if ( body.per_page && body.per_page != 'null' ) {
            records_per_page        = body.per_page;
        } 

        if ( body.page && body.page != '' && body.page != null && body.page != 'null' ) {
            //  console.log('sdffdfdsfsf',body.page)
            page = Number(body.page) + 1;

            if ( body.lastRecId != null && body.lastRecId != "null" && body.lastRecId != "" && sortOrder == "DESC") {
                // console.log(body.lastRecId)
                additionalNewCondition = " AND p_id <= " + body.lastRecId;
            }
        } else {
            // console.log('new last id ');
            checkNewRecord  = true;
        }

        if ( body.last && body.last != 'null' ) {
            whereLast       += 'AND p_id <= ' + body.last;
            whereMore       += 'AND p_id > ' + body.last;
        }

        if ( body.sortOrder && body.sortOrder != 'null' ) {
            sortOrder       = body.sortOrder;
        }

        if ( body.sortBy && body.sortBy != 'null' ) {
            sortBy          = body.sortBy;
        }

        if ( body.keyword && body.keyword != 'null' ) {
            whereLast       +=  " AND u_name LIKE '%" + body.keyword + "%'";
            whereMore       +=  " AND u_name LIKE '%" + body.keyword + "%'";
        }
        let userCountry  = '',
        userState        = '',
        userLatitude     = '',
        userUuid         = '',
        u_rank           = '',
        userLongitude    = '';
        if( userId ){   
            userData    = await commonModel.getAll(userId,'u_id','user','u_uuid,u_country,u_rank,u_state,u_latitude,u_longitude');
            if( userData && userData.length > 0 ){

                userCountry      = userData[0].u_country,
                userState        = userData[0].u_state,
                userLatitude     = userData[0].u_latitude,
                userUuid         = userData[0].u_uuid,
                userLongitude    = userData[0].u_longitude;
                u_rank           = userData[0].u_rank;

            }

        }
        whereLast           += additionalNewCondition;
        if( body.otherUserId ){
            console.log('fsdfsdfsdf============>>>>>>>>>1111111',body.otherUserId)
            console.log('fsdfsdfsdf===================>>>>>>>222222222',userUuid)

            if( body.otherUserId == userUuid ){
                dataArray = [ body.otherUserId ,'0', '0', '0', '1', '1' ]
                addCondition = ` WHERE u_uuid = ? AND u_deleted = ? AND  u_deactivated = ? AND p_deleted = ? AND u_enable = ? AND p_status = ? AND p_share_id IS NULL`;
            } else {
                dataArray = [ body.otherUserId ,'0', '0', '0', '1', '1' ]
                addCondition = ` WHERE  u_uuid = ? AND u_deleted = ? AND  u_deactivated = ? AND p_deleted = ? AND u_enable = ? AND p_status = ? AND p_share_id IS NULL`;
                // addCondition = ` WHERE (p_sponsor_post_type = 'C' AND post.p_country = '`+userCountry+`') OR (p_sponsor_post_type = 'S' AND post.p_state = '`+userState+`') OR (p_sponsor_post_type = 'M' AND ((3959 *  acos( cos( radians(`+userLatitude+`))* cos( radians( p_latitude))*cos( radians( p_longitude ) - radians(`+userLongitude+`))  + sin( radians(`+userLatitude+`))*sin( radians( p_latitude )))) < p_miles )) OR p_sponsor_post = 'NO' AND u_uuid = ? AND u_deleted = ? AND  u_deactivated = ? AND p_deleted = ? AND u_enable = ? AND p_status = ? AND p_share_id IS NULL`;

            }
           
            // records_per_page = '12';
        } else {
            addCondition        = ` WHERE (p_sponsor_post_type = 'C' AND (post.p_country = '`+userCountry+`' OR p_fk_u_id = '`+userId+`' )) OR (p_sponsor_post_type = 'S' AND (post.p_state = '`+userState+`' OR p_fk_u_id = '`+userId+`' )) OR (p_sponsor_post_type = 'M' AND ((3959 *  acos( cos( radians(`+userLatitude+`))* cos( radians( p_latitude))*cos( radians( p_longitude ) - radians(`+userLongitude+`))  + sin( radians(`+userLatitude+`))*sin( radians( p_latitude )))) < p_miles ) OR p_fk_u_id = '`+userId+`' ) OR  p_sponsor_post = 'NO' AND u_deleted = ? AND  u_deactivated = ? AND p_deleted = ? AND u_enable = ? AND p_status = ? `
            dataArray       = [ '0', '0', '0', '1', '1' ];

        }
    
        let sql  = ` SELECT u_id,u_name, u_image, u_uuid,u_rank,u_free_contest,u_points_contest,u_sponsor_contest,u_paid_contest, u_state, u_country, p_id, p_uuid, p_text, p_title, p_like_count, p_post_type,p_latitude,p_longitude,p_country, p_address, p_state, p_miles, p_comment_count,p_share_count, p_views_count ,p_created, p_share_id, p_sponsor_post,p_sponsor_post_type FROM post 
        LEFT JOIN user ON  post.p_fk_u_id =  user.u_id ` + addCondition;
            // dataArray       = [ '0', '0', '0', '1', '1' ];
            // dataArray       = '',
        let getLastRecIdSql = sql + " GROUP BY p_id ORDER BY p_id DESC",
            moreRecordSql   = sql;
            
        let offset          = page * records_per_page;
        moreRecordSql       += whereMore + " GROUP BY p_id ORDER BY " + sortBy + " " + sortOrder;
        sql                 += whereLast + " GROUP BY p_id ORDER BY " + sortBy + " " + sortOrder + " LIMIT " + offset + "," + records_per_page;

        let result          = await common.commonSqlQuery(sql, dataArray, true);

        // console.log('getPostData == 33333333333333 result === ', result);
            
        if ( result && result.sqlMessage ) { 
            // console.log('getPostData == 444444444444 result === ');
            deferred.resolve(false);
        } else {


            if ( result && result.length > 0 ) {

                for ( let  resultData of result ) {
                    // console.log('getPostData == 555555555555555555 result === ',resultData);

                    if( resultData.u_id ){

                        resultData.verifiedType = await common.getRowById(resultData.u_id,'u_id','u_verified_account','user');
                        resultData.sponsorType = await common.getRowById(resultData.u_id,'u_id','u_sponsor_account','user');

                    } 

                    if( resultData.u_image ) {
                        
                        resultData.u_image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + resultData.u_image;
                    }
                      
                    if( resultData.p_share_id ){
                       let otherPostSql =  ` SELECT u_id,u_name, u_image, u_uuid, u_rank,u_free_contest,u_points_contest,u_sponsor_contest,u_paid_contest,p_id, p_uuid, p_text, p_title, p_like_count, p_post_type, p_comment_count,p_share_count , p_views_count,p_created, p_share_id, p_latitude,p_longitude,p_country, p_address, p_state, p_miles, p_sponsor_post,p_sponsor_post_type FROM post 
                       LEFT JOIN user ON  post.p_fk_u_id =  user.u_id WHERE u_deleted = ? AND  u_deactivated = ? AND p_deleted = ? AND u_enable = ? AND p_status = ? AND p_id = ? `,
                       arrayData = ['0', '0', '0', '1', '1',resultData.p_share_id ];

                        let otherPostData   = await common.commonSqlQuery(otherPostSql,arrayData);


                         if( otherPostData && otherPostData.length > 0 ){

                            if( otherPostData[0].u_id ){

                                otherPostData[0].verifiedType = await common.getRowById(otherPostData[0].u_id,'u_id','u_verified_account','user');
                                otherPostData[0].sponsorType = await common.getRowById(otherPostData[0].u_id,'u_id','u_sponsor_account','user');
        
                            } 

                            if( otherPostData[0].u_image ) {
                        
                                otherPostData[0].u_image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + otherPostData[0].u_image;
                            }
                            if ( otherPostData[0].p_post_type == 'IMAGE' || otherPostData[0].p_post_type ==  'VIDEO' ) {
                        
                                //  console.log('dsdfsdfsdfsdfsdfsdfsd',otherPostData[0].p_post_type)
                            let attachmentSql =" SELECT p_id, pa_attachment AS image, pa_attachment_m3u8 AS videoPath, pa_attachment_thumbnail AS video_thumbnail,p_post_type FROM post_attachment LEFT JOIN post ON pa_fk_p_id = P_id  WHERE pa_fk_p_id = ? AND p_post_type = ?";
    
                            let dataArrayOne = [otherPostData[0].p_id, otherPostData[0].p_post_type ];    
    
                            let  result  = await common.commonSqlQuery(attachmentSql ,dataArrayOne);
                            // console.log('dsdfsdfsdfsdfsdfsdfsd=============>>>111',result)
    
                            if ( result && result.length > 0 ) {
                               
                                if (  result[0].image && result[0].p_post_type == 'IMAGE' ) {
                                    //   console.log('result[0]',result[0].image)
                                    result[0].image = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.POST_UPLOAD_PATH + otherPostData[0].u_uuid +'/'+ conObj.AWS_IMAGE_PATH  +  result[0].image; 
            
                                }
                                 
                                if ( result[0].video_thumbnail ) {
    
                                    result[0].video_thumbnail  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.POST_UPLOAD_PATH + otherPostData[0].u_uuid +'/'+ conObj.AWS_VIDEO_PATH + otherPostData[0].p_uuid +'/'+ result[0].video_thumbnail ;
            
                                }
    
                                if ( result[0].videoPath ) {
    
                                    result[0].videoPath  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.POST_UPLOAD_PATH + otherPostData[0].u_uuid +'/'+ conObj.AWS_VIDEO_PATH + otherPostData[0].p_uuid +'/'+ result[0].image;
            
                                } else {
    
                                    result[0].videoPath  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.POST_UPLOAD_PATH + otherPostData[0].u_uuid +'/'+ conObj.AWS_VIDEO_PATH + otherPostData[0].p_uuid +'/'+ result[0].image;
    
                                }
                                
    
                                otherPostData[0].imageArray = result;
                            }
                        }
                            resultData.otherPostData = otherPostData[0]
                         }
                        //  console.log( 'otherPostData otherPostData otherPostData otherPostData',otherPostData ,resultData.otherPostData);
                    }
                    if( resultData.p_id ){
                        let sqlData = 'SELECT pl_id FROM post_like WHERE pl_fk_p_id = ? AND pl_fk_u_id = ?',
                            // dataArray = [resultData.p_id, resultData.u_id]userId
                            dataArray = [resultData.p_id, userId]
                            isLIked = await common.commonSqlQuery(sqlData,dataArray);
                            // console.log('isLIked=================>>>>>>>>>',isLIked)
                            if( isLIked && isLIked != '' ){
                                // console.log('isLIked YES YES=================>>>>>>>>>11111111')

                                resultData.postIsLike = 'YES'

                            } else {
                                // console.log('isLIked NO NO=================>>>>>>>>>2222222')

                                resultData.postIsLike = 'NO'
                            }
                    }

                    if ( resultData.p_post_type == 'IMAGE' || resultData.p_post_type ==  'VIDEO' ) {
                        
                            //  console.log('dsdfsdfsdfsdfsdfsdfsd',resultData.p_post_type)
                        let attachmentSql =" SELECT p_id, pa_attachment AS image, pa_attachment_m3u8 AS videoPath, pa_attachment_thumbnail AS video_thumbnail,p_post_type FROM post_attachment LEFT JOIN post ON pa_fk_p_id = P_id  WHERE pa_fk_p_id = ? AND p_post_type = ?";

                        let dataArrayOne = [resultData.p_id, resultData.p_post_type ];    

                        let  result  = await common.commonSqlQuery(attachmentSql ,dataArrayOne);
                        // console.log('dsdfsdfsdfsdfsdfsdfsd=============>>>111',result)

                        if ( result && result.length > 0 ) {
                           
                            if (  result[0].image && result[0].p_post_type == 'IMAGE' ) {
                                //   console.log('result[0]',result[0].image)
                                result[0].image = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.POST_UPLOAD_PATH + resultData.u_uuid +'/'+ conObj.AWS_IMAGE_PATH  +  result[0].image; 
        
                            }
                             
                            if ( result[0].video_thumbnail ) {

                                result[0].video_thumbnail  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.POST_UPLOAD_PATH + resultData.u_uuid +'/'+ conObj.AWS_VIDEO_PATH + resultData.p_uuid +'/'+ result[0].video_thumbnail ;
        
                            }

                            if ( result[0].videoPath ) {

                                result[0].videoPath  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.POST_UPLOAD_PATH + resultData.u_uuid +'/'+ conObj.AWS_VIDEO_PATH + resultData.p_uuid +'/'+ result[0].image;
        
                            } else {

                                result[0].videoPath  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.POST_UPLOAD_PATH + resultData.u_uuid +'/'+ conObj.AWS_VIDEO_PATH + resultData.p_uuid +'/'+ result[0].image;

                            }

                            resultData.imageArray = result;
                        }
                    }
                   
                    

                }
                // console.log('data data data',result)
                obj.data            = result;
                // obj.total_records   = resultOne.length;
                obj.last            = result[0].p_id;
                obj.page            = page;

                if ( checkNewRecord ) {
                    // console.log("hi i am in");

                    let getLastRecId = await common.commonSqlQuery(getLastRecIdSql, dataArray, false);
                    // console.log("getLastRecId obj is : ", getLastRecId);
                    if ( getLastRecId && getLastRecId.length > 0 ) {
                        obj.lastRecId = getLastRecId[0].p_id;
                    } 
                } 

                deferred.resolve(obj);

            } else {
                deferred.resolve(obj);
            }
        }

    } else {
        // console.log('getPostData == 1231231234234243243242343243');
        deferred.resolve(obj);
    }
    
    return deferred.promise;
}


/**
 * This function is using to add new participants in a group
 * @param     :   
 * @returns   : 
 * @developer : 
 */
postModel.updateThumbnail =  async ( obj ) => {
    // console.log('updateThumbnail in =======================>>>>>>>>>>11111111111',obj)

   let deferred          =  q.defer();
   if ( obj ) {
    //    console.log('updateThumbnail in =======================>>>>>>>>>>22222222222222222222')

       let sql = "SELECT pa_id FROM post_attachment WHERE pa_id = ? ",
           res = await common.commonSqlQuery(sql,[ obj.postAttachId ],true);

         if ( res && res.length > 0 ) {

        //    console.log('updateThumbnail in =======================>>>>>>>>>>333333333333333333333333333')

           let updateSql = "UPDATE post_attachment SET pa_attachment_thumbnail = ? WHERE pa_id = ? ",
               updateData = await common.commonSqlQuery(updateSql, [ obj.thumbnail.imageName , obj.postAttachId ]);

           if ( updateData ) {
            //    console.log('updateThumbnail in =======================>>>>>>>>>>4444444444444444444444',obj)
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
 * This function is using to delete post
 * @param     : 
 * @returns   : true , false 
 * @developer : 
 */
 postModel.postDelete = async(object) =>{
    // console.log('postDelete innnnn ====>>>>......',object)
   let deferred =  q.defer();

   let conObj   = await constant.getConstant()

    if ( object && object != '' ) {

        let postId    = '',
            userUuid  = '',
            userId    =  '',
            fileObj   = '';
        if ( object.p_id ) {
            postId = object.p_id ;
        }
        
        if ( object.userUuid ) {
            userUuid = object.userUuid; 
        }
        if( object.userId ){
            userId = object.userId
        }

        let checkSql = "SELECT p_id, p_uuid , p_post_type  FROM post WHERE p_id = ? ",
            res      = await common.commonSqlQuery(checkSql,[ postId ] );
        
        if ( res && res.length > 0 ) {

            // console.log('res==============================>>>>',res,'sfsfsfsfsfsfs',res[0].p_id)
            let attachId= await helper.getRowId(res[0].p_id,'pa_fk_p_id','pa_attachment','post_attachment');
                // console.log('attachId============>>',attachId)
            if( res[0].p_post_type == 'VIDEO' ){

                // console.log('VIDEO in===========>>>>>>>>>11111')
                if( attachId && res[0].p_uuid ){
                    // console.log('VIDEO in===========>>>>>>>>>22222222',attachId)
                let fileName = attachId.split('.')[0] 
                    // fileObj = {
                    //     sId  : fileName,
                    //     path : conObj.UPLOAD_PATH + conObj.POST_UPLOAD_PATH + userUuid +'/'+ conObj.AWS_VIDEO_PATH + res[0].p_uuid +'/',
                    // };
                    fileObj = {
                        fileName  : fileName,
                        filePath : conObj.UPLOAD_PATH + conObj.POST_UPLOAD_PATH + userUuid +'/'+ conObj.AWS_VIDEO_PATH + res[0].p_uuid +'/',
                    };
                    // console.log('VIDEO in===========>>>>>>>>>33333333',fileName)

                    
                }
                let deletedVideo = await helper.deleteFileToAwsBucket(fileObj)
                    // console.log('VIDEO in===========>>>>>>>>>44444444',fileObj)
                    // let deletedVideo = await helper.removeAwsVideo(fileObj);
                // console.log('VIDEO in===========>>>>>>>>>55555555555555',deletedVideo)
                if( deletedVideo ) {
            
                deleteMsg = true;
            
                } else {
            
                deleteMsg = false;
            
                }
                
                
            } else if( res[0].p_post_type == 'IMAGE' ){
                // console.log('IMAGE in===========>>>>>>>>>111111111');
                // console.log('IMAGE in===========>>>>>>>>>22222222',attachId,res[0].pa_fk_p_id)

                if( attachId ){
                    // console.log('IMAGE in===========>>>>>>>>>22222222',attachId)
                   fileObj = {
                    
                    filePath       : conObj.UPLOAD_PATH + conObj.POST_UPLOAD_PATH + userUuid +'/'+ conObj.AWS_IMAGE_PATH,
                    fileName       : attachId,
                   };
                    
                }
                // console.log('IMAGE in===========>>>>>>>>>333333333',fileObj)
                let deletedImage = await helper.deleteFileToAwsBucket(fileObj)
                // console.log('IMAGE in===========>>>>>>>>>44444444',deletedImage)
                if( deletedImage ) {
            
                deleteMsg = true;
            
                } else {
            
                deleteMsg = false;
                    
                }
            
            } else {
                deleteMsg = true;
            } 

            let isCommentSql   = 'SELECT pc_id FROM post_comments WHERE pc_fk_p_id = ?', 
            isCommentExist = await common.commonSqlQuery(isCommentSql,[postId]),
            isLikerSql     = 'SELECT pl_id FROM post_like WHERE pl_fk_p_id = ?', 
            isLikeExist    = await common.commonSqlQuery(isLikerSql,[postId]);
            
            // console.log('deleteComments,deleteLikes==============>>>>>>>>>>>>11111',isCommentExist,isLikeExist)

            // if( (isCommentExist && isCommentExist != '') || (isLikeExist && isLikeExist != '') ){

                let deleteCommentSql = "DELETE FROM post_comments WHERE pc_fk_p_id = ?",
                deleteComments       = await common.commonSqlQuery(deleteCommentSql ,[ postId ]),
                deleteLikeSql        = "DELETE FROM post_like WHERE pl_fk_p_id = ?",
                deleteLikes           = await common.commonSqlQuery(deleteLikeSql ,[ postId ]);

                // if( deleteComments || deleteLikes ){
                    // console.log('deleteComments,deleteLikes==============>>>>>>>>>>>>11111',deleteComments,deleteLikes)

                   let commentCount = await postModel.postCommentCount(postId),
                    likeCount    = await postModel.postLikeCount(postId);
                    // console.log('deleteComments,deleteLikes==============>>>>>>>>>>>>22222',commentCount,likeCount)

                    // if( commentCount || likeCount ){
                    //     console.log('deleteComments,deleteLikes==============>>>>>>>>>>>>3333',commentCount,likeCount)

                    //     deferred.resolve(true);

                    // } 
                // } 

            // }

            let deleteSQl = "DELETE FROM post WHERE p_id = ? ",
                deleteRes = await common.commonSqlQuery(deleteSQl ,[ postId ]);


                if ( deleteRes ) {


                        let postCount = await postModel.postCount(userId,postId);
                        //  console.log('postCount====>>>>>',postCount)
                        if( postCount ){
                            // console.log('postCount====>>>>>1111111',postCount)

                            deferred.resolve(true);
                        } else {
                            // console.log('postCount====>>>>>2222222',postCount)

                            deferred.resolve(false);

                        }
                    // deferred.resolve(true);
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
 * This function is using to delete post comment
 * @param     : 
 * @returns   : true , false 
 * @developer : 
 */
 postModel.deletePostComment = async(object) =>{
    // console.log('postDelete innnnn ====>>>>......',object)
   let deferred =  q.defer();

    if ( object && object != '' ) {

        let commentId    =  '',
            userId    =  '';
        if ( object.p_id ) {
            postId = object.p_id ;
        }
        if ( object.pc_id ) {
            commentId = object.pc_id ;
        }
 
        if( object.userId ){
            userId = object.userId
        }
        // console.log('deleteComments==============>>>>>>>>>>>>1111111111111',commentId)

        let deleteCommentSql = "DELETE FROM post_comments WHERE pc_id = ?",
        deleteComments    = await common.commonSqlQuery(deleteCommentSql ,[ commentId ]);
         
        if ( deleteComments ) {
          
            // console.log('deleteComments==============>>>>>>>>>>>>22222222222222',deleteComments)

            let commentCount = await postModel.postCommentCount(postId);
        
            // console.log('deleteComments==============>>>>>>>>>>>>',commentCount)

            if( commentCount ){

                deferred.resolve(commentCount);

            } else{
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
 * This function is using to get  count
 * @param        :
 * @returns      :
 * @developer    : 
 * @modification :  
 */

 postModel.postCount = async (userId) => {

    let deferred     = q.defer();
    //   console.log('postCount===========>>>!111',userId)
    if( userId ) {

        let countSql = 'SELECT p_id FROM post WHERE p_fk_u_id = ? AND p_deleted = ?',
        getPostCount = await helper.getDataOrCount(countSql, [userId,'0'], 'L'),
        dataObj      = {};

        if ( getPostCount ) {
            // console.log('postCount===========>>>2222222',getPostCount)

                updateData    =  'UPDATE user SET ? WHERE u_id = ?',
                dataObj         = {
        
                    u_post_count : getPostCount
                };
            
            let updatePostCount =  await common.commonSqlQuery(updateData, [dataObj, userId ]);
            // console.log('postCount===========>>>333333',updatePostCount)

            if( updatePostCount ){
                // console.log('postCount===========>>>4444444')

                deferred.resolve(true);

            } else {
                console.log('postCount===========>>>5555555')

                deferred.resolve(false)
            }
            
        } else {
            deferred.resolve(false)
        } 

    } else {

        deferred.resolve(false)
    }
    return deferred.promise
}

/**
 * This function is used to update user post data
*  @developer   : Anil Guleria
 * @modified    :
 * @params      : userId , body
 */

postModel.userPostComment = async ( userId,body ) => {
    let deferred        = q.defer();
       
    if( body && userId && body.text && body.postUuid ){
           
        let uuid            = uuidv1(Date.now()),
            insertQuery     = "INSERT INTO post_comments SET ?",
            postId          = await commonHelper.getRowId(body.postUuid,'p_uuid','p_id','post');
            // console.log('postId====>>>',postId)
            insertData      = {
                pc_fk_u_id       : userId,
                pc_fk_p_id       : postId,
                pc_uuid          : uuid,
                pc_comment       : body.text,
                pc_created       : await helper.getUtcTime()
            };

        pool.query(insertQuery, insertData, async (error, result)=> {

            if( error ) {

                deferred.resolve(false);
            } else {
                if( result ){
                    
                    let commentCount = await postModel.postCommentCount(postId);

                    if( commentCount ){

                        deferred.resolve(commentCount);
                    } else {

                        deferred.resolve(false);

                    }
                } else {
                    deferred.resolve(false);
                }
            }

        });
    } else {

        deferred.resolve(false)
    }

   return deferred.promise;
}

/**
 * This function is using to get  count
 * @param        :
 * @returns      :
 * @developer    : 
 * @modification :  
 */

 postModel.postCommentCount = async (postId) => {

    let deferred     = q.defer();
    //   console.log('postCommentCount===========>>>!111',postId)
    if( postId ) {

        let countSql = 'SELECT pc_id FROM post_comments WHERE pc_fk_p_id = ? AND pc_deleted = ?',
        getCommentCount = await helper.getDataOrCount(countSql, [postId,'0'], 'L'),
        dataObj      = {};
        // console.log('postCommentCount===========>>>2346tdfcfdvc',getCommentCount)

        // if ( getCommentCount ) {
            // console.log('postCommentCount===========>>>2222222',getCommentCount)

                updateData    =  'UPDATE post SET ? WHERE p_id = ?',
                dataObj         = {
        
                    p_comment_count : getCommentCount ? getCommentCount : '0'
                };
            
            let updatePostCount =  await common.commonSqlQuery(updateData, [dataObj, postId ]);
            // console.log('postCommentCount===========>>>333333',updatePostCount)

            if( updatePostCount ){
                // console.log('postCommentCount===========>>>4444444',getCommentCount)
                // getLikeCount ? getLikeCount:'NO'
                deferred.resolve(getCommentCount ? getCommentCount:'NO');

            } else {
                // console.log('postCommentCount===========>>>5555555')

                deferred.resolve(false)
            }
            
        // } else {
        //     deferred.resolve(false)
        // } 

    } else {

        deferred.resolve(false)
    }
    return deferred.promise
}


/**
 * This function is get user post data
 * @param     	: userId, body
 * @developer 	: 
 * @modified	: 
 */
 postModel.getCommentData = async (userId, body) => {
     console.log('body=====>>>',body)
    let deferred                = q.defer(),
        conObj                  = await constant.getConstant(),
        obj                     = {
            data                : [],
            postLikeCount       : 0,
            more_records        : 0,
            total_records       : 0,
            last                : 0,
            lastRecId           : 0,
            page                : 0,
            user_profile_url    : conObj.SITE_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH,
        };


        if( body.postUuid && body.postUuid != 'null' ){
            idPost    = await commonHelper.getRowId(body.postUuid,'p_uuid','p_id','post');
        }

        let sqlLikeCount  =  `SELECT p_like_count FROM post WHERE p_id = ?`,
        postLikeCount     = await common.commonSqlQuery(sqlLikeCount,[idPost]);
        if( postLikeCount ){
            obj.postLikeCount  = postLikeCount[0].p_like_count;
        }
    
        // console.log('getPostData == 111111111111111111111111');

    if ( userId && body ) {
        // console.log('getPostData == 22222222222222');

        let whereLast               = '',
            whereMore               = '',
            id                      = '',
            sortBy                  = 'pc_id',
            sortOrder               = 'DESC',
            page                    = 0,
            checkNewRecord          = false,
            additionalNewCondition  = '',
            addCondition            = '',
            dataArray               = '',
            records_per_page        = conObj.RECORDS_PER_PAGE,
            postId                  = '';
        if ( body.per_page && body.per_page != 'null' ) {
            records_per_page        = body.per_page;
        } 

        if ( body.page && body.page != '' && body.page != null && body.page != 'null' ) {
            //  console.log('sdffdfdsfsf',body.page)
            page = Number(body.page) + 1;

            if ( body.lastRecId != null && body.lastRecId != "null" && body.lastRecId != "" && sortOrder == "DESC") {
                // console.log(body.lastRecId)
                additionalNewCondition = " AND pc_id <= " + body.lastRecId;
            }
        } else {
            // console.log('new last id ');
            checkNewRecord  = true;
        }

        if ( body.last && body.last != 'null' ) {
            whereLast       += 'AND pc_id <= ' + body.last;
            whereMore       += 'AND pc_id > ' + body.last;
        }

        if ( body.sortOrder && body.sortOrder != 'null' ) {
            sortOrder       = body.sortOrder;
        }

        if ( body.sortBy && body.sortBy != 'null' ) {
            sortBy          = body.sortBy;
        }

        if ( body.keyword && body.keyword != 'null' ) {
            whereLast       +=  " AND u_name LIKE '%" + body.keyword + "%'";
            whereMore       +=  " AND u_name LIKE '%" + body.keyword + "%'";
        }

        if( body.postUuid && body.postUuid != 'null' ){
            postId    = await commonHelper.getRowId(body.postUuid,'p_uuid','p_id','post');
        }

        whereLast           += additionalNewCondition;
        
        let sql             = ` SELECT u_id,u_name, u_image,u_rank,u_free_contest,u_points_contest,u_sponsor_contest,u_paid_contest, u_uuid, pc_id, pc_uuid, pc_uuid, pc_comment_like_count, pc_comment_reply_count, pc_comment , pc_created FROM post_comments 
        LEFT JOIN user ON  post_comments.pc_fk_u_id =  user.u_id 
        LEFT JOIN post ON post_comments.pc_fk_p_id = post.p_id WHERE p_id = ?`;
            // dataArray       = [ '0', '0', '0', '1', '1' ];
            dataArray       = [postId];
        let getLastRecIdSql = sql + " GROUP BY pc_id ORDER BY pc_id DESC",
            moreRecordSql   = sql;

        let offset          = page * records_per_page;
        moreRecordSql       += whereMore + " GROUP BY pc_id ORDER BY " + sortBy + " " + sortOrder;
        sql                 += whereLast + " GROUP BY pc_id ORDER BY " + sortBy + " " + sortOrder + " LIMIT " + offset + "," + records_per_page;

        let result          = await common.commonSqlQuery(sql, dataArray);

        // console.log('getPostData == 33333333333333 result === ', result);
            
        if ( result && result.sqlMessage ) { 
            // console.log('getPostData == 444444444444 result === ');
            deferred.resolve(false);
        } else {

            // console.log('getPostData == 555555555555555555 result === ');

            if ( result && result.length > 0 ) {

                result.sort(function(a, b) {
                    return parseFloat(a.pc_id) - parseFloat(b.pc_id);
                });

                for ( let  resultData of result ) {

                    if( resultData.pc_created ){
                        resultData.pc_created = await helper.agoTime( resultData.pc_created );
                    }
                    if( resultData.u_image ) {
                        
                        resultData.u_image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + resultData.u_image;
                    }

                }

                obj.data            = result;
                // obj.total_records   = resultOne.length;
                obj.last            = result[0].pc_id;
                obj.page            = page;

                if ( checkNewRecord ) {
                    // console.log("hi i am in");

                    let getLastRecId = await common.commonSqlQuery(getLastRecIdSql, dataArray);
                    // console.log("getLastRecId obj is : ", getLastRecId);
                    if ( getLastRecId && getLastRecId.length > 0 ) {
                        obj.lastRecId = getLastRecId[0].pc_id;
                    } 
                } 

                deferred.resolve(obj);

            } else {
                deferred.resolve(obj);
            }
        }

    } else {
        // console.log('getPostData == 1231231234234243243242343243');
        deferred.resolve(obj);
    }
    
    return deferred.promise;
}


/**
 * This function is used to update user post data
*  @developer   : Anil Guleria
 * @modified    :
 * @params      : userId , body
 */

postModel.userPostLike = async ( userId,body ) => {
    let deferred        = q.defer();
       
    if( body && userId && body.type && body.postUuid ){
        let postId          = await commonHelper.getRowId(body.postUuid,'p_uuid','p_id','post');
        // console.log('postId=================>>>',postId);
        if( body.type == 'YES' ){
            // console.log('postId=================>>>11111111',body.type);

            let uuid            = uuidv1(Date.now()),
                insertQuery     = "INSERT INTO post_like SET ?",
                insertData      = {
                    pl_fk_u_id       : userId,
                    pl_fk_p_id       : postId,
                    pl_created       : await helper.getUtcTime()
                };
            
            let sql = 'SELECT pl_id FROM post_like WHERE pl_fk_u_id = ? AND pl_fk_p_id = ? '
            isLiked = await common.commonSqlQuery(sql, [userId, postId] );
            result  = '';
            if( isLiked &&  isLiked != ''){
                // console.log('isLikedisLikedisLikedisLikedisLiked')
                let deleteSql = `DELETE FROM post_like WHERE pl_fk_p_id = ? AND  pl_fk_u_id = ? ` ;
                result = await common.commonSqlQuery(deleteSql,[postId,userId]);
            } else {
                result = await common.commonSqlQuery(insertQuery,insertData);

            }


            // pool.query(insertQuery, insertData, async (error, result)=> {

            //     if( error ) {

            //         deferred.resolve(false);
            //     } else {
                    if( result ){
                        
                        let likeCount = await postModel.postLikeCount(postId);

                        if( likeCount ){

                            deferred.resolve(likeCount);
                        } else {

                            deferred.resolve(false);

                        }
                    } else {
                        deferred.resolve(false);
                    }
                // }

            // });
        }
        if( body.type == 'NO' ){
            // console.log('postId=================>>>222222222',body.type);

            let deleteSql = `DELETE FROM post_like WHERE pl_fk_p_id = ? AND  pl_fk_u_id = ? ` 
                deleteResult = await common.commonSqlQuery(deleteSql,[postId,userId]);
            if( deleteResult ){
                // console.log('postCount===========>>>!111',deleteResult)

                let likeCount = await postModel.postLikeCount(postId);
                // console.log('likeCount===========>>>22222',likeCount)

                if( likeCount ){
                    // console.log('likeCount===========>>>22222',postId)

                    deferred.resolve(likeCount );
                } else {
                    // console.log('likeCount===========>>>333333',postId)

                    deferred.resolve(false);

                }

            } else {
                // console.log('likeCount===========>>>44444',postId)

                deferred.resolve(false);
            } 
        }
    } else {

        deferred.resolve(false)
    }

   return deferred.promise;
}

/**
 * This function is using to get  count
 * @param        :
 * @returns      :
 * @developer    : 
 * @modification :  
 */

 postModel.postLikeCount = async (postId) => {

    let deferred     = q.defer();
    //   console.log('postLikeCount===========>>>!111',postId)
    if( postId ) {

        let countSql = 'SELECT pl_id FROM post_like WHERE pl_fk_p_id = ? ',
        getLikeCount = await helper.getDataOrCount(countSql, [postId,'0'], 'L'),
        dataObj      = {};

        // console.log('postLikeCount===========>>>2222222',getLikeCount)

            let updateData    =  'UPDATE post SET ? WHERE p_id = ?';
            dataObj         = {
    
                p_like_count : getLikeCount ? getLikeCount :'0'
            };
        
        let updatePostCount =  await common.commonSqlQuery(updateData, [dataObj, postId ] );
        // console.log('postLikeCount===========>>>333333',updatePostCount)

        if( updatePostCount ){
            // console.log('postLikeCount===========>>>4444444',getLikeCount)

            deferred.resolve(getLikeCount ? getLikeCount:'NO');

        } else {
            // console.log('postLikeCount===========>>>5555555')

            deferred.resolve(false)
        }
    
    } else {

        deferred.resolve(false)
    }
    return deferred.promise
}

/**
 * This function is get user post data
 * @param     	: userId, body
 * @developer 	: 
 * @modified	: 
 */
 postModel.getLikeData = async (userId, body) => {
    // console.log('body=====>>>',body)
    let deferred                = q.defer(),
        conObj                  = await constant.getConstant(),
        obj                     = {
            data                : '',
            more_records        : 0,
            total_records       : 0,
            last                : 0,
            lastRecId           : 0,
            page                : 0,
            user_profile_url    : conObj.SITE_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH,
        };


        //    console.log('getPostData == 111111111111111111111111');

    if ( userId && body ) {
        //    console.log('getPostData == 22222222222222');

        let whereLast               = '',
            whereMore               = '',
            id                      = '',
            sortBy                  = 'pl_id',
            sortOrder               = 'DESC',
            page                    = 0,
            checkNewRecord          = false,
            additionalNewCondition  = '',
            addCondition            = '',
            dataArray               = '',
            records_per_page        = conObj.RECORDS_PER_PAGE,
            postId                  = '';
        if ( body.per_page && body.per_page != 'null' ) {
            records_per_page        = body.per_page;
        } 

        if ( body.page && body.page != '' && body.page != null && body.page != 'null' ) {
                // console.log('sdffdfdsfsf',body.page)
            page = Number(body.page) + 1;

            if ( body.lastRecId != null && body.lastRecId != "null" && body.lastRecId != "" && sortOrder == "DESC") {
                //    console.log(body.lastRecId)
                additionalNewCondition = " AND pl_id <= " + body.lastRecId;
            }
        } else {
            //    console.log('new last id ');
            checkNewRecord  = true;
        }

        if ( body.last && body.last != 'null' ) {
            whereLast       += 'AND pl_id <= ' + body.last;
            whereMore       += 'AND pl_id > ' + body.last;
        }

        if ( body.sortOrder && body.sortOrder != 'null' ) {
            sortOrder       = body.sortOrder;
        }

        if ( body.sortBy && body.sortBy != 'null' ) {
            sortBy          = body.sortBy;
        }

        if ( body.keyword && body.keyword != 'null' ) {
            whereLast       +=  " AND u_name LIKE '%" + body.keyword + "%'";
            whereMore       +=  " AND u_name LIKE '%" + body.keyword + "%'";
        }

        if( body.postUuid && body.postUuid != 'null' ){
            postId    = await commonHelper.getRowId(body.postUuid,'p_uuid','p_id','post');
        }

        whereLast           += additionalNewCondition;
        
        let sql             = ` SELECT u_id,u_name, u_image, u_uuid,u_rank,u_free_contest,u_points_contest,u_sponsor_contest,u_paid_contest, pl_id, pl_created FROM post_like 
        LEFT JOIN user ON  post_like.pl_fk_u_id =  user.u_id 
        LEFT JOIN post ON post_like.pl_fk_p_id = post.p_id WHERE p_id = ?`;
            // dataArray       = [ '0', '0', '0', '1', '1' ];
            dataArray       = [postId];
        let getLastRecIdSql = sql + " GROUP BY pl_id ORDER BY pl_id DESC",
            moreRecordSql   = sql;

        let offset          = page * records_per_page;
        moreRecordSql       += whereMore + " GROUP BY pl_id ORDER BY " + sortBy + " " + sortOrder;
        sql                 += whereLast + " GROUP BY pl_id ORDER BY " + sortBy + " " + sortOrder + " LIMIT " + offset + "," + records_per_page;

        let result          = await common.commonSqlQuery(sql, dataArray);

        //    console.log('getPostData == 33333333333333 result === ', result);
            
        if ( result && result.sqlMessage ) { 
            //    console.log('getPostData == 444444444444 result === ');
            deferred.resolve(false);
        } else {

            //    console.log('getPostData == 555555555555555555 result === ');

            if ( result && result.length > 0 ) {

                for ( let  resultData of result ) {

                    if( resultData.pc_created ){
                        resultData.pc_created = await helper.agoTime( resultData.pc_created );
                    }
                    if( resultData.u_image ) {
                        
                        resultData.u_image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + resultData.u_image;
                    }
                    

                }

                obj.data            = result;
                // obj.total_records   = resultOne.length;
                obj.last            = result[0].pl_id;
                obj.page            = page;

                if ( checkNewRecord ) {
                    //    console.log("hi i am in");

                    let getLastRecId = await common.commonSqlQuery(getLastRecIdSql, dataArray);
                    // console.log("getLastRecId obj is : ", getLastRecId);
                    if ( getLastRecId && getLastRecId.length > 0 ) {
                        obj.lastRecId = getLastRecId[0].pl_id;
                    } 
                } 

                deferred.resolve(obj);

            } else {
                deferred.resolve(obj);
            }
        }

    } else {
        //    console.log('getPostData == 1231231234234243243242343243');
        deferred.resolve(obj);
    }
   
   return deferred.promise;
}


/**
* This function is used to Share Post
* @param     	: postId
* @developer 	: Dushyant Sharma
* @modified	: 
*/
postModel.userPostShare = async ( userId,body ) => {
    let deferred        = q.defer();
       
    if( body && userId && body.postId ){

        let uuid            = uuidv1(Date.now()),
            insertQuery     = "INSERT INTO post SET ?",
            insertData      = {
                p_fk_u_id       : userId,
                p_uuid          : uuid,
                p_share_id      : body.postId,
                p_created       : await helper.getUtcTime()
            };

         pool.query(insertQuery, insertData, async (error, result)=> {

            if( error ) {

                deferred.resolve(false);
            } else {
                if( result ){
                    // let postCount = await postModel.userPostCount(userId,body),
                    let   shareCount = await postModel.userShareCount(userId,body);

                    if( shareCount ){

                        deferred.resolve(true);
                    } else {

                        deferred.resolve(false);

                    }
                    deferred.resolve(true);

                } else {
                    deferred.resolve(false);
                }
            }

        });
    } else {

        deferred.resolve(false)
    }

   return deferred.promise;
}

/**
 * This function is using to get shear count
 * @param        :
 * @returns      :
 * @developer    : Dushyant Sharma
 * @modification :  
 */

 postModel.userShareCount = async (userId, body) => {

    let deferred     = q.defer();

    if( body && userId ) {

        let countSql = 'SELECT p_id FROM post WHERE p_share_id = ? AND p_deleted = ?',
        getShareCount = await helper.getDataOrCount(countSql, [body.postId,'0'], 'L'),
        dataObj      = {};
        if ( getShareCount ) {

                updateData    =  'UPDATE post SET ? WHERE p_id = ?',
                dataObj         = {
        
                    p_share_count : getShareCount
                };
            
            let updateShareCount =  await common.commonSqlQuery(updateData, [dataObj,body.postId]);

            if( updateShareCount ){

                deferred.resolve(updateShareCount);

            } else {
                
                deferred.resolve(false)
            }
            
        } else {
            deferred.resolve(false)
        } 

    } else {

        deferred.resolve(false)
    }
    return deferred.promise
}


 /**
 * Used to update uploaded video data.
 * @developer   : 
 * @modified    :
 * @params      : 
 */
 postModel.editPostData = async (body) => {
    let deferred       = q.defer();
    if ( body  && body.postUuid  && body.postText ) {
        
        let updateSql   = `UPDATE post SET  p_text = ? WHERE  p_uuid = ?`,
            dataArray   = [ body.postText,body.postUuid],
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
* Used to get post view count
* @developer   : Dushyant Sharma
* @modified    :
* @params      : req.body, userId, postId
*/
postModel.postViewCount =  async function( body, userId, postId ) {
console.log('postViewCount=========================>>>>>>>>>>',body, userId, postId)
    let deferred    =  q.defer();

    if ( body && userId && body.postUuid && postId && postId != '' ) {

        let Obj = {
            pv_fk_u_id   : userId,
            pv_fk_p_id   : postId,
            pv_created   : await helper.getUtcTime()
        }, 
        insertViewData = await commonModel.insert('post_views',Obj);

        if( insertViewData ){

            let sql = 'SELECT pv_id FROM post_views WHERE pv_fk_p_id = ? ',
            sqlData = await commonModel.commonSqlQuery(sql,[postId],true);

            if( sqlData && sqlData.length > 0 ){

                let postViewCount = sqlData.length,
                sqlUpdate     = "UPDATE post SET ? WHERE p_uuid = ?",
                    obj     = {
                        p_views_count : postViewCount
                    },
                    res     = await commonModel.commonSqlQuery(sqlUpdate,[obj,body.postUuid],true);

                if ( res ) {

                    deferred.resolve(postViewCount);

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



module.exports = postModel;
