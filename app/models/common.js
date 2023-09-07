const { image } = require('image-downloader');
const nodeMailer        = require('nodemailer'),
    _                   = require('underscore'),
    spacetime           = require('spacetime'),
    q                   = require('q'),

    connectionManager   = require('../../configCommon/config/db'),
    //notificationSocket  = require('../../connect/call'),
    pool                = require('../../configCommon/config/pool'),
    constant            = require('../../configCommon/config/constants'),
    helper              = require('../../configCommon/helper');

let commonModel         = {};

/**
 * This function is using to send email in stagging server .
 
 */
commonModel.sendEmails = async (emailData) => {

    let conObj      = await constant.getConstant();
    let transporter = nodeMailer.createTransport({
        // host    : 'smtp.gmail.com',
        // port    : 465,
        // secure  : true,
        // auth    : {
          
        //     user    : conObj.NODE_MAILER_USER,
        //     pass    : conObj.NODE_MAILER_PASS
        // }
        host    : 'smtp-relay.sendinblue.com',
        port    : 465,
        secure  : true,
        auth    : {
          
            user    : conObj.SENDINBLUE_USER,
            pass    : conObj.SENDINBLUE_PASS
        }
    });
   
    console.log('asdas wsdxws',transporter);

    let mailOptions = {
        from    : 'Glimpster <' + emailData.from + '>', // sender address
        to      : emailData.to, // list of receivers
        subject : emailData.subject, // Subject line
        html    : emailData.body // html body
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if ( error ) {
            console.log("emaillllll error ::::::: ", error);
            return false;
        }
        console.log("emaillllll info ::::::: ", info);
        return true;

    });

}

/**
 * This function is using to send email 
 * @param        : emailType,userId
 * @returns      :
 * @developer    :
 * @modification :  
 */
commonModel.sendMasterEmail = async function (body) {
    let to          = '',
        conObj      = await constant.getConstant(),
        from        = conObj.SITE_EMAIL,
        sub         = '',
        username    = '';

    if ( body && body.userId && body.emailType ) {

        result = await commonModel.getRowIdAll(body.userId, 'u_id', 'user');

        if ( result && typeof result == 'object' && Object.keys(result).length > 0 ) {

            if ( result.u_name ) {
                username = result.u_name;
            }

            if ( result.u_email ) {
                to = result.u_email;
            }

            results = await commonModel.getRowIdAll(body.emailType, 'me_type', 'master_emails');

            if ( results && typeof results == 'object' && Object.keys(results).length > 0 ) {

                if ( results.me_subject ) {
                    sub = results.me_subject;
                }


                if ( body.text ) {

                    dataEmail = body.text;

                } else {

                    dataEmail = username + ',<br /><br />';
                    dataEmail += results.me_text;
                    dataEmail += '<br /><br /><strong>Regards,</strong><br /><strong> The Bobotracker Team </strong>';

                }


                let emailArray = {
                    to      : to,
                    from    : from,
                    subject : sub,
                    body    : dataEmail

                };

                if ( commonModel.sendEmails(emailArray) ) {

                    // commonModel.insertSentEmailData(emailArray);
                    return true;
                }
                return false;

            }

        }

    }

    return false;


}

/**
 * Used to Ranking cron helper SelectAndInsert
 * @developer   : MANI
 * @modified    :
 */
commonModel.SelectAndInsert = function( sqlQuery, printQuery = false) {
    let deferred = q.defer();

    if ( sqlQuery != '' ) {

        let qe = pool.query( sqlQuery, [] , function ( error, results, fields ) {

            if ( printQuery ) {
                console.log(qe.sql);
            }
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

    }else{
        deferred.resolve(false);
    }

    return deferred.promise;

}

/**
 * Used to get user FCM device tokens.
 * @developer   : Anil Guleria
 * @modified    : 
 */
commonModel.getUserDeviceTokens = async function (userId) {

    let deferred = q.defer();

    if ( userId ) {

        let sql     = `SELECT ud_device_id, ud_token FROM user_devices WHERE ud_fk_u_id = ? AND ud_type = "M"`,
            getData = await commonModel.commonSqlQuery(sql, [userId]);

        if ( getData && getData.length > 0 ) {
            deferred.resolve(getData);
        } else {
            deferred.resolve([]);
        }

    } else {
        deferred.resolve([]);
    }

    return deferred.promise;

}
/**
 * This function is using to insert data
 * @developer   : Anil Guleria
 * @modified    : 
 */
commonModel.insert = function (tablename, data, printQuery = false) {
    let deferred = q.defer();

    if ( tablename != '' && typeof (data) == 'object' ) {

        let i   = 0;
        let len = Object.keys(data).length;
        let col = fakeval = '';
        let val = [];

        _.each(data, function (v, k) {

            let comma = ',';

            if ( i == len - 1 ) {
                comma = '';
            }

            col += k + comma;
            val.push(v);
            fakeval += '?' + comma;
            i++;

        });
        let sql = 'INSERT INTO ' + tablename + '(' + col + ') VALUES(' + fakeval + ')';

        let qe = pool.query(sql, val, function (error, results, fields) {
            if ( printQuery ) {
                console.log(qe.sql);
            }
            //console.log(error,"error");
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
 * Function     : get_total_record
 * Description  : this model use  for get total_record.
 * Developed By : Jatinder Singh
 * Modified By  : 
 */
commonModel.get_total_record = function (sql, column) {
    let deferred = q.defer(),
        numRows  = {
            'total_records' : 0,
            'last'          : 0
        };

    connectionManager.getConnection().then(function (connection) {

        connection.query(sql, function (error, totalRecord) {

            numRows['total_records'] = totalRecord.length;
            numRows['last']          = totalRecord[0][column];

            if ( error ) {
                deferred.reject(error)
            } else {
                deferred.resolve(numRows);
            }

        });

    }).catch(error => {

        deferred.reject(error);

    });

    return deferred.promise;

}

/**
 * API          : get_more_record
 * Description  : This function is using to get more records
 * Developed By : Jatinder Singh
 * Modified By  : 
*/
commonModel.get_more_record = function (sql) {
    let deferred = q.defer();

    connectionManager.getConnection().then(function (connection) {

        connection.query(sql, function (error, moreRecord) {

            let numRows = moreRecord.length;

            if (error) {
                deferred.reject(error)
            } else {
                deferred.resolve(numRows);
            }

        });

    }).catch(error => {
        deferred.reject(error);
    });

    return deferred.promise;

}
/**
 * Function     : get_more_record
 * Description  : This function is using to get row by id
 * Developed By : 
 * Modified By  : 
*/
commonModel.getRowId = function (uuid, wherecolname, selectcolname, tablename) {
    let deferred = q.defer(),
        sql      = 'SELECT ' + selectcolname + ' FROM ' + tablename + ' WHERE ' + wherecolname + ' = "' + uuid + '"';
    //console.log(sql);
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
 * Function     : getRowById
 * Description  : This function is using to get column by id
 * Developed By : 
 * Modified By  : 
*/
commonModel.getRowById = function (uuid, wherecolname, selectcolname, tablename, printQuery = false) {
    let deferred = q.defer(),
        sql      = 'SELECT ' + selectcolname + ' FROM ' + tablename + ' WHERE ' + wherecolname + ' = "' + uuid + '"';

    let query = pool.query(sql, function (error, record) {

        if ( printQuery ) {
            console.log(query.sql);
        }
        if ( error ) {
            deferred.resolve(error);
        } else {

            if ( record && record.length > 0 ) {

                deferred.resolve(record[0][selectcolname]);
            } else {

                deferred.resolve(false);
            }

        }

    });

    return deferred.promise;

}
/**
 * Function     : getRowIdAll
 * Description  : This function is using to get all data of a row
 * Developed By : 
 * Modified By  : 
*/
commonModel.getRowIdAll = async function (uuid, wherecolname, tablename, memberId = '', wherecolnameTwo = '', selectcolname = '*') {
    let deferred = q.defer(),
        sql      = '';

    if ( memberId != "" && wherecolnameTwo != "" ) {
        sql = 'SELECT ' + selectcolname + ' FROM ' + tablename + ' WHERE ' + wherecolname + ' = "' + uuid + '" AND ' + wherecolnameTwo + ' = "' + memberId + '" ';
    } else {
        sql = 'SELECT ' + selectcolname + ' FROM ' + tablename + ' WHERE ' + wherecolname + ' = "' + uuid + '"';
    }

    let a = pool.query(sql, function (error, record) {
        console.log(a.sql);
        // console.log(record,'recordrecordrecord',record);

        if ( error ) {
            deferred.resolve(error);
        } else {
            // console.log('hgbfhjrednjgfvnjkdfmkv');

            if ( record && record.length > 0 ) {
                // console.log('recordrecordrecord',record);
                deferred.resolve(record[0]);
            } else {
                deferred.resolve(false);
            }

        }

    });

    return deferred.promise;

}
/**
 * Function     : getAll
 * Description  : This function is using to get all data of a row in an array
 * Developed By : 
 * Modified By  : 
*/
commonModel.getAll = function (uuid, wherecolname, tablename, selectcolname = '*', whereAnd = '', printSql = false) {
    let deferred = q.defer(),
        sql      = 'SELECT ' + selectcolname + ' FROM ' + tablename + ' WHERE ' + wherecolname + ' = "' + uuid + '"' + whereAnd;

    let consoleData = pool.query(sql, function (error, record) {

        if( printSql ){
            console.log('getAll======================>>>>>>>>>',consoleData.sql);
        }

        if ( error ) {
            deferred.reject(error);
        } else {
            deferred.resolve(record);
        }

    });

    return deferred.promise;

}

/**
 * API          : get_more_record
 * Description  : This function is using to get all data of a row in an array
 * Developed By : 
 * Modified By  : 
*/
commonModel.getAllRecord = function (tablename, where) {
    let deferred = q.defer();
    let sql      = 'SELECT *' + ' FROM ' + tablename + ' Where ' + where;

    pool.query(sql, function (error, record) {

        if ( error ) {
            deferred.resolve(error);
        } else {
            deferred.resolve(record);
        }

    });

    return deferred.promise;

}
/**
 * Function     : socketNotification
 * Description  : 
 * Developed By : 
 * Modified By  : 
*/
commonModel.socketNotification = async function (userId, type = '') {
    let uuid = await commonModel.getRowId(userId, 'u_id', 'u_uuid', 'user');

    let count           = await commonModel.getUnseenNotCount(userId, '1');
    let newMeetingCount = await commonModel.getNewMeetingCount(userId);
    let completeMeeting = await commonModel.getCompleteMeetingCount(userId);

    let notificationCount = 0;

    if ( count && count.length > 0 ) {
        notificationCount = count.length;
    }

    let toSocketId = await commonModel.getUserSocketId(uuid, false);

    if ( toSocketId.length > 0 ) {

        let sendObj = {
            action  : 'NOTIFICATIONS',
            data    : {
                notificationCount       : notificationCount,
                newMeetingCount         : newMeetingCount,
                completeMeetingCount    : completeMeeting
            }
        };

        toSocketId.forEach(function (row) {
            io.to(row.uc_socket_id).emit('call', sendObj);
        });

    }

}
/**
 * This function is using to add secondary emails
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : Vikas Rana
 **/
commonModel.addSecondaryEmails = async function (obj, userId) {
    let deferred    = q.defer(),
        date        = new Date(),
        conObj      = await constant.getConstant();

    if ( obj && userId ) {

        if ( typeof obj == 'object' ) {

            // for ( const result of Object.keys(obj) ) {

            let emailsData = await commonModel.getAllRecord('secondary_emails', 'se_fk_u_id =' + userId);

            if ( emailsData.length < conObj.MAXIMUM_USER_EMAILS ) {

                let emailExist = await commonModel.getRowId(obj.email, 'se_emails', 'se_id', 'secondary_emails');

                if ( emailExist == false ) {

                    obj = {
                        se_fk_u_id  : userId,
                        se_emails   : obj.email,
                        se_updated  : date,
                    }
                    let insertData = await commonModel.insert('secondary_emails', obj, true);

                    if ( insertData && insertData != false ) {

                        deferred.resolve(true);

                    } else {

                        deferred.resolve(false);

                    };

                };

            };

            deferred.resolve(true);

        } else {

            deferred.resolve(false);

        };

    } else {

        deferred.resolve(false);
    };

    return deferred.promise;

};

/**
 * This function is using to add secondary emails
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : 
 */
commonModel.addPrimaryEmail = async function (email, userId, type) {

    let deferred    = q.defer(),
        date        = new Date();

    if ( email && userId ) {

        obj = {
            se_fk_u_id: userId,
            se_emails: email,
            se_updated: date,
        }

        if (type && type == 'FACEBOOK') {
            obj.se_verified = '1';
        }

        result = await commonModel.insert('secondary_emails', obj);

        if (result) {
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
 * This function is using to add secondary emails
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : 
 */
commonModel.getSecondaryEmailObj = async function (userId) {
    let deferred = q.defer();

    if (userId) {

        pool.query("SELECT se_id,se_emails,se_verified FROM secondary_emails WHERE se_fk_u_id = ? ORDER BY se_is_primary_status DESC  ", [userId], function (error, emailsData) {

            if (emailsData && emailsData.length > 0) {
                deferred.resolve(emailsData);
            } else {
                deferred.resolve(false);
            }

        });

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}
/**
 * This function is using to add secondary emails
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : 
 */
commonModel.verifyPrimaryEmail = async function (email, userId) {
    let deferred = q.defer();

    if (email && userId) {

        pool.query("UPDATE secondary_emails SET se_verified = ? WHERE se_emails = ? AND se_fk_u_id = ? ", ['1', email, userId], function (error, row) {

            if (error) {
                deferred.resolve(false);
            } else {

                if (row) {
                    deferred.resolve(true);
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
 * This function is using to check string exist in table or not
 * @param       : 
 * @returns     : 
 * @developer   : Diksha
 * @ModifiedBy  : 
 */
commonModel.checkStringExist = function (wherecolname, value, tablename, whereCondition = "", selectCol) {
    let deferred = q.defer();

    if (wherecolname && value && tablename) {

        let trimVal = value.trim(),
            sql = `SELECT ` + selectCol + ` FROM ` + tablename + ` WHERE ` + wherecolname + ` LIKE '%` + trimVal + `%'`;
        if (whereCondition && whereCondition != '') {
            sql += " AND " + whereCondition;
        }

        pool.query(sql, function (error, result) {

            if (error) {
                deferred.resolve(false);
            } else {

                if (result && result.length > 0) {
                    deferred.resolve(result[0][selectCol]);
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
 * This function is using to check string exist in table or not
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : 
 */
commonModel.checkStringExistOrNot = function (wherecolname, value, tablename, whereCondition = "", selectCol) {
    let deferred = q.defer();

    if (wherecolname && value && tablename) {

        let trimVal = value.trim(),

            sql = "SELECT " + selectCol + " FROM " + tablename + " WHERE " + wherecolname + " = '" + trimVal + "'";

        if (whereCondition && whereCondition != '') {

            sql += " AND " + whereCondition;
        }

        pool.query(sql, function (error, result) {

            if (error) {

                deferred.resolve(false);
            } else {

                if (result && result.length > 0) {

                    deferred.resolve(result[0][selectCol]);

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
 * This function is using to get total rating user count
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : 
 */
commonModel.getRatingUserCount = async function (userId, topicId) {
    let deferred = q.defer(),
        addCondition = "",
        meetingCount = 0,
        videoCount = await commonModel.getVideoRatingCount(userId, topicId);

    if (userId) {

        if (topicId && topicId != '') {
            addCondition = " AND m_fk_t_id = " + topicId;
        }

        let sql = "SELECT m_id FROM meeting LEFT JOIN meeting_user on meeting.m_id = meeting_user.mu_fk_m_id WHERE mu_rating_status = 'Y' AND ( (mu_fk_u_id_member = ? AND (m_entry_type = 'MEETING' OR m_entry_type = 'INSTANT')) OR (mu_fk_u_id_created = ? AND m_entry_type = 'COURSE') ) AND mu_fk_u_id_member != 0 AND mu_cancel_status = '0'" + addCondition,

            row = await commonModel.commonSqlQuery(sql, [userId, userId]);

        if (row && row.length > 0) {
            meetingCount = row.length;
        }

    }

    deferred.resolve(meetingCount + videoCount);

    return deferred.promise;

}
/**
 * This function is using to update sequence column
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : 
 */
commonModel.updateSequence = async function (obj) {
    let deferred = q.defer();

    if (obj) {

        let sql = 'SELECT ' + obj.colName + ' FROM ' + obj.table + ' WHERE ' + obj.delCol + ' = ? ORDER BY ' + obj.colName + ' DESC LIMIT 1',
            result = await commonModel.commonSqlQuery(sql, ['0']);

        if (result && result.length > 0) {

            let updateQuery = "UPDATE " + obj.table + " SET " + obj.colName + " = ?  WHERE " + obj.whereCol + " = ?",
                sequence = result[0][obj.colName] + 1;
            updateData = await commonModel.commonSqlQuery(updateQuery, [sequence, obj.id]);

            if (updateData) {
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

    return deferred.promise;

}
/**
 * This function is using to 
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : Vikas Rana
 */
commonModel.commonSqlQuery = async function (sql, dataArray, printSql = false) {

    let deferred = q.defer();
    if (sql) {

        let qq = pool.query(sql, dataArray, function (error, result) {
            //console.log(error,"error");
            if (printSql) {
                console.log(qq.sql);
            }
            if (error) {
                deferred.resolve(false);
            } else {
                deferred.resolve(result);
            }
        });
    } else {

        deferred.resolve(false);
    }

    return deferred.promise;

}
/**
 * This function is using to add user  activity 
 * @param       : 
 * @returns     : 
 * @developer   : Diksha
 * @ModifiedBy  : 
 */
commonModel.addUserActivity = async function (obj) {
    let deferred = q.defer();

    if (obj) {

        let post = {
            ual_fk_ref_id: obj.id,
            ual_fk_action_user_u_id: obj.userId,
            ual_module_name: obj.module,
            ual_activity: obj.type,
            ual_action_user_type: 'USER',
            ual_description: 'You ' + obj.description,
        },
            result = await commonModel.insert('user_activity_logs', post);

        if (result) {

            if (obj.adminActivity == true) {

                let postOne = {
                    al_fk_au_id: 1,
                    al_fk_module_reference_id: obj.id,
                    al_module_name: obj.module,
                    al_description: 'User  ' + obj.description,
                    al_action_user_type: 'USER',
                    al_activity_action_type: obj.type
                },
                    resultOne = await commonModel.insert('admin_logs_activity', postOne);

                if (resultOne) {
                    deferred.resolve(true);
                } else {
                    deferred.resolve(false);
                }

            }

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
 * This function is using to get total rating user count
 * @param       : 
 * @returns     : 
 * @developer   : Diksha
 * @ModifiedBy  : 
 */
commonModel.getEmailText = async function (type) {
    let deferred = q.defer();

    if (type) {

        let sql = "SELECT emt_body_text FROM email_marketing_system LEFT JOIN email_marketing_template ON emt_id = ems_fk_emt_id WHERE ems_type = ? AND emt_enabled = ? AND emt_deleted = ?",
            data = await commonModel.commonSqlQuery(sql, [type, '1', '0']);

        if (data && data.length > 0) {

            let text = data[0].emt_body_text,
                newText = text.toString().replace(/##/g, '');
            deferred.resolve(newText);

        } else {
            deferred.resolve(false);
        }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}
/**
 * This function is using to get total rating user count
 * @param       : 
 * @returns     : 
 * @developer   : Diksha
 * @ModifiedBy  : 
 */
commonModel.getRatingPercentage = async function (obj, ratingCount) {
    let deferred = q.defer();

    if (obj) {

        let totalRating = obj.oneStar * 1 + obj.twoStar * 2 + obj.threeStar * 3 + obj.fourStar * 4 + obj.fiveStar * 5,
            percentage = ratingCount * 100 / totalRating;
        percentage = parseFloat(percentage).toFixed(2) - 0;
        deferred.resolve(percentage);

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}
/**
 * This function is using to send notification 
 Diksha
 * @modified  : 
 */
commonModel.getFollowStatus = async function (userId, loginUserId) {
    let deferred = q.defer();

    if (userId && loginUserId) {

        let sql = `SELECT uf_id FROM user_follow  WHERE user_follow.uf_fk_u_id = ? AND  uf_follower_u_id = ?`,
            result = await commonModel.commonSqlQuery(sql, [userId,loginUserId]);

        if (result && result.length > 0) {
            deferred.resolve('YES');
        } else {
            deferred.resolve('NO');
        }

    } else {
        deferred.resolve('NO');
    }

    return deferred.promise;

}
/**
 * This function is using to send notification 
 Diksha
 * @modified  : 
 */
commonModel.getFollowerCount = async function (userId) {

    let deferred = q.defer(),
        addCondition = '';

    if (userId) {

        let sqlOne = "SELECT ub_fk_u_id FROM users_block WHERE ub_fk_blocked_u_id = ?",
            res = await commonModel.commonSqlQuery(sqlOne, [userId]);

        if (res && res.length > 0) {

            for (const resultOne of res) {
                addCondition += " AND uf_fk_follower_u_id != " + resultOne.ub_fk_u_id;
            }

        }


        let sql = `SELECT uf_id FROM user_follow  WHERE user_follow.uf_fk_u_id = ? AND user_follow.utef_type = ? ` + addCondition,
            result = await commonModel.commonSqlQuery(sql, [userId, 'USER']);

        if (result && result.length > 0) {
            deferred.resolve(result.length);
        } else {
            deferred.resolve(0);
        }

    } else {
        deferred.resolve(0);
    }

    return deferred.promise;

}
/**
 * This function is using to send notification 
 Diksha
 * @modified  : 
 */
commonModel.getFollowingCount = async function (userId) {
    let deferred = q.defer(),
        addCondition = '';

    if (userId) {

        let sqlOne = "SELECT ub_fk_u_id FROM users_block WHERE ub_fk_blocked_u_id = ?",
            resultOne = await commonModel.commonSqlQuery(sqlOne, [userId]);

        if (resultOne && resultOne.length > 0) {

            for (const res of resultOne) {
                addCondition += " AND uf_fk_u_id != " + res.ub_fk_u_id;
            }

        }

        let sql = `SELECT uf_id FROM user_follow  WHERE user_follow.uf_fk_follower_u_id = ? AND user_follow.utef_type = ? ` + addCondition,
            result = await commonModel.commonSqlQuery(sql, [userId, 'USER']);

        if (result && result.length > 0) {
            deferred.resolve(result.length);
        } else {
            deferred.resolve(0);
        }

    } else {
        deferred.resolve(0);
    }

    return deferred.promise;

}
/**
 * This function is using to send notification 
 Diksha
 * @modified  : 
 */
commonModel.getTotalRecordedVideoCount = async function (topicId, userId) {
    let deferred = q.defer();
    addCondition = '',
        addConOne = '';

    if (userId) {

        let sql = "SELECT ub_fk_u_id FROM users_block WHERE ub_fk_blocked_u_id = ?",
            result = await commonModel.commonSqlQuery(sql, [userId]);

        if (result && result.length > 0) {

            for (const res of result) {
                addConOne += " AND ulsv_fk_u_id != " + res.ub_fk_u_id;
            }
            addConOne += " OR ulsv_fk_u_id IS NULL "

        }

    }

    addConOne = " AND ( ulsv_schedule_broadcast = '1' AND ulsv_is_approved = '1' OR uvv_fk_ulsv_id IS NULL AND ulsv_watched_count > 0 AND ulsv_live_status = '1' AND ulsv_schedule_broadcast = '0' AND ulsv_is_approved = '1' OR uvv_fk_ulsv_id != '' AND ulsv_is_approved = '1' OR uvv_fk_ulsv_id IS NULL  AND ulsv_live_status = '0' AND ulsv_schedule_broadcast = '0' AND ulsv_is_approved = '1' OR ulsv_live_status = '1' AND ulsv_is_approved = '1') ";
    let expireIds = await commonModel.getSoonExpireVideoId();

    if (expireIds && expireIds.length > 0) {

        for (const ress of expireIds) {
            addCondition += " AND ulsv_id != " + ress;
        }

    }

    let sql = `SELECT ulsv_id FROM user_live_saved_videos LEFT JOIN user_videos_views ON user_videos_views.uvv_fk_ulsv_id = user_live_saved_videos.ulsv_id AND uvv_fk_u_id = ? WHERE ulsv_fk_t_id = ? AND ulsv_deleted = ? AND ulsv_schedule_broadcast_is_expired = ?  AND  ulsv_verified_by_guest = 'VERIFIED' AND ulsv_status = '1' AND ulsv_is_submitted = '1' ` + addCondition + addConOne;

    if (topicId) {

        let result = await commonModel.commonSqlQuery(sql, [userId, topicId, '0', '0']);

        if (result && result.length > 0) {
            deferred.resolve(result.length);
        } else {
            deferred.resolve(0);
        }

    } else {
        deferred.resolve(0);
    }

    return deferred.promise;
}
/**
 * This function is used to get total video count
 Diksha
 */
commonModel.getLiveVideoCount = async function (topicId, userId) {
    let deferred = q.defer();
    addCondition = '';

    if (userId) {

        let sql = "SELECT ub_fk_u_id FROM users_block WHERE ub_fk_blocked_u_id = ?",
            result = await commonModel.commonSqlQuery(sql, [userId]);

        if (result && result.length > 0) {

            for (const res of result) {
                addCondition += " AND ulsv_fk_u_id != " + res.ub_fk_u_id;
            }

        }

    }
    let expireIds = await commonModel.getSoonExpireVideoId();

    if (expireIds && expireIds.length > 0) {

        for (const ress of expireIds) {
            addCondition += " AND ulsv_id != " + ress;
        }

    }

    let sql = `SELECT ulsv_id FROM user_live_saved_videos WHERE ulsv_fk_t_id = ? AND ulsv_type = ? AND ulsv_live_status = ? AND ulsv_is_approved = '1' AND  ulsv_verified_by_guest = 'VERIFIED' AND ulsv_status = '1' AND ulsv_is_submitted = '1' and ulsv_deleted = '0' AND ulsv_schedule_broadcast_is_expired = '0' ` + addCondition;

    if (topicId) {

        let result = await commonModel.commonSqlQuery(sql, [topicId, 'LIVE', '1']);

        if (result && result.length > 0) {
            deferred.resolve(result.length);
        } else {
            deferred.resolve(0);
        }

    } else {
        deferred.resolve(0);
    }

    return deferred.promise;

}
/**
 * This function is used to get total video count
 Diksha
 */
commonModel.getUserChannelTopic = async function (userId) {
    let deferred = q.defer(),
        sql = `SELECT ucsd_fk_t_id FROM users_channels_detail WHERE ucsd_fk_u_id = ?`;

    if (userId) {

        let result = await commonModel.commonSqlQuery(sql, [userId]);

        if (result && result.length > 0) {
            deferred.resolve(result[0].ucsd_fk_t_id);
        } else {
            deferred.resolve(false);
        }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}
/**
 * This function is used to get total video count
 Diksha
 */
commonModel.getUserChannelCategory = async function (userId) {
    let deferred = q.defer(),
        sql = `SELECT ucsd_fk_cat_id FROM users_channels_detail WHERE ucsd_fk_u_id = ?`;

    if (userId) {

        let result = await commonModel.commonSqlQuery(sql, [userId]);

        if (result && result.length > 0) {
            deferred.resolve(result[0].ucsd_fk_cat_id);
        } else {
            deferred.resolve(false);
        }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}
/**
 * This function is used to get total video count
 Diksha
 */
commonModel.getUserChannelCommunity = async function (userId) {
    let deferred = q.defer(),
        sql = `SELECT ucsd_fk_com_id FROM users_channels_detail WHERE ucsd_fk_u_id = ?`;

    if (userId) {

        let result = await commonModel.commonSqlQuery(sql, [userId]);

        if (result && result.length > 0) {
            deferred.resolve(result[0].ucsd_fk_com_id);
        } else {
            deferred.resolve(false);
        }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}

/**
 * Used to execute query
 * @params      :
 * @developer   : Anil Guleria
 * @modified    :
 */
commonModel.executeQuery = async function (sqlQuery, dataArray) {

    let deferred = q.defer();

    pool.query(sqlQuery, dataArray, async function (error, result) {

        if (error) {
            deferred.resolve(false);
        } else {
            deferred.resolve(true);
        }

    });

    return deferred.promise;

}
/**
 * This function is using to add secondary emails
 * @param       : 
 * @returns     : 
 * @developer   : Diksha
 * @ModifiedBy  : 
 */
commonModel.getUserChannelData = async function (userId) {
    let deferred = q.defer();

    if (userId) {

        let sql = "SELECT cat_uuid,cat_name,com_uuid,com_name,t_uuid,t_name,t_id FROM users_channels_detail LEFT JOIN topic ON topic.t_id = ucsd_fk_t_id LEFT JOIN category ON category.cat_id = ucsd_fk_cat_id LEFT JOIN community ON community.com_id = ucsd_fk_com_id  WHERE ucsd_fk_u_id = ?",
            result = await commonModel.commonSqlQuery(sql, [userId]);

        if (result && result.length > 0) {

            let recorded_videos_count = await commonModel.getTotalRecordedVideoCount(result[0].t_id),
                live_videos_count = await commonModel.getLiveVideoCount(result[0].t_id);
            result[0].recorded_videos_count = helper.countFormat(recorded_videos_count);
            result[0].live_videos_count = helper.countFormat(live_videos_count);
            bookmarkData = await commonModel.getBookmarkData(userId, result[0].t_id, 'Data');

            if (bookmarkData) {

                result[0].bookmark_topic_status = 'YES';
                result[0].bookmark_uuid = bookmarkData.usb_uuid;

            } else {

                result[0].bookmark_topic_status = 'NO';
                result[0].bookmark_uuid = '';

            }

            delete result[0].t_id;
            deferred.resolve(result[0]);

        } else {
            deferred.resolve({});
        }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}
/**
 * This function is using to add secondary emails
 * @param       : 
 * @returns     : 
 * @developer   : Diksha
 * @ModifiedBy  : 
 */
commonModel.getBookmarkData = async function (userId, tId, status) {
    let deferred = q.defer();

    if (userId && tId) {

        let sql = "SELECT usb_uuid  FROM user_saved_bookmarks  WHERE usb_fk_u_id = ? AND usb_module_type = ? AND usb_fk_reference_id = ? AND usb_type = ?",
            result = await commonModel.commonSqlQuery(sql, [userId, 'TOPIC', tId, 'NONE']);

        if (result && result.length > 0) {

            if (status == 'Data') {
                deferred.resolve(result[0]);
            } else {
                deferred.resolve('YES');
            }

        } else {

            if (status == 'Data') {
                deferred.resolve(false);
            } else {
                deferred.resolve('NO');
            }

        }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}
/**
 * This function is using to add secondary emails
 * @param       : 
 * @returns     : 
 * @developer   : Diksha
 * @ModifiedBy  : 
 */
commonModel.getWatchCount = async function (courseId) {
    let deferred = q.defer();

    if (courseId) {

        let sql = "SELECT csvv_id  FROM course_session_video_views  WHERE csvv_fk_m_id = ? ",
            result = await commonModel.commonSqlQuery(sql, [courseId]);

        if (result && result.length > 0) {
            deferred.resolve(result.length);
        } else {
            deferred.resolve(0);
        }

    } else {
        deferred.resolve(0);
    }

    return deferred.promise;

}
/**
 * This function is using to add secondary emails
 * @param       : 
 * @returns     : 
 * @developer   : Diksha
 * @ModifiedBy  : 
 */
commonModel.getCourseUserRatingCount = async function (courseId) {
    let deferred = q.defer();

    if (courseId) {

        let sql = "SELECT mu_id  FROM meeting_user  WHERE mu_fk_m_id = ? AND mu_rating_status = ?",
            result = await commonModel.commonSqlQuery(sql, [courseId, 'Y']);

        if (result && result.length > 0) {
            deferred.resolve(result.length);
        } else {
            deferred.resolve(0);
        }

    } else {
        deferred.resolve(0);
    }

    return deferred.promise;

}
/**
 * This function is using to get total rating user count
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : 
 */
commonModel.getVideoRatingUserCount = async function (videoId) {
    let deferred = q.defer();

    if (videoId) {

        let sql = "SELECT uvv_id FROM user_videos_views WHERE uvv_fk_ulsv_id = ? AND uvv_rating != ''";

        pool.query(sql, [videoId], function (error, row) {

            if (error) {
                deferred.resolve(0);
            } else {

                if (row && row.length > 0) {
                    deferred.resolve(row.length);
                } else {
                    deferred.resolve(0);
                }

            }

        });

    } else {
        deferred.resolve(0);
    }

    return deferred.promise;

}
/**
 * This function is using to get total rating user count
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : 
 */
commonModel.getMeetingRatingUserCount = async function (meetingId) {
    let deferred = q.defer();

    if (meetingId) {

        let sql = "SELECT m_id FROM meeting LEFT JOIN meeting_user on meeting.m_id = meeting_user.mu_fk_m_id WHERE mu_rating_status = 'Y' AND mu_fk_m_id = ?";

        pool.query(sql, [meetingId], function (error, row) {

            if (error) {
                deferred.resolve(0);
            } else {

                if (row && row.length > 0) {
                    deferred.resolve(row.length);
                } else {
                    deferred.resolve(0);
                }

            }

        });

    } else {
        deferred.resolve(0);
    }

    return deferred.promise;

}
/**
 * This function is using to get total rating user count
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : 
 */
commonModel.getVideoRatingCount = async function (userId, topicId) {
    let deferred = q.defer(),
        addCondition = "";

    if (userId) {

        if (topicId && topicId != '') {
            addCondition = " AND ulsv_fk_t_id = " + topicId;
        }

        let sql = "SELECT uvv_id FROM user_videos_views LEFT JOIN user_live_saved_videos ON user_live_saved_videos.ulsv_id = user_videos_views.uvv_fk_ulsv_id WHERE ulsv_fk_u_id = ? AND uvv_rating != ''" + addCondition;

        pool.query(sql, [userId], function (error, row) {

            if (error) {
                deferred.resolve(0);
            } else {

                if (row && row.length > 0) {
                    deferred.resolve(row.length);
                } else {
                    deferred.resolve(0);
                }

            }

        });

    } else {
        deferred.resolve(0);
    }

    return deferred.promise;

}
/**
 * This function is using to get total rating user count
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : 
 */
commonModel.getBlockedUserStatus = async function (anotherUser, userId) {
    let deferred = q.defer();

    if (userId && anotherUser) {

        let sql = "SELECT ub_id FROM users_block  WHERE ub_fk_u_id = ? AND ub_fk_blocked_u_id = ?";

        pool.query(sql, [userId, anotherUser], function (error, row) {

            if (error) {
                deferred.resolve(false);
            } else {

                if (row && row.length > 0) {
                    deferred.resolve(true);
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
 * This function is using to send notification 
 Diksha
 * @modified  : 
 */
commonModel.getQuestionVideoCount = async function (questionId) {
    let deferred = q.defer(),
        sql = `SELECT ulsv_id FROM user_live_saved_videos LEFT JOIN user_live_saved_videos_questions ON user_live_saved_videos_questions.ulsvq_fk_ulsv_id = user_live_saved_videos.ulsv_id WHERE ulsv_deleted = ? AND ulsv_is_approved = ? AND ulsvq_fk_tq_id = ? AND ulsv_verified_by_guest = ? AND ulsv_status = '1' AND ulsv_is_submitted = '1' `;

    if (questionId) {

        let result = await commonModel.commonSqlQuery(sql, ['0', '1', questionId, 'VERIFIED']);

        if (result && result.length > 0) {
            deferred.resolve(result.length);
        } else {
            deferred.resolve(0);
        }

    } else {
        deferred.resolve(0);
    }

    return deferred.promise;
}

/**
 * This function is using to get user topic
 
 */
commonModel.executeUserQuery = async function (userId) {

    let deferred = q.defer();


    if (userId) {

        let sql = "SELECT user.u_id, user.u_uuid, user.u_full_address, user.u_rating, user.u_name, user.u_email, user.u_image, user.u_latitude, user.u_longitude,ub_current_emp as u_designation,  user.u_phone, user.u_gender, user.u_active_count, user.u_is_available, user.u_is_online, user.u_active, user.u_fk_t_id , user.u_fk_cat_id , topic.t_name , category.cat_name , topic.t_uuid , category.cat_uuid , user.u_country, user.u_state, states.name as state , countries.name as country, user_price.up_group, user_price.up_individual_free_price, user_price.up_group_free_price,user_price.up_in_person_price, user_price.up_online_price, user_price.up_in_person_free,user_price.up_online_free, user_bio.ub_current_emp, user_price.up_individual, user_wallet.uw_balance ,com_uuid,com_name FROM user LEFT JOIN user_price ON user_price.up_fk_u_id = user.u_id LEFT JOIN countries ON countries.id = user.u_country LEFT JOIN states ON states.id = user.u_state LEFT JOIN user_address ON user_address.ua_fk_u_id = user.u_id LEFT JOIN user_wallet ON user_wallet.uw_fk_u_id = user.u_id LEFT JOIN user_bio ON user_bio.ub_fk_u_id = user.u_id LEFT JOIN community ON community.com_id = user.u_fk_com_id LEFT JOIN topic ON topic.t_id = user.u_fk_t_id LEFT JOIN category ON category.cat_id = user.u_fk_cat_id  WHERE u_id = ? ";

        pool.query(sql, [userId], async function (error, results, fields) {

            if (error) {
                deferred.resolve(error);
            } else {

                if (results && results.length > 0) {
                    deferred.resolve(results);
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
 * This function is using to get user meeting
 
 */
commonModel.getUnseenNotCount = async function (userId, isseen) {

    let deferred = q.defer();
    sql = "SELECT un_id from user_notifications WHERE un_fk_receiver_u_id = ?  AND un_isseen != ? AND un_deleted = '0'";

    if (userId) {

    let result = await commonModel.commonSqlQuery(sql,[userId,isseen]);
    if(result ){
        deferred.resolve(result.length);

    } else {
        deferred.resolve(false);

    }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}

/**
 * This function is using to get user meeting
 
 */
commonModel.getUserSocketId = async function (userUuid, ownId = false) {
    let deferred = q.defer();

    if (userUuid && userUuid != '') {

        let sql = '';

        if (ownId) {
            sql = `SELECT uc_socket_id FROM user_connections WHERE uc_fk_u_uuid = ? OR  uc_fk_u_uuid = '` + ownId + `'`;
        } else {
            sql = `SELECT uc_socket_id FROM user_connections WHERE uc_fk_u_uuid = ?`;
        }

        let getData = await helper.getDataOrCount(sql, [userUuid], 'D');

        if (getData) {
            deferred.resolve(getData);
        } else {
            deferred.resolve([]);
        }

    }

    return deferred.promise;

}
/**
 * This function is using to get current user meeting list
 * @param     :
 * @returns   : 
 * @developer : 
 */
commonModel.getNewMeetingCount = async function (userId) {
    let deferred = q.defer(),
        d = spacetime.now('America/Los_Angeles'),
        dDate = d.unixFmt('yyyy-MM-dd'),
        time = d.format('time'),
        cTime = helper.changePstTime(time),
        currentTime = helper.getTimeSimpleFormat(cTime);

    if (userId) {

        let newMeetingSql = "SELECT m_id ,m_entry_type, meeting_user.mu_fk_u_id_created , meeting_user.mu_fk_m_id ,  meeting_user.mu_status from meeting LEFT JOIN meeting_user ON meeting.m_id = meeting_user.mu_fk_m_id where (meeting.m_status = 'N' || meeting.m_status = 'U' ) AND meeting.m_entry_type = 'MEETING' AND meeting.m_date >= '" + dDate + "' AND TIMESTAMP(meeting.m_date, meeting.m_start_time) > '" + dDate + " " + currentTime + "' AND meeting_user.mu_fk_u_id_member = ?  GROUP BY meeting_user.mu_fk_m_id ",
            getData = await helper.getDataOrCount(newMeetingSql, [userId, userId], 'D');

        if (getData && getData.length > 0) {
            deferred.resolve(getData.length);
        } else {
            deferred.resolve(0);
        }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}

/**
 * This function is using to get current user meeting list
 * @param     :
 * @returns   : 
 * @developer : 
 */
commonModel.getCompleteMeetingCount = async function (userId) {
    let deferred = q.defer(),
        d = spacetime.now('America/Los_Angeles'),
        dDate = d.unixFmt('yyyy-MM-dd'),
        time = d.format('time'),
        cTime = helper.changePstTime(time),
        currentTime = helper.getTimeSimpleFormat(cTime);

    if (userId) {

        let sql = "SELECT mu_id FROM meeting_user LEFT JOIN meeting ON meeting.m_id = meeting_user.mu_fk_m_id WHERE m_deleted = '0' AND (( m_entry_type = 'MEETING' AND m_status = 'A' AND meeting_user.mu_fk_u_id_member = ? AND TIMESTAMP(meeting.m_date, meeting.m_end_time) <= '" + dDate + " " + currentTime + "') ||  (m_entry_type = 'COURSE' && m_has_course_session = '1' AND m_is_published_status = 'P' AND meeting_user.mu_fk_u_id_member != 0 AND m_status = 'N' AND meeting.m_fk_u_id = ? AND TIMESTAMP(meeting.m_course_end_date, meeting.m_end_time) <= '" + dDate + " " + currentTime + "')   AND mu_cancel_status = '0'  ";
        getData = await helper.getDataOrCount(sql, [userId, userId, userId, userId], 'D');

        if (getData && getData.length > 0) {
            deferred.resolve(getData.length);
        } else {
            deferred.resolve(0);
        }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}
/**
 * This function is using to send notification 
 Diksha
 * @modified  : 
 */
commonModel.insertSentEmailData = async function (obj) {
    let deferred = q.defer(),
        userId = null,
        emId = '';

    if (obj) {

        if (obj.userId) {
            userId = obj.userId;
        }

        let uuid = uuidv1(Date.now()),

            insertObj = {
                emse_uuid: uuid,
                emse_subject: obj.subject,
                emse_message: obj.body,
                emse_sentby_fk_u_id: userId,
                emse_type: 'HTML',
                emse_status: '1',

            },
            insertedId = await commonModel.insert('email_marketing_sent_emails', insertObj);

        if (insertedId) {

            if (obj.to) {
                emId = await commonModel.getRowId(obj.to, 'em_email', 'em_id', 'email_marketing');
            }

            let euuid = uuidv1(Date.now()),
                detailObj = {
                    emsed_uuid: euuid,
                    emsed_fk_em_id: emId,
                    emsed_fk_emse_id: insertedId,

                },
                insertId = await commonModel.insert('email_marketing_sent_emails_detail', detailObj);

            if (insertId) {

                if (emId) {

                    let d = spacetime.now('America/Los_Angeles'),
                        dDate = d.unixFmt('yyyy-MM-dd'),
                        time = d.format('time'),
                        currentTime = helper.changePstTime(time),
                        transTime = helper.getTimeSimpleFormat(currentTime);
                    dateTime = dDate + ' ' + transTime;

                    let sql = 'UPDATE email_marketing SET em_sent_on = ? WHERE em_id = ?',
                        result = await commonModel.commonSqlQuery(sql, [dateTime, emId]);

                    if (result) {
                        deferred.resolve(true);
                    } else {
                        deferred.resolve(false);
                    }

                }

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

    return deferred.promise;

}
/**
 * Used to update uploaded video data.
 * @developer   : 
 * @modified    :
 * @params      : 
 */
commonModel.getSoonExpireVideoId = async function () {

    let deferred = q.defer(),
        resultOne = [],
        sql = `SELECT ulsv_id,ulsv_schedule_broadcast_date,ulsv_schedule_broadcast_time FROM user_live_saved_videos WHERE  ulsv_schedule_broadcast_is_expired = ? AND ulsv_schedule_broadcast = ? AND  ulsv_verified_by_guest = ?  `,
        dataArray = ['0', '1', 'VERIFIED'],
        result = await commonModel.commonSqlQuery(sql, dataArray);

    if (result && result.length > 0) {

        for (const resOne of result) {

            let date = await helper.getPstDateTime(),
                time = await helper.getPstDateTime('time'),
                vTime = resOne.ulsv_schedule_broadcast_time,
                bDate = await helper.simpleDateFormat(resOne.ulsv_schedule_broadcast_date),
                incTime = await helper.addMintsInTime(bDate, resOne.ulsv_schedule_broadcast_time, 30),
                hr = incTime.substr(0, 2);

            if (vTime) {
                tHr = vTime.substr(0, 2);
            }

            if (hr == "00" && tHr != '00') {
                bDate = await helper.getNextDayDate(bDate);
                bDate = await helper.simpleDateFormat(bDate);
            }

            bDateTime = await helper.conTimeDate(bDate, incTime),
                dateTime = await helper.conTimeDate(date, time);

            if (dateTime >= bDateTime) {

                resultOne.push(resOne.ulsv_id);

            }

        }

        deferred.resolve(resultOne);

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}
/**
 * This function is using to get user meeting
 
 */
commonModel.getComCatName = async function (topicId, type) {
    let deferred = q.defer();

    if (topicId && type) {

        let sqlQuery = `SELECT  cat_name,com_name  FROM topic LEFT JOIN category ON category.cat_id = topic.t_fk_cat_id LEFT JOIN community ON community.com_id = topic.t_fk_com_id WHERE t_deleted = ? AND t_active = ? AND t_is_approved = ? AND t_id = ?`;

        let getData = await commonModel.commonSqlQuery(sqlQuery, ['0', '1', '1', topicId]);

        if (getData) {

            let name = getData[0].com_name;

            if (type == 'catName') {
                name = getData[0].cat_name;
            }
            deferred.resolve(name);

        } else {
            deferred.resolve(false);
        }

    }

    return deferred.promise;

}
/**
 * This function is used to get data 
 
 */
commonModel.getVideoFirstQuestion = async function (videoId) {
    let deferred = q.defer();

    if (videoId) {

        let sql = `SELECT ulsvq_question FROM user_live_saved_videos_questions LEFT JOIN topic_question ON tq_id = ulsvq_fk_tq_id WHERE ulsvq_fk_ulsv_id = ? ORDER BY CASE WHEN ulsvq_sequence IS  NULL THEN ulsvq_id ELSE ulsvq_sequence END  LIMIT 0, 1`,
            dataArrayOne = [videoId],
            question = await commonModel.commonSqlQuery(sql, dataArrayOne);

        if (question && question.length > 0) {

            deferred.resolve(question[0].ulsvq_question);

        } else {
            deferred.resolve('');
        }

    } else {
        deferred.resolve('');
    }

    return deferred.promise;

}
/**
 * This function is used to get language list
 
 */
commonModel.getLanguageList = async function (body) {
    let deferred = q.defer(),
        whereLast = '',
        whereMore = '',
        id = '',
        sortBy = 'l_id',
        sortOrder = 'ASC',
        page = 0,
        records_per_page = 5;

    if (body) {

        if (body.per_page) {
            records_per_page = body.per_page;
        }

        if (body.page) {
            page = body.page;
        }

        if (body.last) {
            whereLast += ' AND language.l_id > ' + body.last;
            whereMore += ' AND language.l_id > ' + body.last;
        }

        if (body.sortOrder) {
            sortOrder = body.sortOrder;
        }

        if (body.sortBy) {
            sortBy = body.sortBy;
        }

        if (body.keyword) {
            whereLast += " AND language.l_name LIKE '%" + body.keyword + "%'";
            whereMore += " AND language.l_name LIKE '%" + body.keyword + "%'";
        }

    }

    let sql = `SELECT l_id as id,l_code,l_name as name FROM language  WHERE l_active = ? AND l_deleted = ? `,
        totalRecordSql = sql,
        moreRecordSql = sql;
    let offset = page * records_per_page;

    totalRecordSql += whereLast + "  ORDER BY " + sortBy + " " + sortOrder;
    moreRecordSql += whereMore + "  ORDER BY " + sortBy + " " + sortOrder;
    sql += whereLast + "  ORDER BY " + sortBy + " " + sortOrder + " LIMIT " + offset + "," + records_per_page;

    let result = await commonModel.commonSqlQuery(sql, ['1', '0']),
        resultOne = await commonModel.commonSqlQuery(totalRecordSql, ['1', '0']);

    if (result && result.sqlMessage) {
        deferred.resolve(false);
    } else {

        let obj = {
            data: [],
            more_records: 0,
            total_records: 0,
            last: id,
        };

        if (result && result.length > 0 && resultOne && resultOne.length > 0) {

            obj.data = result;
            obj.total_records = resultOne.length;
            obj.last = result[0].id;

            for (const resOne of result) {

                if (body.language_checked) {
                    resOne.checked_status = false;
                } else {

                    resOne.checked_status = false;

                    if (resOne.l_code == 'EN') {
                        resOne.checked_status = true;
                    }

                }

            }

            if (body.last) {

                let resultTwo = await commonModel.commonSqlQuery(moreRecordSql, ['1', '0']);

                if (resultTwo && resultTwo.length > 0) {
                    obj.more_records = resultTwo.length;
                    deferred.resolve(obj);
                }

            } else {

                deferred.resolve(obj);
            }

        } else {

            deferred.resolve(obj);

        }

    }

    return deferred.promise;
}

/**
 * This model is using to 
 * @param        :
 * @returns       :
  * @developer : 
 */
commonModel.getHomeNotification = async function (userId, body) {
    let deferred = q.defer(),
        conObj = await constant.getConstant(),
        abc = conObj.SITE_URL + conObj.UPLOAD_PATH + conObj.PROFILE_IMAGE_PATH,
        d = spacetime.now('America/Los_Angeles'),
        whereLast = '',
        id = '',
        page = 0,
        recordsPerPage = conObj.RECORDS_PER_PAGE,
        orderBy = '',
        groupBy = ' n_id ',
        sortOrder = "DESC",
        sortBy = "n_id";


    if (body) {

        if (body.per_page) {
            recordsPerPage = body.per_page;
        }

        if (body.page) {
            page = body.page;
        }

        if (body.sortOrder) {
            sortOrder = body.sortOrder;
        }

        if (body.sortBy) {
            sortBy = body.sortBy;
        }

        if (body.keyword) {
            whereLast += " AND n_message LIKE '%" + body.keyword + "%'";
            whereMore += " AND n_message LIKE '%" + body.keyword + "%'";
        }

    }

    let sql = "select n_id, n_uuid, n_fk_reference_id,n_fk_u_id, n_message, n_title, n_isseen as is_seen, n_type,n_isread,n_fk_receiver_u_id,n_created, u_name, u_uuid,user.u_is_available, user.u_is_online, CONCAT('" + abc + "',user.u_image) as u_image, meeting.m_uuid, meeting.m_subject, meeting.m_date, meeting.m_start_time, meeting.m_course_type,meeting.m_end_time, meeting.m_price, meeting.m_per_seat_price,m_is_free, meeting.m_type,meeting.m_refund_amount_percentage, meeting.m_mode, meeting.m_status,meeting.m_fk_u_id, meeting.m_entry_type,meeting.m_created, topic.t_uuid, topic.t_name, meeting.m_total_minute,meeting.m_per_mint_price,meeting.m_extended_price, topic_question.tq_uuid, topic_question.tq_question FROM user_notifications LEFT JOIN meeting ON user_notifications.n_fk_reference_id = meeting.m_id AND ( n_type = ? OR n_type = ? OR n_type = 'CRC' OR n_type = 'COC' OR n_type = 'CIC' OR n_type = 'CMC' OR n_type = 'I' ) LEFT JOIN topic_question ON user_notifications.n_fk_reference_id = topic_question.tq_id AND n_type = ? LEFT JOIN topic ON user_notifications.n_fk_t_id = topic.t_id  LEFT JOIN user ON user_notifications.n_fk_u_id = user.u_id WHERE n_fk_receiver_u_id = ? AND n_deleted = ?  AND n_dismiss = ?  AND n_home_view = ? AND n_isseen = '0' AND n_isread = '0' ";

    let totalRecordSql = sql,
        offset = page * recordsPerPage;

    totalRecordSql += whereLast + " GROUP BY " + groupBy + " ORDER BY " + sortBy + ' ' + sortOrder;
    sql += whereLast + " GROUP BY " + groupBy + " ORDER BY " + sortBy + ' ' + sortOrder + " LIMIT " + offset + "," + recordsPerPage;
    let result = await commonModel.commonSqlQuery(totalRecordSql, ['M', 'C', 'TQ', userId, '0', '0', '1']),
        resultTwo = await commonModel.commonSqlQuery(sql, ['M', 'C', 'TQ', userId, '0', '0', '1']);
    if (resultTwo && resultTwo.length > 0) {

        for (const resOne of resultTwo) {

            if (resOne.m_price) {
                resOne.m_price = helper.priceFormat(resOne.m_price);
            }

            let tablename = '',
                wherecol = '',
                selectcolname = '';

            switch (resOne.n_type) {
                case "M":
                case "CIC":
                case "CRC":
                case "CMC":
                case "COC":
                case "I":
                    tablename = 'meeting';
                    wherecol = 'm_id';
                    selectcolname = 'm_uuid';
                    break;
                case "C":
                    tablename = 'meeting';
                    wherecol = 'm_id';
                    selectcolname = 'm_uuid';
                    break;
                case "T":
                    tablename = 'topic';
                    wherecol = 't_id';
                    selectcolname = 't_uuid';
                    break;
                case "MQ":
                    tablename = 'meeting_question';
                    wherecol = 'mq_id';
                    selectcolname = 'mq_uuid';
                    break;
                case "TQ":
                    tablename = 'topic_question';
                    wherecol = 'tq_id';
                    selectcolname = 'tq_uuid';
                    break;
                case "TQA":
                    tablename = 'topic_answer';
                    wherecol = 'ta_id';
                    selectcolname = 'ta_uuid';
                    break;
                case "V":
                    tablename = 'user_live_saved_videos';
                    wherecol = 'ulsv_id';
                    selectcolname = 'ulsv_uuid';
                    break;
                case "US":
                    tablename = 'user_status';
                    wherecol = 'us_id';
                    selectcolname = 'us_uuid';
                    break;
                case "RQ":
                    tablename = 'user_request_email_answer';
                    wherecol = 'urea_id';
                    selectcolname = 'urea_uuid';
                    break;
                default:
                    tablename = 'topic';
                    wherecol = 't_id';
                    selectcolname = 't_uuid';
                    break;
            }

            if (resOne.m_status) {

                if (resOne.m_status == 'N') {
                    resOne.m_status = 'New';
                }

                if (resOne.m_status == 'R') {
                    resOne.m_status = 'Rejected';
                }

                if (resOne.m_status == 'C') {
                    resOne.m_status = 'Completed';
                }

                if (resOne.m_status == 'CC') {
                    resOne.m_status = 'Cancelled By Me';
                }

                if (resOne.m_status == 'A') {
                    resOne.m_status = 'Booked';
                }

            }

            if (resOne.n_type == 'CT') {

                resOne.cat_name = await commonModel.getRowById(resOne.n_fk_reference_id, 'cat_id', 'cat_name', 'category');
                resOne.u_image = '';

            }

            if (resOne.n_type == 'CM') {

                resOne.com_name = await commonModel.getRowById(resOne.n_fk_reference_id, 'com_id', 'com_name', 'community');
                resOne.u_image = '';

            }

            if (resOne.n_type == 'T') {

                resOne.t_name = await commonModel.getRowById(resOne.n_fk_reference_id, 't_id', 't_name', 'topic');
                resOne.u_image = '';

            }
            if (resOne.n_type == 'V') {

                resOne.video_price = await commonModel.getRowById(resOne.n_fk_reference_id, 'ulsv_id', 'ulsv_price', 'user_live_saved_videos');

                if (resOne.video_price) {
                    resOne.video_price = helper.priceFormat(resOne.video_price);
                } else {
                    resOne.video_price = 'Free';
                }

            }

            if (resOne.m_entry_type == 'MEETING' || resOne.m_entry_type == 'INSTANT') {

                if (resOne.m_fk_u_id == userId) {

                    resOne.userType = 'STUDENT';

                } else {

                    resOne.userType = 'EXPERT';

                }

            }

            if (resOne.m_entry_type == 'COURSE') {

                if (resOne.m_fk_u_id == userId) {

                    resOne.userType = 'EXPERT';

                } else {

                    resOne.userType = 'STUDENT';

                }

            }

            if (resOne.n_type == 'TQA') {

                let sql = "SELECT ta_uuid,ta_answer,ta_fk_tq_id FROM topic_answer WHERE ta_id = ? ";
                topicAnswer = await commonModel.commonSqlQuery(sql, resOne.n_fk_reference_id);

                if (topicAnswer && topicAnswer.length > 0) {

                    resOne.answer = topicAnswer[0];
                    let sql = "SELECT tq_uuid,tq_question FROM topic_question WHERE tq_id = ? ";
                    topicQuestion = await commonModel.commonSqlQuery(sql, topicAnswer[0].ta_fk_tq_id);

                    if (topicQuestion && topicQuestion.length > 0) {
                        resOne.question = topicQuestion[0];
                    }

                }

            }
            if (resOne.n_type == 'V' && resOne.n_fk_receiver_u_id == resOne.n_fk_u_id) {
                resOne.u_image = '';
            }

            resOne.transactionId = '';
            resOne.m_created = await helper.dateFormat(resOne.m_created);
            resOne.m_per_mint_price = helper.priceFormat(resOne.m_per_mint_price);
            resOne.m_per_seat_price = helper.priceFormat(resOne.m_per_seat_price);
            resOne.m_extentded_price = helper.priceFormat(resOne.m_extended_price);

            if (resOne.n_type != 'P') {

                resOne.n_fk_reference_id = await commonModel.getRowId(resOne.n_fk_reference_id, wherecol, selectcolname, tablename);

            }


            if (resOne.n_type == 'RQ') {

                resOne.video_price = await commonModel.getRowById(resOne.n_fk_reference_id, 'urea_uuid', 'urea_total_question_amount', 'user_request_email_answer');

                if (resOne.video_price) {
                    resOne.video_price = '$' + helper.priceFormat(resOne.video_price);
                } else {
                    resOne.video_price = 'Free';
                }
                resOne.userType = 'EXPERT';

                let requestId = await commonModel.getRowById(resOne.n_fk_reference_id, 'urea_uuid', 'urea_id', 'user_request_email_answer');
                let reqSql = "SELECT urel_fk_u_id FROM user_request_emails_list WHERE urel_fk_u_id = ? AND urel_fk_urea_id = ? ",
                    studentData = await commonModel.commonSqlQuery(reqSql, [userId, requestId]);

                if (studentData && studentData.length > 0) {

                    resOne.userType = 'STUDENT';

                    if (resOne.n_fk_receiver_u_id == userId) {
                        resOne.expert_uuid = resOne.u_uuid;
                    }

                } else {

                    resOne.expert_uuid = await commonModel.getRowById(resOne.n_fk_receiver_u_id, 'u_id', 'u_uuid', 'user');
                }

            }

            if (resOne.n_title == 'Meeting Accepted' || resOne.n_title == 'Book Meeting' || resOne.n_title == 'Meeting Timing' || resOne.n_title == 'Meeting Rejected' || resOne.n_title == 'Course Registration') {

                resOne.u_name = await commonModel.getRowById(resOne.n_fk_receiver_u_id, 'u_id', 'u_name', 'user');

            }

            let newDate = helper.agoTime(resOne.n_created);
            resOne.agoDate = newDate;

            resOne.n_created = helper.dateFormat(resOne.n_created);

            resOne.n_message = helper.capitalizeFirstLetter(resOne.n_message);


            resOne.isKnowEx = '0';

            if ((resOne.n_fk_u_id == userId) || resOne.n_type == 'P') {
                resOne.isKnowEx = '1';
                delete resOne.u_is_online;
                delete resOne.u_is_available;

            }

            delete resOne.n_fk_u_id;

        }
        if (result && result.length > 0) {
            id = result[0].n_id;
        }
        let obj = {
            data: resultTwo,
            more_records: 0,
            total_records: result.length,
            last: id
        };

        await commonModel.sendHomeNotification(userId, obj);

    } else {

        deferred.resolve(false);

    }

    return deferred.promise;

}
/**
 * This function is using to update topic question like count
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : 
 */
commonModel.updateTopicQuestionLikeCount = async function (tqId) {

    let deferred = q.defer();

    if (tqId) {

        let likeCount = 0;

        let sql = "SELECT SUM( ulsvq_like_count) as like_count FROM  user_live_saved_videos_questions WHERE ulsvq_fk_tq_id = ? ",
            sqlQuery = "SELECT COUNT(mq_id) as like_count  FROM  meeting_question  WHERE  mq_fk_tq_id = ? AND mq_like_dislike_status = ?",
            sqlQueryOne = "SELECT SUM( csq_like_count) as like_count FROM course_session_question WHERE csq_fk_tq_id = ?",
            vData = await commonModel.commonSqlQuery(sql, [tqId]),
            cData = await commonModel.commonSqlQuery(sqlQueryOne, [tqId]),
            mData = await commonModel.commonSqlQuery(sqlQuery, [tqId, 'L']);

        if (mData && vData) {

            likeCount = vData[0].like_count + mData[0].like_count + cData[0].like_count;


            let updateQuery = "UPDATE topic_question SET tq_like_count = ? WHERE tq_id = ?";

            pool.query(updateQuery, [likeCount, tqId], async function (error, resultOne) {

                if (resultOne) {
                    deferred.resolve(true);
                } else {
                    deferred.resolve(false);
                }

            });

        }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}
/**
 * This function is using to update topic question dislike count
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : 
 */
commonModel.updateTopicQuestionDislikeCount = async function (tqId) {

    let deferred = q.defer();

    if (tqId) {

        let dislikeCount = 0;

        let sql = "SELECT SUM( ulsvq_dislike_count) as dislike_count FROM  user_live_saved_videos_questions WHERE ulsvq_fk_tq_id = ? ",
            sqlQuery = "SELECT COUNT(mq_id) as dislike_count  FROM  meeting_question  WHERE  mq_fk_tq_id = ? AND mq_like_dislike_status = ?",
            sqlQueryOne = "SELECT SUM( csq_dislike_count) as dislike_count FROM course_session_question WHERE csq_fk_tq_id = ?",
            vData = await commonModel.commonSqlQuery(sql, [tqId]),
            cData = await commonModel.commonSqlQuery(sqlQueryOne, [tqId]),
            mData = await commonModel.commonSqlQuery(sqlQuery, [tqId, 'D']);

        if (mData && vData) {

            dislikeCount = vData[0].dislike_count + mData[0].dislike_count + cData[0].dislike_count;

            let updateQuery = "UPDATE topic_question SET tq_dislike_count = ? WHERE tq_id = ?";

            pool.query(updateQuery, [dislikeCount, tqId], async function (error, resultOne) {

                if (resultOne) {
                    deferred.resolve(true);
                } else {
                    deferred.resolve(false);
                }

            });

        }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}
/**
 * This function is using to update topic question like count
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : 
 */
commonModel.updateCanAnsQuestionLikeCount = async function (tqId, userId) {

    let deferred = q.defer();

    if (tqId) {

        let likeCount = 0;

        let sql = "SELECT SUM( ulsvq_like_count) as like_count FROM  user_live_saved_videos_questions WHERE ulsvq_fk_tq_id = ? AND ulsvq_fk_u_id = ? ",
            sqlQuery = "SELECT COUNT(mq_id) as like_count  FROM  meeting_question  WHERE  mq_fk_tq_id = ? AND mq_like_dislike_status = ? AND mq_fk_u_answerer_id = ?",
            sqlQueryOne = "SELECT SUM( csq_like_count) as like_count FROM course_session_question LEFT JOIN meeting ON csq_fk_m_id = m_id WHERE csq_fk_tq_id = ? AND m_fk_u_id = ?",
            vData = await commonModel.commonSqlQuery(sql, [tqId, userId]),
            cData = await commonModel.commonSqlQuery(sqlQueryOne, [tqId, userId]),
            mData = await commonModel.commonSqlQuery(sqlQuery, [tqId, 'L', userId]);

        if (mData && vData) {

            likeCount = vData[0].like_count + mData[0].like_count + cData[0].like_count;


            let updateQuery = "UPDATE topic_can_answer SET tca_like_count = ? WHERE tca_fk_tq_id = ? AND tca_questioner_fk_u_id = ?";

            pool.query(updateQuery, [likeCount, tqId], async function (error, resultOne) {

                if (resultOne) {
                    deferred.resolve(true);
                } else {
                    deferred.resolve(false);
                }

            });

        }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}
/**
 * This function is using to update topic question dislike count
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : 
 */
commonModel.updateCanAnsQuestionDislikeCount = async function (tqId, userId) {

    let deferred = q.defer();

    if (tqId) {

        let dislikeCount = 0;

        let sql = "SELECT SUM( ulsvq_dislike_count) as dislike_count FROM  user_live_saved_videos_questions WHERE ulsvq_fk_tq_id = ? AND ulsvq_fk_u_id = ?",
            sqlQuery = "SELECT COUNT(mq_id) as dislike_count  FROM  meeting_question  WHERE  mq_fk_tq_id = ? AND mq_like_dislike_status = ? AND mq_fk_u_answerer_id = ?",
            sqlQueryOne = "SELECT SUM( csq_dislike_count) as dislike_count FROM course_session_question LEFT JOIN meeting ON csq_fk_m_id = m_id WHERE csq_fk_tq_id = ? AND m_fk_u_id = ?",
            vData = await commonModel.commonSqlQuery(sql, [tqId, userId]),
            cData = await commonModel.commonSqlQuery(sqlQueryOne, [tqId, userId]),
            mData = await commonModel.commonSqlQuery(sqlQuery, [tqId, 'D', userId]);

        if (mData && vData) {

            dislikeCount = vData[0].dislike_count + mData[0].dislike_count + cData[0].dislike_count;

            let updateQuery = "UPDATE topic_can_answer SET tca_dislike_count = ? WHERE tca_fk_tq_id = ? AND tca_questioner_fk_u_id = ?";

            pool.query(updateQuery, [dislikeCount, tqId, userId], async function (error, resultOne) {

                if (resultOne) {
                    deferred.resolve(true);
                } else {
                    deferred.resolve(false);
                }

            });

        }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}
/**
 * This function is using to update topic question dislike count
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : 
 */
commonModel.getTopicAllPrices = async function (topicId, userId) {

    let deferred = q.defer(),
        conObj = await constant.getConstant(),
        replyMint = conObj.TEXT_REPLY_MINUTES;
    console.log("getTopicAllPricesgetTopicAllPricesgetTopicAllPricesgetTopicAllPricesgetTopicAllPrices");
    if (userId) {

        let sql = "SELECT up_online_price,up_in_person_price,up_instant_call_price,up_video_answer_price,up_text_answer_price,up_message_price,up_instant_call_free,up_video_answer_free,up_text_answer_free,up_message_free,up_online_free,up_in_person_free FROM  user_price WHERE up_fk_u_id = ? AND up_fk_t_id = ?",
            result = await commonModel.commonSqlQuery(sql, [userId, topicId], true);

        if (result && result.length > 0) {

            result[0].up_in_person_price = helper.priceFormat(result[0].up_in_person_price);
            result[0].up_online_price = helper.priceFormat(result[0].up_online_price);
            result[0].up_instant_call_price = helper.priceFormat(result[0].up_instant_call_price);
            result[0].up_video_answer_price = helper.priceFormat(result[0].up_video_answer_price);
            result[0].up_text_answer_price = helper.priceFormat(result[0].up_text_answer_price);
            result[0].up_message_price = helper.priceFormat(result[0].up_message_price);

            deferred.resolve(result[0]);

        } else {

            let sqlOne = "SELECT up_hourly_price,up_online_price,up_in_person_price,up_instant_call_price,up_video_answer_price,up_text_answer_price,up_message_price,up_hourly_free,up_instant_call_free,up_video_answer_free,up_text_answer_free,up_message_free,up_online_free,up_in_person_free FROM  user_price WHERE up_fk_u_id = ? LIMIT 1",
                resultOne = await commonModel.commonSqlQuery(sqlOne, [userId], true);

            if (resultOne && resultOne.length > 0) {

                let perMintPrice = helper.priceFormat(resultOne[0].up_hourly_price / 60),
                    replyPrice = perMintPrice * replyMint;

                if (resultOne[0].up_hourly_free == '1') {

                    resultOne[0].up_in_person_free = '1';
                    resultOne[0].up_online_free = '1';
                    resultOne[0].up_instant_call_free = '1';
                    resultOne[0].up_video_answer_free = '1';
                    resultOne[0].up_text_answer_free = '1';
                    resultOne[0].up_message_free = '1';

                } else {
                    resultOne[0].up_in_person_price = perMintPrice;
                    resultOne[0].up_online_price = perMintPrice;
                    resultOne[0].up_instant_call_price = perMintPrice;
                    resultOne[0].up_video_answer_price = perMintPrice;
                    resultOne[0].up_text_answer_price = replyPrice;
                    resultOne[0].up_message_price = replyPrice;
                }

                deferred.resolve(resultOne[0]);

            } else {
                deferred.resolve('{}');
            }

        }

    } else {
        deferred.resolve('{}');
    }

    return deferred.promise;

}
/**
 * This function is used to get data 
 
 */
commonModel.getUserRank = async function (userId) {
    let deferred = q.defer();

    if (userId) {

        let sql = `SELECT por_rank FROM points_overall_ranking  WHERE por_fk_u_id = ?`,
            dataArrayOne = [userId],
            res = await commonModel.commonSqlQuery(sql, dataArrayOne);

        if (res && res.length > 0) {

            deferred.resolve(res[0].por_rank);

        } else {
            deferred.resolve(0);
        }

    } else {
        deferred.resolve(0);
    }

    return deferred.promise;

}


/**
 * This function is used to get data 
 
 */
commonModel.getUserTopicRank = async function (userId, topicId) {
    let deferred = q.defer();

    if (userId && topicId) {

        let sql = `SELECT ptr_rank FROM points_topic_ranking  WHERE ptr_fk_u_id = ? AND ptr_fk_t_id = ? `,
            dataArrayOne = [userId, topicId],
            res = await commonModel.commonSqlQuery(sql, dataArrayOne);

        if (res && res.length > 0) {

            deferred.resolve(res[0].ptr_rank);

        } else {
            deferred.resolve(0);
        }

    } else {
        deferred.resolve(0);
    }

    return deferred.promise;

}


/**
 * This function is used to get data 
 
 */
commonModel.getTotalTopicExpert = async function (topicId) {
    let deferred = q.defer();

    if (topicId) {

        let sql = `SELECT ut_id FROM user_topic  WHERE ut_deleted = ? AND ut_fk_t_id = ? AND ut_active = ?`,
            dataArrayOne = ['0', topicId, '1'],
            res = await commonModel.commonSqlQuery(sql, dataArrayOne);

        if (res && res.length > 0) {

            deferred.resolve(res.length);

        } else {
            deferred.resolve(0);
        }

    } else {
        deferred.resolve(0);
    }

    return deferred.promise;

}
/**
 * This function is used to get data 
 
 */
commonModel.getUserPercentage = async function (userId) {
    let deferred = q.defer();

    if (userId) {

        let sql = `SELECT por_rank_percentage FROM points_overall_ranking  WHERE por_fk_u_id = ?`,
            dataArrayOne = [userId],
            res = await commonModel.commonSqlQuery(sql, dataArrayOne);

        if (res && res.length > 0) {

            deferred.resolve(res[0].por_rank_percentage);

        } else {
            deferred.resolve(0);
        }

    } else {
        deferred.resolve(0);
    }

    return deferred.promise;

}
/**
 * This function is used to get data 
 
 */
commonModel.addExpertData = async function (userId, topicId) {
    let deferred = q.defer();

    if (userId && topicId) {

        let sql = `SELECT ut_id FROM user_topic  WHERE ut_fk_u_id = ? AND ut_fk_t_id = ?`,
            res = await commonModel.commonSqlQuery(sql, [userId, topicId]);

        if (res && res.length > 0) {

            deferred.resolve(false);

        } else {

            let comId = await commonModel.getRowById(topicId, 't_id', 't_fk_com_id', 'topic'),
                catId = await commonModel.getRowById(topicId, 't_id', 't_fk_cat_id', 'topic'),
                obj = {
                    ut_fk_t_id: topicId,
                    ut_fk_cat_id: catId,
                    ut_fk_com_id: comId,
                    ut_sequence: 1,
                    ut_fk_u_id: userId,
                },
                insertTopicExpert = await commonModel.insert('user_topic', obj);

            if (insertTopicExpert) {
                deferred.resolve(true);
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
 * This function is used to get data 
 
 */
commonModel.getGroupInvitationStatus = async function (groupUuid, userUuid, type) {
    let deferred = q.defer();

    if (groupUuid && userUuid && type) {

        let sql = `SELECT cgp_id FROM conversation_group_participants  WHERE cgp_fk_cg_uuid = ? AND cgp_fk_u_uuid = ? AND cgp_status = ?`,
            dataArrayOne = [groupUuid, userUuid, type],
            res = await commonModel.commonSqlQuery(sql, dataArrayOne);

        if (res && res.length > 0) {

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
 * This function is using to get expert topic status
 
 * @modified  : 
 */
commonModel.getExpertTopicStatus = async function (topicUuid, userId) {
    let deferred = q.defer();

    if (topicUuid && userId) {

        let topicId = await commonModel.getRowId(topicUuid, 't_uuid', 't_id', 'topic');

        if (topicId) {

            let sql = `SELECT ut_id FROM user_topic  WHERE  user_topic.ut_fk_t_id = ? AND ut_fk_u_id = ?`,
                result = await commonModel.commonSqlQuery(sql, [topicId, userId]);

            if (result && result.length > 0) {
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

    return deferred.promise;

}
/**
 * This function is using to update topic question dislike count
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : 
 */
commonModel.getUserTopicData = async function (topicId, userId) {

    let deferred = q.defer();

    if (userId) {

        let sql = "SELECT  ut_rating,t_name,t_uuid,ut_tagline FROM  user_topic LEFT JOIN topic ON t_id = ut_fk_t_id WHERE ut_fk_u_id = ? AND ut_fk_t_id = ?",
            result = await commonModel.commonSqlQuery(sql, [userId, topicId]);

        if (result && result.length > 0) {

            if (result[0].ut_rating && result[0].ut_rating != null && result[0].ut_rating != "") {
                result[0].ut_rating = parseFloat(result[0].ut_rating).toFixed(1) - 0;
                result[0].ut_rating = result[0].ut_rating + 0.0;
            } else {
                result[0].ut_rating = 0.0;
            }
            result[0].like_count = await commonModel.getLikeDisliketopicQuestionCount(topicId, userId, 'like');
            result[0].dislike_count = await commonModel.getLikeDisliketopicQuestionCount(topicId, userId, 'dislike');

            deferred.resolve(result[0]);

        } else {
            deferred.resolve('{}');
        }

    } else {
        deferred.resolve('{}');
    }

    return deferred.promise;

}
/**
 * This function is using to get topic question like dislike count
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : 
 */
commonModel.getLikeDisliketopicQuestionCount = async function (topicId, userId, type) {
    let deferred = q.defer();

    if (topicId && userId && type) {

        if (type == 'like') {
            vColumn = 'ulsv_like_count';
            mColumn = 'm_like_count';
        } else {
            vColumn = 'ulsv_dislike_count';
            mColumn = 'm_dislike_count';
        }

        let sql = "SELECT " + vColumn + " as count FROM  user_live_saved_videos WHERE `ulsv_fk_u_id` = ? AND ulsv_fk_t_id = ? ",
            sqlQuery = "SELECT " + mColumn + " as count FROM meeting LEFT JOIN meeting_user on meeting.m_id = meeting_user.mu_fk_m_id WHERE ( (mu_fk_u_id_member = ? AND (m_entry_type = 'MEETING' OR m_entry_type = 'INSTANT')) OR (mu_fk_u_id_created = ? AND m_entry_type = 'COURSE' AND mu_fk_u_id_member != 0) ) AND m_fk_t_id = ? GROUP BY m_id ",
            getData = await commonModel.likeDislikeCount(sqlQuery, [userId, userId, topicId]),
            vData = await commonModel.likeDislikeCount(sql, [userId, topicId]);

        deferred.resolve(getData + vData);

    } else {
        deferred.resolve(0);
    }

    return deferred.promise;

}
/**
 * This function is used to get data 
 
 */
commonModel.likeDislikeCount = async function (sql, dataArray) {
    let deferred = q.defer();
    let result = await commonModel.commonSqlQuery(sql, dataArray);

    if (result && result.length > 0) {

        let sum = 0;

        for (const resOne of result) {
            sum += resOne.count;
        }

        deferred.resolve(sum);

    } else {
        deferred.resolve(0);
    }

    return deferred.promise;

}
/**
 * This function is using to send notification 
 
 * @modified  : 
 */
commonModel.getTopicUserSkills = async function (userId, topicId) {
    let deferred = q.defer();

    if (userId && topicId) {

        let sql = `SELECT b_id, b_bulit_point FROM topic_user_bulit_point WHERE b_fk_t_id = ? AND b_fk_u_id = ?`,
            result = await commonModel.commonSqlQuery(sql, [topicId, userId]);

        if (result && result.length > 0) {
            deferred.resolve(result);
        } else {
            deferred.resolve([]);
        }

    } else {
        deferred.resolve([]);
    }

    return deferred.promise;

}
/**
 * This function is using to send notification 
 
 * @modified  : 
 */
commonModel.getUserTagLine = async function (userId, topicId) {
    let deferred = q.defer();

    if (userId && topicId) {

        let sql = `SELECT ut_tagline FROM user_topic WHERE ut_fk_u_id = ? AND ut_fk_t_id = ?`,
            result = await commonModel.commonSqlQuery(sql, [userId, topicId]);

        if (result && result.length > 0) {
            deferred.resolve(result[0].ut_tagline);
        } else {
            deferred.resolve('');
        }

    } else {
        deferred.resolve('');
    }

    return deferred.promise;

}
/**
 * Used to insert data into user rating table.
 * @developer   : 
 * @modified    :
 */
commonModel.insertRatingData = async function (obj) {

    let deferred = q.defer();

    if (obj) {

        let rateUuid = uuidv1(Date.now()),
            post = {
                urd_fk_u_id: obj.userId,
                urd_uuid: rateUuid,
                urd_fk_rate_by_u_id: obj.rateByUid,
                urd_type: obj.type,
                urd_rating: obj.rate,
                urd_comment: obj.comment,
                urd_fk_t_id: obj.topicId,
                urd_created: obj.dateTime,
            };

        if (obj.type == 'VIDEO' && obj.videoId) {

            post.urd_fk_ulsv_id = obj.videoId;

        } else if (obj.type == 'CHAT QUESTION ANSWER' && obj.answerId) {

            post.urd_fk_cgqa_id = obj.answerId;

        }
        //console.log(post,"post");
        let insertId = commonModel.insert('user_rating_data', post);
        //console.log(insertId,"insertId");
        if (insertId) {
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
 * This function is using to update like dislike count
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : 
 */
commonModel.updateUserOverAllLikeDislike = async function (userId) {
    let deferred = q.defer();

    if (userId) {

        let dislikeSql = "SELECT utoas_dislike_count as count FROM  user_topic_overall_app_statistics WHERE `utoas_fk_u_id` = ?";
        let likeSql = "SELECT utoas_like_count as count FROM  user_topic_overall_app_statistics WHERE `utoas_fk_u_id` = ?";

        let disLikeData = await commonModel.likeDislikeCount(dislikeSql, [userId]),
            likeData = await commonModel.likeDislikeCount(likeSql, [userId]);

        obj = {
            uoas_fk_u_id: userId,
            uoas_dislike_count: disLikeData,
            uoas_like_count: likeData,
        };

        let sqlData = `SELECT * FROM user_overall_app_statistics WHERE  uoas_fk_u_id = ?`,

            results = await commonModel.commonSqlQuery(sqlData, [userId]);

        if (results && results.length > 0) {
            let updateQuery = "UPDATE user_overall_app_statistics SET uoas_like_count = ?,uoas_dislike_count = ? WHERE  uoas_fk_u_id = ?",
                updateData = await commonModel.commonSqlQuery(updateQuery, [likeData, disLikeData, userId], true);

            if (updateData) {
                deferred.resolve(true);
            } else {
                deferred.resolve(false);
            }

        } else {
            let insertData = await commonModel.insert('user_overall_app_statistics', obj);

            if (insertData) {
                deferred.resolve(true);
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
 * This function is using to update like dislike count
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : 
 */
commonModel.updateUserOverAllTopicLikeDislike = async function (userUuid, userId, groupUuid, topicId) {

    let deferred = q.defer();

    if (userUuid && groupUuid) {

        let topicUuid = await commonModel.getRowById(groupUuid, 'cg_uuid', 'cg_fk_t_uuid', 'conversation_group');

        let dislikeSql = "SELECT SUM(cgp_dislike_count) as disLikeCount FROM  conversation_group_participants LEFT JOIN conversation_group on conversation_group.cg_uuid =  conversation_group_participants.cgp_fk_cg_uuid WHERE conversation_group_participants.cgp_fk_u_uuid = ? AND conversation_group.cg_fk_t_uuid = ?";


        let likeSql = "SELECT SUM(cgp_like_count) as likeCount FROM  conversation_group_participants LEFT JOIN conversation_group on conversation_group.cg_uuid =  conversation_group_participants.cgp_fk_cg_uuid WHERE conversation_group_participants.cgp_fk_u_uuid = ? AND conversation_group.cg_fk_t_uuid = ?";

        let disLikeData = await commonModel.commonSqlQuery(dislikeSql, [userUuid, topicUuid]);
        let likeData = await commonModel.commonSqlQuery(likeSql, [userUuid, topicUuid]);

        let sqlData = `SELECT * FROM user_topic_overall_app_statistics WHERE  utoas_fk_u_id = ? AND utoas_fk_t_id = ?`,

            results = await commonModel.commonSqlQuery(sqlData, [userId, topicId]);

        obj = {
            utoas_fk_u_id: userId,
            utoas_fk_t_id: topicId,
            utoas_like_count: likeData[0].likeCount,
            utoas_dislike_count: disLikeData[0].disLikeCount,
        };
        if (results && results.length > 0) {
            let sql = "UPDATE user_topic_overall_app_statistics SET utoas_like_count = ?, utoas_dislike_count = ? WHERE utoas_fk_u_id = ? AND utoas_fk_t_id = ? ",
                result = await commonModel.commonSqlQuery(sql, [likeData[0].likeCount, disLikeData[0].disLikeCount, userId, topicId], true);

            if (result) {
                deferred.resolve(true);
            } else {
                deferred.resolve(false);
            }
        } else {

            let insertData = await commonModel.insert('user_topic_overall_app_statistics', obj, true);

            if (insertData) {
                deferred.resolve(true);
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
 * This function is using to update like dislike count
 * @param       : 
 * @returns     : 
 * @developer   : Ashwani Kumar
 * @ModifiedBy  :  
 */
commonModel.getCountryList_bk = async function (body,userId) {

    let deferred     = q.defer(),
        conObj       = await constant.getConstant(),
        stateCondition = '',
        addCondition = '';

    if ( body ) {

        if ( body.keywords != null && body.keywords != undefined && body.keywords != '' ) {

            // addCondition += " AND (SELECT state.country_id FROM state AS state LEFT JOIN countries AS cnt ON t.t_id = ut.ut_fk_t_id WHERE t_active = '1' AND t_deleted = '0' AND ut_active = '1' AND ut_deleted = '0' AND t_name LIKE '%" + body.keyword + "%') AND name like '%" + body.keywords + "%'";
            // addCondition += " AND (countries.name like '%" + body.keywords + "%'OR state.name like '%" + body.keywords + "%' )";
            addCondition += " AND countries.name like '%" + body.keywords + "%'";
            stateCondition = "WHERE  state.name like '%" + body.keywords + "%' ";
        }

        // let sql = `SELECT id, state.id , name, state.name , sortname ,CONCAT('` + conObj.API_URL + conObj.UPLOAD_PATH +`country_images/', image ) AS image ,  phonecode,latitude AS lat, longitude AS lng FROM countries LEFT JOIN state AS state ON state.id = id WHERE status = ? ` + addCondition;
        let sql =  `SELECT countries.id, countries.name, sortname ,CONCAT('` + conObj.API_URL + conObj.UPLOAD_PATH +`country_images/', countries.image ) AS image , countries.phonecode, countries.latitude AS lat, countries.longitude AS lng FROM countries WHERE countries.status = '1' ` + addCondition,
        stateSQl = `SELECT state.id , state.name  , CONCAT('` + conObj.API_URL + conObj.UPLOAD_PATH +`country_images/', state.image) AS image,  state.phonecode, state.latitude AS lat, state.longitude AS lng FROM states AS state  ` + stateCondition,
        stateResult =  await commonModel.commonSqlQuery(stateSQl,'',true)

       let a =  pool.query(sql, ['1'], async function (error, result) {
           console.log('====>>>>>>>>>>>', a.sql);

            if (error) {

                deferred.reject(false);
            } else {

                if( stateResult && stateResult.length > 0 ){

                    for(let stateData of stateResult ){

                        result.push(stateData);
                    }

                }

                if( body.userCount && body.userCount != '' && body.userCount == 'YES'  ){

                    for( let countryData of result ){

                        let sql              = 'SELECT u_id FROM user_follow LEFT JOIN user ON user.u_id = user_follow.uf_fk_u_id  WHERE( u_country = ? OR u_state = ? ) AND user_follow.uf_follower_u_id = ? AND u_deleted = ? AND u_enable = ? AND u_active = ?';
                        let countryUserCount = await helper.getDataOrCount(sql,[countryData.name,countryData.name,userId,'0','1','1'],'L');

                        countryData.totalUserCount = (countryUserCount && countryUserCount != false ) ? countryUserCount : 0
                    }

                }


                let obj = {
                    data: result,
                    // conObj           = await constant.getConstant()

                };

                deferred.resolve(obj);

            }
        })


    } else {

        deferred.resolve(false);
    }

    return deferred.promise;

}


/**
 * This function is using to update like dislike count
 * @param       : 
 * @returns     : 
 * @developer   : Ashwani Kumar
 * @ModifiedBy  :  
 */
commonModel.getCountryList = async function (body,userId) {

    let deferred     = q.defer(),
        conObj       = await constant.getConstant(),
        stateCondition = '',
        addCondition = '';

    if ( body ) {

        if ( body.keywords != null && body.keywords != undefined && body.keywords != '' ) {

            // addCondition += " AND (SELECT state.country_id FROM state AS state LEFT JOIN countries AS cnt ON t.t_id = ut.ut_fk_t_id WHERE t_active = '1' AND t_deleted = '0' AND ut_active = '1' AND ut_deleted = '0' AND t_name LIKE '%" + body.keyword + "%') AND name like '%" + body.keywords + "%'";
            // addCondition += " AND (countries.name like '%" + body.keywords + "%'OR state.name like '%" + body.keywords + "%' )";
            addCondition += " AND countries.name like '%" + body.keywords + "%'";
            stateCondition = "WHERE  state.name like '%" + body.keywords + "%' ";
        }

        // let sql = `SELECT id, state.id , name, state.name , sortname ,CONCAT('` + conObj.API_URL + conObj.UPLOAD_PATH +`country_images/', image ) AS image ,  phonecode,latitude AS lat, longitude AS lng FROM countries LEFT JOIN state AS state ON state.id = id WHERE status = ? ` + addCondition;
        let sql =  `SELECT countries.id, countries.name, sortname ,CONCAT('` + conObj.API_URL + conObj.UPLOAD_PATH +`country_images/', countries.image ) AS image , countries.phonecode, countries.latitude AS lat, countries.longitude AS lng FROM countries WHERE countries.status = '1' ` + addCondition,
        stateSQl = `SELECT state.id , state.name  , CONCAT('` + conObj.API_URL + conObj.UPLOAD_PATH +`country_images/', state.image) AS image,  state.phonecode, state.latitude AS lat, state.longitude AS lng FROM states AS state  ` + stateCondition;
        // stateResult =  await commonModel.commonSqlQuery(stateSQl,'',true);

        q.all( [ commonModel.commonSqlQuery(sql,'',true),commonModel.commonSqlQuery(stateSQl,'',true) ]).then( async function (values) {
             console.log('channelModel.deleteChannel==========>>33333333333',values[0]);

            if( body.userCount && body.userCount != '' && body.userCount == 'YES'  ){

                for( let countryData of values[0] ){

                    let sql              = 'SELECT u_id FROM user_follow LEFT JOIN user ON user.u_id = user_follow.uf_fk_u_id  WHERE  u_country = ?  AND user_follow.uf_follower_u_id = ? AND u_deleted = ? AND u_enable = ? AND u_active = ?';
                    let countryUserCount = await helper.getDataOrCount(sql,[countryData.name,userId,'0','1','1'],'L',true);

                    countryData.totalUserCount = (countryUserCount && countryUserCount != false ) ? countryUserCount : 0
                }
                for( let stateData of values[1] ){

                    let sql              = 'SELECT u_id FROM user_follow LEFT JOIN user ON user.u_id = user_follow.uf_fk_u_id  WHERE  u_state = ?  AND user_follow.uf_follower_u_id = ? AND u_deleted = ? AND u_enable = ? AND u_active = ?';
                    let countryUserCount = await helper.getDataOrCount(sql,[stateData.name,userId,'0','1','1'],'L',true);

                    stateData.totalUserCount = (countryUserCount && countryUserCount != false ) ? countryUserCount : 0
                }

            }
            let obj = {
                data: values,
            };

            deferred.resolve(obj);
        }, function(error) {
        
                 deferred.resolve(false);
        });

    //    let a =  pool.query(sql, ['1'], async function (error, result) {
    //        console.log('====>>>>>>>>>>>', a.sql);

    //         if (error) {

    //             deferred.reject(false);
    //         } else {

    //             if( stateResult && stateResult.length > 0 ){

    //                 for(let stateData of stateResult ){

    //                     result.push(stateData);
    //                 }

    //             }

    //             if( body.userCount && body.userCount != '' && body.userCount == 'YES'  ){

    //                 for( let countryData of result ){

    //                     let sql              = 'SELECT u_id FROM user_follow LEFT JOIN user ON user.u_id = user_follow.uf_fk_u_id  WHERE( u_country = ? OR u_state = ? ) AND user_follow.uf_follower_u_id = ? AND u_deleted = ? AND u_enable = ? AND u_active = ?';
    //                     let countryUserCount = await helper.getDataOrCount(sql,[countryData.name,countryData.name,userId,'0','1','1'],'L');

    //                     countryData.totalUserCount = (countryUserCount && countryUserCount != false ) ? countryUserCount : 0
    //                 }

    //             }


    //             let obj = {
    //                 data: result,
    //                 // conObj           = await constant.getConstant()

    //             };

    //             deferred.resolve(obj);

    //         }
    //     })


    } else {

        deferred.resolve(false);
    }

    return deferred.promise;

}



/**
 * Function     : sendNotificationUser
 * Description  : Common function for using send notification to user.
 * Developed By : 
 * Modified By  : 
 */
commonModel.sendNotificationUser = async function (obj) {
    let d         = spacetime.now('America/Los_Angeles'),
        startTime = d.unixFmt('hh:mm:ss');

    if ( obj ) {

        let actions = '';
        if ( obj.actions ) {
            actions = JSON.stringify(obj.actions);
        }
        if ( !obj.sound ) {
            obj.sound = '';
        }
        if ( !obj.android_channel_id ) {
            obj.android_channel_id = '';
        }

        let message = {
            data        : {
                title           : obj.type,
                score           : '850',
                time            : startTime,
                callType        : obj.callType,
                //actions     : actions,
                sender_name     : obj.senderName,
                sender_id       : obj.senderUuid,
                meetingId       : obj.meetingUuid,
                agoraToken      : obj.agoraToken,
                click_action    : 'FLUTTER_NOTIFICATION_CLICK'
            },

            // notification : {
            //     title               : obj.title,
            //     content_available   : true,
            //     priority            : "high",
            //body                : obj.body,
            // sound               : obj.sound,
            // android_channel_id  : obj.android_channel_id
            // }
        };

        if ( obj.type == 'CIC'  || obj.type == 'CMC' ) {
            message.registration_ids = obj.memberDeviceToken;
        } else {

            message.notification  = {
                title     : obj.title,
                body      : obj.body
            };

            message.to                 = obj.memberDeviceToken;
        }
        let result = await commonModel.pushNotification(obj.memberDeviceToken, message, obj.userId, obj.receiverId, obj.referenceId, obj.type, obj.topicId, obj);

        if ( result ) {
            return true;
        } else {
            return false;
        }

    } else {
        return false;
    }

}

/**
 * This function is using to check contest full or not
 
 * @modified  : 
 */
 commonModel.checkContestFullOrNot = async  (contestUuid, contestId, userId) => {
    let deferred = q.defer();

    if ( contestUuid ) {

        let sql = `SELECT ct_views,ct_viewer_count FROM contests WHERE ct_uuid = ?`,
        result  = await commonModel.commonSqlQuery(sql,[contestUuid],true);
        console.log('We are hear ===================>>>>>>>result',result);
        if (result && result.length > 0) {

            // console.log('We are hear ===================>>>>>>>result[0].ct_views == result[0].ct_viewer_count',result[0].ct_views == result[0].ct_viewer_count);
            // isExistSql =  'SELECT ctv_id FROM contest_viewers WHERE ctv_fk_ct_id = ? AND ctv_fk_u_id =? ',
            // isExist    =  await commonModel.commonSqlQuery(isExistSql, [contestId,userId]);
            // console.log('We are hear ===================>>>>>>>isExist',isExist);
            // if( isExist && isExist.length > 0 && isExist != '' ){
            //     console.log('We are hear ===================>>>>>>>ishklasdjasldjadjadjaljdk');
            //     deferred.resolve({status:'NOTFULL'});
    
            // } else {

                if( result[0].ct_views == result[0].ct_viewer_count ){

                    deferred.resolve({status:'FULL'});
    
                } else {
    
                    deferred.resolve({status:'NOTFULL'});
    
                }
            }
           

        // } else {
        //     deferred.resolve(false);
        // }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}

/**
 * This function is using to update Contest Live
 
 * @modified  : 
 */
 commonModel.updateContestLive = async function (contestsUuuid, type) {
    console.log('We are hear ===================>>>>>>>updateContestLive',contestsUuuid,type);
    let deferred = q.defer();

    if (contestsUuuid && type) {

        let sql = `UPDATE contests SET ct_is_live = ? WHERE ct_uuid = ? `,
            result = await commonModel.commonSqlQuery(sql, [type, contestsUuuid],true);

        if (result && result.length > 0) {
            deferred.resolve(result);
        } else {
            deferred.resolve([]);
        }

    } else {
        deferred.resolve([]);
    }

    return deferred.promise;

}

/**
 * Used to insert data into user rating table.
 * @developer   : 
 * @modified    :
 */
commonModel.addUserPointsHistory = async function (obj) {

    let deferred = q.defer();

    if (obj) {

        let post = {
                ph_fk_u_id: obj.userId,
                ph_type: obj.type,
                ph_point: obj.points,
            };
        if( obj.type == 'STORE' ){
            post.ph_fk_s_id = obj.id;
        }
        if( obj.type == 'ADS' ){
            post.ph_fk_ma_id = obj.id;  
        }
        
        //console.log(post,"post");
        let insertId = commonModel.insert('point_history', post);
        //console.log(insertId,"insertId");
        if (insertId) {
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
 * Function     : getAll
 * Description  : This function is using to get all data of a row in an array
 * Developed By : 
 * Modified By  : 
*/
commonModel.deleteDataFormTable = function (uuid, wherecolname, tablename, whereAnd = '', isConsole = false) {
    let deferred = q.defer(),
        sql      = 'DELETE  FROM '+ tablename + ' WHERE ' + wherecolname + ' = "' + uuid + '"' + whereAnd;

    let poolQuery =  pool.query(sql, function (error, record) {
        if( isConsole == true ){
            console.log('deleteDataFormTable==================>>>>',poolQuery.sql);
        }
        if ( error ) {
            deferred.reject(error);
        } else {
            deferred.resolve(record);
        }

    });

    return deferred.promise;

}

module.exports = commonModel;
