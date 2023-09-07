

const 
    chat_socket         = require('./chat'),
    // live_socket         = require('./live'),
    common_socket       = require('./configCommon'),
    helper              = require('../configCommon/helper/'),
    common_controller   = require('./app/controllers/configCommon'),
    socket_constant     = require('../configCommon/config/socket_constant'),
    constant_listener   = socket_constant.LISTENER,
    constant_emit       = socket_constant.EMIT,
    socketHandlerObj    = {};

socketHandlerObj.onSocketConnect = function(socket){

    socket.on(constant_listener.MAIN_LISTENER, async function (dataObj) {
        //helper.logs({'ON CALL LISTENER======' : dataObj});
        //if ( dataObj && dataObj.type.meeting && dataObj.type.meeting != "CANDIDATE") {
            console.log('ON LISTENER======' , dataObj);
        //}
        if ( dataObj && dataObj.data ) {

            let userAthuntication = helper.isAuthentication( socket , dataObj);
            
            if ( userAthuntication && userAthuntication.userId && userAthuntication.u_uuid ) {

                console.log('We are hear ===================>>>>>>>');
                if ( dataObj.data ) {
                   dataObj.data.userId     = userAthuntication.userId;
                   dataObj.data.userUuid   = userAthuntication.u_uuid;
                   dataObj.data.mySocketId = socket.id;
                }
                if ( dataObj.type ) {
                    let type = dataObj.type;

                    if ( type.chat ) {
                        console.log('We are hear ===================>>>>>>>,type.chat',type.chat);
                        chat_socket.init(socket , dataObj);
                    }
                   
                }
            } else {
                socket.emit(constant_emit.MAIN_EMIT,{
                    action : 'INFO',
                    data : {
                        message: 'Authentication failed!'
                    }
                })
            }
        } else {
            console.log('ON error part======' );
            socket.emit(constant_emit.MAIN_EMIT,{
                action : 'ERROR',
                data : {
                    message: '2222222222222222222'
                }
            })
        }
    });
    common_socket.init(socket);
}



module.exports.init = function (io) {
    console.log('first------>>>>');
   
    io.on('connection', function (socket) {
        console.log('new Connect ' );
        let userAthuntication = helper.isAuthentication( socket );
        if ( userAthuntication && userAthuntication.u_uuid ) {
            // console.log('new Connect TOKEN---------------------------------------------------- ', userAthuntication);
            common_controller.newUser(socket , userAthuntication);
        }
        socketHandlerObj.onSocketConnect(socket);
	});

	
}
