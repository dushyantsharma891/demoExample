



const q 				= require('q'),

_followModelObj     = require('../models/follow_model'),
{v1: uuidv1}        = require('uuid'),
helper				= require('../../configCommon/helpers'),
config				= require('../../configCommon/config').init(),
busboyCon 		    = require('busboy'),
common              = require('../models/configCommon'),
constant            = require('../../configCommon/config/constants'),
path				= require('path'),
ThumbnailGenerator  = require('video-thumbnail-generator').default,
ffmpeg              = require('fluent-ffmpeg');


    
let follow = {};


/**
* This function is using to add spam user data
* @param     :
* @returns   :
* @developer : 
*/
follow.followUnFollow = async (req, res) => {

    let userId = await helper.getUUIDByTocken(req);

    if (userId) {

        if ( req && req.body && req.body.followUserId && req.body.type ) {

            let followUserId = await common.getRowById(req.body.followUserId, 'u_uuid', 'u_id', 'user');

            if (followUserId) {

                let obj = {
                    userId: userId,
                    followUserId: followUserId,
                    type: req.body.type
                },
                result = await _followModelObj.followUnFollow(obj);
                  console.log('dsdasdadadad',result)
                if (result) {

                    let followStatus = 'NO',
                        msg = "User unfollowed successfully.";

                    if (req.body.type == 'FOLLOW') {
                        followStatus = 'YES';
                        msg = "User followed successfully."
                    }

                    helper.successHandler(res, {
                        message: msg,
                        payload: {
                            followStatus: followStatus
                        }
                    }, 200);

                } else {

                    let obj = {
                        code: 'FUE -E1001',
                        message: 'Failed,Please try again.',
                        status: false
                    };
                    helper.successHandler(res, obj);

                }

            } else {

                let obj = {
                    code: 'FUE-E1002',
                    message: 'Expert does not exist.',
                    status: false
                };
                helper.successHandler(res, obj);

            }

        } else {

            let obj = {
                code: 'FUE-E1003',
                message: 'Please fill mandatory fields.',
                status: false
            };
            helper.successHandler(res, obj);

        }

    } else {

        let obj = {
            status: false,
            code: "FUE-E1001",
            message: "Unauthorized Error."
        }
        helper.errorHandler(res, obj, 401);

    }  

}

/**
* This function is using to get followers list
* @param     : otherUserId
* @returns   :
* @developer : 
*/
follow.getMyFollowersList = async function (req, res) {

    let userId = await helper.getUUIDByTocken(req),
        // loginUserId = userId,
        followUserId = '';
                  
    if (userId) {

        if (req && req.body) {

            if (req.body.otherUserId) {
                followUserId = await common.getRowId(req.body.otherUserId, 'u_uuid', 'u_id', 'user');
            }

            if (followUserId) {
                otherUserId = followUserId;
            }

            let result = await _followModelObj.getMyFollowersList(otherUserId, req.body );
            //    console.log('sdsdsddsdfsd',result)
            if (result) {

                helper.successHandler(res, {
                    payload: result
                }, 200);

            } else {

                helper.successHandler(res, {
                    status: false,
                    code: 'GMFL-E1000',
                    message: 'No records found.'
                }, 200);

            }

        } else {

            let obj = {
                code: 'GMFL -E1001',
                message: 'Something went wrong.',
                status: false
            };
            helper.successHandler(res, obj);

        }

    } else {

        helper.errorHandler(res, {
            status: false,
            code: "GMFL-E1002",
            message: "Unauthorized Error."
        }, 401);

    }

}

/**
* This function is using to get all my  Follower Following List 
* @param     : 
* @returns   :
* @developer : 
*/
follow.friendsList = async function (req, res) {

    let userId = await helper.getUUIDByTocken(req),
        // loginUserId = userId,
        followUserId = '';

    if (userId) {

        if (req && req.body) {

            let result = await _followModelObj.friendsList(userId, req.body );
            //    console.log('sdsdsddsdfsd',result)
            if (result) {

                helper.successHandler(res, {
                    payload: result
                }, 200);

            } else {

                helper.successHandler(res, {
                    status: false,
                    code: 'GMFL-E1000',
                    message: 'No records found.'
                }, 200);

            }

        } else {

            let obj = {
                code: 'GMFL -E1001',
                message: 'Something went wrong.',
                status: false
            };
            helper.successHandler(res, obj);

        }

    } else {

        helper.errorHandler(res, {
            status: false,
            code: "GMFL-E1002",
            message: "Unauthorized Error."
        }, 401);

    }

}



module.exports = follow;
