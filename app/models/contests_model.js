


const { async } = require('q');
const { result } = require('underscore');

const passwordHash 		= require('password-hash'),
    AWS                 = require('aws-sdk'),
    q                   = require('q'),
    spacetime           = require('spacetime'),
    {v1: uuidv1}        = require('uuid'),
    config				= require('../../configCommon/config').init(),
    connectionManager 	= require('../../configCommon/config/db'),
    pool 	            = require('../../configCommon/config/pool'),
    common              = require('./configCommon'),
    constant            = require('../../configCommon/config/constants'),
    commonHelper        = require('../../configCommon/helpers/index'),
    moment              = require('moment'),
    helper              = require('../../configCommon/helpers/index');
    // email_template      = require('./email_templates');
        

let contestsModel           = {};
const momentTimeZone = require('moment-timezone');
function convertNYCToUTC(nycDateTime,timeZone) {
const oldFormat = 'MM-DD-YYYY hh:mm A';
const newFormat = 'YYYY-MM-DD HH:mm:ss';
const convertedDateTime = moment(nycDateTime, oldFormat).format(newFormat);
const nycMoment = momentTimeZone.tz(convertedDateTime, timeZone && timeZone == 'IST' ? 'Asia/Calcutta' : 'America/New_York');
const utcMoment = nycMoment.utc();
return utcMoment.format('hh:mm A');
}

// function nowTimeDate(){
//     const currentDate = new Date();
//     const year = currentDate.getUTCFullYear();
//     const month = String(currentDate.getUTCMonth() + 1).padStart(2, "0");
//     const day = String(currentDate.getUTCDate()).padStart(2, "0");
//     const hours = String(currentDate.getUTCHours()).padStart(2, "0");
//     const minutes = String(currentDate.getUTCMinutes()).padStart(2, "0");
//     const seconds = String(currentDate.getUTCSeconds()).padStart(2, "0");
//     const formattedUtcDateTime = `${month}-${day}-${year} ${hours}:${minutes}:${seconds}`;
//     return formattedUtcDateTime
// }

function nowTimeDate() {
    const currentDate = new Date();
    const year = currentDate.getUTCFullYear();
    const month = String(currentDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getUTCDate()).padStart(2, "0");
    const hours24 = currentDate.getUTCHours();
    const hours12 = (hours24 % 12) || 12; // Convert to 12-hour format
    const minutes = String(currentDate.getUTCMinutes()).padStart(2, "0");
    const seconds = String(currentDate.getUTCSeconds()).padStart(2, "0");
    const ampm    = hours24 < 12 ? "AM" : "PM";
    
    const formattedUtcDateTime = `${month}-${day}-${year} ${hours12.toString().padStart(2, "0")}:${minutes} ${ampm}`;
    return formattedUtcDateTime;
}

contestsModel.convertUTCToNYC = async (utcDateTime,timeZone ) => {
    console.log('utcDateTime===================>>>>>>>>>>>',utcDateTime);
    const parsedDate = moment(utcDateTime, 'MM-DD-YYYY h:mm A');
    const isoDate = parsedDate.toISOString();
    const utcMoment = moment.utc(isoDate);
    const nycMoment = utcMoment.tz(timeZone && timeZone == 'IST' ? 'Asia/Calcutta' : 'America/New_York');
    return nycMoment.format('hh:mm A');
}
// function contestsModel.convertUTCToNYC(utcDateTime,timeZone) {

//   }
  
/**
 * This function is used to add contest
 * @param        :
 * @returns      :
 * @developer    :
 * @modification : Anil Guleria
 */
contestsModel.addContests = async ( body,userId ) => {
    console.log('We are hear addContests===================>>>>>>>addContests',body);
    let deferred = q.defer(),
        conObj   = await constant.getConstant();
    if ( body && userId && body.contestName && body.startTime && body.endTime ) {
            // let  userData        = await common.getRowIdAll(userId ,'u_id','u_free_contest,u_points_contest,u_sponsor_contest,u_paid_contest','user'),
            let  userData  = await common.getRowIdAll(userId, 'u_id', 'user');
            uuid            = uuidv1(Date.now()),
            dataObj         = {
                message : 'Something Went Wrong',
                status  :  false
            },
            createStatus    = 'YES';
            contestName     = await commonHelper.capitalizeFirstLetter(body.contestName);

            let insertData      = {
                ct_fk_u_id                 : userId,
                ct_uuid                    : uuid,
                ct_name                    : body.contestName,
                ct_start_date              : body.startDate ,
                ct_start_time              : convertNYCToUTC(body.startDate +' '+ body.startTime,body.timeZone),
                ct_end_time                : convertNYCToUTC(body.startDate +' '+ body.endTime,body.timeZone),
                ct_start_date_time         : body.startDate +' '+ body.startTime,
                ct_end_date_time           : body.startDate +' '+ body.endTime,
                ct_is_location_based       : body.locationBased,
                ct_point_type_earn         : body.pointEarnType,
                ct_views_require           : body.viewsBased,
                ct_created_at              : await helper.getUtcTime('','') ,            
            };

            if( body.locationBased == 'YES'){

                if( body.location && body.location != '' ){

                    if(  body.latitude && body.longitude && body.latitude != '' && body.longitude != '' ){

                        insertData.ct_latitude  = body.latitude;
                        insertData.ct_longitude = body.longitude;
                        insertData.ct_address   = body.location;

                        
                    } else {

                        insertData.ct_address = body.location;

                    }

                } else {

                    deferred.resolve(dataObj)
 
                }
                
            }

            if( body.distance && body.distance != '' ){

                insertData.ct_contest_distance = body.distance;

            }

            if( body.viewsBased == 'YES'){
                insertData.ct_views       = body.views;
                
            }

            if( body.contestType == 'POINTS'){

                insertData.ct_points       = body.points ? body.points : '0' ;
                
            }

            if( body.pointEarnType == 'STORE'){

               
            }
            
            if( body.contestType  && body.contestType != '' ){

                if( body.contestType == 'POINTS' ){

                    insertData.ct_contestType = 'POINTS'; 

                    if(  userData && userData.u_points_contest != '1'){

                        dataObj.message = "You don't have permission to create points contest ."
                        createStatus    = 'NO'

                    }

                } else if ( body.contestType == 'SPONSORS' ){
                    insertData.ct_contestType = 'SPONSORS'; 

                    if( userData && userData.u_sponsor_contest != '1'){
                        dataObj.message = "You don't have permission to create sponsor contest."
                        createStatus    = 'NO'

    
                    }

                } else {
                   
                    insertData.ct_contestType = 'FREE'; 

                    if( userData && userData.u_free_contest != '1' ){
                        dataObj.message = "You don't have permission to create free contest."
                        createStatus    = 'NO'

                    }

                }

            } 

            let insertedId = ''
            if( createStatus && createStatus == 'YES'){
                insertedId = await common.insert('contests', insertData);

            }

        if( insertedId && insertedId != '' ) {
            dataObj.status = true;
            dataObj.message = 'Contest added Successfully';
            dataObj.insertedId = insertedId;
            deferred.resolve(dataObj);

        } else {
            deferred.resolve(dataObj);
        }
    } else {

        deferred.resolve(dataObj);

    }
    
    return deferred.promise;
}

/**
 * This function is get contests data Detail
 * @param     	: userId, contestUuid
 * @developer 	: 
 * @modified	: 
 */
 contestsModel.getContestsDetail = async (userId, body) => {

    let deferred                = q.defer(),
        conObj                  = await constant.getConstant(),
        obj                     = {
            data                : '',
            user_profile_url    : conObj.SITE_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH,
        };

    if ( userId && body && body.contestUuid ) {

        let dataArray               = [body.contestUuid];
        
        let sql  = ` SELECT  ct_id, ct_fk_u_id, ct_uuid, ct_name,ct_start_date, ct_start_time, ct_end_date,ct_image, ct_end_time, ct_start_date_time, ct_end_date_time,ct_contestType, ct_points, ct_is_live,ct_store_joining_points,ct_views_require, ct_views,ct_viewer_count, ct_address, ct_contest_distance, ct_created_at,ct_latitude,ct_longitude,ct_point_type_earn,ct_is_location_based FROM contests WHERE ct_uuid = ?`;

        let result          = await common.commonSqlQuery(sql, dataArray);        

        if ( result && result.length > 0 ) {

            let getContestCreatedSql = 'SELECT ct_id FROM contests WHERE ct_id= ? AND ct_fk_u_id = ? ',
            getContestCreatedData    = await common.commonSqlQuery(getContestCreatedSql,[result[0].ct_id,userId]);

            const timeData = moment(result[0].ct_start_time, 'HH:mm A');
            let time12HourFormat   =  await contestsModel.convertUTCToNYC(result[0].ct_start_date +' '+ result[0].ct_start_time,body.timeZone)
            let startDateTimeData = result[0].ct_start_date + ' ' + time12HourFormat;
            let data = formatDateTime(startDateTimeData);
            result[0].startDateTime = data;

            if( getContestCreatedData && getContestCreatedData != '' ){
                result[0].createdByLoginUser = 'YES' 

            } else {
                result[0].createdByLoginUser = 'NO' 
            }

            if( result[0].ct_start_time ){
                result[0].ct_start_time   =  await contestsModel.convertUTCToNYC(result[0].ct_start_date +' '+ result[0].ct_start_time,body.timeZone)
            }

            if( result[0].ct_end_time ){
                result[0].ct_end_time   =  await contestsModel.convertUTCToNYC(result[0].ct_start_date +' '+ result[0].ct_end_time,body.timeZone)
            }

            if( result[0].ct_fk_u_id ){
                
                let userData =  await common.getAll(result[0].ct_fk_u_id,'u_id','user','u_name,u_uuid');
            
                if( userData  && userData.length != '' ){
            
                    result[0].u_name = userData[0].u_name;
                    result[0].u_uuid = userData[0].u_uuid;
            
                }
            }
            // let formattedDateTime = moment(body.time, 'MM-DD-YYYY HH:mm:ss').format('MM-DD-YYYY hh:mm:ss');
            let formattedDateTime =  nowTimeDate();

            let contestTypeSql =  " SELECT ct_id FROM contests WHERE CONCAT(ct_start_date, ' ', ct_start_time) <= '"+formattedDateTime+"' AND  ct_deleted = '0' AND ct_id = ?",
            contestTypeData    = await common.commonSqlQuery(contestTypeSql,[result[0].ct_id]);
            if( getContestCreatedData && getContestCreatedData != '' ){
                result[0].contestExpire  = 'NO';

            } else {
               
                if( contestTypeData && contestTypeData != ''){
                    result[0].contestExpire  = 'YES'
                } else {
                    result[0].contestExpire  = 'NO'
                }
                
            }

            let userUuid = await common.getRowById(userId,'u_id','u_uuid','user');
            let isJoinedUserDataSql =  `SELECT ctv_id FROM contest_viewers  WHERE ctv_fk_ct_id = ? AND ctv_fk_u_id = ?`,
            isJoinedUserData    =  await common.commonSqlQuery(isJoinedUserDataSql,[result[0].ct_id,userId]);
            if( isJoinedUserData && isJoinedUserData.length > 0 ){
                result[0].contestExpire  = 'NO';
            }

            if( result[0].ct_id ){
                let bannerData = await contestsModel.bannerData(result[0].ct_id);

                if( bannerData && bannerData.length > 0 ){
                    result[0].bannerData = bannerData;
                } else {
                    result[0].bannerData = [];


                }
            }

            if( result[0].ct_uuid ){

                let winnerSql    = `SELECT U.u_id, U.u_name, U.u_image,ctbv_id, ctbv_fk_u_uuid ,ctbv_winners, ctbv_fk_ct_uuid   FROM contest_broadcast_viewers LEFT JOIN user AS U ON ctbv_fk_u_uuid = u_uuid  WHERE ctbv_fk_ct_uuid = ?   AND ctbv_winners IN('FIRST', 'SECOND', 'THIRD') AND ctbv_winners != 'VIEWER'  ORDER BY ctbv_winners `;
                let winnerData   = await common.commonSqlQuery( winnerSql, [ result[0].ct_uuid ] );
                if( winnerData && winnerData.length > 0 ){

                    for( let userWinners of winnerData ){

                        if(userWinners.u_image ){

                            userWinners.u_image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + userWinners.u_image;

                        }

                    }

                    result[0].winnerUsersData = winnerData;
                } else {

                    result[0].winnerUsersData = [];
                }

            }

            if( userId ){

                let isAddByAdminSql = 'SELECT cas_id FROM contests_ads_stores WHERE cas_fk_ct_id = ? AND  cas_type = ? AND cas_fk_u_id = ?',
                isAddByAdminData    = await common.commonSqlQuery(isAddByAdminSql,[result[0].ct_id, 'USER', userId]); 
                if( isAddByAdminData && isAddByAdminData.length > 0 ){
                  
                    result[0].isAddByAdmin = 'YES'
                } else {
                    result[0].isAddByAdmin = 'NO'

                    if( result[0].ct_fk_u_id == userId ){
                        result[0].isAddByAdmin = 'YES'
                    }

                }
            }

            let isLiveSql = 'SELECT lb_id FROM live_broadcast WHERE lb_fk_ct_uuid = ? AND lb_status ="LIVE"', 
                isLiveData = await common.commonSqlQuery(isLiveSql,[result[0].ct_uuid]);
                if( isLiveData && isLiveData != ''){
                    result[0].isSomeOneLive  = 'YSE'
                } else {
                    result[0].isSomeOneLive  = 'NO'
                }

            let checkUserJoinedSql = 'SELECT ctv_id FROM contest_viewers WHERE ctv_fk_ct_id = ? AND ctv_fk_u_id =? ',
            checkUserJoinedData    = await common.commonSqlQuery(checkUserJoinedSql,[result[0].ct_id,userId]);

            if( checkUserJoinedData && checkUserJoinedData != '' ){
                result[0].userJoinedContest = 'YES' 

            } else {
                result[0].userJoinedContest = 'NO' 
            }

            if( result[0].ct_views_require == 'YES' ){

                if( result[0].ct_views == result[0].ct_viewer_count ){
                    result[0].joinedContest = 'FULL' 
                } else {
                    result[0].joinedContest = 'NOT FULL' 
                }

            }

                if( result[0].ct_is_live == 'L' ){

                    result[0].contestEnd = 'START' 

                } else if( result[0].ct_is_live == 'C' ){

                    result[0].contestEnd = 'COMPLETE' 

                } else {

                    result[0].contestEnd = 'NOTSTART' 

                }

            if ( result[0].ct_is_live == 'C' ) {
                
                let attachmentSql =" SELECT lb_uuid, lb_status, lb_attachment AS videoPath, lb_video_thumbnail AS video_thumbnail ,lb_fk_ct_uuid FROM live_broadcast WHERE lb_fk_ct_uuid = ? ";

                let dataArrayOne = [result[0].ct_uuid];    

                let  resultOne  = await common.commonSqlQuery(attachmentSql ,dataArrayOne);

                if ( resultOne && resultOne.length > 0 ) {
                    
                        
                    if ( resultOne[0].video_thumbnail ) {

                        result[0].video_thumbnail  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.BROADCAST_UPLOAD_PATH + resultOne[0].lb_fk_ct_uuid +'/' + resultOne[0].lb_uuid +'/' + conObj.AWS_VIDEO_PATH + resultOne[0].video_thumbnail ;

                    }

                    if ( resultOne[0].videoPath ) {

                        result[0].videoPath  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.BROADCAST_UPLOAD_PATH + resultOne[0].lb_fk_ct_uuid +'/' + resultOne[0].lb_uuid +'/' + conObj.AWS_VIDEO_PATH + resultOne[0].videoPath;

                    } 
                    resultOne[0].videoData = resultOne;
                }
            }

            if( result[0].ct_id ) {
                let imageData = await contestsModel.getContestsAttachment(result[0].ct_id);
                
                if( imageData && imageData != '' ){
                    result[0].attachmentArray = imageData

                } else {

                    result[0].attachmentArray = []

                }


            }
            
            if( result[0].ct_id ){

                let adsDataSql = 'SELECT cas_fk_ma_id FROM contests_ads_stores WHERE cas_fk_ct_id = ? AND  cas_type = ?',
                adsData        = await common.commonSqlQuery(adsDataSql,[result[0].ct_id, 'ADS']); 

                if( adsData && adsData.length > 0 ){

                    for(let adsForData of adsData ){

                        let adsSql = `SELECT ma_id, ma_uuid, ma_title,ma_points, ma_detail, ma_attachment, ma_thumbnail,	ma_type, ma_status,ma_deleted, ma_created
                        FROM  marketing_ads WHERE ma_id = ? `,
                        adsDataOne          = await common.commonSqlQuery(adsSql,[adsForData.cas_fk_ma_id]);
        
                        if( adsDataOne && adsDataOne.length > 0 ){
            
                            for( let ads of adsDataOne ){
            
            
                                if( ads.ma_created ){
                                    ads.ma_created = await commonHelper.dateFormat( ads.ma_created );
                                }
                    
                                if ( ads.ma_type == 'IMAGE' || ads.ma_type ==  'VIDEO' ) {
                                                            
                                    if (  ads.ma_attachment && ads.ma_type == 'IMAGE' ) {
                                        ads.ma_attachment = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.ADS_UPLOAD_PATH + ads.ma_uuid +'/'+ conObj.AWS_IMAGE_PATH  +  ads.ma_attachment; 
                                      
                                    }
            
                                    if ( ads.ma_thumbnail && ads.ma_type ==  'VIDEO' ) {
                    
                                        ads.ma_thumbnail  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.ADS_UPLOAD_PATH + ads.ma_uuid +'/'+ conObj.AWS_VIDEO_PATH + ads.ma_thumbnail ;
                                    }
                    
                                    if ( ads.ma_attachment && ads.ma_type ==  'VIDEO' ) {
                    
                                        ads.videoPath  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.ADS_UPLOAD_PATH + ads.ma_uuid +'/'+ conObj.AWS_VIDEO_PATH + ads.ma_attachment;
                    
                                    } 
                                }  
            
                            }
             
                            result[0].adsData  = adsDataOne;
            
                        } else {
                            result[0].adsData  = []
                        }
                        
                    }
                } else {
                    result[0].adsData  = []

                }
            }
           
            let joinedUserData =  `SELECT u_id,u_uuid,u_image,u_name FROM user LEFT JOIN contest_viewers ON ctv_fk_u_id = u_id WHERE ctv_fk_ct_id = ?
            `,
                joinedUsers    =  await common.commonSqlQuery(joinedUserData,[result[0].ct_id]);

                if( joinedUsers && joinedUsers.length > 0 ){

                    for( let users of joinedUsers ){


                        if( users.u_image ) {
                
                            users.u_image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + users.u_image;
                        }

                    }
                    result[0].joinedUsers = joinedUsers;

                } else {
                    result[0].joinedUsers = [];

                }
            
            obj.data            = result;

            deferred.resolve(obj);

        } else {
            deferred.resolve(false);
        }

    } else {
        deferred.resolve(false);
    }
    
    return deferred.promise;
}


function formatDateTime(dateString) {
    const currentDate = moment();
    const inputDate = moment(dateString, 'MM-DD-YYYY hh:mm A');
    const oneWeekAgo = moment().subtract(1, 'week');

    if (inputDate.isSame(currentDate, 'day')) {
        return `Today ${inputDate.format('hh:mm A')}`;
    } else if (inputDate.isSame(currentDate.clone().add(1, 'day'), 'day')) {
        return `Tomorrow ${inputDate.format('hh:mm A')}`;
    } else if (inputDate.isAfter(oneWeekAgo)) {
        return inputDate.format('dddd MM-DD-YYYY hh:mm A');
    } else if((inputDate.isAfter(currentDate.clone().add(1, 'week')))) {
        return inputDate.format('MM-DD-YYYY hh:mm A');
    }
};


/**
 * This function is get contests data
 * @param     	: userId, body
 * @developer 	: 
 * @modified	: 
 */
contestsModel.getContestsData = async (userId, body) => {
    console.log('body=====>>>>>>>>>>>>',body)

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
     
        helper.getUtcTime()
    if ( userId && body ) {

        let whereLast               = '',
            whereMore               = '',
            id                      = '',
            sortBy                  = 'ct_id',
            sortOrder               = 'DESC',
            page                    = 0,
            checkNewRecord          = false,
            additionalNewCondition  = '',
            userUuid                = '',
            addCondition            = '',
            dataArray               = '',
            records_per_page        = conObj.RECORDS_PER_PAGE;

        if ( body.per_page && body.per_page != 'null' ) {
            records_per_page        = body.per_page;
        } 

        if( userId && userId != '' ){
            userUuid =  await common.getRowById(userId,'u_id','u_uuid','user');
        }

        if ( body.page && body.page != '' && body.page != null && body.page != 'null' ) {

            page = Number(body.page) + 1;

            if ( body.lastRecId != null && body.lastRecId != "null" && body.lastRecId != "" && sortOrder == "DESC") {

                additionalNewCondition = " AND ct_id <= " + body.lastRecId;
            }
        } else {

            checkNewRecord  = true;
        }

        if ( body.last && body.last != 'null' ) {
            whereLast       += 'AND ct_id <= ' + body.last;
            whereMore       += 'AND ct_id > ' + body.last;
        }
        sortBy = "CONCAT(ct_start_date, ' ', ct_start_time)";
        sortOrder = 'ASC';
        if ( body.sortOrder && body.sortOrder != 'null' ) {
            sortOrder       = body.sortOrder;
        }
        if ( body.sortBy && body.sortBy != 'null' ) {
            sortBy          = body.sortBy;
        }

        if ( body.keyword && body.keyword != 'null' ) {
            whereLast       +=  " AND ct_name LIKE '%" + body.keyword + "%'";
            whereMore       +=  " AND ct_name LIKE '%" + body.keyword + "%'";
        }

        whereLast           += additionalNewCondition;
        let formattedDateTime =  nowTimeDate();

        if( body.type == 'UPCOMMING' ){

            addCondition = " WHERE CONCAT(ct_start_date, ' ', ct_end_time) >= '"+formattedDateTime+"' AND  ct_deleted = '0' AND (ct_is_live = 'I' OR ct_is_live = 'L') AND ct_is_live != 'C'  "

        } else if( body.type == 'PAST' ){
          
            addCondition = " WHERE (CONCAT(ct_start_date, ' ', ct_end_time) <= '"+formattedDateTime+"'  OR ct_is_live = 'C') AND  ct_deleted = '0'  "
            sortBy       = "CONCAT(ct_start_date, ' ', ct_start_time)";
            sortOrder    = 'DESC';

        } else if( body.type == 'joinHistory' ){

            addCondition = " LEFT JOIN contest_broadcast_viewers  ON ctbv_fk_ct_uuid = ct_uuid  WHERE ctbv_fk_u_uuid = '"+userUuid+"'"
        
        } else {

            addCondition = `WHERE ct_deleted = '0' `
        }
        if( body.contestUid && body.contestUid != '' ){
           let  userIdFromCtUuid = await common.getRowById(body.contestUid,'ct_uuid','ct_fk_u_id','contests');
            addCondition = ` WHERE ct_uuid != ? AND ct_fk_u_id =  ?` 
            dataArray    =[body.contestUid, userIdFromCtUuid]
        }

        if( body.myContest && body.myContest == 'MY' ){

            addCondition += ` AND ct_fk_u_id =  ? AND ct_deleted = '0' `
            dataArray     = [ userId ];
        }
        
        let sql  = ` SELECT user.u_name,user.u_uuid, ct_id, ct_fk_u_id, ct_uuid, ct_name,ct_start_date, ct_start_time, ct_end_date,ct_image, ct_end_time, ct_start_date_time, ct_end_date_time,ct_contestType, ct_points, ct_is_live,ct_store_joining_points,ct_views_require, ct_views,ct_viewer_count, ct_address, ct_contest_distance, ct_created_at,ct_latitude,ct_longitude,ct_point_type_earn,ct_is_location_based FROM contests LEFT JOIN user AS user ON contests.ct_fk_u_id = user.u_id ` + addCondition,
        sqlOne   = ` SELECT ct_id FROM contests ` + addCondition;

        let getLastRecIdSql = sql + " GROUP BY ct_id ORDER BY ct_id DESC",
            moreRecordSql   = sqlOne;

        let offset          = page * records_per_page;
        sql                 += whereLast + " GROUP BY ct_id ORDER BY " + sortBy + " " + sortOrder + " LIMIT " + offset + "," + records_per_page;

        let result          = await common.commonSqlQuery(sql, dataArray),
            resultOne       = await common.commonSqlQuery(moreRecordSql,dataArray);
            
        if ( result && result.sqlMessage ) { 

            deferred.resolve(false);

        } else {

            if ( result && result.length > 0 ) {

                for( let resultData of result ) {

                    let getContestCreatedSql = 'SELECT ct_id FROM contests WHERE ct_id= ? AND ct_fk_u_id = ? ',
                    getContestCreatedData    = await common.commonSqlQuery(getContestCreatedSql,[resultData.ct_id,userId]);

                    if( getContestCreatedData && getContestCreatedData != '' ){
                        resultData.createdByLoginUser = 'YES' 

                    } else {
                        resultData.createdByLoginUser = 'NO' 
                    }

                    let contestTypeSql =  " SELECT ct_id FROM contests WHERE CONCAT(ct_start_date, ' ', ct_end_time) <= '"+formattedDateTime+"'  AND  ct_deleted = '0' AND ct_id = ?",
                    contestTypeData    = await common.commonSqlQuery(contestTypeSql,[resultData.ct_id]);

                    if( contestTypeData && contestTypeData != ''){
                        resultData.contestExpire  = 'YES'
                    } else {
                        resultData.contestExpire  = 'NO'
                    }   
                   
                    let time12HourFormat   =  await contestsModel.convertUTCToNYC(resultData.ct_start_date +' '+ resultData.ct_start_time,body.timeZone);
                    console.log('new12HoursData======================>>>>>>>>>>>1111111111',time12HourFormat,resultData.ct_id);
                    let startDateTimeData = resultData.ct_start_date + ' ' + time12HourFormat;
                    let data = formatDateTime(startDateTimeData);

                    resultData.startDateTime = data;

                    if(resultData.ct_is_live == 'C' ) {
                        resultData.startDateTime =  startDateTimeData
                    }
                    let isLiveSql = 'SELECT lb_id FROM live_broadcast WHERE lb_fk_ct_uuid = ? AND lb_status ="LIVE"', 
                        isLiveData = await common.commonSqlQuery(isLiveSql,[resultData.ct_uuid]);
                        if( isLiveData && isLiveData != ''){
                            resultData.isSomeOneLive  = 'YSE'
                        } else {
                            resultData.isSomeOneLive  = 'NO'
                        }

                    let checkUserJoinedSql = 'SELECT ctv_id FROM contest_viewers WHERE ctv_fk_ct_id = ? AND ctv_fk_u_id =? ',
                    checkUserJoinedData    = await common.commonSqlQuery(checkUserJoinedSql,[resultData.ct_id,userId]);

                    if( checkUserJoinedData && checkUserJoinedData != '' ){
                        resultData.userJoinedContest = 'YES' 

                    } else {
                        resultData.userJoinedContest = 'NO' 
                    }

                    if( resultData.ct_views_require == 'YES' ){

                        if( resultData.ct_views == resultData.ct_viewer_count ){
                            resultData.joinedContest = 'FULL' 
    
    
                        } else {
    
                            resultData.joinedContest = 'NOT FULL' 
    
                        }

                    }

                        if( resultData.ct_is_live == 'L' ){

                            resultData.contestEnd = 'START' 

                        } else if( resultData.ct_is_live == 'C' ){

                            resultData.contestEnd = 'COMPLETE' 

                        } else {

                            resultData.contestEnd = 'NOTSTART' 

                        }

                    if ( resultData.ct_is_live == 'C' ) {
                        
                        let attachmentSql =" SELECT lb_uuid, lb_status, lb_attachment AS videoPath, lb_video_thumbnail AS video_thumbnail ,lb_fk_ct_uuid FROM live_broadcast WHERE lb_fk_ct_uuid = ? ";

                        let dataArrayOne = [resultData.ct_uuid];    

                        let  result  = await common.commonSqlQuery(attachmentSql ,dataArrayOne);

                        if ( result && result.length > 0 ) {
                           
                             
                            if ( result[0].video_thumbnail ) {

                                resultData.video_thumbnail  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.BROADCAST_UPLOAD_PATH + resultData.ct_uuid +'/' + result[0].lb_uuid +'/' + conObj.AWS_VIDEO_PATH + result[0].video_thumbnail ;
        
                            }

                            if ( result[0].videoPath ) {

                                resultData.videoPath  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.BROADCAST_UPLOAD_PATH + resultData.ct_uuid +'/' + result[0].lb_uuid +'/' + conObj.AWS_VIDEO_PATH + result[0].videoPath;
        
                            } 

                        }
                    }

        
                    if( resultData.ct_id ) {
                        let imageData = await contestsModel.getContestsAttachment(resultData.ct_id);
                        if( imageData && imageData != '' ){
                            resultData.attachmentArray = imageData

                        } else {

                            resultData.attachmentArray = []

                        }
        
                    }
                   
                }



                obj.data            = result;
                obj.total_records   = resultOne.length;
                obj.last            = result[0].ct_id;
                obj.page            = page;
                if ( checkNewRecord ) {

                    let getLastRecId = await common.commonSqlQuery(getLastRecIdSql, dataArray, false);
                    if ( getLastRecId && getLastRecId.length > 0 ) {
                        obj.lastRecId = getLastRecId[0].ct_id;
                    } 
                } 

                deferred.resolve(obj);

            } else {
                deferred.resolve(obj);
            }
        }

    } else {

        deferred.resolve(obj);
    }
    
    return deferred.promise;
}

/** 
 * This function is using to delete post
 * @param     : 
 * @returns   : true , false 
 * @developer : 
 */
 contestsModel.contestsDelete = async(object) =>{
    // console.log('postDelete innnnn ====>>>>......',object)
   let deferred =  q.defer();

   let conObj   = await constant.getConstant();

    if ( object && object != '' ) {

        let contestUuid    = '',
            userUuid  = '',
            userId    =  '',
            fileObj   = '';
        if ( object.contestUuid ) {
            contestUuid = object.contestUuid ;
        }
        
        if ( object.userUuid ) {
            userUuid = object.userUuid; 
        }
        if( object.userId ){
            userId = object.userId
        }

        let deleteSQl = "DELETE FROM contests WHERE ct_uuid = ? ",
        deleteRes = await common.commonSqlQuery(deleteSQl ,[ contestUuid ]);

        if ( deleteRes ) {

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
 * This function is using to contests Delete 
 * @param     : 
 * @returns   : true , false 
 * @developer : 
 */
 contestsModel.bannerData = async (contestId) => {
    // console.log('postDelete innnnn ====>>>>......',object)
   let deferred =  q.defer();

   let conObj   = await constant.getConstant();

   let bannerDataSql    = `SELECT b_uuid, b_title, b_detail,b_link, b_image FROM banners LEFT JOIN contests_ads_stores AS cas ON cas.cas_fk_b_id = b_id  WHERE cas_fk_ct_id  = ? `;
   let bannerData   = await common.commonSqlQuery( bannerDataSql, [ contestId ],true );
   
    if( bannerData && bannerData.length > 0 ){

        for( let dataBanner of bannerData ){

           if(dataBanner.b_image ){

            dataBanner.bannerImage = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.BANNERS_UPLOAD_PATH + dataBanner.b_uuid +'/'+ conObj.AWS_IMAGE_PATH  +  dataBanner.b_image; 

           }
 
        }
       deferred.resolve(bannerData);

    } else {

    deferred.resolve(false);


   }
   console.log('bannerDatabannerDatabannerDatabannerDatabannerDatabannerData',bannerData)
   return deferred.promise; 

}

/** 
 * This function is using to update Contests 
 * @param     : 
 * @returns   :  
 * @developer : Dushyant Sharma
 */

contestsModel.updateContests = async ( body ) => {

    let deferred =  q.defer(),
    date         = await commonHelper.getPstDateTime('timeDate'),
    updateSql    = 'UPDATE contests SET ? WHERE ct_uuid = ?';
  
    if( body  && body.contestUuid ){
        let   updateObj    = {
            ct_updated_at  : date,
    
        };

        if( body.contestName && body.contestName != '' ){
            updateObj.ct_name  = body.contestName
        }
        if( body.startDate && body.startDate != '' ){
            updateObj.ct_start_date  = body.startDate
        }
        if( body.startTime && body.startTime != '' ){
            updateObj.ct_start_time  =  convertNYCToUTC(body.startDate +' '+ body.startTime,body.timeZone);
        }
        if( body.endTime && body.endTime != '' ){
            updateObj.ct_end_time  = convertNYCToUTC(body.startDate +' '+ body.endTime,body.timeZone);
        }
        if( body.views && body.views != '' ){
            updateObj.ct_views  = body.views
        }
        if( body.points && body.points != '' ){
            updateObj.ct_points  = body.points
        }
        if( body.distance && body.distance != '' ){
            updateObj.ct_contest_distance  = body.distance
        }
        let updateData = await common.commonSqlQuery(updateSql,[updateObj,body.contestUuid],true);
        if(  updateData ){
            deferred.resolve(true);
        } else {
            deferred.resolve(false);
        }
        console.log('updateData,updateData===============>>>>',updateData)

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
 contestsModel.updateThumbnailValue = async (bodyObj) => {
    let deferred       = q.defer();

    if ( bodyObj  && bodyObj.contestAttachmentId  && bodyObj.thumbnail ) {
        
        let updateSql   = `UPDATE contests_attachment SET  ca_attachment_thumbnail = ? WHERE  ca_id = ?`,
            dataArray   = [ bodyObj.thumbnail.imageName,bodyObj.contestAttachmentId],
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
 * This function is using to contests Delete 
 * @param     : 
 * @returns   : true , false 
 * @developer : 
 */
 contestsModel.getContestsAttachment = async (contestId) => {
   let deferred             =  q.defer(),
    conObj                  = await constant.getConstant(),
    contestUuid             = await common.getRowById(contestId,'ct_id','ct_uuid','contests'),
    contestAttachmentSql    = `SELECT ca_type, ca_uuid, ca_attachment, ca_attachment_m3u8, ca_attachment_thumbnail  FROM contests_attachment  WHERE ca_fk_ct_id  = ? `,
    contestAttachmentData   = await common.commonSqlQuery( contestAttachmentSql, [ contestId ],true );
   
    if( contestAttachmentData  && contestAttachmentData .length > 0 ){

        for( let contestAttachment of contestAttachmentData  ){

            let type = contestAttachment.ca_attachment.split('.')[1]
           if( (contestAttachment.ca_attachment && type == 'mp4') || (contestAttachment.ca_attachment && type == 'mov') ){

            contestAttachment.contestImage = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.CONTESTS_UPLOAD_PATH + contestUuid +'/'+  conObj.AWS_VIDEO_PATH + contestAttachment.ca_uuid + '/' + contestAttachment.ca_attachment_thumbnail;

            contestAttachment.contestVideo = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.CONTESTS_UPLOAD_PATH + contestUuid +'/'+  conObj.AWS_VIDEO_PATH + contestAttachment.ca_uuid + '/' + contestAttachment.ca_attachment;

           } else {
            contestAttachment.contestImage = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.CONTESTS_UPLOAD_PATH + contestUuid +'/'+  conObj.AWS_IMAGE_PATH + contestAttachment.ca_attachment;


           }
 
        }
       deferred.resolve(contestAttachmentData );

    } else {

    deferred.resolve(false);


   }
   return deferred.promise; 

}

/** 
 * This function is using to delete Contests Image
 * @param     : 
 * @returns   : true , false 
 * @developer : Dushyant Sharma
 */
contestsModel.deleteContestsMedia = async(body) =>{
    console.log('marketing_adsDelete innnnn ====>>>>......',body)
   let deferred =  q.defer(),
   conObj       = await constant.getConstant(),
   deleteMsg    = false;

    if ( body  ) {

        let res     = await common.getAll(body.contestMediaUuid,'ca_uuid','contests_attachment','ca_uuid,ca_attachment,ca_type,ca_fk_ct_id');

        if ( res && res.length > 0 ) {

            let  contestUuid = await common.getRowById(res[0].ca_fk_ct_id,'ct_id','ct_uuid','contests');

            if( res[0].ca_type == 'VIDEO' ){

                let videoObj = {
                    fileName  : res[0].ca_attachment.split(".")[0],
                    filePath :  conObj.UPLOAD_PATH + conObj.CONTESTS_UPLOAD_PATH + contestUuid +'/'+  conObj.AWS_VIDEO_PATH + res[0].ca_uuid + '/',
                };
                    
                let deletedVideo = await helper.deleteFileToAwsBucket(videoObj)
                
                if( deletedVideo ) {

                    deleteMsg = true;
            
                } else {
            
                    deleteMsg = false;
            
                }
            }

            if( res[0].ca_type == 'IMAGE' ){

                let imageObj = {

                    filePath       : conObj.UPLOAD_PATH + conObj.CONTESTS_UPLOAD_PATH + contestUuid +'/'+  conObj.AWS_IMAGE_PATH,
                    fileName       : res[0].ca_attachment,
                };
                    
                let deletedImage = await helper.deleteFileToAwsBucket(imageObj)
                if( deletedImage ) {
        
                    deleteMsg = true;
            
                } else {
            
                    deleteMsg = false;
                    
                }
            
            }  
            if( deleteMsg && deleteMsg == true ) {

                let deleteSQl = "DELETE FROM contests_attachment WHERE ca_uuid = ? ",
                    deleteRes = await common.commonSqlQuery(deleteSQl ,[ body.contestMediaUuid ]);
                if ( deleteRes ) {
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
        
    } else {
        deferred.resolve(false);
    }

   return deferred.promise; 

}





/**
 * This function is used to comment contest video
*  @developer   : Anshu Salaria 
 * @modified    :
 * @params      : userId , body
 */

contestsModel.contestVideoPostComment = async ( userId,body ) => {
    let deferred        = q.defer();
       
    if( body && userId && body.text && body.contestsUuid ){
           
        let uuid            = uuidv1(Date.now()),
            insertQuery     = "INSERT INTO contests_broadcast_video_comments SET ?",
            contestId       = await commonHelper.getRowId(body.contestsUuid,'ct_uuid','ct_id','contests');
            // console.log('postId====>>>',postId)
            insertData      = {
                cbvc_fk_u_id       : userId,
                cbvc_fk_ct_id      : contestId,
                cbvc_uuid          : uuid,
                cbvc_comment       : body.text,
                cbvc_created       : await helper.getUtcTime()
            };

        pool.query(insertQuery, insertData, async (error, result)=> {

            if( error ) {

                deferred.resolve(false);
            } else {
                deferred.resolve(true);
                // if( result ){
                    
                //     let commentCount = await postModel.postCommentCount(postId);

                //     if( commentCount ){

                //         deferred.resolve(commentCount);
                //     } else {

                //         deferred.resolve(false);

                //     }
                // } else {
                //     deferred.resolve(false);
                // }
            }

        });
    } else {

        deferred.resolve(false)
    }

   return deferred.promise;
}




/**
 * This function is get user post data
 * @param     	: userId, body
 * @developer 	: 
 * @modified	: 
 */
contestsModel.getCommentData = async (userId, body) => {
    console.log('body=====>>>',body)
   let deferred                = q.defer(),
       conObj                  = await constant.getConstant(),
       contestId               = '',
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


       if( body.contestsUuid && body.contestsUuid != 'null' ){
        contestId       = await commonHelper.getRowId(body.contestsUuid,'ct_uuid','ct_id','contests');
       }

    //    let sqlLikeCount  =  `SELECT p_like_count FROM post WHERE p_id = ?`,
    //    postLikeCount     = await common.commonSqlQuery(sqlLikeCount,[idPost]);
    //    if( postLikeCount ){
    //        obj.postLikeCount  = postLikeCount[0].p_like_count;
    //    }
   
       // console.log('getPostData == 111111111111111111111111');

   if ( userId && body ) {
       // console.log('getPostData == 22222222222222');

       let whereLast               = '',
           whereMore               = '',
           id                      = '',
           sortBy                  = 'cbvc_id',
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
               additionalNewCondition = " AND cbvc_id <= " + body.lastRecId;
           }
       } else {
           // console.log('new last id ');
           checkNewRecord  = true;
       }

       if ( body.last && body.last != 'null' ) {
           whereLast       += 'AND cbvc_id <= ' + body.last;
           whereMore       += 'AND cbvc_id > ' + body.last;
       }

       if ( body.sortOrder && body.sortOrder != 'null' ) {
           sortOrder       = body.sortOrder;
       }

       if ( body.sortBy && body.sortBy != 'null' ) {
           sortBy          = body.sortBy;
       }

    //    if ( body.keyword && body.keyword != 'null' ) {
    //        whereLast       +=  " AND u_name LIKE '%" + body.keyword + "%'";
    //        whereMore       +=  " AND u_name LIKE '%" + body.keyword + "%'";
    //    }

    //    if( body.postUuid && body.postUuid != 'null' ){
    //        postId    = await commonHelper.getRowId(body.postUuid,'p_uuid','p_id','post');
    //    }

       whereLast           += additionalNewCondition;
       
       let sql             = ` SELECT u_id,u_name, u_image, u_uuid, cbvc_id,cbvc_comment, cbvc_created, cbvc_uuid FROM contests_broadcast_video_comments 
       LEFT JOIN user ON  contests_broadcast_video_comments.cbvc_fk_u_id =  user.u_id 
        WHERE cbvc_fk_ct_id = ?`;
           // dataArray       = [ '0', '0', '0', '1', '1' ];
           dataArray       = [contestId];
       let getLastRecIdSql = sql + " GROUP BY cbvc_id ORDER BY cbvc_id DESC",
           moreRecordSql   = sql;

       let offset          = page * records_per_page;
       moreRecordSql       += whereMore + " GROUP BY cbvc_id ORDER BY " + sortBy + " " + sortOrder;
       sql                 += whereLast + " GROUP BY cbvc_id ORDER BY " + sortBy + " " + sortOrder + " LIMIT " + offset + "," + records_per_page;

       let result          = await common.commonSqlQuery(sql, dataArray, true);

       // console.log('getPostData == 33333333333333 result === ', result);
           
       if ( result && result.sqlMessage ) { 
           // console.log('getPostData == 444444444444 result === ');
           deferred.resolve(false);
       } else {

           // console.log('getPostData == 555555555555555555 result === ');

           if ( result && result.length > 0 ) {

               result.sort(function(a, b) {
                   return parseFloat(a.cbvc_id) - parseFloat(b.cbvc_id);
               });

               for ( let  resultData of result ) {

                   if( resultData.cbvc_created ){
                       resultData.cbvc_created = await helper.agoTime( resultData.cbvc_created );
                   }

                   if( resultData.u_image ) {
                       resultData.u_image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + resultData.u_image;
                   }

               }

               obj.data            = result;
               // obj.total_records   = resultOne.length;
               obj.last            = result[0].cbvc_id;
               obj.page            = page;

               if ( checkNewRecord ) {
                   // console.log("hi i am in");

                   let getLastRecId = await common.commonSqlQuery(getLastRecIdSql, dataArray);
                   // console.log("getLastRecId obj is : ", getLastRecId);
                   if ( getLastRecId && getLastRecId.length > 0 ) {
                       obj.lastRecId = getLastRecId[0].cbvc_id;
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
 * This function is using to delete post comment
 * @param     : 
 * @returns   : true , false 
 * @developer : 
 */
contestsModel.deleteComment = async(object) =>{
    // console.log('postDelete innnnn ====>>>>......',object)
   let deferred =  q.defer();

    if ( object && object != '' ) {

        let commentId    =  '',
            userId    =  '';
        // if ( object.p_id ) {
        //     postId = object.p_id ;
        // }
        if ( object.cbvc_id ) {
            commentId = object.cbvc_id ;
        }
 
        // if( object.userId ){
        //     userId = object.userId
        // }
        // console.log('deleteComments==============>>>>>>>>>>>>1111111111111',commentId)

        let deleteCommentSql = "DELETE FROM contests_broadcast_video_comments WHERE cbvc_id = ?",
        deleteComments    = await common.commonSqlQuery(deleteCommentSql ,[ commentId ]);
         
        if ( deleteComments ) {
          
            // console.log('deleteComments==============>>>>>>>>>>>>22222222222222',deleteComments)

            // let commentCount = await postModel.postCommentCount(postId);
        
            // // console.log('deleteComments==============>>>>>>>>>>>>',commentCount)

            // if( commentCount ){

            //     deferred.resolve(commentCount);

            // } else{
                deferred.resolve(true);
            // }
        
       
        } else {
            deferred.resolve(false);
        }

    } else {

        deferred.resolve(false);
    }

   return deferred.promise; 

}
module.exports = contestsModel;