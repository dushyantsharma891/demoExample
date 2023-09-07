


const { result } = require('underscore');
const pool 	            = require('../../configCommon/config/pool'),
    q                   = require('q'),
    {v1: uuidv1}        = require('uuid'),
    common              = require('./configCommon'),
    constant            = require('../../configCommon/config/constants'),
    commonHelper        = require('../../configCommon/helpers/index'),
    helper			    = require('../../configCommon/helpers'),
    path				= require('path');
        

let reportModel = {};

/**
 * This function is using to Get Pages Data
 * @param        :
 * @returns      :
 * @developer    : Dushyant sharma
 * @modification :  
 */


reportModel.getPagesData  = async (body) => {

    let deferred = q.defer(),
        sql      = `SELECT sp_id, sp_uuid , sp_mobile AS pageHtml 
        FROM static_pages 
        WHERE sp_short_name = ? AND sp_show_on_mobile = ? AND sp_status = ? AND sp_deleted = ? `;

    if( body && body.pageName ){

        let results = await common.commonSqlQuery(sql, [body.pageName,'1','1','0']);

        if ( results && results.length > 0 ) {
        
            deferred.resolve(results);
    
        } else {

            deferred.resolve(false); 
        }   

    } else {

        deferred.resolve(false)
    }
    
      
            
    return deferred.promise;
}

module.exports = reportModel