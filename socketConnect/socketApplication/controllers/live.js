


const q             = require('q'), 
    liveObj         = {},
    helper          = require('../../../configCommon/helper'),
    constant        = require('../../../configCommon/config/constants'),
    liveModel       = require('../models/live_model'),
    socket_constant = require('../../../configCommon/config/socket_constant'),
    constant_action = socket_constant.ACTION_TYPES,
    commonModelObj  = require('../models/common_model');

/**
 * 
 * @param: 
 * @returns:
 * @developer : 
 */
 liveObj.liveRequestLeave = async function(socket, data) {
    let returnObj = helper.emitDataObj('ERROR');
    if ( data && data.contestUuid ) {
        
        if ( data ) {

            let liveData = await liveModel.liveRequestLeave(data);

            returnObj = helper.emitDataObj('END-LIVE', liveData, data.contestUuid , true);

        }

    } else {
        console.log('else part 567890-')
    }

    return returnObj;
}



/**
 * 
 * @param: 
 * @returns:
 * @developer : 
 */
 liveObj.liveRoomStartLeave = async function(socket, data) {
    let returnObj = helper.emitDataObj('ERROR');
    if ( data && data.contestUuid ) {
        
        if ( data ) {

            let contestEnd = await liveModel.liveRoomStartLeave(data);

            returnObj = helper.emitDataObj('START-LIVE', contestEnd, data.contestUuid , true);

        }

    } else {
        console.log('else part 567890-')
    }
    return returnObj;
}


/**
 * 
 * @param: 
 * @returns:
 * @developer :  
 */
 liveObj.liveRoomJoinLeave = async function(socket, data) {
    let returnObj = helper.emitDataObj('ERROR');
    if ( data && data.contestUuid ) {
        
        if ( data.requestFor ) {

            if (data.requestFor == 'JOIN') {

                socket.join(data.contestUuid);

                let ViewerData      = await liveModel.updateLiveViewer(data);
                let winnerUsersData = await liveModel.winnerUsersData(data);
                let myRoom        = io.sockets.adapter.rooms[data.contestUuid] || { length: 0 };
                let viewersCount  = myRoom.length;
                data.viewersCount = viewersCount;
                data.viewerData   = ViewerData;
                data.winnerUsersData = winnerUsersData;

                console.log('winnerUsersData winnerUsersData winnerUsersData winnerUsersData======>>>>1111111111',winnerUsersData)


            } else {

                socket.leave(data.contestUuid);

                let ViewerData      = await liveModel.updateLiveViewer(data);
                let winnerUsersData = await liveModel.winnerUsersData(data);
                let myRoom        = io.sockets.adapter.rooms[data.contestUuid] || { length: 0 };
                let viewersCount  = myRoom.length;
                data.viewersCount = viewersCount;
                data.viewerData   = ViewerData;
                data.winnerUsersData = winnerUsersData;

                console.log('winnerUsersData winnerUsersData winnerUsersData winnerUsersData======>>>> 222222222',winnerUsersData)

            }


        }
     
        returnObj = helper.emitDataObj('LIVE-ROOM-JOIN-LEAVE', data, data.contestUuid, true);
    }
    return returnObj;
}


/**
 * 
 * @param: 
 * @returns:
 * @developer :  
 */
 liveObj.livePlayAds = async function(socket, data) {
    let returnObj = helper.emitDataObj('ERROR');
    if ( data && data.contestUuid ) {
        
        returnObj = helper.emitDataObj('PLAY-ADS', data, data.contestUuid , true);

    } else {
        console.log('else part 567890-')
    }
    return returnObj;
}
/**
 * 
 * @param: 
 * @returns:
 * @developer :  
 */
 liveObj.liveWinnerUser = async function(socket, data) {
    let returnObj = helper.emitDataObj('ERROR'),
    conObj        = await constant.getConstant();

    if ( data && data.contestUuid ) {
        
        let winnerUser = await liveModel.liveWinnerUser(data);
        console.log('We are hear ===================>>>>>>>winnerUser232323232323232',winnerUser);
            // if(  winnerUser ){
            //     data.winnerListData = winnerUser
            // }
            let winnerUsersData = await liveModel.winnerUsersData(data);

            data.winnerListData = winnerUsersData

            let countSql        = `SELECT ctbv_id, ctbv_fk_u_uuid, ctbv_fk_ct_uuid, ctbv_created, u_id, u_uuid, u_name , u_image  FROM contest_broadcast_viewers LEFT JOIN user ON u_uuid = ctbv_fk_u_uuid WHERE ctbv_fk_ct_uuid = ? AND ctbv_status = "1"`,
            countRes            = await commonModelObj.commonSqlQuery( countSql, [data.contestUuid ] );

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

                data.ViewerData = countRes;
            }

        returnObj = helper.emitDataObj('WINNER-USER', data, data.contestUuid , true);

    } else {
        console.log('else part 567890-');
    }
    // console.log('We are hear ===================>>>>>>>liveRoomStartLeave returnObj',returnObj);
    return returnObj;
}



/**
 * 
 * @param: 
 * @returns:
 * @developer : 
 */
liveObj.liveSendRequest = async function(socket, data) {

    let returnObj = helper.emitDataObj('ERROR');
    console.log('liveSendRequest start --------',data)
    if ( data && data.contestUuid ) {

    console.log('liveSendRequest -0987654367890-',data)

    let requestUser = await liveModel.liveSendRequest(data);

    console.log('liveSendRequest -11111111111111111111-',requestUser);
    if( requestUser && requestUser != ''){
        
        data.broadcasterImage = requestUser.broadcasterImage
        data.broadcasterUuid  = requestUser.broadcasterUuid
        data.broadcasterName  = requestUser.broadcasterName
        data.otherUserUuid    = requestUser.otherUserUuid

    }

        console.log("saveChatsaveChatsaveChatsaveChatsaveChatsaveChat",data)
    returnObj = helper.emitDataObj('SEND-REQUEST', data, data.contestUuid , true);



    } else {
        //console.log('else part 567890-')
    }

    return returnObj;
}


/**
 * 
 * @param: 
 * @returns:
 * @developer : 
 */
liveObj.liveCancelRequest = async function(socket, data) {

    let returnObj = helper.emitDataObj('ERROR');
    console.log('liveCancelRequest start --------',data)
    if ( data && data.contestUuid ) {

    console.log('liveCancelRequest -0987654367890-',data)

    let requestUser = await liveModel.liveCancelRequest(data);

    console.log('liveCancelRequest -11111111111111111111-',requestUser);
    if( requestUser && requestUser != ''){
        
        data.broadcasterImage = requestUser.broadcasterImage
        data.broadcasterUuid  = requestUser.broadcasterUuid
        data.broadcasterName  = requestUser.broadcasterName
        data.otherUserUuid    = requestUser.userUuid

    }

        console.log("liveCancelRequest liveCancelRequest liveCancelRequest",data)
    returnObj = helper.emitDataObj('REQUEST-CANCEL', data, data.contestUuid , true);



    } else {
        //console.log('else part 567890-')
    }

    return returnObj;
}



/**
 * 
 * @param: 
 * @returns:
 * @developer : 
 */
liveObj.liveAudioVideoRequest = async function(socket, data) {

    let returnObj = helper.emitDataObj('ERROR');
    console.log('liveAudioVideoRequest start --------',data)
    if ( data && data.contestUuid ) {

    // console.log('liveAudioVideoRequest -0987654367890-',data)

    // let requestUser = await liveModel.liveAudioVideoRequest(data);

    // console.log('liveAudioVideoRequest -11111111111111111111-',requestUser);
    // if( requestUser && requestUser != ''){
        
    //     data.broadcasterImage = requestUser.broadcasterImage
    //     data.broadcasterUuid  = requestUser.broadcasterUuid
    //     data.broadcasterName  = requestUser.broadcasterName
    //     data.otherUserUuid    = requestUser.userUuid

    // }

        console.log("liveAudioVideoRequest liveAudioVideoRequest liveAudioVideoRequest",data)
    returnObj = helper.emitDataObj('REQUEST-AUDIO-VIDEO', data, data.contestUuid , true);



    } else {
        //console.log('else part 567890-')
    }

    return returnObj;
}


/**
 * 
 * @param: 
 * @returns:
 * @developer : 
 */
liveObj.liveJoinRequest = async function(socket, data) {

    let returnObj = helper.emitDataObj('ERROR');
    conObj        = await constant.getConstant();
    console.log('liveJoinRequest start --------',data)
    if ( data && data.contestUuid ) {

    console.log('liveJoinRequest -0987654367890-',data)

    let requestUser = await liveModel.liveJoinRequest(data);

    console.log('liveJoinRequest -11111111111111111111-',requestUser);
    if( requestUser && requestUser != ''){
        
        data.broadcasterImage = requestUser.broadcasterImage
        data.broadcasterUuid  = requestUser.broadcasterUuid
        data.broadcasterName  = requestUser.broadcasterName
        data.otherUserUuid    = requestUser.otherUserUuid

        let joinedUserSql = 'SELECT ctbv_fk_u_uuid , u_name , u_image FROM contest_broadcast_viewers LEFT JOIN  user ON user.u_uuid = ctbv_fk_u_uuid  WHERE ctbv_fk_ct_uuid = ?   AND ctbv_request_live = "A"'
        let joinedUserData    = await commonModelObj.commonSqlQuery( joinedUserSql, [ data.contestUuid ],true );
    console.log('dasdasdasdasdasdadasdaadasaa===========================>>>>>>>>>>>',joinedUserData);
        data.joinedUserData   = [];
        
        if( joinedUserData &&  joinedUserData.length > 0 ){


            for( let resOne of joinedUserData ){

                if( resOne.u_image ){

                                
                    resOne.u_image  = conObj.AWS_CLOUDFRONT_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH + resOne.u_image;
                }     
            }

            joinedUserData.unshift({u_name : requestUser.broadcasterName, u_image : requestUser.broadcasterImage });


            data.joinedUserData   = joinedUserData;

        }
    }

        console.log("saveChatsaveChatsaveChatsaveChatsaveChatsaveChat",data)
    returnObj = helper.emitDataObj('REQUEST-JOIN', data, data.contestUuid , true);



    } else {
        //console.log('else part 567890-')
    }

    return returnObj;
}




module.exports = liveObj;