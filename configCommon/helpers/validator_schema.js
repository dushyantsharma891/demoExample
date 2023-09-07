	

// load Joi module
const Joi = require('joi');

// accepts name only as letters and converts to uppercase
const name = Joi.string().regex(/^[A-Z]+$/).uppercase();

// accepts a valid UUID v4 string as id
const personID = Joi.string().guid({version: 'uuidv4'});

// accepts ages greater than 6
// value could be in one of these forms: 15, '15', '15y', '15yr', '15yrs'
// all string ages will be replaced to strip off non-digits
const ageSchema = Joi.alternatives().try([
    Joi.number().integer().greater(6).required(),
    Joi.string().replace(/^([7-9]|[1-9]\d+)(y|yr|yrs)?$/i, '$1').required()
]);

const personDataSchema = Joi.object().keys({
    id: personID.required(),
    firstname: name,
    lastname: name,
    fullname: Joi.string().regex(/^[A-Z]+ [A-Z]+$/i).uppercase(),
    type: Joi.string().valid('STUDENT', 'TEACHER').uppercase().required(),
    sex: Joi.string().valid(['M', 'F', 'MALE', 'FEMALE']).uppercase().required(),

    // if type is STUDENT, then age is required
    age: Joi.when('type', {
        is: 'STUDENT',
        then: ageSchema.required(),
        otherwise: ageSchema
    })
})

// must have only one between firstname and lastname
.xor('firstname', 'fullname')

// firstname and lastname must always appear together
.and('firstname', 'lastname')

// firstname and lastname cannot appear together with fullname
.without('fullname', ['firstname', 'lastname']);

// password and confirmPassword must contain the same value
const authDataSchema = Joi.object({
    teacherId: personID.required(),
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(7).required().strict(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().strict()
});

// cardNumber must be a valid Luhn number
const feesDataSchema = Joi.object({
    studentId: personID.required(),
    amount: Joi.number().positive().greater(1).precision(2).required(),
    cardNumber: Joi.string().creditCard().required(),
    completedAt: Joi.date().timestamp().required()
});



// login validation
let login = Joi.object({
    email           : Joi.string().email().min(3).max(99),
    password        : Joi.string().regex(/^\S*$/).min(8).max(20).strict(),
    device_token    : Joi.string().min(10).max(500).optional(),
    device_id       : Joi.string().min(10).max(256).optional(),
    device_platform : Joi.string().min(3).max(80).optional(),
    voipToken       : Joi.string(),
    bundleId        : Joi.any(),
});

// signUp validation
let signUp = Joi.object({
    email       : Joi.string().email().min(3).max(99),
    password    : Joi.string().regex(/^\S*$/).min(8).max(20).strict(),
    name        : Joi.string().regex(/^[a-zA-Z ]*$/).min(3).max(30),
    mobile      : Joi.any(),
    appType     : Joi.any(),
    
});

// forgotPassword validation
let forgotPassword = Joi.object ({
    email       : Joi.string().email().min(3).max(99)
});

//activateAccount validation
let activateAccount = Joi.object ({
    email       : Joi.string().email().min(3).max(99),
    token       : Joi.string().regex(/^[0-9]+$/).min(4).max(4),
    device_token    : Joi.string().min(10).max(500).optional(),
    device_id       : Joi.string().min(10).max(256).optional(),
    device_platform : Joi.string().min(3).max(80).optional(),
    voipToken       : Joi.string(),
});

// resendPassword validation
// let resendPassword = Joi.object ({
//     email       : Joi.string().email().min(3).max(99),
//     code        : Joi.string().min(4).max(4),
//     password    : Joi.string().regex(/^\S*$/).min(8).max(20),

// });

//resendActivationCode validation
let resendActivationCode = Joi.object ({
    email       : Joi.string().email().min(3).max(99),

});

// signinWithFacebook validation 
let signinWithFacebook = Joi.object ({
    email       : Joi.string().email().min(3).max(99),
    //name        : Joi.string().regex(/^[a-zA-Z ]*$/).min(3).max(30),
    name        :  Joi.string(),
    //image_url   : Joi.string(),
    device_token    : Joi.string().min(10).max(500).optional(),
    device_id       : Joi.string().min(10).max(256).optional(),
    device_platform : Joi.string().min(3).max(80).optional(),
});

// changePassword validation
let changePassword = Joi.object ({
    oldPassword : Joi.string().regex(/^\S*$/).min(8).max(20).strict(),
    newPassword : Joi.string().regex(/^\S*$/).min(8).max(20).strict(),
});

// updateBio validation
let updateBio = Joi.object ({
    currentEmp  : Joi.string().regex(/^[a-zA-Z ]*$/).min(3).max(200),
    previousEmp : Joi.string().regex(/^[a-zA-Z ]*$/).min(3).max(200),
    education   : Joi.string().min(3).max(200),
    about       : Joi.string().min(3).max(200),
});

// updatePrice validation 
// let updatePrice = Joi.object ({
//     groupPrice      : Joi.string().regex(/^[+-]?([0-9]*[.])?[0-9]+$/),
//     individualPrice : Joi.string().regex(/^[+-]?([0-9]*[.])?[0-9]+$/),
// });

// profileAccount validation
// let profileAccount = Joi.object ({
//     name        : Joi.string().regex(/^[a-zA-Z ]*$/).min(3).max(30),
//     phone       : Joi.string().regex(/^[0-9]+$/).min(8).max(15),
//     gender      : Joi.string().regex(/^(?:M|F)$/),
//     isImage     : Joi.string().regex(/^(?:0|1)$/),
//     fullAddress : Joi.string().min(3).max(50),
//     latitude    : Joi.string().max(50),
//     longitude   : Joi.string().max(50),
//     designation : Joi.string().regex(/^[a-zA-Z ]*$/).min(3).max(50),
//     department  : Joi.string().regex(/^[a-zA-Z ]*$/).min(3).max(50),
// });

//bookMeeting validation 
// let bookMeeting = Joi.object ({
//     subject     : Joi.string(),//.regex(/^[a-zA-Z ]*$/).min(3).max(300),
//     goal        : Joi.string(),//.regex(/^[a-zA-Z ]*$/).min(3).max(300),
//     date        : Joi.string(),//.regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
//     startTime   : Joi.string(),//.regex(/^([0-1]?[0-9]|[2][0-3]):([0-5][0-9]):([0-5][0-9])?$/),
//     endTime     : Joi.string(),//.regex(/^([0-1]?[0-9]|[2][0-3]):([0-5][0-9]):([0-5][0-9])?$/),
//     topicId     : Joi.string(),//.min(15).max(50),
//     mode        : Joi.string(),//.regex(/^(?:I|O)$/),
//     location    : Joi.string(),//.min(3).max(50),
//     memberUserId: Joi.string(),//.min(15).max(50),
//     question    : Joi.string(),//.min(3).max(300),
//     currencyId  : Joi.string(),//.min(10).max(50),
// });

// groupMeeting validation
// let groupMeeting = Joi.object ({
//     subject     : Joi.string().regex(/^[a-zA-Z ]*$/).min(3).max(300),
//     goal        : Joi.string().regex(/^[a-zA-Z ]*$/).min(3).max(300),
//     date        : Joi.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
//     startTime   : Joi.string().regex(/^([0-1]?[0-9]|[2][0-3]):([0-5][0-9]):([0-5][0-9])?$/),
//     endTime     : Joi.string().regex(/^([0-1]?[0-9]|[2][0-3]):([0-5][0-9]):([0-5][0-9])?$/),
//     topicId     : Joi.string().min(15).max(50),
//     mode        : Joi.string().regex(/^(?:I|O)$/),
//     location    : Joi.string().min(3).max(50),
//     question    : Joi.string().min(3).max(300),
//     currencyId  : Joi.string().min(10).max(50),
//     seat        : Joi.string().regex(/^[0-9]+$/).min(1).max(100),
//     perSeatPrice: Joi.string().regex(/^[+-]?([0-9]*[.])?[0-9]+$/),
// });

//updateMeetingTiming validation
// let updateMeetingTiming = Joi.object ({
//     date        : Joi.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
//     startTime   : Joi.string().regex(/^([0-1]?[0-9]|[2][0-3]):([0-5][0-9]):([0-5][0-9])?$/),
//     endTime     : Joi.string().regex(/^([0-1]?[0-9]|[2][0-3]):([0-5][0-9]):([0-5][0-9])?$/),
//     meetingId   : Joi.string().min(15).max(50),
//     currencyId  : Joi.string().min(5).max(50)
// });

//dateMeeting validation 
let dateMeeting = Joi.object ({
    date        : Joi.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
});

//askQuestion validation
// let askQuestion = Joi.object ({
//     topicId     : Joi.string().min(15).max(50),
//     question    : Joi.string().min(3).max(300),
//     expertUserId: Joi.string().min(15).max(50),
//     questionId  : Joi.string().min(15).max(50)
// })
//registration 
let registration =Joi.object ({
    meetingId   : Joi.string().min(15).max(50),
    currencyId  : Joi.string().min(5).max(50),
})

// export the schemas
module.exports = {
    '/login'                                    : login,
    '/signup'                                   : signUp,
    '/forgot-password'                          : forgotPassword,
    '/activate-account'                         : activateAccount,
    //'/reset-password'                           : resendPassword,
    '/resend-activation-code'                   : resendActivationCode,
    '/signin-with-facebook'                     : signinWithFacebook,

    '/private/user/change-password'             : changePassword,
    '/private/user/update-bio'                  : updateBio,
    //'/private/user/price'                       : updatePrice,
    //'/private/user/profile-account'             : profileAccount,
    //'/private/meeting/book'                     : bookMeeting,
    //'/private/meeting/group'                    : groupMeeting,
    //'/private/meeting/update-meeting-timing'    : updateMeetingTiming,
    '/private/meeting/date-meeting'             : dateMeeting,   
    //'/private/topic/ask-question'               : askQuestion,
    '/private/meeting/registration'             : registration,


    '/login1': personDataSchema,
    '/auth/edit': authDataSchema,
    '/fees/pay': feesDataSchema
};