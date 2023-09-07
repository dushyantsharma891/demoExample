	

const common_controller     = require('./app/controllers/configCommon'),
    helper                  = require('../configCommon/helper/');
    // kurentoObj              = require('./kurento');
    // kurentoNewObj           = require('./kurentoOneToManyNew');

let obj = {};
obj.init = function(socket) {
    socket.on('new', function (newData) {
        let userAthuntication = helper.isAuthentication( socket , newData);
        if ( userAthuntication && userAthuntication.u_uuid ) {
            common_controller.newUser(socket , userAthuntication);
        }
    });
    socket.on('disconnect', function () {
        console.log('disconnect redfedcfjvrekjd  dsdw')
        common_controller.updateBothUserOngoingCallStatus(socket);
       
    });
    // kurentoNewObj.init(socket);
}
module.exports = obj;