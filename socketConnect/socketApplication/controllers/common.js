	

const commonObj    = {},
      common_model = require('../models/common_model');


commonObj.newUser = async function(socket , data){
    // console.log('newUser 111111',data)
    if ( data && data.u_uuid && socket.id ) {
        data.socketId = socket.id;
        let result = await common_model.newUser(data);
    } 
}

commonObj.deleteUserSocket =  async function(socketId){
    if ( socketId && socketId != '' ) {
        let sendingObj = {
            socketId : socketId
        }
       await common_model.deleteSocketId(sendingObj);
    }
}
/**
 * 
 * @developer :
 * @modified  :
 */
commonObj.exitFromMetting = async function(socket){
    await common_model.exitFromMetting(socket);
}
/**
 * 
 * @developer :
 * @modified  :
 */
commonObj.updateBothUserOngoingCallStatus = async function(socket){
    console.log('Anhsu salaria  ')
    await common_model.updateBothUserOngoingCallStatus(socket);
}

module.exports = commonObj;