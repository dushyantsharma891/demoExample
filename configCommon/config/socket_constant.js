	

const  constantObj = {

    LISTENER : {
        MAIN_LISTENER : 'call',
    },
    
    EMIT : {
        MAIN_EMIT : 'call',
        MAIN_EMIT_LIVE : 'live'

    },
   
    
    CALL_TYPES : {
        INCOMING_CALL_INDICATION    : 'INSTANT-CALL',
        END_CALL_INDICATION         : 'END-CALL',
        ACCEPT_CALL_INDICATION      : 'ACCEPT',
        DISCONNECT_CALL_INDICATION  : 'DISCONNECT',
        REJECT_CALL_INDICATION      : 'REJECT'
    },

    ACTION_TYPES : {
        INCOMING_CALL               : 'INCOMING-CALL',
        QUESTIONS_LIST              : 'QUESTIONS-LIST',
        QUESTIONS_ADD_NEW           : '',
        QUESTIONS_MARK_DONE         : '',
        ACCEPT_CALL                 : 'ACCEPT',
        DISCONNECT_CALL             : 'DISCONNECT',
        REJECT_CALL                 : 'REJECT',
        END_CALL                    : 'END',
        CANDIDATE                   : 'CANDIDATE'

    },

    FCM_ACTION : {
        INCOMING_CALL               : 'Incoming Call',

    },
    FCM_MESSAGE : {
        INCOMING_CALL               : 'Hi you have an incoming call.'
    }
};
module.exports = constantObj;