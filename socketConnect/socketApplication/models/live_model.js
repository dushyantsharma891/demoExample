

const q                 = require('q'),
{v1: uuidv1}            = require('uuid'),
    helper              = require('../../../configCommon/helper'),
    commonModelObj      = require('./common_model'),
    constant            = require('../../../configCommon/config/constants'),
    loveBroadcastModel  = require('../../../app/models/live_broadcast_model');

let liveModel          = {};


/**
 * @developer : 
 * @modified  :  
 */
 liveModel.liveRequestLeave = async function( dataObj ) {

    let deferred        = q.defer(),
        conObj          = await constant.getConstant();

    if ( dataObj && dataObj.contestUuid && dataObj.broadcastUuid ) {

        let sql     = "UPDATE live_broadcast SET ? WHERE lb_fk_ct_uuid= ? AND lb_uuid = ?",
            obj     = {
                lb_status : 'ENDLIVE'
            },
            res         = await commonModelObj.commonSqlQuery(sql,[obj,dataObj.contestUuid,dataObj.broadcastUuid],true),
            contestId   = await commonModelObj.getRowId(dataObj.contestUuid, 'ct_uuid' , 'ct_id' , 'contests' ),
            broadcastId = await commonModelObj.getRowId(dataObj.broadcastUuid, 'lb_uuid' , 'lb_id' , 'live_broadcast' );

        if ( res ) {

            let participantsSql  =  `SELECT lbud_id, lbud_fk_u_uuid,lbud_user_type FROM live_broadcast_users_detail WHERE lbud_fk_lb_uuid = ? AND lbud_fk_ct_uuid = ? `
                sqlData          =  await commonModelObj.commonSqlQuery(participantsSql,[dataObj.broadcastUuid, dataObj.contestUuid]);
            
            let updateSql = 'UPDATE contests SET ct_is_live = ? WHERE ct_uuid = ?',
            updateLiveStatus = await commonModelObj.commonSqlQuery(updateSql,['C',dataObj.contestUuid]);

            if( sqlData && sqlData.length > 0 ){

                for( let userData of sqlData ){

                    sqlUpdate     = "UPDATE live_broadcast_users_detail SET ? WHERE lbud_id = ?",
                    objOne     = {
                        lbud_status : 'ENDLIVE'
                    },
                    resData     = await commonModelObj.commonSqlQuery(sqlUpdate,[objOne,userData.lbud_id],true);

                }
          
                if ( dataObj.resource && dataObj.sid ) {

                  loveBroadcastModel.stopLiveBroadcast( { contestUuid : dataObj.contestUuid, broadcastUuid : dataObj.broadcastUuid, resourceId : dataObj.resource, sid : dataObj.sid } );

                }

               
                let obj = {
                    contestEnd : 'COMPLETE',
                    userUuid   : dataObj.userUuid,
                    contestUuid:dataObj.contestUuid
                }
                deferred.resolve(obj);

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
 * @developer : 
 * @modified  :  
 */
 liveModel.liveRoomStartLeave = async function( dataObj ) {

    let deferred        = q.defer(),
        conObj          = await constant.getConstant();

    if ( dataObj && dataObj.contestUuid ) {

        let isLive = await commonModelObj.getRowById('ct_is_live', 'contests', 'ct_uuid', dataObj.contestUuid),
        obj = {};

            if( isLive == 'L' ){

                obj.contestEnd = 'START'

            } else if( isLive == 'C' ){

                obj.contestEnd = 'COMPLETE'

            } else {
                obj.contestEnd = 'NOTSTART'

            }
            obj.userUuid   = dataObj.userUuid

            
            deferred.resolve(obj);

    } else {

        deferred.resolve(false);

    }

    return deferred.promise;
}

/** This Function is used to update live viewer 
 *   
 * @developer : 
 * @modified  : 
 */
 liveModel.updateLiveViewer = async function( dataObj ) {

    let deferred      = q.defer(),
        selectData    = '',
        conObj        = await constant.getConstant(),
        uuid          = uuidv1(Date.now());

    if ( dataObj && dataObj.contestUuid ) {

        let hostId   = await commonModelObj.getRowById('ct_fk_u_id','contests','ct_uuid',dataObj.contestUuid);
        let hostUuid = await commonModelObj.getRowById('u_uuid','user','u_id',hostId);

        let viewerSql   = `SELECT ctbv_id FROM contest_broadcast_viewers WHERE ctbv_fk_ct_uuid = ? AND ctbv_fk_u_uuid = ?`;
        let viewerExist = await commonModelObj.commonSqlQuery( viewerSql, [ dataObj.contestUuid, dataObj.userUuid ] );
        console.log('sdadadadadasdadasdasdasdasdasdadadasdasdasdasdas============================>>>>>>>>>',viewerExist);
        if ( viewerExist && viewerExist.length > 0 ) {

            let reqValue            = '0';
            if ( dataObj.requestFor == 'JOIN' ) {

                reqValue            = '1';
            }
            let updateViewerSql     =  'UPDATE contest_broadcast_viewers SET ? WHERE ctbv_fk_ct_uuid = ? AND ctbv_fk_u_uuid = ?',
                updateViewObj       = {
        
                    ctbv_status : reqValue,
                };

            let updateViewStatus    = await commonModelObj.commonSqlQuery( updateViewerSql, [ updateViewObj, dataObj.contestUuid, dataObj.userUuid ] );

            if ( updateViewStatus && updateViewStatus != false ) {

                if ( dataObj.requestFor == 'JOIN' ) {

                    let countSql        = `SELECT ctbv_id, ctbv_fk_u_uuid, ctbv_fk_ct_uuid, ctbv_created,ctbv_winners, u_id, u_uuid, u_name , u_image FROM contest_broadcast_viewers LEFT JOIN user ON u_uuid = ctbv_fk_u_uuid WHERE ctbv_fk_ct_uuid = ?`,
                    countRes            = await commonModelObj.commonSqlQuery( countSql, [dataObj.contestUuid], true );

                    let updateData          =  'UPDATE live_broadcast SET ? WHERE lb_fk_ct_uuid = ?',
                        updateObj           = {
            
                            lb_views_count : countRes && countRes.length > 0 ? countRes.length : '0'
                        };

                    let updateViewsCount =  await commonModelObj.commonSqlQuery( updateData, [updateObj, dataObj.contestUuid ] );
                console.log('countRes ======================================>>>>>>>>>',countRes);
                    if( countRes && countRes.length > 0 ) {

                        for ( let resOne of countRes ) {

                            resOne.viewsCount   = countRes.length;

                            if( resOne.u_image ){

                                
                                resOne.u_image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + resOne.u_image;
                            }     

                            if( resOne.ctbv_created ){

                                resOne.ctbv_created =  helper.agoTime( resOne.ctbv_created );
                            }

                        }
                        
                        selectData = countRes;
                    }

                } else {

                    selectData       = [{ u_uuid : dataObj.userUuid }]

                }
                deferred.resolve(selectData);

            } else {

                deferred.resolve( false );
            }
               
        } else {
           console.log('asdasdasdasdasdasdasdasdasdasdasdasdasdasdasdasd==========================>>>>>>>>>',hostUuid != dataObj.userUuid);
            if( hostUuid != dataObj.userUuid ){

                let sql         = `INSERT INTO contest_broadcast_viewers SET ?`,   
                insertValue = {

                    "ctbv_fk_u_uuid"             : dataObj.userUuid,
                    "ctbv_fk_ct_uuid"            : dataObj.contestUuid,
                    "ctbv_created"               : await helper.getPstDateTime('timeDate'),
                    "ctbv_uuid"                  : uuid,
                    "ctbv_status"                : "1",
                };

                let insertData  = await helper.getDataOrCount(sql, insertValue, 'U');

                if ( insertData && insertData.insertId > 0 ) {

                    let countSql        = `SELECT ctbv_id, ctbv_fk_u_uuid, ctbv_fk_ct_uuid, ctbv_created, u_id, u_uuid, u_name , u_image  FROM contest_broadcast_viewers LEFT JOIN user ON u_uuid = ctbv_fk_u_uuid WHERE ctbv_fk_ct_uuid = ? AND ctbv_status = "1"`,
                    countRes            = await commonModelObj.commonSqlQuery( countSql, [dataObj.contestUuid ] );
                    console.log('countRes===============================>>>>>>>>>>>>>>>>>>>>>>>>>',countRes);
                    let updateData          =  'UPDATE live_broadcast SET ? WHERE lb_fk_ct_uuid = ?',
                    updateObj           = {
        
                        lb_views_count : countRes && countRes.length > 0 ? countRes.length : '0'
                    };

                    let updatePostCount =  await commonModelObj.commonSqlQuery( updateData, [updateObj, dataObj.contestUuid ] );
                
                    if( countRes && countRes.length > 0 ) {

                        for ( let resOne of countRes ) {

                            resOne.viewsCount   = countRes.length;

                            if( resOne.u_image ){

                                resOne.u_image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + resOne.u_image;
                            }     

                            if( resOne.ctbv_created ){

                                resOne.ctbv_created =  helper.agoTime( resOne.ctbv_created );
                            }

                        }

                        selectData = countRes;
                    }
                    
                    deferred.resolve(selectData);
                    
                } else {

                    deferred.resolve(false);
                }

            } else {

                console.log('We are hear ===================>>>>>>>user is exist');
            }

        }

    } else {

        deferred.resolve(false);
    } 

    return deferred.promise;
}

liveModel.winnerUsersData = async (dataObj) => {

    let deferred      = q.defer(),
    conObj        = await constant.getConstant();

    if ( dataObj && dataObj.contestUuid ) {


        let winnerSql    = `SELECT U.u_id, U.u_name,U.u_uuid, U.u_image,ctbv_id, ctbv_fk_u_uuid ,ctbv_winners, ctbv_fk_ct_uuid   FROM contest_broadcast_viewers LEFT JOIN user AS U ON ctbv_fk_u_uuid = u_uuid  WHERE ctbv_fk_ct_uuid = ?   AND ctbv_winners IN('FIRST', 'SECOND', 'THIRD') AND ctbv_winners != 'VIEWER' ORDER BY ctbv_winners `;
        let winnerData   = await commonModelObj.commonSqlQuery( winnerSql, [ dataObj.contestUuid ],true );
        if( winnerData && winnerData.length > 0 ){
    
            for( let userWinners of winnerData ){
    
                if(userWinners.u_image ){
    
                    userWinners.u_image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + userWinners.u_image;
    
                }

                let requestSql = 'SELECT ctbv_request_live FROM contest_broadcast_viewers  WHERE ctbv_fk_ct_uuid = ?   AND ctbv_fk_u_uuid = ?'
                
                let requestData    = await commonModelObj.commonSqlQuery( requestSql, [ dataObj.contestUuid, userWinners.u_uuid ],true );
                let requestStatus = false;

                if( requestData && requestData.length > 0 ){

                    if( requestData[0].ctbv_request_live == 'P' ){
                        requestStatus = true
                    }

                }
                userWinners.requestStatus = requestStatus;
    
            }
            
            deferred.resolve(winnerData)
        } else {
            deferred.resolve([])
    
        }
        console.log('winnerData winnerData ===========>>>>',winnerData)

    } else {
        console.log('winnerData winnerData ===========>>>> else ')

    }

 return deferred.promise

}



// /** This Function is used to update live viewer 
//  *   
//  * @developer : 
//  * @modified  : 
//  */
//  liveModel.liveWinnerUser = async function( dataObj ) {

//     let deferred      = q.defer();

//     if ( dataObj && dataObj.contestUuid && dataObj.winnerList ) {
//         console.log('We are hear ===================>>>>>>>dataObj.winnerList1111111111',dataObj.winnerList);

//         if( dataObj.winnerList && dataObj.winnerList.length > 0 ) {                                                                                                                                                                                                
//             let updateWinnerObj  = {},
//             updateWinnerData     = [],
//             obj                  = {};
//             console.log('We are hear ===================>>>>>>>dataObj.winnerList222222222222222',dataObj.winnerList.length);

//             for( let i = 0; i < dataObj.winnerList.length ; i++ ){
//                 console.log('We are hear ===================>>>>>>>dataObj.winnerList3333333333333333',dataObj.winnerList[i]);

//                 let sql     = `SELECT ctbv_id, ctbv_fk_u_uuid ,ctbv_winners, ctbv_fk_ct_uuid   FROM contest_broadcast_viewers WHERE ctbv_fk_ct_uuid = ?   AND ctbv_winners IN('FIRST', 'SECOND', 'THIRD') ORDER BY ctbv_winners `;
//                 let isExist = await commonModelObj.commonSqlQuery( sql, [dataObj.contestUuid ],true );
//                 console.log('We are hear ===================>>>>>>>dataObj.winnerList44444444444444444',isExist);

//                 if( isExist && isExist.length > 0 ){
//                     console.log('We are hear ===================>>>>>>>dataObj.winnerList555555555555555555555',isExist.length);

//                     if( isExist.length == 1 ){
//                         console.log('We are hear ===================>>>>>>>dataObj.winnerList66666666666666666666',isExist);

//                         if( dataObj.winnerList[1] ){
    
//                             updateWinnerObj       = {
        
//                                 ctbv_winners : 'SECOND',
//                             };
//                             updateWinnerData      = [updateWinnerObj,dataObj.winnerList[1].ctbv_id];
//                         }


//                     } else if ( isExist.length == 2 ){
//                         console.log('We are hear ===================>>>>>>>dataObj.winnerList77777777777777777777777777',isExist);

//                         if( dataObj.winnerList[2]){
    
//                             updateWinnerObj       = {
        
//                                 ctbv_winners : 'THIRD',
//                             };
//                             updateWinnerData      = [updateWinnerObj,dataObj.winnerList[2].ctbv_id];
//                         }

//                     }

//                     obj = isExist
//                     console.log('We are hear ===================>>>>>>>obj.winnerListDataasdasdadadadadadasdadadadasda24242424234242342423',obj);
//                 } else {
//                     console.log('We are hear ===================>>>>>>>dataObj.winnerList88888888888888888888888888888');


//                     if( dataObj.winnerList[0].ctbv_fk_u_uuid ){
//                         console.log('We are hear ===================>>>>>>>dataObj.winnerList101010101010101010101001',dataObj.winnerList[0].ctbv_fk_u_uuid);

//                         updateWinnerObj       = {
    
//                             ctbv_winners : 'FIRST',
//                         };
//                         updateWinnerData      = [updateWinnerObj,dataObj.winnerList[0].ctbv_id];
    
//                     }
//                     if( dataObj.winnerList[1] ){
//                         console.log('We are hear ===================>>>>>>>dataObj.winnerList1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1',dataObj.winnerList[1].ctbv_fk_u_uuid);

//                         updateWinnerObj       = {
    
//                             ctbv_winners : 'SECOND',
//                         };
//                         updateWinnerData      = [updateWinnerObj,dataObj.winnerList[1].ctbv_id];
//                     }
    
//                     if( dataObj.winnerList[2] ){
//                         console.log('We are hear ===================>>>>>>>dataObj.winnerList12121212121212121212121212121212121212121212121212121212121212121212',dataObj.winnerList[2].ctbv_fk_u_uuid);

//                         updateWinnerObj       = {
    
//                             ctbv_winners : 'THIRD',
//                         };
//                         updateWinnerData      = [updateWinnerObj,dataObj.winnerList[2].ctbv_id];
//                     }

//                 }

//                 let updateSql  = 'UPDATE contest_broadcast_viewers SET ? WHERE ctbv_id = ? ',
//                     updateData = await  commonModelObj.commonSqlQuery( updateSql,updateWinnerData, true);

//                 if( updateData ){
//                     console.log('We are hear ===================>>>>>>>updateData11111');
//                 } else {
//                     console.log('We are hear ===================>>>>>>>updateData2222222');
//                 }

//                 obj = isExist
//                 console.log('We are hear ===================>>>>>>>obj.winnerListData101010101010101010101010101010101010101',obj);

//             }
//             deferred.resolve(obj)
          
//         } else {

//             deferred.resolve(false);

//         }
        

//     } else {

//         deferred.resolve(false);
//     } 


//     return deferred.promise;
// }


/** This Function is used to update live viewer 
 *   
 * @developer : 
 * @modified  : 
 */
liveModel.liveWinnerUser = async function( dataObj ) {

    let deferred      = q.defer();

    if ( dataObj && dataObj.contestUuid && dataObj.winnerId ) {
        console.log('We are hear ===================>>>>>>>dataObj.winnerId1111111111',dataObj.contestUuid);

        if( dataObj.winnerId && dataObj.winnerId != '' ) {   

            let updateWinnerObj  = {},
            updateWinnerData     = [],
            obj                  = {};
            console.log('We are hear ===================>>>>>>>dataObj.winnerId222222222222222',dataObj.winnerId);

            // for( let i = 0; i < dataObj.winnerId.length ; i++ ){
            //     console.log('We are hear ===================>>>>>>>dataObj.winnerId3333333333333333',dataObj.winnerId[i]);

                let sql     = `SELECT ctbv_id, ctbv_fk_u_uuid ,ctbv_winners, ctbv_fk_ct_uuid   FROM contest_broadcast_viewers WHERE ctbv_fk_ct_uuid = ? AND ctbv_winners IN('FIRST', 'SECOND', 'THIRD') ORDER BY ctbv_winners `;
                let isExist = await commonModelObj.commonSqlQuery( sql, [dataObj.contestUuid ],true );
                console.log('We are hear ===================>>>>>>>dataObj.winnerId44444444444444444',isExist);
                let userUuid = await commonModelObj.getRowId(dataObj.winnerId,'u_id','u_uuid','user');

                if( isExist && isExist.length > 0 ){
                    console.log('We are hear ===================>>>>>>>dataObj.winnerId555555555555555555555',isExist.length);
                    let sql     = `SELECT ctbv_id, ctbv_fk_u_uuid ,ctbv_winners, ctbv_fk_ct_uuid   FROM contest_broadcast_viewers WHERE ctbv_fk_ct_uuid = ?  AND ctbv_fk_u_uuid = ? AND ctbv_winners IN('FIRST', 'SECOND', 'THIRD') ORDER BY ctbv_winners `;
                    let isUserExist = await commonModelObj.commonSqlQuery( sql, [dataObj.contestUuid,userUuid ],true );
                    if( isUserExist && isUserExist.length > 0 ) {
                        console.log('We are hear isUserExist===================>>>>>>>dataObj.2222222222222222222222222222222222222222',isUserExist);

                    } else {

                        if( isExist.length == 1 ){
                            console.log('We are hear ===================>>>>>>>dataObj.2222222222222222222222222222222222222222',isExist);

                            updateWinnerObj       = {
        
                                ctbv_winners : 'SECOND',
                            };
                            updateWinnerData      = [updateWinnerObj,userUuid,dataObj.contestUuid];
                        

                        } else if ( isExist.length == 2 ){
                            console.log('We are hear ===================>>>>>>>dataObj.333333333333333333333333333333333333',isExist);
        
                            updateWinnerObj       = {
        
                                ctbv_winners : 'THIRD',
                            };
                            updateWinnerData      = [updateWinnerObj,userUuid,dataObj.contestUuid];
                        

                        }
                    }

                } else {
                    console.log('We are hear ===================>>>>>>>dataObj11111111111111');


                    if( dataObj.winnerId ){
                        console.log('We are hear ===================>>>>>>>dataObj.winnerId101010101010101010101001',dataObj.winnerId);

                        updateWinnerObj       = {
    
                            ctbv_winners : 'FIRST',
                        };
                        updateWinnerData      = [updateWinnerObj,userUuid,dataObj.contestUuid];
    
                    }
                   
                }

                let updateSql  = 'UPDATE contest_broadcast_viewers SET ? WHERE ctbv_fk_u_uuid = ? AND ctbv_status = "1" AND ctbv_fk_ct_uuid = ? ',
                    updateData = await  commonModelObj.commonSqlQuery( updateSql,updateWinnerData, true);
                if( updateData ){
                    
                    console.log('We are hear ===================>>>>>>>updateData11111');
                } else {
                    console.log('We are hear ===================>>>>>>>updateData2222222');
                }

                obj = isExist
                console.log('We are hear ===================>>>>>>>obj.winnerIdData101010101010101010101010101010101010101',obj);

            // }
            deferred.resolve(obj)
          
        } else {

            deferred.resolve(false);

        }
        

    } else {

        deferred.resolve(false);
    } 


    return deferred.promise;
}


/**
 * This function is using to insert group chat data
 * @developer : 
 * @modified  :  
 */
liveModel.liveSendRequest = async function( dataObj ) {

    let deferred        = q.defer(),
    conObj              = await constant.getConstant();

    if ( dataObj && dataObj.contestUuid && dataObj.otherUserId && dataObj.broadcastUuid ) {


        // let otherUserUuid = await commonModelObj.getRowId(dataObj.otherUserId,'u_id','u_uuid','user');
        let otherUserUuid = dataObj.otherUserId;

        let winnerSql    = `SELECT U.u_id, U.u_name, U.u_image,ctbv_id, ctbv_fk_u_uuid ,ctbv_winners, ctbv_fk_ct_uuid   FROM contest_broadcast_viewers LEFT JOIN user AS U ON ctbv_fk_u_uuid = u_uuid  WHERE ctbv_fk_ct_uuid = ?   AND ctbv_fk_u_uuid = ? AND ctbv_request_live IN('A', 'P') AND ctbv_winners != 'VIEWER'  ORDER BY ctbv_winners `;
        let winnerData   = await commonModelObj.commonSqlQuery( winnerSql, [ dataObj.contestUuid, otherUserUuid ],true );
        console.log('winnerData======================>>>>>>>>',winnerData);
        if( winnerData ){

            let updateUserSql = 'UPDATE contest_broadcast_viewers SET ctbv_request_live = ? WHERE ctbv_fk_ct_uuid = ?   AND ctbv_fk_u_uuid = ?'
            let updateUser    = await commonModelObj.commonSqlQuery( updateUserSql, [ 'P',dataObj.contestUuid, otherUserUuid ],true );

            if( updateUser ){

                let broadcasterDataSql  =  `SELECT u_name AS broadcasterName,u_image AS broadcasterImage, u_uuid AS broadcasterUuid, lb_uuid FROM live_broadcast LEFT JOIN user ON lb_fk_u_uuid = u_uuid WHERE lb_uuid = ? AND lb_fk_ct_uuid = ? `,
                broadcasterData          =  await commonModelObj.commonSqlQuery(broadcasterDataSql,[dataObj.broadcastUuid, dataObj.contestUuid],true);
                console.log('liveSendRequest start --------2222222222',broadcasterData)

                if( broadcasterData && broadcasterData.length > 0 ){

                    if(broadcasterData[0].broadcasterImage ){
    
                        broadcasterData[0].broadcasterImage  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + broadcasterData[0].broadcasterImage;
        
                    }
                    broadcasterData[0].otherUserUuid = otherUserUuid
                    deferred.resolve(broadcasterData[0]);

                }

            }

        } else {
            deferred.resolve(false);

        }

    } else {

        deferred.resolve(false);
    }
 return deferred.promise
}


/**
 * This function is using to insert group chat data
 * @developer : 
 * @modified  :  
 */
liveModel.liveCancelRequest = async function( dataObj ) {

    let deferred        = q.defer(),
    conObj              = await constant.getConstant();

    if ( dataObj && dataObj.contestUuid && dataObj.otherUserId && dataObj.broadcastUuid ) {

        let otherUserUuid = await commonModelObj.getRowId(dataObj.otherUserId,'u_id','u_uuid','user');

        let winnerSql    = `SELECT U.u_id, U.u_name, U.u_image,ctbv_id, ctbv_fk_u_uuid ,ctbv_winners, ctbv_fk_ct_uuid   FROM contest_broadcast_viewers LEFT JOIN user AS U ON ctbv_fk_u_uuid = u_uuid  WHERE ctbv_fk_ct_uuid = ?   AND ctbv_fk_u_uuid = ?  AND ctbv_winners != 'VIEWER'  ORDER BY ctbv_winners `;
        let winnerData   = await commonModelObj.commonSqlQuery( winnerSql, [ dataObj.contestUuid, otherUserUuid ],true );
        console.log('winnerData======================>>>>>>>>',winnerData);
        if( winnerData ){

            let updateUserSql = 'UPDATE contest_broadcast_viewers SET ctbv_request_live = ? WHERE ctbv_fk_ct_uuid = ?   AND ctbv_fk_u_uuid = ?'
            let updateUser    = await commonModelObj.commonSqlQuery( updateUserSql, [ 'C',dataObj.contestUuid, otherUserUuid ],true );

            if( updateUser ){

                let broadcasterDataSql  =  `SELECT u_name AS broadcasterName,u_image AS broadcasterImage, u_uuid AS broadcasterUuid, lb_uuid FROM live_broadcast LEFT JOIN user ON lb_fk_u_uuid = u_uuid WHERE lb_uuid = ? AND lb_fk_ct_uuid = ? `,
                broadcasterData          =  await commonModelObj.commonSqlQuery(broadcasterDataSql,[dataObj.broadcastUuid, dataObj.contestUuid],true);
                console.log('liveSendRequest start --------2222222222',broadcasterData)

                if( broadcasterData && broadcasterData.length > 0 ){

                    if(broadcasterData[0].broadcasterImage ){
    
                        broadcasterData[0].broadcasterImage  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + broadcasterData[0].broadcasterImage;
        
                    }
                    broadcasterData[0].otherUserUuid = otherUserUuid
                    deferred.resolve(broadcasterData[0]);

                }

            }

        } else {
            deferred.resolve(false);

        }

    } else {

        deferred.resolve(false);
    }
 return deferred.promise
}


/**
 * This function is using to insert group chat data
 * @developer : 
 * @modified  :  
 */
liveModel.liveJoinRequest = async function( dataObj ) {

    let deferred        = q.defer(),
    conObj              = await constant.getConstant();

    if ( dataObj && dataObj.contestUuid && dataObj.otherUserId && dataObj.broadcastUuid ) {

        let otherUserUuid = dataObj.otherUserId;

        let winnerSql    = `SELECT U.u_id, U.u_name, U.u_image,ctbv_id, ctbv_fk_u_uuid ,ctbv_winners, ctbv_fk_ct_uuid   FROM contest_broadcast_viewers LEFT JOIN user AS U ON ctbv_fk_u_uuid = u_uuid  WHERE ctbv_fk_ct_uuid = ?   AND ctbv_fk_u_uuid = ? AND ctbv_request_live = 'P'  AND ctbv_winners != 'VIEWER'  ORDER BY ctbv_winners `;
        let winnerData   = await commonModelObj.commonSqlQuery( winnerSql, [ dataObj.contestUuid, otherUserUuid ],true );
        console.log('winnerData======================>>>>>>>>',winnerData);
        if( winnerData ){

            let updateUserSql = 'UPDATE contest_broadcast_viewers SET ctbv_request_live = ? WHERE ctbv_fk_ct_uuid = ?   AND ctbv_fk_u_uuid = ?'
            let updateUser    = await commonModelObj.commonSqlQuery( updateUserSql, [ 'A',dataObj.contestUuid, otherUserUuid ],true );

            if( updateUser ){

                let broadcasterDataSql  =  `SELECT u_name AS broadcasterName,u_image AS broadcasterImage, u_uuid AS broadcasterUuid, lb_uuid FROM live_broadcast LEFT JOIN user ON lb_fk_u_uuid = u_uuid WHERE lb_uuid = ? AND lb_fk_ct_uuid = ? `,
                broadcasterData          =  await commonModelObj.commonSqlQuery(broadcasterDataSql,[dataObj.broadcastUuid, dataObj.contestUuid],true);
                console.log('liveSendRequest start --------2222222222',broadcasterData)

                if( broadcasterData && broadcasterData.length > 0 ){

                    if(broadcasterData[0].broadcasterImage ){
    
                        broadcasterData[0].broadcasterImage  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + broadcasterData[0].broadcasterImage;
        
                    }
                    broadcasterData[0].otherUserUuid = otherUserUuid
                    deferred.resolve(broadcasterData[0]);

                }

            }

        } else {
            deferred.resolve(false);

        }

    } else {

        deferred.resolve(false);
    }
 return deferred.promise
}




module.exports = liveModel;