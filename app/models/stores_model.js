


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

let storesModel = {};

/**
 * This function is get Post data
 * @param     	:  body
 * @developer 	: Dushyant Sharma
 * @modified	: 
 */
 storesModel.getStoresData = async ( body , userId) => {

     console.log('body=====>>> storesModel storesModel',body)
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

    if ( body && userId ) {
        let whereLast               = '',
            whereMore               = '',
            id                      = '',
            sortBy                  = 's_id',
            sortOrder               = 'ASC',
            page                    = 0,
            checkNewRecord          = false,
            additionalNewCondition  = '',
            addCondition            = '',
            dataArray               = '',
            contestId               = '',
            records_per_page        = conObj.RECORDS_PER_PAGE;

        if ( body.per_page && body.per_page != 'null' ) {
            records_per_page        = body.per_page;
        } 
        if( body.contestUuid ){

            contestId = await common.getRowById(body.contestUuid,'ct_uuid','ct_id','contests'); 
            addCondition  = 'LEFT JOIN contests_ads_stores ON cas_fk_s_id = s_id WHERE cas_fk_ct_id = ?';
            dataArray     = [contestId];

        }
        if ( body.page && body.page != '' && body.page != null && body.page != 'null' ) {
            page = Number(body.page) + 1;
            // page = body.page;

            if ( body.lastRecId != null && body.lastRecId != "null" && body.lastRecId != "" && sortOrder == "DESC") {
                // console.log(body.lastRecId)
                additionalNewCondition = " AND s_id <= " + body.lastRecId;
            }
        } else {
            // console.log('new last id ');
            checkNewRecord  = true;
        }
        if ( body.last && body.last != 'null' ) {
            whereLast       += 'AND s_id <= ' + body.last;
            whereMore       += 'AND s_id > ' + body.last;
        }

        if ( body.sortOrder && body.sortOrder != 'null' ) {
            sortOrder       = body.sortOrder;
        }

        if ( body.sortBy && body.sortBy != 'null' ) {
            sortBy          = body.sortBy;
        }

        if ( body.keyword && body.keyword != 'null' ) {
            whereLast       +=  " AND s_name LIKE '%" + body.keyword + "%'";
            whereMore       +=  " AND s_name LIKE '%" + body.keyword + "%'";
        }

        whereLast           += additionalNewCondition;
        let userDataSql = 'SELECT u_latitude, u_longitude FROM user WHERE u_id = ?',
        userDataData    = await common.commonSqlQuery(userDataSql, [userId]);

        let sql  = ` SELECT s_id, (3959 *  acos( cos( radians(`+userDataData[0].u_latitude+`))* cos( radians( s_latitude))*
        cos( radians( s_longitude ) - radians(`+userDataData[0].u_longitude+`))  + sin( radians(`+userDataData[0].u_latitude+`))*
       sin( radians( s_latitude ) ))) AS distance, s_uuid, s_name, s_detail, s_points, s_address, s_image, s_status,s_deleted,s_latitude,s_longitude, s_created
        FROM stores 
        ` + addCondition ;
            // dataArray       = [ '0', '0', '0', '1', '1' ];
            // dataArray       = '',
        let getLastRecIdSql = sql + "distance < 25 ORDER BY distance ",
            moreRecordSql   = sql;

        let offset          = page * records_per_page;
        // moreRecordSql       += whereMore + " GROUP BY s_id ORDER BY " + sortBy + " " + sortOrder;
        // sql                 += whereLast + " GROUP BY s_id ORDER BY " + sortBy + " " + sortOrder + " LIMIT " + offset + "," + records_per_page;
        moreRecordSql       += whereMore + " GROUP BY s_id ORDER BY distance  " + sortOrder;
        sql                 += whereLast + " GROUP BY s_id ORDER BY distance  " + sortOrder + " LIMIT " + offset + "," + records_per_page;
        let result          = await common.commonSqlQuery(sql, dataArray, true);

        // console.log('getPostData == 33333333333333 result === ', result);
            
        if ( result && result.sqlMessage ) { 
            // console.log('getPostData == 444444444444 result === ');
            deferred.resolve(false);
        } else {

            // console.log('getPostData == 555555555555555555 result === ');

            if ( result && result.length > 0 ) {

                for ( let  resultData of result ) {

                    if( resultData.s_created ){
                        resultData.s_created = await commonHelper.dateFormat( resultData.s_created );
                    }

                    if (  resultData.s_image ) {
                        
                        resultData.image = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.STORES_UPLOAD_PATH + resultData.s_uuid +'/'+ conObj.AWS_IMAGE_PATH  +  resultData.s_image; 
                    }
                    console.log('resultData.image',resultData)

                    let letLngObj = {
                        storeLat        : resultData.s_latitude,
                        storeLog        : resultData.s_longitude,
                        userId          : userId,
                    },
                    storDistance = await storesModel.userIsNearLocation(letLngObj);

                    if( storDistance && storDistance != '' ){
                        resultData.storDistance  = storDistance

                    } 
//                     SELECT id, (3959 *  acos( cos( radians(37))* cos( radians( lat))*
//  cos( radians( Ing ) - radians(-122))  + sin( radians(37))*
// sin( radians( lat ) ))) AS distance FROM your table name HAVING



                    if( body.contestUuid ){

                        isPointSql       = 'SELECT csp_id FROM contest_stores_point WHERE csp_fk_u_id = ? AND csp_fk_ct_id = ? AND csp_fk_s_id = ? ',
                        isPoint          = await commonModel.commonSqlQuery(isPointSql,[userId,contestId,resultData.s_id],true);

                        if( isPoint && isPoint.length > 0 ){
                            resultData.isPointsGet =  'YES' ;
                        } else {
                            resultData.isPointsGet =   'NO';

                        }

                    }
                    
                    
                }

                obj.data            = result;
                // obj.total_records   = resultOne.length;
                obj.last            = result[0].s_id;
                obj.page            = page;

                if ( checkNewRecord ) {
                    // console.log("hi i am in");

                    let getLastRecId = await common.commonSqlQuery(getLastRecIdSql, dataArray, false);
                    // console.log("getLastRecId obj is : ", getLastRecId);
                    if ( getLastRecId && getLastRecId.length > 0 ) {
                        obj.lastRecId = getLastRecId[0].s_id;
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
 * This function is using to insert Viewer Data
 * @param     :   
 * @returns   : 
 * @developer : 
 */
 storesModel.userIsNearLocation =  async ( dataObj )=> {

    const distFrom = require('distance-from');
    let deferred   =  q.defer();

    if ( dataObj.storeLat && dataObj.storeLog && dataObj.userId  ) {
        let userDataSql = 'SELECT u_latitude, u_longitude FROM user WHERE u_id = ?',
        userDataData    = await common.commonSqlQuery(userDataSql, [dataObj.userId]);

        if( userDataData && userDataData.length > 0 ){

            let userLat    = userDataData[0].u_latitude,
            userLog        = userDataData[0].u_longitude,
            userLatLng     = [userDataData[0].u_latitude,userDataData[0].u_longitude],
            storeLatLng    = [dataObj.storeLat,dataObj.storeLog],
            calculatedDistance = distFrom(userLatLng).to(storeLatLng).in('mi'); 
            // console.log('calculatedDistance=======>>>>>>',calculatedDistance);
            deferred.resolve(calculatedDistance);

        } else {

            deferred.resolve(false);

        }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise; 
}


function degToRad(deg) {
    return deg * (Math.PI/180)
}


/**
 * This function is used to add Ads Point To User
*  @developer   : 
 * @modified    :
 * @params      : userId , body
 */

storesModel.addStoresPointToUser = async ( userId,body ) => {
    let deferred        = q.defer();
       
    if( body && userId && body.adUuid ){

        let updateSql       = 'UPDATE user SET ? WHERE u_id = ?'
            date            = await commonHelper.getPstDateTime('timeDate'),
            updateData      = {};
           
        let storesPoints = await commonModel.getRowById(body.adUuid,'s_uuid','s_points','stores');
        let storesId     = await commonModel.getRowById(body.adUuid,'s_uuid','s_id','stores');
        let contestId    = await commonModel.getRowById(body.contestUid,'ct_uuid','ct_id','contests');

        isPointSql       = 'SELECT csp_id FROM contest_stores_point WHERE csp_fk_u_id = ? AND csp_fk_ct_id = ? AND csp_fk_s_id = ? ',
        isPoint          = await commonModel.commonSqlQuery(isPointSql,[userId,contestId,storesId]);

        if( isPoint && isPoint.length > 0 ){

            deferred.resolve(false)

        } else {

            console.log('We are hear ===================>>>>>>>storesPoints',storesPoints);
            if( storesPoints && storesPoints != '' && storesPoints != '0' ){
    
                let insertDataObj = {
                    csp_fk_u_id     : userId,
                    csp_fk_ct_id	: contestId,
                    csp_fk_s_id     : storesId,
                },
                insertData = await common.insert('contest_stores_point',insertDataObj);
                console.log('insertData============>>',insertData)
                let userStoresPointsData = await commonModel.getRowById(userId,'u_id','u_stores_points','user'),
                    userStoresAdsData    = await commonModel.getRowById(userId,'u_id','u_ads_points','user'),
                userStoresPoints         =  parseInt(userStoresPointsData) +  parseInt(storesPoints),
                userTotalPoints          =  parseInt(userStoresPoints) +  parseInt(userStoresAdsData);
    
                updateData      = {
                    u_stores_points    : userStoresPoints,
                    u_total_points     : userTotalPoints,
                    u_updated          : date
                };
                let result = await commonModel.commonSqlQuery(updateSql,[updateData,userId],true);
                console.log('We are hear ===================>>>>>>>userStoresPoints',storesPoints,userStoresPointsData,'totalPoints',userStoresPoints);
                console.log('We are hear ===================>>>>>>>result',result);
                if( result ){
                    let obj  = {
                        id   : storesId,
                        type   : 'STORE',
                        userId : userId,
                        points : storesPoints
                    };
                    let addPointHistory = await commonModel.addUserPointsHistory(obj);
                    console.log('addPointHistory=======>>>>>>>',addPointHistory);
                    deferred.resolve(true);
                   
                } else {
    
                    deferred.resolve(false);
                }
    
            } else {
    
                deferred.resolve(false);
            }
        }
       
    } else {

        deferred.resolve(false)
    }

   return deferred.promise;
}



module.exports = storesModel;