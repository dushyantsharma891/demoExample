const q         = require('q'),
    jwt         = require('jsonwebtoken'),
    // dateFormat  = require('dateformat'),
    spacetime   = require('spacetime'),
    agora       = require("agora-access-token"),

    pool 	    = require('../config/pool'),
    config      = require('../config').init(),
    monthNames  = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];

let helper          = {};

/**
 * 
 * @param: 
 * @returns:
 * @developer :  Vipin
 */
helper.successHandler = function ( res, options ) {
    
    status = '';

    if ( options.status == false ) {
        status = options.status;
    } else {
        status = true;
    }
    
    let obj = {
        status 	: status,
        code 	: (options && options.code) || "",
        message : (options && options.message) || 'Operation performed successfully.',
        payload :  (options && options.payload) || {}
    }

    res.send(obj);

}

/**
 * This helper is using to return date into a format
 * @param     : 
 * @returns   :
 * @developer :  Vipin
 */
helper.errorHandler = function ( res, options, httpStatuCode = 501 ) {
    status = '';

    if ( options.status == '' ) {
        status = options.status;
    } else {
        status = true;
    }

    let obj = {
        status 	:  status || false,
        code 	:  (options && options.code) || "",
        message :  (options && options.message) || 'Something went wrong',
        payload :  (options && options.payload) || []
    }
    res.status(httpStatuCode).json(obj);

}

/**
 * This helper is using to get login user details
 * @param     : 
 * @returns   :
 * @developer :  Diksha
 */
helper.getUidByToken = function( req ){
    let token       = '', 
        returnOb    = {};
    if ( req && req.cookies && req.cookies.token && req.cookies.token != '' ) {
        token = req.cookies.token;
    } 

    if ( token && token != '' ) {

        let decoded = jwt.verify(token, "@&*(29783-d4343daf4dd*&@&^#^&@#");

        if ( decoded && decoded.userId ) {
            returnOb.userId  = decoded.userId;
            returnOb.email   = decoded.email;
        }

    }

    return returnOb;

}

/**
 * This helper is using to return date into a format
 * @param     : Date
 * @returns   : Date 
 * @developer : Diksha
 */
helper.dateFormat = function ( date,type = '' ) {

    if ( date != '' ) {

        let newdate = new Date(date),
            year    = newdate.getFullYear(),
            month   = newdate.getMonth(),
            dt      = newdate.getDate(),
            hours   = newdate.getHours(),
            minutes = newdate.getMinutes(),
            ampm    = hours >= 12 ? 'pm' : 'am';

        if ( dt < 10 ) {
          dt = '0' + dt;
        }

        month    = monthNames[month];
        hours    = hours % 12;
        hours    = hours ? hours : 12; // the hour '0' should be '12'
        minutes  = minutes < 10 ? '0'+minutes : minutes;

       let strTime = hours + ':' + minutes +  ampm;

        if ( type != '' ) {
            returnDate = dt +' ' + month + ',' +' '+ year;
        } else {
            returnDate = month +' ' + dt + ',' + year + ',' + strTime;
        }

        return returnDate;

    } 

}

/**
 * This helper is using to return date into a format
 * @param     : Date
 * @returns   : Date 
 * @developer : Diksha
 */
helper.changeTime = function ( time ) {

    if ( time != '' ) {
        time = time.toString ().match (/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];

        if ( time.length > 1 ) { 
            time = time.slice (1);  
            time[5] = +time[0] < 12 ? ' AM ' : ' PM '; 
            time[0] = +time[0] % 12 || 12; 
        }

        return time.join ('');
    } 

}
/**
* This helper is using to get Data or count 
* @param     : 
* @returns   : object or number
* @developer : 
*/
helper.getDataOrCount = async function ( sql = '' , data = '' , need = 'D' , consoleData = false) {
    let deferred = q.defer();

    if ( sql != '' ) {

        let hSqul = pool.query(sql, data , function ( error, result ) {

            if ( consoleData ) {
                console.log(hSqul.sql);
            }

            if ( error ) {
                deferred.resolve(false);
            } else {

                if ( result ) {

                    if ( need != '') {

                        if ( need == 'L' && result.length > 0) {
                            deferred.resolve(result.length);
                        } else if ( need == 'D' && result.length > 0) {
                            deferred.resolve(result);
                        } else if ( need == 'U' ) {
                            deferred.resolve(result);
                        } else {
                            deferred.resolve(false);
                        }

                    } else {
                        deferred.resolve(false);
                    }

                } else {
                    deferred.resolve(false);
                }

            }

        });

    }

    return deferred.promise;
    
}
/**
* This helper is using to get Data or count 
* @param     : 
* @returns   : object or number
* @developer : 
*/
helper.sqlUpdate = function(table, data) {
        
    let ret = {
        sql : '',
        val : []
    }
    if ( table && data ) {

        ret.sql = 'UPDATE ' + table + ' SET '; 

        _.each(data, function (v, k) {

            if ( k ) {

                if ( ret.val.length > 0 ) {
                    ret.sql += ', ';
                }
                ret.sql+= k + ' = ? ';
                ret.val.push(v);

            }

        });

    }

    return ret;

}

/**
* This helper is using to get Data or count 
* @param     : 
* @returns   : object or number
* @developer : 
*/
helper.pstTime = function( timeFormate = 'AM/PM') {
    

    let d      = spacetime.now('America/Los_Angeles'),
        dDate  = d.unixFmt('MM/dd/yyyy'),
        dTime  = d.unixFmt('hh:mm:ss a');
    if (timeFormate == '24') {
        let time        = d.format('time');
        let amPmTime    = d.unixFmt('hh:mm:ss');
        let getSec      = amPmTime.split(":");
        let sec         = getSec[2];
        let currentTime = helper.changePstTime(time);
        dTime           = helper.getTimeSimpleFormat(currentTime , sec);
    }
    let ret    = {
            date : dDate,
            time : dTime
        };

    return ret;
}



/**
 * This helper is used to return common error object.
 * @developer : Anil Guleria
 * @modified  : 
 */
helper.errorListener = function() {
    
    let returnObj = {
        emit: {
            action : 'ERROR',
            data   : {
                message: 'Something went wrong!'
            }
        }
    };
    return returnObj;
}


/**
 * This helper is used to return common error object.
 * @developer : Anil Guleria
 * @modified  : 
 */
helper.commonListener = function(socket) {
    
    let socketCommon = socket.emit('call', {
        action  : 'INFO',
        data    : {
            message: 'Something went wrong!'
        }
    });
    return socketCommon;
}

/**
 * Common function to insert data into the database.
 * @developer : Anil Guleria
 * @modified  : 
 */
helper.insert = async function(tablename, data) {

    let deferred = q.defer();
    
    if ( tablename != '' && typeof( data ) == 'object' ) {
       
        let i   = 0;
            len = Object.keys( data ).length,
            col = fakeval = '',
            val = [];
        
        _.each(data, function (v, k) {

            let comma = ',';
            if ( i == len-1 ) {
                comma = '';
            }
            col += k+comma;
            val.push(v);
            fakeval+= '?'+comma;
            i++;

        });
        
        let sql = 'INSERT INTO '+ tablename +'('+ col +') VALUES('+ fakeval +')';
        
        var dd = pool.query(sql, val, function (error, results, fields) {
            console.log(dd.sql);

            if ( error ) {
                deferred.resolve(error);
            } else {

                if ( results && results.insertId > 0 ) {
                    deferred.resolve(results.insertId);
                } else {
                    deferred.resolve(false);
                }

            }

        });

    }

    return deferred.promise;

}

/**
 * 
 * @param     : 
 * @returns   :
 * @developer :  Rahul
 */
 helper.isAuthentication = function( socket = {} , data = {}){
    let returnOb = {},
        token    = ''; 
    if ( socket && socket.handshake && socket.handshake.query && socket.handshake.query.token ) {
        console.log('HI i am in ifff');
        token = socket.handshake.query.token;
    } else if ( data && data.token ) {
        console.log("hi i am in else if");
        token = data.token;
    } else {
        console.log(' hi i am in else qwaed123456i7897645324768');
    }

// console.log(jwt,"jwrtttttttt---------------------------------------------------------")
    if ( token && token != 'null' && token != null ) {

        let decoded = jwt.verify(token, config.secret);

        if ( decoded && ( decoded.userId || decoded.orgId ) ) {

            console.log('decoded=====------------------------------------------------------------------------------------------------->',decoded)
            
            if ( decoded.userId ) {
                decoded.u_uuid =  decoded.userId;
                decoded.userId = decoded.userId;
            }  
            
            if ( decoded.orgId ) {
                decoded.userId = decoded.orgId;
            }

            if ( socket.handshake.query && socket.handshake.query.fcmToken && socket.handshake.query.devicePlatform &&   socket.handshake.query.deviceId) {

                decoded.fcmToken   = socket.handshake.query.fcmToken;
                decoded.bundleId   = socket.handshake.query.bundleId;
                decoded.deviceId   = socket.handshake.query.deviceId;
                decoded.devicePlatform = socket.handshake.query.devicePlatform;

            } else if ( data.fcmToken && data.devicePlatform && data.deviceId ) {

                decoded.fcmToken   = data.fcmToken;
                decoded.bundleId   = data.bundleId;
                decoded.deviceId   = data.deviceId;
                decoded.devicePlatform = data.devicePlatform;

            }

            returnOb = decoded;

        }

    } else{
        console.log('not founfd data ')
    }

    return returnOb;

}

/**
 * 
 * @param     : 
 * @returns   :
 * @developer :  
 */
helper.logs = async function(data , socket = io )  {
    socket.emit('logs' , data );
}
/**
 * 
 * @param     : 
 * @returns   :
 * @developer :  
 */
helper.emitDataObj = async function(action = '', data = '' , to = [] , own = false , ownData = '' ,ownAction = false)  {
    console.log('emitDataObjemitDataObj', data)
    let obj = {
        emit : {
            action : 'ERROR',
            data : {
                message: 'Something went wrong!'
            },
        },
        to : to,
        own : own,
        ownData : ownData,
        ownAction : ownAction

    }

    if ( action != '') {
        obj.emit.action = action;
    }

    if ( data != '' ) {
        obj.emit.data = data;
    }

    return obj;

}

/**
 * This helper is using to get difference between two time
 * @param     : startTime,endTime
 * @returns   : mintues
 * @developer : 
 */
helper.timeDifference = async function( startTime , endTime ) {
    
    let minutes = '';

    if ( startTime != '' && endTime != '' ) {

        let startDate   = new Date("January 1, 1970 " + startTime),
            endDate     = new Date("January 1, 1970 " + endTime),
            timeDiff    = Math.abs(startDate - endDate);
        
        minutes         = Math.round((timeDiff/1000)/60);

    }

    return minutes;

}
/**
 * This helper is using to get difference between two time
 * @param     : startTime,endTime
 * @returns   : mintues
 * @developer : 
 */
helper.getHoursOfTwoDates = function(startDate, startTime, endDate, endTime ) {

    let newStartDate   = new Date(startDate+' '+startTime),
        newEndDate     = new Date(endDate+' '+endTime),
        timeDiff       = Math.abs(newStartDate - newEndDate),
        seconds     = Math.floor((timeDiff % (1000 * 60)) / 1000),
        mins        = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60)),
        hrs         = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        days        = Math.floor(hrs / 24),
        yrs         = Math.floor(days / 365),
        totalMins   = Math.floor(timeDiff / 60000),
        totalSec    = Math.floor(timeDiff / 1000);
        obj         = {
            secs : seconds,
            mins : mins,
            hrs  : hrs,
            days : days,
            yrs  : yrs,
            totalMins : totalMins,
            totalSec  : totalSec
        };
        console.log("startDate====" , startDate);
        console.log("startTime====" , startTime);
        console.log("endDate====" , endDate);
        console.log("endTime====" , endTime);
        console.log("newStartDate====" , newStartDate);
        console.log("newEndDate======" , newEndDate);
        console.log('======' , timeDiff);
    return obj;
    
}

/**
 * This helper is using to change pst time in AM PM
 * @developer   :
 * @modified    :
 */
helper.changePstTime = function ( time ) {
    let res  = time.charAt(time.length-2);

    if ( res == 'a' ) {
        str  = time.replace('am',' AM')
    } else {
        str  = time.replace('pm',' PM')
    }

    return str;

}
/**
 * This helper is using to change pst time in AM PM
 * @developer   :
 * @modified    :
 */
helper.getTimeSimpleFormat = function( time , sec = '') {
    let date     = new Date("2000-01-01 " + time),
        hours    = date.getHours(),
        minutes  = date.getMinutes(),
        second   = date.getSeconds();
        if (sec != '') {
            second = sec;
        }
        hours    = hours < 10 ? '0'+hours : hours;
        minutes  = minutes < 10 ? '0'+minutes : minutes;
        second   = second < 10 ? '0'+second : second;
        strTime  = hours + ':' + minutes + ':' + second;

    return strTime;

}
/**
 * This helper is used to show count above 1000 to 1K and so on.
 * @developer   :
 * @modified    :
 */
helper.countFormat = function( value ) {
    let  newValue = value;
 
     if ( value >= 1000 ) {
 
        let suffixes   = ["", "K", "M", "B","T"],
            suffixNum  = Math.floor( ( "" + value).length/3 ),
            shortValue = '';
 
        for ( let precision = 2; precision >= 1; precision-- ) {
 
            shortValue = parseFloat( (suffixNum != 0 ? (value / Math.pow(1000,suffixNum) ) : value).toPrecision(precision));
            let  dotLessShortValue = (shortValue + '').replace(/[^a-zA-Z 0-9]+/g,'');

            if ( dotLessShortValue.length <= 2 ) { 
                break; 
            }
 
        }
        if ( shortValue % 1 != 0 ) {
 
            shortValue = shortValue.toFixed(1);
 
        } 
 
        newValue = shortValue+suffixes[suffixNum];
 
    }
 
    return newValue;

}

// /**
//  * This function is used to get pst date time
//  * @param       : 
//  * @returns     :
//  * @developer   :
//  */
// helper.getPstDateTime = async function(type) {
    
//     let d               = spacetime.now('America/Los_Angeles'),
//         dDate           = d.unixFmt('MM/dd/yyyy'),
//         time            = d.format('time'),
//         currentTime     = helper.changePstTime(time),
//         dDateNewFormate = d.unixFmt('yyyy-MM-dd'),
//         transTime       = helper.getTimeSimpleFormat(currentTime),
//         currentDateTime = dDate + ' ' + transTime;
//     if ( type == 'timeDate' ) {
//         return currentDateTime;
//     } else if ( type == 'time' ) {
//         return transTime;
//     } else if (type == 'both'){
//         let obj = { 
//             date : dDate,
//             time : helper.formatTime(transTime , 'a'),
//             time24 : transTime,
//             dDateNewFormate : dDateNewFormate
//         }
//         return obj;
//     } else {
//         return dDate;
//     }

// }

/**
* This function is used to get pst date time
* @param       : 
* @returns     :
* @developer   : Anil Guleria
*/
helper.getPstDateTime = async (type) => {
 
let d               = spacetime.now('America/Los_Angeles'),
    dDate           = d.unixFmt('yyyy-MM-dd'),
    time            = d.format('time'),
    currentTime     = helper.changePstTime(time),
    transTime       = helper.getTimeSimpleFormat(currentTime),
    currentDateTime = dDate + ' ' + transTime;

    if ( type == 'timeDate' ) {
        return currentDateTime;
    } else if ( type == 'time' ) {
        return transTime;
    } else if ( type == 'dateTimeSec') {

        let amPmTime    = d.unixFmt('hh:mm:ss'),
            getSec      = amPmTime.split(":"),
            sec         = getSec[2],
            newTime     =  helper.setCharAt(transTime,6,sec);

        newTime     = newTime.substring(0, newTime.length - 1);
        return dDate + ' ' + newTime;

    } else {
        return dDate;
    }
}
/**
 * This helper is using to get time in different format
 * @developer   :
 * @modified    :
 */
helper.formatTime = function(date,type) {

    let vr      = new Date ("2014-04-25 "+date+"");
    var hours   = vr.getHours();
    var minutes = vr.getMinutes();
    var sec     = vr.getSeconds();
    
    var ampm    = hours >= 12 ? 'PM' : 'AM';
        hours   = hours % 12;
        hours   = hours ? hours : 12; 
        hours = hours < 10 ? '0'+hours : hours;
        strTime = '',
        minutes = minutes < 10 ? '0'+minutes : minutes;
        sec     = sec < 10 ? '0'+sec : sec;
    if ( type && type != '' ) {
        strTime = hours + ':' + minutes+ ':' + sec + ' ' + ampm;
    } else {
        strTime = hours + ':' + minutes + ' ' + ampm;
    }
    return strTime;

}

/**
 * This helper is using to get ago time 
 * @developer   :
 * @modified    :
 */
helper.agoTime = function ( date ) {

    let minute          = 60,
        hour            = minute * 60,
        day             = hour   * 24,
        month           = day    * 30,
        year            = day    * 365;
        suffix          = ' ago';
        d               = spacetime.now('America/Los_Angeles'),
        dDate           = d.unixFmt('yyyy-MM-dd'),
        time            = d.format('time'),
        currentTime     = helper.changePstTime(time),
        transTime       = helper.getTimeSimpleFormat(currentTime),
        currentDateTime = dDate + ' ' + transTime, 
        convert         = Date.parse(date),
        pstTime         = Date.parse(currentDateTime),
        elapsed         = Math.floor((pstTime - convert) / 1000);

    if ( elapsed < minute ) {
        return 'Just now';
    }

    // get an array in the form of [number, string]
    let a = elapsed < hour  && [Math.floor(elapsed / minute), 'min'] ||
            elapsed < day   && [Math.floor(elapsed / hour), 'hr']     ||
            elapsed < month && [Math.floor(elapsed / day), 'day']       ||
            elapsed < year  && [Math.floor(elapsed / month), 'month']   ||
            [Math.floor(elapsed / year), 'year'];

    // pluralise and append suffix
    if ( a[1] == 'day' && a[0] >= 7 ) {

        if ( a[0] == 7 ) {
            a[1] = 'week';
            a[0] = 1;

        }
        if ( a[0] == 14 ) {
            a[1] = 'week';
            a[0] = 2;

        }
        if ( a[0] == 21 ) {
            a[1] = 'week';
            a[0] = 3;

        }
        if ( a[0] == 28 ) {
            a[1] = 'week';
            a[0] = 4;

        }

    }
    
    return a[0] + ' ' + a[1] + (a[0] === 1 ? '' : 's') + suffix;
}
/**
 * get simple format date
 jatinder singh
 */
helper.simpleDateFormat = async function ( date ) {

    let deferred = q.defer();

    /* if ( date ) {

        let d                = new Date(date);
        let simpleDateFormat = dateFormat(d,'yyyy-mm-dd');
        
        deferred.resolve(simpleDateFormat);

    } else {
        deferred.resolve(false);
    } */

    deferred.resolve(false);

    return deferred.promise;

}
/**
 * This helper is using to add mints in time
 * @developer   :
 * @modified    :
 */
helper.addMintsInTime = function( date,time,mints ) {
    let d        = new Date(date+" " + time);
        mints    = d.setMinutes(d.getMinutes() + mints);
        hours    = d.getHours(),
        minutes  = d.getMinutes(),
        second   = d.getSeconds();
        hours    = hours < 10 ? '0'+hours : hours;
        minutes  = minutes < 10 ? '0'+minutes : minutes;
        second   = second < 10 ? '0'+second : second;
        strTime  = hours + ':' + minutes + ':' + second;
    return strTime;

}
/**
 * This function is using to concatinate time and date and convert into parse value
 * @developer   :
 * @modified    :
 */
helper.conTimeDate = function( d,time ) { 

    let date      = d +" "+time,
        convert   = Date.parse(date);
    return convert;

}
/**
 * This helper is using to get next date
 * @developer   :
 * @modified    :
 */
helper.getNextDayDate = function( date ) {

    let day     = new Date(date),
        nextDay = new Date(day);
    nextDay.setDate(day.getDate() + 1);
    return nextDay;

}

/**
 * This helper is using to get price in a format
 * @developer   :Diksha
 * @modified    :
 */
helper.priceFormat = function( price ) {

    let newPrice = "";

    if ( price && price < 10 ) {

        newPrice = parseFloat(price).toFixed(2);

    }

    if ( price && price >= 10 ) {

        newPrice   = parseFloat(price).toFixed(2)- 0;

        let value  = helper.countDecimals(newPrice);

        if ( value == 1 ) {
            newPrice = parseFloat(price).toFixed(2);
        }

    }

    return newPrice;

}
/**
 * This helper is using to count value after decimal
 * @developer   : diksha
 * @modified    :
 */
helper.countDecimals = function ( value ) {

    if ( Math.floor(value) === value ) {
        return 0;
    } else {
        return value.toString().split(".")[1].length || 0; 
    }

}

/**
 * This function is using to change string first letter in capital letter
 * @developer   :
 * @modified    :
 */
helper.capitalizeFirstLetter = function ( text ) {

    if ( text ) {
        text  = text.charAt(0).toUpperCase() + text.slice(1);
    } else {
        return false;
    }
    return text;

}

/**
 * This function is using to change string first letter in capital letter
 * @developer   :
 * @modified    :
 */
helper.agoraToken = function ( data ) {

    if ( data ) {
        const appID = "0fda789a4bad40da8d108fd2ece78a86";
        const appCertificate = "bec9fc66c8394934b6d6be70c30ca2c3";
        const expirationTimeInSeconds = 36000;
        //const uid = Math.floor(Math.random() * 100000);
        const uid = 0;
        //const role = req.body.isPublisher ? agora.RtcRole.PUBLISHER : agora.RtcRole.SUBSCRIBER;
        const role = agora.RtcRole.PUBLISHER ;
        const channel = data.meetingId;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const expirationTimestamp = currentTimestamp + expirationTimeInSeconds;

        const token = agora.RtcTokenBuilder.buildTokenWithUid(appID, appCertificate, channel, uid, role, expirationTimestamp);
        return token;
    } else {
        return null;
    }
    //return text;

}
module.exports = helper;