	
 const _             = require('underscore'),
 q                   = require('q'),
 fs 				 = require('fs'),
 AWS                 = require('aws-sdk'),
 spacetime           = require('spacetime'),
 // dateFormat          = require('dateformat'),
 path				 = require('path'),
 axios               = require("axios"),
 moment              = require('moment-timezone'),
 ffmpeg              = require('fluent-ffmpeg'),
 ThumbnailGenerator  = require('video-thumbnail-generator').default,
 agora               = require("agora-access-token"),
 config	             = require('../config').init(),
 constant            = require('../config/constants'),
 pool 	             = require('../config/pool'),
 _commonModel        = require('../../app/models/configCommon'),
 apn                 = require('apn');
 // import dateFormat, { masks } from "dateformat";
             
let helper              = {};

const monthNames        = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
 "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"
 ],
 fullMonthNames      = ["January", "February", "March", "April", "May", "June",
 "July", "August", "September", "October", "November", "December"
 ];


/**
* This function is using to return UserId
* @param     : Token
* @returns   : 
* @developer :
*/
helper.getUUIDByTocken  =  async (req, uuid = '') => {

    let token           = '', 
        uid             = '';

    if ( req ) {

        if ( req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer' ) {

            token = req.headers.authorization.split(' ')[1];
        } else if (req.query && req.query.token) {

            token = req.query.token;
        } else {

            token = req.body.token || req.query.token || req.headers['x-access-token'];
        }
        
    }

    if ( token && token != '' && token != 'undefined') {

        jwt.verify(token, config.secret, function(err, decoded) {

            if (err) {
                return false
            } else {

                // if( decoded && decoded.orgId && decoded.userId ) {
                if ( decoded && decoded.userId ) {
                    let userUUID = '';
                    if ( decoded.orgId ) {
                        
                        userUUID = decoded.orgId;
                        if ( uuid == 'T' ) {
                            uid = decoded.userId;
                        } else if ( uuid == 'E' ) {
                            uid = decoded.email;
                        } else {
                            uid = decoded.orgId;
                        }
                    } else {
                        
                        if ( uuid == 'E' ) {
                            uid = decoded.email;
                        } else {
                            uid = decoded.userId;
                        }
                    }
                }
            }
        });
    }
    return uid;
}

/**
* This function is using to return UserId by Token 
* @param     : Token
* @returns   : 
* @developer : Anil Guleria 
*/
helper.getUUIDByToken = async (req, uuid = '') => {

    let token       = '', 
        uid         = '';

    if ( req ) {

        if ( req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer' ) {

            token = req.headers.authorization.split(' ')[1];

        } else if ( req.query && req.query.token ) {

            token = req.query.token;

        } else {

            token = req.body.token || req.query.token || req.headers['x-access-token'];

        }

    }

    if ( token && token != '' && token != 'undefined' ) {

        jwt.verify(token, config.secret, function(err, decoded) {

            if ( err ) {
                return false
            } else {

                if ( decoded && decoded.orgId && decoded.userId ) {

                    userUUID = decoded.orgId;

                    if ( uuid == 'T' ) {
                        uid = decoded.userId;
                    } else if ( uuid == 'E' ) {
                        uid = decoded.email;
                    } else {
                        uid = decoded.orgId;
                    }

                }

            }

        });

    }

    if ( uid ) {

        uid = await helper.checkUserAvailability(uid);

        if ( uid && Object.keys(uid).length > 0 ) {

            return false;

        } else {

            if ( uid ) {
                return uid;
            } else {
                return false;
            }

        }

    } else {
        return uid;
    }

}

/**
* 
* @developer   : Anil Guleria
* @modified    :
*/
helper.createRandomName = async () => {

    let result              = '',
        length              = 15,
        characters          = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz01',
        charactersLength    = characters.length;

    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

/**
* 
* @developer   :Anil Guleria
* @modified    :
*/
helper.checkUserAvailability = async (userId) => {
 
 let deferred = q.defer();

    if ( userId ) {

        pool.query('SELECT u_id FROM user WHERE u_active = ? AND u_deleted = ? AND u_id = ?', [ '1', '0',userId ], async (error, results, fields) => {

            if ( error ) {
                deferred.resolve(error);
            } else {

                if ( results && results.length > 0 ) {    
                    deferred.resolve(results[0].u_id);
                } else {
                    deferred.resolve(false);
                }

            }

        });

    } else {
        deferred.resolve(false);
    }

 return deferred.promise;

}

/**
* 
* @developer   :
* @modified    :
*/
helper.sqlUpdate = async (table, data) => {
 
    let ret = {
        sql : '',
        val : []
    };

    if ( table && data ) {

        ret.sql = 'UPDATE ' + table + ' SET '; 

        _.each(data, function (v, k) {

            if ( k ) {

                if ( ret.val.length > 0 ) {
                    ret.sql += ', ';
                }
                ret.sql+= k + '=? ';
                ret.val.push(v);
            }

        });
    }
    return ret;
}

/**
* 
* @param: 
* @returns:
* @developer :  Vipin
*/
helper.successHandler = async (res, options = {}) => {
 
 let status = '';

    if ( options.status == false ) {
        status = options.status;
    } else {
        status = true;
    }
    
    let obj = {
        status 	: status,
        code 	: (options && options.code) || "",
        message : (options && options.message) || 'Operation performed successfully.',
        payload : (options && options.payload) || {}
    };

    res.send(obj);

}

/**
* 
* @param       : 
* @returns     :
* @developer   :  Anil Guleria
*/
helper.errorHandler = async (res, options = {}, httpStatuCode = 501) => {

 let status  = '';

    if ( options.status == '' ) {
        status  = options.status;
    } else {
        status  = true;
    }

    let obj     = {
        status 	:  status || false,
        code 	:  (options && options.code) || "",
        message :  (options && options.message) || 'Something went wrong.',
        payload :  (options && options.payload) || []
    };

    res.status(httpStatuCode).json(obj);

}

/**
* 
* @developer   :
* @modified    :
*/
helper.customValidation = async (res, value, condition) => {

    if ( !( !/\s/.test(value) ) ) {

        helper.errorHandler(res, {
            message:"No spaces are allowed",
        });
    }

    if ( condition == 'number' ) {

        if ( !(/^\d*$/.test(value) ) ) {

            helper.errorHandler(res, {
                message:"Only numbers are allowed",
            });
        } 
    }

    if ( condition == 'float' ) {

        if ( !(/^-?\d*[.,]?\d*$/.test(value) ) ) {

            helper.errorHandler(res, {
                message:"Only numbers are allowed",
            });
        } 
    }
    
    if ( condition == 'cherecter' ) {

        if ( !(/^[a-z]*$/i.test(value) ) ) {

            helper.errorHandler(res, {
                message:"Only characters are allowed",
            });
        } 
    }

    if ( value.length > 15 ) {

        helper.errorHandler(res, {
            message:"Please enter no more than 20 characters",
        });

    } else if ( value.length < 3 ) {

        helper.errorHandler(res, {
            message:"Please enter minimum 3 characters",
        });
    }

}

/**
* This helper is using to return date into a format
* @param     : Date
* @returns   : Date 
* @developer : Anil Guleria
*/
helper.dateFormat = async (date, type = '', yearData = '') => {
 
    if ( date != '' ) {

        let newdate = new Date(date),
            year    = newdate.getFullYear(),
            month   = newdate.getMonth(),
            dt      = newdate.getDate(),
            hours   = newdate.getHours(),
            minutes = newdate.getMinutes(),
            ampm    = hours >= 12 ? ' PM' : ' AM';

        if ( dt < 10 ) {
            dt = '0' + dt;
        }

        let fullNameMonth   = fullMonthNames[month];

        month               = monthNames[month];
        hours               = hours % 12;
        hours               = hours ? hours : 12; 
        minutes             = minutes < 10 ? '0' + minutes : minutes;

        let strTime = hours + ':' + minutes +  ampm;

        if ( type != '' && yearData == '' ) {
            returnDate = dt +' ' + month + ', ' + year;
        } else if ( type != '' && yearData != '' && yearData == 'S' ) {
            returnDate =   month +' ' + dt  ;
        } else if ( type != '' && yearData != '' && yearData == 'V' ) {
            returnDate = month +' ' + dt  +' ' + year;
        } else if ( type != '' && yearData != '' && yearData == 'T' ) {
            returnDate = month +' ' + dt  +', ' + year;
        } else if ( type != '' && yearData != '' && yearData == 'F' ) {
            returnDate = fullNameMonth +' '+ year;
        } else {

            returnDate = month +' ' + dt + ', ' + year + ', ' + strTime;
        
        }
        return returnDate;

    } 
}

/**
* This helper is using to get time in different format
* @developer   : Anil Guleria
* @modified    :
*/
helper.formatTime = async (date, type) => {

    let vr      = new Date ("2014-04-25 " + date + ""),
        hours   = vr.getHours(),
        minutes = vr.getMinutes(),
        sec     = vr.getSeconds(),
        ampm    = hours >= 12 ? 'PM' : 'AM';

    hours       = hours % 12;
    hours       = hours ? hours : 12; 
    hours       = hours < 10 ? '0'+hours : hours;
    strTime     = '',
    minutes     = minutes < 10 ? '0'+minutes : minutes;
    sec         = sec < 10 ? '0'+sec : sec;

    if ( type && type != '' ) {
        strTime = hours + ':' + minutes + ':' + sec + ' ' + ampm;
    } else {
        strTime = hours + ':' + minutes + ' ' + ampm;
    }
    return strTime;
}

/**
* This helper is using to get difference between two time
* @param     : startTime,endTime
* @returns   : mintues
* @developer : Anil Guleria
*/
helper.timeDifference = async (startTime , endTime) => {

    if ( startTime != '' && endTime != '' ) {

        let startDate = new Date("January 1, 1970 " + startTime),
            endDate   = new Date("January 1, 1970 " + endTime),
            timeDiff  = Math.abs(startDate - endDate),
            mintues   = Math.round((timeDiff/1000)/60);

        return mintues;
    } 
}

/**
* This helper is using to get hours, mints, days, yrs between to dates
* @developer   :Anil Guleria
* @modified    :
*/
helper.getHoursOfTwoDates = async (startDate, startTime, endDate, endTime) => {
 
    startDate      = new Date(startDate + ' ' + startTime);
    endDate         = new Date(endDate + ' ' + endTime);

    let timeDiff    = Math.abs(startDate - endDate),
        mins        = Math.floor(timeDiff / 60000),
        hrs         = Math.floor(mins / 60),
        days        = Math.floor(hrs / 24),
        yrs         = Math.floor(days / 365),
        obj         = {
            mins : mins,
            hrs  : hrs,
            days : days,
            yrs  : yrs
        };
    return obj;
}

/**
* This helper is using to get hours, mints, days, yrs between to dates
* @developer   : Anil Guleria
* @modified    :
*/
helper.getExpiryHours = async (dateFuture) => {

    let dateTwo    = dateFuture,

        dateTwoObj = new Date(dateTwo),
        date       = await helper.getPstDateTime('date'),
        time       = await helper.getPstDateTime('time'),

        dateOneObj   = new Date(date+" " + time),
        hours        = 0;

    if ( dateTwoObj > dateOneObj ) {

        let milliseconds    = Math.abs(dateTwoObj - dateOneObj);
        hours               = Math.floor(milliseconds / 36e5);
    }

    return hours;
}

helper.dateDifferenceInDays = async (date) => {

    if ( date ) {

        let d               = spacetime.now('America/Los_Angeles'),
            dDate           = d.unixFmt('yyyy-MM-dd'),
            time            = d.format('time'),
            currentTime     = helper.changePstTime(time),
            transTime       = helper.getTimeSimpleFormat(currentTime),
            currentDateTime = dDate + ' ' + transTime;

        let dt1 = new Date(date).getTime(),
            dt2 = new Date(currentDateTime).getTime(),
            diffDays = parseInt((dt2 - dt1) / (1000 * 60 * 60 * 24), 10);

        return diffDays;
    } else {
        return false;
    }
}

/**
* Function to sort multidimensional array
* @developer : Anil Guleria
* returns {array}
*/
helper.sortingFunction = {

    multisort: async (arr, columns, order_by) => {

        if ( typeof columns == 'undefined' ) {
            
            columns = []
            
            for ( x = 0;x < arr[0].length; x++ ) {
                columns.push(x);
            }
        }

        if ( typeof order_by == 'undefined' ) {
            order_by = []
            for ( x = 0; x<arr[0].length; x++ ) {
                order_by.push('ASC');
            }
        }

        function multisort_recursive(a, b, columns, order_by, index) {  

            let  direction  = order_by[index] == 'DESC' ? 1 : 0,

                is_numeric  = !isNaN(a[columns[index]]-b[columns[index]]),

                x           = is_numeric ? a[columns[index]] : a[columns[index]].toLowerCase(),
                y           = is_numeric ? b[columns[index]] : b[columns[index]].toLowerCase();

            if ( !is_numeric ) {
                x           = helper.string.to_ascii(a[columns[index]].toLowerCase(),-1),
                y           = helper.string.to_ascii(b[columns[index]].toLowerCase(),-1);
            }

            if ( x < y ) {
                return direction == 0 ? -1 : 1;
            }

            if ( x == y )  {
                return columns.length-1 > index ? multisort_recursive(a,b,columns,order_by,index+1) : 0;
            }

            return direction == 0 ? 1 : -1;
        }

        return arr.sort(function (a ,b) {
            return multisort_recursive(a,b,columns,order_by,0);
        });
    }
}

/**
* This helper is using to get ago time 
* @developer   : Anil Guleria
* @modified    :
*/
helper.agoTime = async (date) => {

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
* This helper is using to get id by uuId 
* @param     : uuid , tableName , selectColumnname , whereColumn
* @returns   : number
* @developer : Anil Guleria
*/
helper.getIdByUUID = async (uuid , tableName , selectColumnname , whereColumn) => {

    let returnVal = false;

    if ( uuid != '' && tableName != '' && selectColumnname != '' && whereColumn != '' ) {

        let record = await _commonModel.getRowId(uuid, whereColumn, selectColumnname , tableName);

        if ( typeof record !='undefined' && typeof record =='number' ) {
            returnVal = record;
        }
    }

    return returnVal;
}

/**
* This helper is using to get Data or count 
* @param     : 
* @returns   : object or number
* @developer : Anil Guleria
*/
helper.getUserMeetingDataConditionally = async (userUuId, selectedColumns = '*', condition = '') => {
 
    let deferred = q.defer();

    if ( userUuId ) {

        let userSql         = 'SELECT u_id FROM user WHERE u_uuid = ?',
            userDataArray   = [userUuId],
            userData        = await helper.getDataOrCount(userSql, userDataArray);

        if ( userData && userData.sqlMessage ) {
            deferred.resolve(false);
        } else {

            if ( userData && userData.length > 0 ) {

                let sql             = `SELECT ` + selectedColumns + ` FROM meeting WHERE m_fk_u_id = ? ` + condition;
                    dataArray       = [userData[0].u_id],
                    userMeetingData = await helper.getDataOrCount(sql, dataArray);

                if ( userMeetingData && userMeetingData.sqlMessage ) {

                    deferred.resolve(false);

                } else {

                    if ( userMeetingData && userMeetingData.length > 0 ) {
                        deferred.resolve(userMeetingData[0]);
                    } else {
                        deferred.resolve(false);
                    }

                }

            } else {
                deferred.resolve(false);
            }

        }

    } else {
        deferred.resolve(false);
    }
    
    return deferred.promise;

}

/**
* This helper is using to get Data or count 
* @param     : 
* @returns   : object or number
* @developer : Anil Guleria
*/
helper.getDataOrCount = async (sql = '' , data = '' , need = 'D' ,  consoleData = false) => {

    let deferred = q.defer();

    if ( sql != '' ) {

        let hSqul = pool.query( sql, data, async (error, result) => {

            if ( consoleData ) {

                console.log('hsql,sql====>>>', hSqul.sql);
            };

            if ( error ) {

                deferred.resolve(false); 
            } else {

                if ( result ) {

                    if ( need != '' ) {

                        if ( need == 'L' && result.length > 0 ) {

                            deferred.resolve( result.length );
                        } else if ( need == 'D' && result.length > 0 ) {

                            deferred.resolve(result);
                        } else if ( need == 'U' ) {

                            deferred.resolve(result);
                        } else {

                            deferred.resolve(false);
                        };
                    } else {

                        deferred.resolve(false);
                    };
                } else {

                    deferred.resolve(false);
                };
            };
        });
    } else {

        deferred.resolve(false);
    };
    return deferred.promise;
};

/**
* This helper is using for check user Price
* @param     : 
* @returns   : object or number
* @developer : Anil Guleria
*/
helper.checkUserPrice = async (groupPrice = '', individualPrice = '') => {

    let deferred = q.defer();

    if ( groupPrice != '' && individualPrice != '' ) {

        if ( groupPrice >= 7.25  && individualPrice >= 7.25 ) {
            
            deferred.resolve(true);
        } else {
            deferred.resolve(false);
        }

    } else if ( groupPrice != '' ) {

        if ( groupPrice >= 7.25  ) {
            deferred.resolve(true);
        } else {
            deferred.resolve(false);
        }

    } else if ( individualPrice != '' ){

        if ( individualPrice >= 7.25 ) {
            deferred.resolve(true);
        } else {
            deferred.resolve(false);
        }

    } else {

        deferred.resolve(false);
    }
    
    return deferred.promise;
}

/**
* get simple format date
* @param     : 
* @returns   : 
* @developer : Anil Guleria
*/
helper.simpleDateFormat = async (date) => {

 let deferred = q.defer();

 /* if ( date ) {

     let d                = new Date(date);
     let simpleDateFormat = dateFormat(d, 'yyyy-mm-dd');
     
     deferred.resolve(simpleDateFormat);

 } else {
     deferred.resolve(false);
 } */

 deferred.resolve(false);

 return deferred.promise;

}

/**
* updateCatComTopicUsersCount
* @param : 
* @returns : 
* @developer : Anil Guleria
*/
helper.updateCatComTopicUsersCount = async (data) => {

    let deferred = q.defer();

    if ( data && data.topicId && data.categoryId && data.communityId ) {

        let topicCount = await helper.updateTopicUserCount(data.topicId);

        if ( topicCount ) {

            let catCount = await helper.updateCommunityUserCount(data.communityId);

            if ( catCount ) {

                let comCount = await helper.updateCategoryUserCount(data.categoryId);

                if ( comCount ) {
                    deferred.resolve(true);
                } else {
                    deferred.resolve(false);
                }

            } else {
                deferred.resolve(false);
            }

        } else {
            deferred.resolve(false);
        }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}

/**
* This helper is using to convert time into parse value
* @developer   : Anil Guleria
* @modified    :
*/
helper.convertTime = async (time) => {

    let date      = "2014-04-25 " + time,
    convert       = Date.parse(date);
    return convert;

}

/**
* This helper is using to replace am pm to in capital AM PM of PST time
* @developer   : Anil Guleria
* @modified    :
*/
helper.changePstTime = (time) => {

    let res  = time.charAt(time.length - 2);

    if ( res == 'a' ) {
        str  = time.replace('am',' AM')
    } else {
        str  = time.replace('pm',' PM')
    }
    return str;

}

/**
* This function is using to concatinate time and date and convert into parse value
* @developer   : Anil Guleria
* @modified    :
*/
helper.conTimeDate = async (d, time) => { 

 let date      = d + " " + time,
     convert   = Date.parse(date);
 return convert;

}

/**
* This helper is using to convert time into simple format
* @developer   : Anil Guleria
* @modified    :
*/
helper.getTimeSimpleFormat = (time) => {

 let date     = new Date("2000-01-01 " + time),
     hours    = date.getHours(),
     minutes  = date.getMinutes(),
     second   = date.getSeconds();
     hours    = hours < 10 ? '0'+hours : hours;
     minutes  = minutes < 10 ? '0'+minutes : minutes;
     second   = second < 10 ? '0'+second : second;
     strTime  = hours + ':' + minutes + ':' + second;
 return strTime;

}

/**
* This helper is using to add mints in time
* @developer   : Anil Guleria
* @modified    :
*/
helper.addMintsInTime = async (date, time, mints) => {

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
* This helper is using to get next date
* @developer   : Anil Guleria
* @modified    :
*/
helper.getNextDayDate = async (date) => {

 let day     = new Date(date),
     nextDay = new Date(day);
 nextDay.setDate(day.getDate() + 1);
 return nextDay;
}

/**
* This helper is used to show count above 1000 to 1K and so on.
* @developer   : Anil Guleria
* @modified    :
*/
helper.countFormat = async (value) => {

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

/**
* This helper is using to show ago time according to  video's screens
* @developer   : Anil Guleria
* @modified    :
*/
helper.statusAgoTime = async (date) => {

    let minute          = 60,
        hour            = minute * 60,
        day             = hour   * 24,
        month           = day    * 30,
        year            = day    * 365;
        d               = spacetime.now('America/Los_Angeles'),
        dDate           = d.unixFmt('yyyy-MM-dd'),
        time            = d.format('time'),
        currentTime     = helper.changePstTime(time),
        transTime       = helper.getTimeSimpleFormat(currentTime),
        currentDateTime = dDate + ' ' + transTime, 
        hours           = date.getHours(),
        minutes         = date.getMinutes(),
        ampm            = hours >= 12 ? ' PM' : ' AM',
        convert         = Date.parse(date),
        pstTime         = Date.parse(currentDateTime),
        elapsed         = Math.floor((pstTime - convert) / 1000);

        hours    = hours % 12;
        hours    = hours ? hours : 12; 
        minutes  = minutes < 10 ? '0'+ minutes : minutes;


    if ( elapsed < minute ) {
        return 'Just now';
    }

    let a = elapsed < hour  && [Math.floor(elapsed / minute), 'min'] ||
            elapsed < day   && [Math.floor(elapsed / hour), 'h']     ||
            elapsed < month && [Math.floor(elapsed / day), 'd']       ||
            elapsed < year  && [Math.floor(elapsed / month), 'm']   ||
            [Math.floor(elapsed / year), 'y'];

    if ( elapsed < month || elapsed < year ) {
        let strTime = hours + ':' + minutes +  ampm;
        return strTime;
    } else {
        return a[0] +  a[1] ;
    }

}

/**
* This function is using to change string first letter in capital letter
* @developer   : Anil Guleria
* @modified    :
*/
helper.capitalizeFirstLetter = async (text) => {

    if ( text ) {
        text  = text.charAt(0).toUpperCase() + text.slice(1);
    } else {
        return false;
    }

 return text;
}

/**
* This function is using to change ALL CAPS string to  first letter in capital letter
* @developer   : Anil Guleria
* @modified    :
*/
helper.capsFirstLetter = async (str) => {

 const lower = str.toLowerCase();
 return str.charAt(0).toUpperCase() + lower.slice(1);
}

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
* Used to replace string.
* @developer   : Anil Guleria
* @modified    :
* @params      : 
*/
helper.setCharAt = async (str, index, chr) => {

 if ( index > str.length - 1 ) return str;
 return str.substring(0,index) + chr + str.substring(index + 1);
}

/**
* Used to upload file in AWS S3 bucket.
* @developer   : Anil Guleria
* @modified    :
* @params      : fileObj { fileName, uploadFolder }
*/
helper.uploadFile = async (fileObj) => {
 
 let defered = q.defer();

    if ( fileObj && Object.keys(fileObj).length > 0 ) {

        if ( fileObj.fileName ) {
            
            let conObj      	= await constant.getConstant(),
                uploadFolder 	= '';
    
            if ( fileObj.uploadFolder ) {
                uploadFolder 	= fileObj.uploadFolder;
            }
            
            const S3        	= new AWS.S3({
                accessKeyId     : conObj.AWS_ACCESS_KEY,
                secretAccessKey : conObj.AWS_SECRET_ACCESS_KEY
                
            });
    
            const params = {
                Bucket          : conObj.AWS_BUCKET_NAME, // your s3 bucket name
                Key             : uploadFolder + `${fileObj.fileName}`, 
                Body            : Buffer.concat(fileObj.chunks), // concatinating all chunks
                // ACL             : 'public-read',
                ContentEncoding : fileObj.encoding, // optional
                ContentType     : fileObj.contentType // required
            };
            // we are sending buffer data to s3.
            S3.upload(params, (err, s3res) => {
                
                if ( err ) {
                    defered.resolve(false);
                } else {

                    if ( s3res ) {
                        let resData = s3res;
                        defered.resolve(resData);
                    } else {
                        defered.resolve(false);
                    }

                }

            });

        } else {
            defered.resolve(false);
        }

    } else {
        defered.resolve(false);
    }
    
    return defered.promise;

}

/**
* Used to create video thumbnail
* @developer   : Anil Guleria 
* @modified    :
* @params      :
*/
helper.uploadThumbnailFileToAwsBucket = async (imageDataObj) => {

 let defered = q.defer();

//  console.log("uploadThumbnailFileToAwsBucketuploadThumbnailFileToAwsBucketuploadThumbnailFileToAwsBucket=========>>>>>>>>>>>>>>>",imageDataObj );
 
    if ( imageDataObj && imageDataObj.imageName && imageDataObj.imageName != '' ) {
        
        let conObj       = await constant.getConstant(),
            uploadFolder = '';
            ext     = (path.extname(imageDataObj.imageName).toLowerCase());
        //  console.log("thummmmmmmmmmmmmmmmmmmmm------=============>>>>",ext);
        
        if ( imageDataObj.uploadFolder && imageDataObj.uploadFolder != '' ) {

            uploadFolder 	= imageDataObj.uploadFolder;

        }

        //  console.log("11111111=================>>>>>>",imageDataObj);

        let tmpFile     =  fs.createReadStream('uploads/' + imageDataObj.imageName);
        //  console.log('tmpFile tmpFile tmpFile',tmpFile)

        const S3        = new AWS.S3({
                accessKeyId     : conObj.AWS_ACCESS_KEY,
                secretAccessKey : conObj.AWS_SECRET_ACCESS_KEY
                
            }),
            params      = {
                Bucket          : conObj.AWS_BUCKET_NAME, 
                Key             : uploadFolder + `${imageDataObj.videoUId + ext}`, 
                Body            : tmpFile,
                // ACL             : 'public-read',
            };
        //    console.log('paramsparamsparamsparamsparams')
        // we are sending buffer data to s3.
        S3.upload(params, async (err, s3res) => {
            // console.log('S3.upload S3.upload S3.upload>>>>>>>>>>>>>>>>',s3res)
            // console.log('S3.err S3.err S3.err>>>>>>>>>>>>>>>>>>>>>>>>',err)

            if ( err ) {
                
                console.log("imagasdfseDatadsfsfimageData ========================================================  Thumbnail Error is : ", err);
                defered.resolve(false);

            } else {

                if ( s3res ) {

                    
                    let fileObj = {
                        fileName    : imageDataObj.imageName,
                        folderPath  : './uploads/'
                    };
                    /** Delete fil from local folder.*/
                    let deleteData = await helper.removeAttachment(fileObj);
                    // console.log(deleteData);
                    imageDataObj.imageName = imageDataObj.videoUId + ext;

                    console.log("uuuuuuuuuuuuuuuuu=====>>>>",imageDataObj);
                    defered.resolve(imageDataObj); 

                } else {
                    defered.resolve(false);
                }
            }
        });
    } else {
        defered.resolve(false);
    }

    return defered.promise;
}

/**
* This function is used to remove image
* @param       : fileObj { fileName, folderPath }
* @returns     :
* @developer   : Anil Guleria
*/
helper.removeAttachment = async (fileObj) => {
    console.log('removeAttachment ================================>>>>>',fileObj)
 let defered = q.defer();
 
    if ( fileObj ) {
        
        if ( fileObj.fileName && fileObj.folderPath ) {
            
            if ( fs.existsSync(fileObj.folderPath + fileObj.fileName) ) {
                
                fs.unlink(fileObj.folderPath + fileObj.fileName, (err) => {

                    if ( err ) {
                        defered.resolve(false);
                    } else {
                        defered.resolve(true);
                    }  

                });

            } else {
                defered.resolve(false);
            }

        } else {
            defered.resolve(false);
        }

    } else {
        defered.resolve(false);
    }

    return defered.promise;

}

/**
* This function is used to get video length 
* @param       : 
* @returns     :
* @developer   : Anil Guleria
*/
helper.getVideoDuration = async (videoUrl) => {

 let deferred       = q.defer();

    ffmpeg.ffprobe(videoUrl, function (error, metadata){

        
        if ( metadata && metadata.format && metadata.format.duration) {

            let timestamp      = Math.floor(metadata.format.duration);
            let hours          = Math.floor(timestamp / 60 / 60);
            let minutes        = Math.floor(timestamp / 60) - (hours * 60);
            let seconds        = timestamp % 60;
            let formatedValue  = '';
            let printValue     = '';

            if ( hours != 0 ) { 

                formatedValue += hours + ' h ';

                if ( hours < 10 ) {
                    printValue    += '0'+hours+':';
                } else {
                    printValue    += hours+':';
                }

            } else {
                printValue += '00:';
            }

            if ( minutes != 0 ) {

                formatedValue += minutes + 'm ';

                if ( minutes < 10 ) {
                    printValue    += '0'+minutes+':';
                } else {
                    printValue    += minutes+':';
                }

            } else {

                printValue += '00:';
            }

            if ( seconds != 0 ) {

                formatedValue += seconds + 's ';

                if ( seconds < 10 ) {
                    printValue    += '0'+seconds;
                } else {
                    printValue    += seconds;
                }
                
            } else {
                printValue += '00';
            }

            let obj = {
                timestamp         : timestamp,
                hours 			  : hours,
                minutes           : minutes,
                seconds           : seconds,
                formatedValue     : formatedValue,
                printValue        : printValue  
            }
            deferred.resolve(obj);

        } else {

            let obj = {
                printValue        : 0
            }
            
            deferred.resolve(obj);

        }

    });

 return deferred.promise;
}

/**
* This function is used to get video length 
* @param       : 
* @returns     :
* @developer   : Anil Guleria
*/
helper.timeFormated = async (time) => {

 let result         = '';

    if ( time != '' && time != null ) {

        let strArray       = time.split(":");

        if ( strArray && strArray.length && strArray.length > 0 ) {

            if ( strArray.length == 3 ) {

                if ( strArray[0] > 0 ) {
                    result += strArray[0] + 'h';
                } 

                if ( strArray[1] > 0 ) {
                    result += strArray[1] + 'm' ;
                } 

                if ( strArray[2] > 0 ) {
                    result += strArray[2] + 's';
                } 

            }

        }

    }

    return result;
 
}

/**
* This helper is using to get price in a format
* @developer   : Anil Guleria
* @modified    :
*/
helper.priceFormat = async (price) => {

 let newPrice = "";

    if ( price && price < 10 ) {

        newPrice = parseFloat(price).toFixed(2) - 0;

    }

    if ( price && price >= 10 ) {

        newPrice   = parseFloat(price).toFixed(2) - 0;

        let value  = helper.countDecimals(newPrice);

        if ( value == 1 ) {
            newPrice = parseFloat(price).toFixed(2);
        }

    }

 return newPrice;
}

/**
* This helper is using to count value after decimal
* @developer   : Anil Guleria
* @modified    :
*/
helper.countDecimals = async (value) => {

    if ( Math.floor(value) === value ) {
        return 0;
    } else {
        return value.toString().split(".")[1].length || 0; 
    }
}

/**
* This helper is using to count value after decimal
* @developer   : Anil Guleria
* @modified    :
*/
helper.convertSecToMint = async (value) => {

    if ( value ) {
        
        value = parseInt(value);

        let mint = Math.floor(value / 60),
            sec  = value % 60;
            
        if ( mint < 10 ) {
            mint = '0'+mint;
        }

        if ( sec < 10 ) {
            sec = '0'+sec;
        }

        return mint + ":" + sec;

    } else {
        return 0;
    }
}

/**
* Used to insert user activity logs.
* @developer   : Anil Guleria
* @modified    :
* @params      : dataObj : { tableName, userId, categoryId, communityId, topicId, meetingId, topicQuesId, description, activityType, userType }
*/
helper.insertUserActivityLogs = async (dataObj) => {

 let deferred = q.defer();

    if ( dataObj && Object.keys(dataObj).length > 0 ) {

        let tableName   = 'all_activity_logs',
            userType    = 'USER',
            categoryId  = '',
            communityId = '',
            topicId     = '',
            meetingId   = '',
            topicQuesId = '',
            insDataObj  = {};
        
        if ( dataObj.tableName ) {
            tableName   = dataObj.tableName;
        }

        if ( dataObj.actionUserId ) {
            insDataObj.aal_fk_action_user_id   = dataObj.actionUserId;
        }

        if ( dataObj.userId ) {
            insDataObj.aal_fk_u_id      = dataObj.userId;
        }

        if ( dataObj.categoryId ) {
            categoryId                  = dataObj.categoryId;
        }

        if ( dataObj.communityId ) {
            communityId                 = dataObj.communityId;
        }

        if ( dataObj.topicId ) {
            topicId                     = dataObj.topicId;
        }

        if ( dataObj.meetingId ) {
            meetingId                   = dataObj.meetingId;
        }

        if ( dataObj.topicQuesId ) {
            topicQuesId                 = dataObj.topicQuesId;
        }

        if ( dataObj.description ) {
            insDataObj.aal_description  = dataObj.description;
        }

        if ( dataObj.moduleName ) {
            insDataObj.aal_module_name  = dataObj.moduleName;
        }

        if ( dataObj.activityType ) {
            insDataObj.aal_activity     = dataObj.activityType;
        }

        if ( dataObj.userType ) {
            userType                    = dataObj.userType;
        }

        if ( dataObj.date ) {
            insDataObj.aal_created	    = dataObj.date;
            insDataObj.aal_updated	    = dataObj.date;
        }
        
        insDataObj.aal_fk_cat_id        = categoryId;
        insDataObj.aal_fk_com_id        = communityId;
        insDataObj.aal_fk_t_id          = topicId;
        insDataObj.aal_fk_m_id          = meetingId;
        insDataObj.aal_fk_tq_id         = topicQuesId;
        insDataObj.aal_action_user_type = userType;

        if ( insDataObj && tableName ) {

            /* let insertedId              = await mongoDb.insert(insDataObj, tableName);

            if ( insertedId ) {
                deferred.resolve(true);
            } else {
                deferred.resolve(false);
            } */
            deferred.resolve(true);

        } else {
            deferred.resolve(false);
        }

    } else {
        deferred.resolve(false);
    }

 return deferred.promise;
}

/**
* Used to send notification email to KnowEx.
* @developer   : Anil Guleria
* @modified    : 
* @params      : 
*/
helper.sendKnowexNotifyEmail = async (emailObj) => {

 let deferred       = q.defer();

    if ( emailObj && Object.keys(emailObj).length > 0 ) {

        let toEmail         = 'sasdasd',
            fromEmail       = 'asdasdsadf',
            subject         = 'email subject',
            emailText       = 'emailtext',
            sentEmailObj    = {};
            
        if ( emailObj.toEmail ) {
            sentEmailObj.to         = toEmail;
        }

        if ( emailObj.fromEmail ) {
            sentEmailObj.from       = fromEmail;
        }

        if ( emailObj.subject ) {
            sentEmailObj.subject    = subject;
        }

        if ( emailObj.toEmail ) {
            sentEmailObj.body       = emailText;
        }

        if ( sentEmailObj ) {

            /* if ( _commonModel.generalMail(emailArray) ) {
                deferred.resolve(true);
            } else {
                deferred.resolve(false);
            } */
        } else {
            deferred.resolve(false);
        }
        
    } else {
        deferred.resolve(false);
    }
 
 return deferred;
}

/**
* This helper is using to add mints in time
* @developer   : Anil Guleria
* @modified    :
*/
helper.incrementedDate = async (date) => {

    let d        = new Date(date);
        date     = d.setDate(d.getDate() + 1),
        dt       = d.getDate(),
        year     = d.getFullYear();
        month    = d.getMonth() + 1;

    if ( dt < 10 ) {
        dt = '0' + dt;
    }

    month     = month < 10 ? '0'+month : month;
    returnVal = year +'-' + month + '-' + dt;
        
    return returnVal;
}

/**
* This helper is using to add mints in time
* @developer   : Anil Guleria
* @modified    :
*/
helper.getMonthYear = async (type = "month") => {

    let d           = new Date(),
        year        = d.getFullYear(),
        month       = d.getMonth() + 1;
    month           = month < 10 ? '0' + month : month;
    let returnVal   = month;

    if ( type == 'year' ) {
        returnVal = year; 
    }
        
 return returnVal;
}

/**
* This function is using to change string first letter in capital letter
* @developer   : Anil Guleria
* @modified    :
*/
helper.capitalizeAllFirstLetter = async (text) => {

    if ( text ) {

        return text.replace(/\w\S*/g, async (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
        
    } else {
        return false;
    }
}

/**
* This helper is using to add mints in time
* @developer   : Anil Guleria
* @modified    :
*/
helper.decreaseDay = async (type) => {

 let date = await helper.getPstDateTime('date'),
     time = await helper.getPstDateTime('time'),

     d        = new Date(date + " " + time),
     newDate  = d.setDate(d.getDate() - 5),
     year     = d.getFullYear(),
     month    = d.getMonth()+1,
     dt       = d.getDate(),
     hours    = d.getHours(),
     minutes  = d.getMinutes(),
     second   = d.getSeconds();

 if ( dt < 10 ) {
     dt      = '0' + dt;
 }

 month       = month < 10 ? '0' + month : month;
 hours       = hours < 10 ? '0' + hours : hours;
 minutes     = minutes < 10 ? '0' + minutes : minutes;
 second      = second < 10 ? '0' + second : second;
 strTime     = hours + ':' + minutes + ':' + second;

 if ( type == 'date' ) {
     returnVal = year + '-' + month + '-' + dt;
 } else {
     returnVal = strTime;
 }

 return returnVal;
}

/**
* This helper is using to add mints in time
* @developer   : Anil Guleria
* @modified    :
*/
helper.increaseDays = async (expiry_days = '') => {

 let date    = await helper.getPstDateTime('date'),
     time    = await helper.getPstDateTime('time'),
     conObj  = await constant.getConstant(),
     incDays = parseInt(conObj.REQUEST_EXPIRE_DAYS);

    if ( expiry_days ) {

        expiry_days = parseInt(expiry_days);

        if ( expiry_days == '24' ) {
            expiry_days = 1;
        }

        incDays = expiry_days;
    }
        
    let d        = new Date(date + " " + time),
        newDate  = d.setDate(d.getDate() + incDays),
        year     = d.getFullYear(),
        month    = d.getMonth() + 1,
        dt       = d.getDate(),
        hours    = d.getHours(),
        minutes  = d.getMinutes(),
        second   = d.getSeconds();

    if ( dt < 10 ) {
        dt = '0' + dt;
    }

    month    = month < 10 ? '0'+month : month;
    hours    = hours < 10 ? '0'+hours : hours;
    minutes  = minutes < 10 ? '0'+minutes : minutes;
    second   = second < 10 ? '0'+second : second;
    strTime  = hours + ':' + minutes + ':' + second;

    returnVal = year + '-' + month + '-' + dt + ' ' +strTime;
    
    return returnVal;
}

/**
* This helper is using to add mints in time
* @developer   :
* @modified    :
*/
helper.statusDateFormat = async (date) => {

    if ( date != '' ) {

        let pstDate         = await helper.getPstDateTime(date),
            previousDate    = await helper.getYesterdayDate(),
            newdate         = new Date(date),
            year            = newdate.getFullYear(),
            month           = newdate.getMonth(),
            dt              = newdate.getDate();

        if ( dt < 10 ) {
            dt = '0' + dt;
        }

        month    = fullMonthNames[month];

        if ( date == pstDate ) {
            returnDate = 'Today';
        } else if ( date == previousDate ) {
            returnDate = 'Yesterday';
        } else {
            returnDate = await helper.agoTime(date);
        }
        
        return returnDate;

    } else {
        return false;
    }
}

/**
* This helper is using to add mints in time
* @developer   : Anil Guleria
* @modified    :
*/
helper.getYesterdayDate = async () => {

    let date        = await helper.getPstDateTime('date'),
        time        = await helper.getPstDateTime('time'),

        d           = new Date(date+" " + time),
        newDate     = d.setDate(d.getDate() - 1),
        year        = d.getFullYear(),
        month       = d.getMonth() + 1,
        dt          = d.getDate();

    if ( dt < 10 ) {
        dt = '0' + dt;
    }

    month    = month < 10 ? '0'+month : month;

    returnVal = year +'-' + month + '-' + dt;
    
    return returnVal;
}

/**
* This helper is using to get ago time 
* @developer   : Anil Guleria
* @modified    :
*/
helper.getLeftTime = async (date) => {

 let minute          = 60,
     hour            = minute * 60,
     day             = hour   * 24,
     month           = day    * 30;
     d               = spacetime.now('America/Los_Angeles'),
     dDate           = d.unixFmt('yyyy-MM-dd'),
     time            = d.format('time'),
     currentTime     = helper.changePstTime(time),
     transTime       = helper.getTimeSimpleFormat(currentTime),
     currentDateTime = dDate + ' ' + transTime, 
     convert         = Date.parse(date),
     pstTime         = Date.parse(currentDateTime),
     elapsed         = Math.floor((convert - pstTime) / 1000);

 let a               = elapsed < hour  && [Math.floor(elapsed / minute), 'min'] ||
         elapsed < day   && [Math.floor(elapsed / hour), 'hr']     ||
         elapsed < month && [Math.floor(elapsed / day), 'day'];

 return a[0] + ' ' + a[1] + (a[0] === 1 ? '' : 's') ;
 
}

/**
* This helper is using to get hours, mints, days, yrs between to dates
* @developer   : Anil Guleria
* @modified    :
*/
helper.getDaysLeft = async (date) => {

    let d       = spacetime.now('America/Los_Angeles'),
        dDate   = d.unixFmt('yyyy-MM-dd'),
        days    = 0;

    if ( date > dDate) {

        let startDate   = new Date(date);
        dDate           = new Date(dDate);
        let timeDiff    = Math.abs(startDate - dDate),
            mins        = Math.floor(timeDiff / 60000),
            hrs         = Math.floor(mins / 60);
        days            = Math.floor(hrs / 24);
        
        return days;

    } else {
        return days;
    }
}

/**
* This helper is using to add mints in time
* @developer   : Anil Guleria
* @modified    :
*/
helper.increaseHours = async (expireHrs = '') => {

 let date    = await helper.getPstDateTime('date'),
     time    = await helper.getPstDateTime('time'),
     incDays = parseInt(expireHrs),

     d        = new Date(date + " " + time),
     newDate  = d.setHours(d.getHours()+incDays),
     year     = d.getFullYear(),
     month    = d.getMonth() + 1,
     dt       = d.getDate(),
     hours    = d.getHours(),
     minutes  = d.getMinutes(),
     second   = d.getSeconds();

 if ( dt < 10 ) {
     dt = '0' + dt;
 }

 month    = month < 10 ? '0' + month : month;
 hours    = hours < 10 ? '0' + hours : hours;
 minutes  = minutes < 10 ? '0' + minutes : minutes;
 second   = second < 10 ? '0' + second : second;
 strTime  = hours + ':' + minutes + ':' + second;

 returnVal = year + '-' + month + '-' + dt + ' ' +strTime;
 
 return returnVal;
}

/**
* This helper is using to add mints in time
* @developer   : Anil Guleria
* @modified    :
*/
helper.chatDateFormat = async (date) => {

    if ( date != '' ) {

        let pstDate         = await helper.getPstDateTime(date),
            previousDate    = await helper.getYesterdayDate(),
            newdate         = new Date(date),
            year            = newdate.getFullYear(),
            month           = newdate.getMonth(),
            dt              = newdate.getDate();

        if ( dt < 10 ) {
            dt = '0' + dt;
        }

        month    = fullMonthNames[month];

        if ( date == pstDate ) {
            returnDate = 'Today';
        } else if ( date == previousDate ) {
            returnDate = 'Yesterday';
        } else {
            returnDate = month +' ' + dt  +', ' + year;
        }
        return returnDate;

    } else {
        return false;
    }
}

/**
* This helper is using to add mints in time
* @developer   : Anil Guleria
* @modified    :
*/
helper.expireDateFormat = async (date) => {

    if ( date != '' ) {

        let days     = ['SUN', 'MON', 'TUES', 'WED', 'THUR', 'FRI', 'SAT'],
            d        = new Date(date),
            dayName  = days[d.getDay()],
            hours    = d.getHours(),
            minutes  = d.getMinutes(),
            ampm     = hours >= 12 ? ' PM' : ' AM';

        hours    = hours % 12;
        hours    = hours ? hours : 12; 
        minutes  = minutes < 10 ? '0'+ minutes : minutes;
        
        return dayName + ' ' + hours+':'+minutes +ampm;

    } else {
        return false;
    }
}

// get day of year ...
helper.getDayOfYear = async () => {

 let now     = new Date(),
     start   = new Date(now.getFullYear(), 0, 0),
     diff    = now - start,
     oneDay  = 1000 * 60 * 60 * 24,
     day     = Math.floor(diff / oneDay);
 return day;
}

helper.days_of_a_year = async () => {

let year = new Date().getFullYear();
return helper.isLeapYear(year) ? 366 : 365;
}

helper.isLeapYear = async (year) => {

  return year % 400 === 0 || (year % 100 !== 0 && year % 4 === 0);
}

/**
* This helper is using to add mints in time
* @developer   : Anil Guleria
* @modified    :
*/
helper.getNextMonthDate = async () => {

 let date    = await helper.getPstDateTime('date'),
     time    = await helper.getPstDateTime('time'),
     d       = new Date(date + " " + time);
     date    = d.setDate(d.getDate() + 30);
 let dt      = d.getDate(),
     year    = d.getFullYear(),
     month   = d.getMonth() + 1;

 if ( dt < 10 ) {
     dt = '0' + dt;
 }

 month     = month < 10 ? '0'+month : month;
 returnVal = year +'-' + month + '-' + dt +' ' +time;
     
 return returnVal;
}

/**
* This helper is using to convert time into simple format
* @developer   : Anil Guleria
* @modified    :
*/
helper.getSimpleTime = async (dateTime) => {

 let date     = new Date(dateTime),
     hours    = date.getHours(),
     minutes  = date.getMinutes(),
     second   = date.getSeconds();

 hours       = hours < 10 ? '0' + hours : hours;
 minutes     = minutes < 10 ? '0' + minutes : minutes;
 second      = second < 10 ? '0' + second : second;
 let strTime = hours + ':' + minutes + ':' + second;

 return strTime;
}

/**
* Description  : This function is using to get row by id
* @developer   : Anil Guleria
* @modified    : 
*/
helper.getRowId = async (uuid, wherecolname, selectcolname, tablename) => {
    let deferred = q.defer(),
        sql      = 'SELECT ' + selectcolname + ' FROM ' + tablename + ' WHERE ' + wherecolname + ' = "' + uuid + '"';
    pool.query(sql, function (error, record) {
        
        if ( error ) {
            deferred.reject(error)
        } else {

            if (record && record.length > 0) {
                deferred.resolve(record[0][selectcolname]);
            } else {
                deferred.resolve(false);
            }

        }
    });

    return deferred.promise;
}

/**
* Used to delete file from AWS S3 bucket.
* @developer   : Anil Guleria
* @modified    :
* @params      : fileObj { fileName, folderName }
*/
helper.deleteAWSFile = async (fileObj) => {

    let defered = q.defer();
    
    if ( fileObj && fileObj.fileName ) {

        let fileName    = fileObj.fileName,
            folderName  = '';

        if ( fileObj.folderName ) {
            folderName  = fileObj.folderName;
        }    

        let conObj  = await constant.getConstant(),
            s3      = new AWS.S3({
                accessKeyId     : conObj.AWS_ACCESS_KEY,
                secretAccessKey : conObj.AWS_SECRET_ACCESS_KEY
            }),
            
            params  = {
                Bucket  : conObj.AWS_BUCKET_NAME,
                Key     : folderName + fileName
            };

        s3.deleteObject(params, function(err, data) {

            if ( err ) {
                defered.resolve(false);
            } else {
                defered.resolve(true);
            }

        });

    } else {
        defered.resolve(false);
    }
    return defered.promise;
}

/**
* This function is used to execute AWS lambda function;
* @param     : 
* @returns   :
* @developer :  Anil Guleria
*/


helper.executeAWSLambdaFunction = async (bodyObj) => {
    console .log("ccccccccvvvvv=========>>>>>",bodyObj);
    let defered = q.defer();

    if ( bodyObj ) {
        console.log('execsdauteAWsdSLadsmbdaFudsnction 1111111111111111111111111111111111111111111111 : bodyObj =======> ', bodyObj);
        let conObj          = await constant.getConstant(),
            apiUrl          = conObj.AWS_LAMBDA_API_GATEWAY_URL,

            mainMediaPath   = conObj.UPLOAD_PATH + conObj.POST_UPLOAD_PATH + bodyObj.folderUId +'/'+ conObj.AWS_VIDEO_PATH + bodyObj.attachmentId +'/';
     
        let data    = {
                'bucketName'             : conObj.AWS_BUCKET_NAME,
                // 'tempBucketName'        : conObj.AWS_TEMP_BUCKET_NAME,
                // 'tempFolderFullPath'    : tempMediaPath,
                'mainMediaFolderPath'   : mainMediaPath,
                // 'fileUId'               : (bodyObj.folderUId) ? bodyObj.folderUId : '',
                // 'mp4FileName'           : 'file_example_MP4_480_1_5MG.mp4'
                'mp4FileName'           : bodyObj.mp4FileName 
        },

            config  = {
                method  : 'post',
                url     : apiUrl,
                headers : { 
                    'Content-Type'  : 'application/json', 
                },
                data    : data
            };
            // console.log('rbesDatba rebsDabta config ====== >>>> ', config);


            resData = await axios(config);
            console.log('rbesDatba rebsDabta config ====== >>>> ', resData.config);

        
        let resObj  = {
            status  : true,
            message : "Operation performed successfully.",
        };

        if ( resData.status && resData.status != 200 ) {

            resObj.status   = false;
            resObj.message  = "Something went wrong.";
        }

        // res.send(acquire);
        defered.resolve(resObj);
        // res.send(resData);
    } else {
        defered.resolve(false);
        // res.send({});
    }

    return defered.promise;
}

/**
 * This helper is using to add mints in time
 * @developer   :
 * @modified    :
 */
 helper.getDateTimeFormat = async function(dateTime) {
    let d        = new Date(dateTime),
        dt       = d.getDate(),
        year     = d.getFullYear(),
        month    = d.getMonth()+1,
        hours    = d.getHours(),
        minutes  = d.getMinutes(),
        second   = d.getSeconds();
        hours    = hours < 10 ? '0'+hours : hours;
        minutes  = minutes < 10 ? '0'+minutes : minutes;
        second   = second < 10 ? '0'+second : second;
        strTime  = hours + ':' + minutes + ':' + second;
    if ( dt < 10 ) {
        dt = '0' + dt;
    }
    month     = month < 10 ? '0'+month : month;
    returnVal = year +'-' + month + '-' + dt +' ' +strTime;
        
    return returnVal;

}


helper.removeAwsVideo = async (obj) => {
    console.log("removeAgoraRecodedVideoremoveAgoraRecodedVideo====>>",obj.sId);
    let defered = q.defer(),
        conObj  = await constant.getConstant(),
        s3      = new AWS.S3({
            accessKeyId     : conObj.AWS_ACCESS_KEY,
            secretAccessKey : conObj.AWS_SECRET_ACCESS_KEY
        }),
        //prefixName = 'agora/video/' + obj.sId;

       // console.log("prefixNameprefixNameprefixName=====>>>>>",prefixName);
  
        bucketParams  = {
            Bucket  : conObj.AWS_BUCKET_NAME,
            Prefix  : obj.path + obj.sId,
        };
        console.log("bucketParamsbucketParams=====>>>>>",bucketParams)

    s3.listObjects(bucketParams, async function(err, data) {
        if (err) {
            defered.resolve(false);
        } else {
            // console.log("bbbbbbbbb-----eledseeeeee----------",data.Contents);
            for ( var i = 0; i < data.Contents.length; i++ ) {
                    console.log("what atta============>>>>>>>>>",data.Contents[i].Key);
                let arr = data.Contents[i].Key.split("/");

                console.log("arrarrarrarrarrarrarrarr=======>>>>>",arr);
                fileObj = {
                   
                    folderName : obj.path,
                };

                fileObj.fileName   = arr[2]
                    
                console.log("fileddddddddddd=ddddd===========>>>>>>>>",fileObj.fileName,fileObj.folderName);

                    deleteStatus =  await helper.deleteAWSFile(fileObj);

                    if ( deleteStatus ) {
                        defered.resolve(true);
                    } else {
                        defered.resolve(false);
                    }
            }
        }
    })
    return defered.promise;
}


/**
 * Used to delete file in AWS S3 bucket. THIS IS NEW FUNCTION
 * @developer   : Anil Guleria
 * @modified    :
 * @params      : fileObj { fileName, filePath }
 */
 helper.deleteFileToAwsBucket = async (fileObj) => {
    
    let defered             = q.defer();

    if ( fileObj && Object.keys(fileObj).length > 0 ) {
        console.log("delete file form aws bucket ======================================================================================================================================================== -------1000000000000000000000111111");

        if ( fileObj.fileName  && fileObj.filePath ) {
            console.log("delete file form aws bucket ======================================================================================================================================================== 00000000000000000000000000000000");
            
            let conObj          = await constant.getConstant();
            //    fullMediaPath    = '';
            //     fullMediaPath   += filePath + fileObj.fileUId  + '/' + subFolderpath;

            const S3        	= new AWS.S3({
                    accessKeyId     : conObj.AWS_ACCESS_KEY,
                    secretAccessKey : conObj.AWS_SECRET_ACCESS_KEY
                    // region          : conObj.AWS_TEMP_BUCKET_REGION
                }),
                params          = {

                    Bucket          : conObj.AWS_BUCKET_NAME, 
                    Key             : fileObj.filePath + `${fileObj.fileName}`, 
                   
                };
            
            // we are sending buffer data to s3.
            S3.deleteObject(params, async (err, s3res) => {
                
                if ( err ) {
                    console.log("delete file form aws bucket ======================================================================================================================================================== err is ", err);
                    defered.resolve(false);
                } else {

                    console.log("delete file form aws bucket ======================================================================================================================================================== 1111111111111111");

                    if ( s3res ) {
                        console.log("delete file form aws bucket ======================================================================================================================================================== 22222222222222222222");
                        let resData = s3res;
                        defered.resolve(resData);
                    } else {
                        console.log("delete file form aws bucket ======================================================================================================================================================== 3333333333333333333333");
                        defered.resolve(false);
                    }
                }
            });
        } else {
            console.log("delete file form aws bucket ======================================================================================================================================================== 444444444444444444444");
            defered.resolve(false);
        }
    } else {
        console.log("delete file form aws bucket ======================================================================================================================================================== 55555555555555555555555555555");
        defered.resolve(false);
    }
    
    return defered.promise;
}

/**
 * This function is using to create agora token
 * @developer   :
 * @modified    :
 */
 helper.agoraToken = function ( data ) {

    // console.log("datttttttataaaaaaaaaaa==========>>>>>>>>>>>", data );
    if ( data ) {
      
        const appID                     = "768bc658c07e410198b05e14e72965be";
        const appCertificate            = "6ae71efd404c4c119f466a0c776572ae";
        const expirationTimeInSeconds   = 36000;
        //const uid = Math.floor(Math.random() * 100000);
        const uid = data.uid ? data.uid : 0;
        // const uid                       = data.uid
        const role                      = data.isPublisher ? agora.RtcRole.PUBLISHER : agora.RtcRole.SUBSCRIBER;
        // console.log('role role role role role role 111111111111111 ',data.isPublisher);
        // console.log('role role role role role role 2222222222222222 ',agora.RtcRole.PUBLISHER);
        // console.log('role role role role role role 33333333333333333 ',agora.RtcRole.SUBSCRIBER);


        // const role                      = isPublisher ;
        const channel                   = data.channelId;
        const currentTimestamp          = Math.floor(Date.now() / 1000);
        const expirationTimestamp       = currentTimestamp + expirationTimeInSeconds;

        const token                     = agora.RtcTokenBuilder.buildTokenWithUid(appID, appCertificate, channel, uid, role, expirationTimestamp);
         
        return { token :token, uid: uid, channelName : channel, role : role };

    } else {

        return null;
    }
    //return text;

}

/**
 * Function is used to copy data from one folder to another folder in AWS s3 bucket. 
 * @returns     : 
 * @developer   : Anil Guleria
 * @modified    : 
 */
 helper.copyFileWithInAWSBucket = async (crtFolderObj, crtFolderpath = '') => {

    console.log("4444444444444444=========================");
    let defered     = q.defer(),
        KeyValue         = '';

    // console.log("crrrrrrtFolllllderrrrrOOOOOOObj=========", crtFolderObj );
    if ( crtFolderObj && crtFolderObj.sourcePath && crtFolderObj.destinationPath && crtFolderObj.fileName ) {
        
        let conObj  = await constant.getConstant();
        const S3    = new AWS.S3({

            accessKeyId     : conObj.AWS_ACCESS_KEY,
            secretAccessKey : conObj.AWS_SECRET_ACCESS_KEY,

        }),
        bucketParams  = {

            Bucket  : conObj.AWS_BUCKET_NAME,
            Prefix  : crtFolderObj.sourcePath +'/'+ `${crtFolderObj.fileName}`,

        };
        
        S3.listObjects(bucketParams, async function(err, data) {

            if ( err ) {

                console.log("errrrrrrrrrrrrrr=======lliiistttttttt>>>>>>", err );
                defered.resolve(false);

            } else {

                // console.log("bbbbbbbbb-----eledseeeeee----------", data );
                for ( var i = 0; i < data.Contents.length; i++ ) {

                    // console.log("what atta========1111111111111====>>>>>>>>>",data.Contents[i].Key);
                    let arr = data.Contents[i].Key.split("/");
    
                    // console.log("arrarrarrarrarrarrarrarr=====1111111111111==>>>>>", arr );
    
                    crtFolderObj.fileName   = arr[1];
 
                    // console.log('crtFolderObj.fileName====>11111111111>>>>>>>>', crtFolderObj.fileName );
                    if (crtFolderObj.moveName && crtFolderObj.moveName !='') {

                        // console.log("crtFolderObj.moveNamecrtFolderObj.moveName======>",crtFolderObj.moveName);
                        KeyValue = crtFolderObj.destinationPath + `${crtFolderObj.moveName}`;
                    } else {

                        KeyValue = crtFolderObj.destinationPath + `${crtFolderObj.fileName}`;
                    }
                    const params  = {
                            Bucket      : conObj.AWS_BUCKET_NAME, 
                            CopySource  : conObj.AWS_BUCKET_NAME + '/' + crtFolderObj.sourcePath + '/' + `${crtFolderObj.fileName}`, 
                            //Key         : crtFolderObj.destinationPath + `${crtFolderObj.moveName}`,
                            Key         : KeyValue,
                    };

                    // console.log("666666666666666=========================",params);
                    S3.copyObject(params, async (err, data) => {

                        // console.log("777777777777771111=========================",data);
                        console.log("777777777777772222=========================error",err);
                        if ( err ) {

                            defered.resolve(false);

                        } else { 
                            console.log('We are hear ===================>>>>>>>true');
                            defered.resolve(true);

                        }           // successful response

                    });
                }
            }
        })
    } else {

        defered.resolve(false);
        
    }
    
    return defered.promise;
}

/** NEW FUNCTION TO CREATE VIDEO THUMBNAIL //
 * This function is using to get live users list
 * @param     : 
 * @returns   :
 * @developer : 
 */
 helper.createThumbnailAWSBucket = async (thumbObj, attempt = 0 ) => {
    // console.log("--------create thumbnail---------------------11111111");
    let deferred = q.defer();

    if ( thumbObj && thumbObj.videoName && thumbObj.folderUId && thumbObj.folderPath) {
        // console.log("--------create thumbnail---------------------222222");
        let conObj        = await constant.getConstant(),
            fullMediaPath = thumbObj.folderPath,
            fileName      =  conObj.AWS_CLOUDFRONT_URL + thumbObj.folderPath + thumbObj.videoName;
       
        /** code to create video thumbnail.*/

        clearInterVal();

        try {
            // console.log("--------create thumbnail---------------------33333",fileName);
            let resolution = await helper.getVideoResolution(fileName);

            if ( resolution ) {
                // console.log("--------create thumbnail---------------------44444",resolution);
                let newResu = resolution;

                const tg = new ThumbnailGenerator({

                    sourcePath      : fileName,
                    thumbnailPath   : 'uploads/',//conObj.UPLOAD_PATH,
                    size            : newResu
                });
                // console.log("tgggggggggggggggggggggggggggggggggg=======================",tg)
                let per         = Math.floor(Math.random() * Math.floor(100)),
                    imageData   = await tg.generateOneByPercent(per);
                    // console.log("--------create thumbnail---------------------555555111111",imageData);

                if ( imageData ) {
                    // console.log("--------create thumbnail---------------------555555",imageData);
                    // let filename = thumbObj.videoName,
                    // arr          = filename.split("."),
                    // videoId      = arr[0];
                    // console.log("--------create thumbnail---------------------5555551111111",videoId);
                    let imageDataObj    = {
                        imageName       : imageData,
                        uploadFolder    : fullMediaPath,
                        videoUId        : thumbObj.videoName.split(".")[0]
                    },
                    data                = await helper.uploadThumbnailFileToAwsBucket(imageDataObj);
                        // console.log('sdfsdfsdfsdfsdfsdfsdfsdfsdfsdf========================>>',data)
                    if ( data ) {

                        deferred.resolve(data);

                    } else {
                        deferred.resolve(false);
                    }

                } else {

                    deferred.resolve(false);
                }
            } else {
                deferred.resolve(false);
            }
        } catch ( error ) {
            console.log('dsddfsdfsdfsdfsfsdfsdf=sdf=sdf=sdf=sdf=sd=fsd=fsd=f>>>>>>>>>>>>>',error)
            if ( attempt <= 10 ) {
                intervalArray = setTimeout(async function () {

                    helper.createThumbnailAWSBucket(thumbObj, ++attempt);

                }.bind(helper), 2000);
            } 
        }
    } else {
        deferred.resolve(false);
    }

    return deferred.promise;
}

var intervalArray;

function clearInterVal() {

    if (intervalArray) {
        clearTimeout(intervalArray);
    }
}

/**
 * This function is using to get video resolution for video thumbnail. 
 * @param        :
 * @returns       :
  * @developer : 
 */
helper.getVideoResolution = async (fileName) => {

    let defered = q.defer();

    if ( fileName && fileName != "" ) {

        // https://d34szq77btttp7.cloudfront.net/media/groups/01e7e2d0-5278-11ec-810a-35ad1ff8630d/videos/390d1b80-527e-11ec-8cd1-13889752dd02/01e7e2d0-5278-11ec-810a-35ad1ff8630d-1638346261544.m3u8
        console.log("chhhhhhhhchchchchhc========================>>>>",fileName);
        ffmpeg.ffprobe(fileName, function (err, metadata) {

            if ( err ) {

                console.log("ffmpeg.ffprobeffmpeg.ffprobe=========>>>>>",err);
                defered.resolve(false);

            } else {

                //  console.log("jeeta swweeeettaaaaaasssss----------------------");
                // metadata should contain 'width', 'height' and 'display_aspect_ratio'
                    
                if ( metadata && metadata.streams && metadata.streams[1] && metadata.streams[1].width && metadata.streams[1].height ) {

                    // console.log("111111111------jjjjjj---------------");
                    let resulation = '';

                    if ( (metadata.streams[1].rotation) && (metadata.streams[1].rotation == '-90' || metadata.streams[1].rotation == 90) ) {

                        // console.log("222222222------jjjjjj---------------");
                        resulation = metadata.streams[1].height + "x" + metadata.streams[1].width;
                    } else {

                        // console.log("333333333------jjjjjj---------------");
                        resulation = metadata.streams[1].width + "x" + metadata.streams[1].height;
                    }
                    //  console.log("444444444------jjjjjj---------------");
                    defered.resolve(resulation);
                } else if ( metadata && metadata.streams && metadata.streams[0] && metadata.streams[0].width && metadata.streams[0].height ) {

                    // console.log("555555555------jjjjjj---------------");
                    let resulation = '';
                    if ( (metadata.streams[0].rotation) && (metadata.streams[0].rotation == '-90' || metadata.streams[0].rotation == 90) ) {

                        // console.log("666666666------jjjjjj---------------");
                        resulation = metadata.streams[0].height + "x" + metadata.streams[0].width;
                    } else {

                        console.log("777777777------jjjjjj---------------");
                        resulation = metadata.streams[0].width + "x" + metadata.streams[0].height;
                    }
                    //  console.log("88888888888------jjjjjj---------------");
                    defered.resolve(resulation);

                } else {

                    // console.log("999999999999------jjjjjj---------------");
                    defered.resolve(false);
                }
            }
        });
    } else {

        // console.log("101010101001010------jjjjjj---------------");
        defered.resolve(false);
    }

    return defered.promise;
}

helper.removeAgoraRecodedVideo = async (obj) => {
    // console.log("removeAgoraRecodedVideoremoveAgoraRecodedVideo====>>",obj.sId);
    let defered = q.defer(),
        conObj  = await constant.getConstant(),
        s3      = new AWS.S3({
            accessKeyId     : conObj.AWS_ACCESS_KEY,
            secretAccessKey : conObj.AWS_SECRET_ACCESS_KEY
        }),
        //prefixName = 'agora/video/' + obj.sId;

       // console.log("prefixNameprefixNameprefixName=====>>>>>",prefixName);
  
        bucketParams  = {
            Bucket  : conObj.AWS_BUCKET_NAME,
            Prefix  : obj.path + obj.sId,
        };
        // console.log("bucketParamsbucketParams=====>>>>>",bucketParams)

    s3.listObjects(bucketParams, async function(err, data) {
        if (err) {
            defered.resolve(false);
        } else {
            // console.log("bbbbbbbbb-----eledseeeeee----------",data.Contents);
            for ( var i = 0; i < data.Contents.length; i++ ) {
                    // console.log("what atta============>>>>>>>>>",data.Contents[i].Key);
                let arr = data.Contents[i].Key.split("/");

                // console.log("arrarrarrarrarrarrarrarr=======>>>>>",arr);
                let fileObj = {
                    folderName : obj.path,
                };

                // if (obj.status == "question_answer_video") {
                //     fileObj.fileName   = arr[4];
                // } else if (obj.status == 'groups'){
                //     fileObj.fileName   = arr[5];
                // } else if (obj.status == 'chat_detail_video') {
                //     fileObj.fileName   = arr[5];
                // } else if (obj.status == 'chat_question') {
                //     fileObj.fileName   = arr[5];
                // } else {
                    fileObj.fileName   = arr[2];
                // }
                    
                // console.log("fileddddddddddd=ddddd===========>>>>>>>>",fileObj.fileName);

                    deleteStatus =  await helper.deleteAWSFile(fileObj);

                    if ( deleteStatus ) {
                        defered.resolve(true);
                    } else {
                        defered.resolve(false);
                    }
            }
        }
    })
    return defered.promise;
}


/**
 * This helper is using to add mints in time
 * @developer   :
 * @modified    :
 */
helper.getTimeFormat = async function(type='') {

    let date = new Date();
    let year = date.getFullYear();
    let month = String(date.getMonth() + 1).padStart(2, '0');
    let day = String(date.getDate()).padStart(2, '0');
    let timeDate = `${year}-${month}-${day}`;    

    if(  date && type == 'TIME'){

    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours    = hours % 12;
    hours    = hours ? hours : 12; // the hour '0' should be '12'
    minutes  = minutes < 10 ? '0'+minutes : minutes;
    timeDate = hours + ':' + minutes + ':00 ';

    }

    return timeDate;

}


/**
 * This helper is using to get utc time
 
 */
helper.getUtcTime = async function ( type, date = '' ) {

    let utcTime  = new Date(new Date().toUTCString());
    if( date != '' ) {

        utcTime = new Date(date);
    }
    let dt       = utcTime.getDate(),
        year     = utcTime.getFullYear(),
        month    = utcTime.getMonth()+1,
        hours    = utcTime.getHours(),
        minutes  = utcTime.getMinutes(),
        second   = utcTime.getSeconds();
        hours    = hours < 10 ? '0'+hours : hours;
        minutes  = minutes < 10 ? '0'+minutes : minutes;
        second   = second < 10 ? '0'+second : second;
        strTime  = hours + ':' + minutes + ':' + second;
    
    // console.log('year +'-' + month + '-' + dt', year, month, dt, 'utcTime=====>>>>>>>>>>>', utcTime);

    if ( dt < 10 ) {

        dt = '0' + dt;
    }
    month     = month < 10 ? '0'+month : month;

    if ( type && type != '' && type == 'date' ) {

        returnVal = year +'-' + month + '-' + dt ;
        return returnVal;
    } else if ( type && type != '' && type == 'time' ) {

        return strTime;
    } else {

        return utcTime;
    }
}


module.exports = helper;