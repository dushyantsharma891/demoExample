	

const   config				= require('../../config').init(),
        pool 	            = require('../../config/pool'),
        q                   = require('q'),
        uuidv1              = require('uuid/v1'),
        common              = require('../configCommon'),
        constant            = require('../../config/constants'),
        commonHelper        = require('../../configCommon/helpers/index'),
        helper              = require('../../configCommon/helpers/index');

        

let reportModel = {};

/**
 * This function is using to update report list
 * @param        :
 * @returns      :
 * @developer    : Dushyant sharma
 * @modification :  
 */
reportModel.reportSomeone = async (body, uId) => {

    console.log('body-else=======>',body, uId);

    let deferred     = q.defer(),
        insertSql    = 'INSERT INTO report_user_concern SET ?',
        insertSqlOne = 'INSERT INTO report_concern_list SET ?',
        checkSql     = `SELECT ruc_id FROM report_user_concern WHERE ruc_type = ? AND ruc_to_fk_reference_id = ?`,
        appType      = '';

    if( body && uId && body.reportTo && body.reportType  && body.createdById && body.reportId ) {

        let reportType    = body.reportType,
            reportTo      = body.reportTo,
            reportId      = body.reportId,
            reportTime    = await helper.getUtcTime(),
            reportMessage = body.reportMessage,                                       
            createdBy     = await helper.getRowId(body.createdById, 'u_uuid', 'u_id', 'user' );
            
            if( body.appType != null ){

                appType = body.appType
            } else {
                 
                appType = 'KNOWEX_BITCOIN'
            }

        if( createdBy && reportId != null ) {

            console.log('creatbyid=========>>>>>else',createdBy)

            // console.log( '  created by ==== >', createdBy)
            let isExist = await common.commonSqlQuery(checkSql,[reportType, reportTo]);
                console.log('lcjaklcaklcklmklamklcm====>>>>',isExist);
            if( isExist && isExist.length > 0 && isExist[0].ruc_id ) {

                let isExistId = isExist[0].ruc_id,
                    sql       = 'SELECT rcl_id, rcl_status FROM report_concern_list WHERE rcl_concern_by_fk_u_id = ? AND rcl_fk_ruc_id = ?',
                    existId   = await common.commonSqlQuery(sql,[uId, isExistId]);
                    reportStatus = '';  

                if( existId  && existId != '' ) {

                    if( existId[0].rcl_status == 'RESOLVE' || existId[0].rcl_status == 'REOPEN' ) {

                        reportStatus = 'REOPEN'

                    }
                        console.log('existI===>>>>',existId)
                   let updateSql = 'Update report_concern_list SET ? WHERE rcl_concern_by_fk_u_id = ? AND rcl_fk_ruc_id = ?',
                       obj       = {

                        rcl_updated  : reportTime,
                        rcl_fk_rt_id : reportId,
                        rcl_concern  : reportMessage,
                        rcl_status   : reportStatus
                    },
                    updateData = await common.commonSqlQuery(updateSql,[ obj, uId, isExistId], true);

                    if( updateData ) {

                        deferred.resolve(true);
                    } else {

                        deferred.resolve(false);
                    }

                } else {
                    // console.log('elser is exist',isExist)

                    let insertDataOne  = {
    
                        rcl_fk_ruc_id           : isExist[0].ruc_id ,
                        rcl_concern_by_fk_u_id  : uId,
                        rcl_fk_rt_id            : reportId,          
                        rcl_concern_to_fk_u_id  : createdBy,
                        rcl_uuid                : uuidv1(Date.now()),
                        rcl_concern             : reportMessage,
                        rcl_created             : reportTime
                        
                    };
    
                    let  resultOne = await common.commonSqlQuery(insertSqlOne, insertDataOne, true);

                    if(resultOne ) {

                     let insertCount = await reportModel.reportCount(body);
                            // console.log('insertCount ======>>>>',insertCount)
                        if( insertCount ){

                            deferred.resolve(true);
                        } else {

                            deferred.resolve(false);
                        }

                        deferred.resolve(resultOne);

                    } else {
                        console.log('result One upper else===========>');
                        deferred.resolve(false);
                    }

                    // deferred.resolve(false);
                }

            } else {

                let insertData    = {

                    ruc_type                : reportType,
                    ruc_created             : reportTime,
                    ruc_to_fk_reference_id  : reportTo,
                    ruc_app_type            : appType,
                    ruc_uuid	            : uuidv1(Date.now()),
                };

                let  result = await common.commonSqlQuery(insertSql, insertData, true);

                if( result ) {
                    
                    console.log('sdhajisdhaksdkasdkaksdas',result.insertId);
                    let insertDataOne  = {
    
                        rcl_fk_ruc_id           : result.insertId ,
                        rcl_concern_by_fk_u_id  : uId,
                        rcl_fk_rt_id            : reportId,          
                        rcl_concern_to_fk_u_id  : createdBy,
                        rcl_uuid                : uuidv1(Date.now()),
                        rcl_concern             : reportMessage,
                        rcl_created             : reportTime
                        
                    };
    
                    let  resultOne = await common.commonSqlQuery(insertSqlOne, insertDataOne, true);

                    if(resultOne ) {

                     let insertCount = await reportModel.reportCount(body);
                            console.log('insertCount ======>>>>',insertCount)
                        if( insertCount ){

                            deferred.resolve(true);
                        } else {

                            deferred.resolve(false);
                        }

                        deferred.resolve(resultOne);

                    } else {
                        console.log('result One else===========>');
                        deferred.resolve(false);
                    }

                } else {
                    console.log('result else=======>');
                    deferred.resolve(false);
                }
            }

        } else {

            console.log('creatbyid && reportId=========>>>>>else')

            deferred.resolve(false);
        }

    } else {

        console.log('body else=======>>>>');
        deferred.resolve(false);
    }

    return deferred.promise   
}


/**
 * This function is using to get report count
 * @param        :
 * @returns      :
 * @developer    : Dushyant sharma
 * @modification :  
 */

reportModel.reportCount = async (body) => {

    let deferred     = q.defer();

    if( body && body.reportType && body.reportTo ) {

        let reportType = body.reportType,
        reportTo       = body.reportTo, 
        insertData     = '',
        dataObj        = '',   
        selectSql      = 'SELECT ruc_id FROM report_user_concern WHERE ruc_type = ? AND ruc_to_fk_reference_id = ? ',
        getId          =  await common.commonSqlQuery(selectSql, [reportType, reportTo ], true ),
        countSql       = 'SELECT * FROM report_concern_list WHERE rcl_fk_ruc_id = ?',
        getReportCount = await helper.getDataOrCount(countSql, getId[0].ruc_id, 'L', true);
        
        if ( getReportCount ) {

            if( reportType == 'OM' ){

                insertData    =  'UPDATE conversation_onetoone SET ? WHERE co_uuid = ?',
                dataObj         = {
        
                    co_report_count : getReportCount
                };
            } 
            if( reportType == 'GM'){
               
                insertData    =  'UPDATE conversation_group_chat SET ? WHERE cgc_uuid = ?',
                dataObj       = {
        
                    cgc_report_count : getReportCount
                };
        
            } 
            if( reportType == 'U' ) {
        
                insertData    =  'UPDATE user SET ? WHERE u_uuid = ?',
                dataObj       = {
        
                    u_report_count : getReportCount
                };
            }
            if( reportType == 'G' ) {
        
                insertData    =  'UPDATE conversation_group SET ? WHERE cg_uuid = ?',
                dataObj       = {
        
                    cg_report_count : getReportCount
                };
            }
            if( reportType == 'S' ) {
        
                insertData    =  'UPDATE user_status SET ? WHERE us_uuid = ?',
                dataObj       = {
        
                    us_report_count : getReportCount
                };
            }
            if( reportType == 'V' ) {
                                                    
                insertData  =  'UPDATE users_saved_videos SET ? WHERE usv_fk_ulsv_id = ? ',
                    dataObj = {
            
                        usv_report_count : getReportCount
                    };
                let videoId = await helper.getRowId(reportTo, 'ulsv_uuid', 'ulsv_id', 'user_live_saved_videos');

                if( videoId ) {

                    reportTo = videoId
                    // console.log('dklnsdkcnksdncksncksncknsklcnk',reportTo)
                } 
            }
            
            let insertRCount =  await common.commonSqlQuery(insertData, [dataObj, reportTo ], true );
                //    console.log('insertcount======>>>',insertRCount)
            if( insertRCount ){
                // console.log( 'insertRCount===>>',insertRCount)
                deferred.resolve(insertRCount);

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











// /**
//  * This function is using to insert report
//  * @param        :
//  * @returns      :
//  * @developer    : Dushyant sharma
//  * @modification :  
//  */

// reportModel.insertReport = async (body, userId) => {
//          console.log('ddsdadasdasdadadadadadada',body, userId)
//     let deferred    = q.defer(),
//     insertSql   = 'INSERT INTO report_user_concern SET ?';

//     if( body && userId && body.reportTo && body.reportType && body.reportMessage ){

//         let reportType  = body.reportType,
//         reportTo        = body.reportTo,
//         reportTime      = await helper.getUtcTime(),
//         uId             = userId
//         reportMessage   = body.reportMessage; 

//         let  insertData = {

//             ruc_type                : reportType,
//             ruc_uuid	            : uuidv1(Date.now()),
//             ruc_created             : reportTime,
//             ruc_concern             : reportMessage,
//             ruc_concern_by_fk_u_id   : uId,
//             ruc_to_fk_reference_id   : reportTo
//         },

//         result = await common.commonSqlQuery(insertSql, insertData, true);
        
//         if( result ) {

//             console.log('result=======>3333333');

//             deferred.resolve(result);
//         } else {
//             console.log('else=======>4444444');

//             deferred.resolve(false);
//         }



//     } else {
//         console.log('else=======>77777');
//         deferred.resolve(false);

//     } 
   


// }



module.exports = reportModel;