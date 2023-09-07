



const q 			= require('q'),
path				= require('path'),
{v1: uuidv1}        = require('uuid'),
helper				= require('../../configCommon/helpers'),
config				= require('../../configCommon/config').init(),
common              = require('../models/configCommon'),
constant            = require('../../configCommon/config/constants'),
_pagesModel         = require('../models/pages_model');

let pages = {};



/**
 * This function is using to get Pages Data
 * @param        :
 * @returns      :
 * @developer    : Dushyant sharma
 * @modification :  
 */
 pages.getPagesData = async (req,res) => {

    if( req && req.body ){

        result = await _pagesModel.getPagesData(req.body);
        //    console.log('result==========>>',result);
        if( result ){
            let obj = {data : result}

            helper.successHandler( res, {
                status  : true, 
                payload : obj
            }, 200 );

        } else {

            helper.errorHandler( res, {
                status  : false,
                code    : "AAA-E1000",
                message : 'something went wrong' 
            }, 200 );
        }

    } else {

        helper.errorHandler( res, {
			status  : false,
			code    : "AAA-E1000",
			message : 'Something Went Wrong' 
		}, 401 );
    }

}


module.exports = pages;