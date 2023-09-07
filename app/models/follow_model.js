



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

// const { updateData } = require('../../configCommon/helper/mongo_helper');

let followModel = {};
/**
 * This function is using to verify secondary email
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : 
 */
 followModel.followUnFollow = async function(obj) {
    console.log('followUnFollowfollowUnFollowfollowUnFollowfollowUnFollowfollowUnFollow',obj )

    let deferred  = q.defer(),
        date      = await commonHelper.getPstDateTime('timeDate');

    if ( obj && obj.userId && obj.followUserId ) {
       console.log('objobjobjobjobjobjobjobj',obj )
        // let getUserDetail   = await userModel.executeQuery(obj.userId),
        //     // getBlockedUser  = await userModel.executeQuery(obj.followUserId),
        //     userName        = '',
        //     blockUserName   = '';

        // if ( getUserDetail && getUserDetail.length > 0 && getBlockedUser && getBlockedUser.length > 0 ) {

        //     userName        = getUserDetail[0].u_name;
        //     blockUserName   = getBlockedUser[0].u_name;
        // }

        if ( obj.type == 'FOLLOW' ) {
            console.log('FOLLOWFOLLOWFOLLOWFOLLOWFOLLOWFOLLOWFOLLOW',obj.type  )

            objData = {
                uf_fk_u_id         : obj.userId,
                uf_follower_u_id   : obj.followUserId,
                uf_created         : date,
                uf_updated         : date,
            }

            let insertedId = await common.insert('user_follow',objData,true);
              console.log('sdfasdfs====================>>',insertedId)
            if ( insertedId && insertedId > 0 ) {

                let updateConTypeSql = 'UPDATE conversation SET con_type = "ONE_TO_ONE" WHERE con_sender_u_uuid = ? AND con_receiver_u_uuid = ?'
                updateConTypeSql     = await common.commonSqlQuery(updateConTypeSql,[obj.userId,obj.followUserId],true);
                
                console.log('updateConTypeSql updateConTypeSql updateConTypeSql',updateConTypeSql);

                let followCount = await followModel.userFollowCount(obj.userId,obj.followUserId);
                 if( followCount ){
                    deferred.resolve(true);
                 } else{
                    deferred.resolve(false);

                 }

                // let actionDate  = await helper.getPstDateTime('timeDate'),
                //     joinDate    = await helper.dateFormat(actionDate, 'n'),
                    // activityObj = {
                    //     userId          : obj.followUserId,
                    //     actionUserId    : obj.userId,  
                    //     description     : userName + ' followed ' + blockUserName + ' at dated ' + joinDate, 
                    //     activityType    : 'PROFILE', 
                    //     date            : actionDate
                    // };
                
                // helper.insertUserActivityLogs(activityObj);
                // followModel.sendFollowNotification(obj,insertedId);
                // deferred.resolve(true);
            } else {
                deferred.resolve(false);
            }

        } else if ( obj.type == 'UNFOLLOW' ) {
            console.log('UNFOLLOWUNFOLLOWUNFOLLOWUNFOLLOWUNFOLLOWUNFOLLOW',obj.type  )

            let sqlQuery  = "DELETE FROM user_follow WHERE uf_fk_u_id = ? AND uf_follower_u_id = ? ";
                result    = await common.commonSqlQuery(sqlQuery, [obj.userId, obj.followUserId]);

            if ( result ) {

                let followCount = await followModel.userFollowCount(obj.userId,obj.followUserId);
                 if( followCount ){
                    deferred.resolve(true);
                 } else{
                    deferred.resolve(false);

                 }
                // let actionDate  = await helper.getPstDateTime('timeDate'),
                //     joinDate    = await helper.dateFormat(actionDate, 'n'),
                //     activityObj = {
                //         userId          : obj.userId,
                //         actionUserId    : obj.userId,  
                //         description     : userName + ' unfollowed ' + blockUserName + ' at dated ' + joinDate, 
                //         activityType    : 'PROFILE', 
                //         date            : actionDate
                //     };
                
                // helper.insertUserActivityLogs(activityObj);
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
 * This function is using to get report count
 * @param        :
 * @returns      :
 * @developer    : 
 * @modification :  
 */

followModel.userFollowCount = async (userId, followUserId) => {
    console.log('userFollowCountuserFollowCountuserFollowCount',userId,followUserId  )

    let deferred     = q.defer();

    if( userId && followUserId ) {
        console.log('userFollowCountuserFollowCountuserFollowCount1111111111',userId,followUserId  )

        let followerSql       = 'SELECT uf_id FROM user_follow WHERE uf_follower_u_id = ? ',
            followingSql      = 'SELECT uf_id FROM user_follow WHERE uf_fk_u_id = ? '
            followerSqlCount  = await helper.getDataOrCount(followerSql, [followUserId], 'L', true),
            followingSqlCount = await helper.getDataOrCount(followingSql, [userId], 'L', true),
            perms             = [],
            updateData        = '',
            dataObj           = {},
            updateFollowCount = '';
            console.log('userFollowCountuserFollowCountuserFollowCount22222222',followerSqlCount  )

        if ( followerSqlCount && followerSqlCount != '' ) {
            console.log('userFollowCountuserFollowCountuserFollowCount2222222111111',followerSqlCount  )

            updateData    =  'UPDATE user SET ? WHERE u_id = ?',
            dataObj         = {
    
                    u_followers : followerSqlCount
            };
            perms = [dataObj, followUserId];
            updateFollowersCount =  await common.commonSqlQuery(updateData, perms, true );

        } else {
            updateData    =  'UPDATE user SET ? WHERE u_id = ?',
            dataObj         = {
    
                    u_followers : 0
            };
            perms = [dataObj, followUserId];
            updateFollowersCount =  await common.commonSqlQuery(updateData, perms, true );
            console.log('userFollowCountuserFollowCountuserFollowCount33333333111111111',updateFollowersCount  )

        } 

        if ( followingSqlCount && followingSqlCount != '' ) {
            console.log('userFollowCountuserFollowCountuserFollowCount33333333',followingSqlCount  )

            updateData    =  'UPDATE user SET ? WHERE u_id = ?',
            dataObj         = {
    
                u_following : followingSqlCount
            };
            perms = [dataObj,userId ];
            updateFollowingCount =  await common.commonSqlQuery(updateData, perms, true );

        } else {
            console.log('userFollowCountuserFollowCountuserFollowCount444444444111111',updateFollowingCount  )
            updateData    =  'UPDATE user SET ? WHERE u_id = ?',
            dataObj         = {
    
                u_following : 0
            };
            perms = [dataObj,userId ];
            updateFollowingCount =  await common.commonSqlQuery(updateData, perms, true );

        }

        if( updateFollowersCount && updateFollowingCount ){
            console.log('userFollowCountuserFollowCountuserFollowCount444444444',updateFollowCount  )

            deferred.resolve(true);

        } else {
            console.log('userFollowCountuserFollowCountuserFollowCount5555555',updateFollowCount  )

            deferred.resolve(false)
        }
        

    } else {

        deferred.resolve(false)
    }
    return deferred.promise
}
/**
 * This function is using to send notification 
 
 * @modified  : 
 */
 followModel.sendFollowNotification = async function(objData, insertedId) {

    let deferred = q.defer();

    if ( objData && insertedId ) {

        let deviceTokens      = await common.getUserDeviceTokens(objData.followUserId),
            userName          = await common.getRowById(objData.userId , 'u_id', 'u_name', 'user'),
            memberDeviceToken = '';   

        if ( deviceTokens && deviceTokens.length > 0 ) {
            
            for ( let i = 0; i < deviceTokens.length; i++ ) {
                if ( memberDeviceToken ) {
                    memberDeviceToken += ',' + deviceTokens[i].ud_token;
                } else {
                    memberDeviceToken += deviceTokens[i].ud_token;
                }
            }
        }
        
        let obj = {
            title             : 'USER FOLLOW',
            body              : userName + ' started following you.',
            memberDeviceToken : memberDeviceToken,
            userId            : objData.userId,
            receiverId        : objData.followUserId,
            referenceId       : insertedId,
            type              : 'UF',
            topicId           : 0
        }
        common.sendNotificationUser( obj );
        deferred.resolve( true );
        
    } else {
        deferred.resolve( false );
    }

    return deferred.promise;

}


/**
 * This function is get user post data
 * @param     	: userId, body
 * @developer 	: 
 * @modified	: 
 */
 followModel.getMyFollowersList = async (userId, body) => {
    //  console.log('body=====>>>',body)
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


        // console.log('getPostData == 111111111111111111111111');

    if ( userId && body ) {
        // console.log('getPostData == 22222222222222');

        let whereLast               = '',
            whereMore               = '',
            id                      = '',
            sortBy                  = 'uf_id',
            sortOrder               = 'DESC',
            page                    = 0,
            checkNewRecord          = false,
            additionalNewCondition  = '',
            addCondition            = '',
            dataArray               = '',
            records_per_page        = conObj.RECORDS_PER_PAGE,
            sqlQuery                = '';
        if ( body.per_page && body.per_page != 'null' ) {
            records_per_page        = body.per_page;
        } 

        if ( body.page && body.page != '' && body.page != null && body.page != 'null' ) {
             console.log('sdffdfdsfsf',body.page)
            page = Number(body.page) + 1;

            if ( body.lastRecId != null && body.lastRecId != "null" && body.lastRecId != "" && sortOrder == "DESC") {
                console.log(body.lastRecId)
                additionalNewCondition = " AND uf_id <= " + body.lastRecId;
            }
        } else {
            console.log('new last id ');
            checkNewRecord  = true;
        }

        if ( body.last && body.last != 'null' ) {
            whereLast       += 'AND uf_id <= ' + body.last;
            whereMore       += 'AND uf_id > ' + body.last;
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

        whereLast           += additionalNewCondition;
    
        if( body.type == 'FOLLOWER' ){

            sqlQuery = `SELECT u_uuid,u_name,u_image,u_is_online,u_is_available FROM user_follow LEFT JOIN user ON user.u_id = user_follow.uf_fk_u_id WHERE user_follow.uf_follower_u_id = ?`;
    
        }
        if( body.type == 'FOLLOWING' ){
    
            sqlQuery  = `SELECT u_uuid,u_name,u_image,u_is_online,u_is_available  FROM user_follow LEFT JOIN user ON user.u_id = user_follow.uf_follower_u_id WHERE user_follow.uf_fk_u_id = ?`;
        
        }
       
        let getLastRecIdSql = sqlQuery + " GROUP BY uf_id ORDER BY uf_id DESC",
            moreRecordSql   = sqlQuery;

        let offset          = page * records_per_page;
        moreRecordSql       += whereMore + " GROUP BY uf_id ORDER BY " + sortBy + " " + sortOrder;
        sqlQuery            += whereLast + " GROUP BY uf_id ORDER BY " + sortBy + " " + sortOrder + " LIMIT " + offset + "," + records_per_page;

        let result          = await common.commonSqlQuery(sqlQuery, userId, true);

        // console.log('getPostData == 33333333333333 result === ', result);
            
        if ( result && result.sqlMessage ) { 
            // console.log('getPostData == 444444444444 result === ');
            deferred.resolve(false);
        } else {

            // console.log('getPostData == 555555555555555555 result === ');

            if ( result && result.length > 0 ) {

                for ( let  resultData of result ) {

                    if( resultData.u_image ) {
                        
                        resultData.u_image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + resultData.u_image;
                    }

                    let id                  =  await common.getRowById( resultData.u_uuid, 'u_uuid', 'u_id', 'user' );
                        resultData.followStatus = await common.getFollowStatus(id,userId);
                }

                obj.data            = result;
                // obj.total_records   = resultOne.length;
                obj.last            = result[0].uf_id;
                obj.page            = page;

                if ( checkNewRecord ) {
                    console.log("hi i am in");

                    let getLastRecId = await common.commonSqlQuery(getLastRecIdSql, dataArray, false);
                    // console.log("getLastRecId obj is : ", getLastRecId);
                    if ( getLastRecId && getLastRecId.length > 0 ) {
                        obj.lastRecId = getLastRecId[0].uf_id;
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
 * This function is get user post data
 * @param     	: userId, body
 * @developer 	: 
 * @modified	: 
 */
 followModel.friendsList = async (userId, body) => {
    //  console.log('body=====>>>',body)
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


        // console.log('getPostData == 111111111111111111111111');

    if ( userId && body ) {
        // console.log('getPostData == 22222222222222');

        let whereLast               = '',
            whereMore               = '',
            id                      = '',
            sortBy                  = 'uf_id',
            sortOrder               = 'DESC',
            page                    = 0,
            checkNewRecord          = false,
            additionalNewCondition  = '',
            addCondition            = '',
            dataArray               = '',
            records_per_page        = conObj.RECORDS_PER_PAGE,
            sqlQuery                = '';
        if ( body.per_page && body.per_page != 'null' ) {
            records_per_page        = body.per_page;
        } 

        if ( body.page && body.page != '' && body.page != null && body.page != 'null' ) {
             console.log('sdffdfdsfsf',body.page)
            page = Number(body.page) + 1;

            if ( body.lastRecId != null && body.lastRecId != "null" && body.lastRecId != "" && sortOrder == "DESC") {
                console.log(body.lastRecId)
                additionalNewCondition = " AND uf_id <= " + body.lastRecId;
            }
        } else {
            console.log('new last id ');
            checkNewRecord  = true;
        }

        if ( body.last && body.last != 'null' ) {
            whereLast       += 'AND uf_id <= ' + body.last;
            whereMore       += 'AND uf_id > ' + body.last;
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

        whereLast           += additionalNewCondition;
    
        // if( body.type == 'FOLLOWER' ){

        //     sqlQuery = `SELECT u_uuid,u_name,u_image,u_is_online,u_is_available FROM user_follow LEFT JOIN user ON user.u_id = user_follow.uf_fk_u_id WHERE user_follow.uf_follower_u_id = ?`;
    
        // }
        // if( body.type == 'FOLLOWING' ){
        
            // sqlQuery  = `SELECT DISTINCT u_uuid,u_name,u_image FROM user_follow LEFT JOIN user ON user.u_id = user_follow.uf_follower_u_id OR user.u_id = user_follow.uf_fk_u_id WHERE (user_follow.uf_fk_u_id = ? OR user_follow.uf_follower_u_id = ?) AND user.u_id != ?`;

            sqlQuery = 'SELECT u_uuid,u_name,u_image,u_is_online,u_is_available FROM user_follow LEFT JOIN user ON user.u_id = user_follow.uf_fk_u_id WHERE user_follow.uf_follower_u_id = ?';
            dataArray = [userId]

        // }

        let getLastRecIdSql = sqlQuery + " GROUP BY uf_id ORDER BY uf_id DESC",
            moreRecordSql   = sqlQuery;

        let offset          = page * records_per_page;
        moreRecordSql       += whereMore + " GROUP BY uf_id ORDER BY " + sortBy + " " + sortOrder;
        sqlQuery            += whereLast + " GROUP BY uf_id ORDER BY " + sortBy + " " + sortOrder + " LIMIT " + offset + "," + records_per_page;

        if( body.type && body.type == 'ALL' ){
            sqlQuery = 'SELECT u_uuid,u_name,u_image,u_is_online,u_is_available FROM user WHERE u_active = "1" ';
            dataArray = []
            sortBy                  = 'u_id',
            getLastRecIdSql = sqlQuery + " GROUP BY u_id ORDER BY u_id DESC",
            moreRecordSql   = sqlQuery;
            offset          = page * records_per_page;
            moreRecordSql       += whereMore + " GROUP BY u_id ORDER BY " + sortBy + " " + sortOrder;
            sqlQuery            += whereLast + " GROUP BY u_id ORDER BY " + sortBy + " " + sortOrder + " LIMIT " + offset + "," + records_per_page;
        }

        // let result          = await common.commonSqlQuery(sqlQuery, [userId,userId,userId], true);
        let result          = await common.commonSqlQuery(sqlQuery, dataArray, true);


        // console.log('getPostData == 33333333333333 result === ', result);
            
        if ( result && result.sqlMessage ) { 
            // console.log('getPostData == 444444444444 result === ');
            deferred.resolve(false);
        } else {

            // console.log('getPostData == 555555555555555555 result === ');

            if ( result && result.length > 0 ) {

                for ( let  resultData of result ) {

                    if( resultData.u_image ) {
                        
                        resultData.u_image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + resultData.u_image;
                    }

                    let id                  =  await common.getRowById( resultData.u_uuid, 'u_uuid', 'u_id', 'user' );
                        resultData.followStatus = await common.getFollowStatus(id,userId);
                }

                obj.data            = result;
                // obj.total_records   = resultOne.length;
                obj.last            = result[0].uf_id;
                obj.page            = page;

                if ( checkNewRecord ) {
                    console.log("hi i am in");

                    let getLastRecId = await common.commonSqlQuery(getLastRecIdSql, dataArray, false);
                    // console.log("getLastRecId obj is : ", getLastRecId);
                    if ( getLastRecId && getLastRecId.length > 0 ) {
                        obj.lastRecId = getLastRecId[0].uf_id;
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


module.exports = followModel;
