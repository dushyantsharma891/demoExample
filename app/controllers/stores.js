



const q 			= require('q'),
path				= require('path'),
{v1: uuidv1}        = require('uuid'),
helper				= require('../../configCommon/helpers'),
config				= require('../../configCommon/config').init(),
common              = require('../models/configCommon'),
constant            = require('../../configCommon/config/constants'),
_storesModelObj     = require('../models/stores_model');


let stores = {};


/**
* This function is get user post data
* @param     	: adsType, contestId
* @developer 	: 
* @modified	    : 
*/
stores.getStoresData = async (req, res) => {

    let userId = await helper.getUUIDByTocken(req);

    if ( userId && userId != '' ) {

        if ( req && req.body ) {

            let userPostData = await _storesModelObj.getStoresData(req.body,userId);

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


/**
* This function is used to add Ads Point To User
* @param     	:  adId
* @developer 	: 
* @modified	    : 
*/
stores.addStoresPointToUser = async (req, res) => {

    let userId = await helper.getUUIDByTocken(req);

    if ( userId && userId != '' ) {

        if ( req && req.body ) {

            let userPostData = await _storesModelObj.addStoresPointToUser(userId,req.body);

            if ( userPostData && userPostData != false ) {

                helper.successHandler(res, {
                    status : true,
                    message : 'Add Points successfully',
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


module.exports = stores