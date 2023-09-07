	

const newModelObj = {},
      q           = require('q'),
      helper      = require('../../../configCommon/helper'),
      pool        = require('../../../configCommon/config/pool');



newModelObj.newUser = async function(dataObj){
    // console.log('newUser newUsernewUsernewUsernewUser',dataObj);
    let deferred = q.defer();
    if (dataObj.u_uuid && dataObj.socketId && dataObj.devicePlatform && dataObj.deviceId ) {
        let bundleId = '';

        if ( dataObj.bundleId && dataObj.bundleId != '' ) {
            bundleId = dataObj.bundleId;
        }
        
        let sql         = `INSERT INTO user_connections SET ?`,
            insertValue = {
                "uc_fk_u_uuid"    : dataObj.u_uuid, 
                "uc_socket_id"    : dataObj.socketId ,
                "uc_fcm_token"    : dataObj.fcmToken || null,
                "uc_device_id"    : dataObj.deviceId ,
                "uc_bundle_id"    : bundleId,
                "uc_device_type"  : 'W',
                "uc_platform"     : dataObj.devicePlatform,
                "uc_Email_id"     : dataObj.email || null
            };
        if ( dataObj.devicePlatform && (dataObj.devicePlatform == 'Android' || dataObj.devicePlatform == 'iOS')){
            insertValue.uc_device_type = 'M';
        }
        await newModelObj.deleteDeviceSocketId({ "deviceId" : dataObj.deviceId ,"bundleId":bundleId});
        await newModelObj.deleteSocketId({"socketId": dataObj.socketId});

        let insertData = await helper.getDataOrCount( sql , insertValue , 'U' );

        // console.log('insertDatainsertDatainsertData',insertData);

        if ( insertData && insertData.insertId > 0) {

            // await newModelObj.updateUserOnGoingCall(dataObj.u_uuid, '0');
            // await newModelObj.updateOnlineStatus( dataObj.u_uuid);
            deferred.resolve(true);

        } else {
            deferred.resolve(false);
        }

    } else {
        deferred.resolve(false);
    }

    return deferred.promise;

}

newModelObj.getUserSocketId = async function(userUuid , ownId = false) {
    let deferred = q.defer();
    if ( userUuid && userUuid != '') {
        let sql         = '';
        if ( ownId ) {
            sql = `SELECT uc_socket_id FROM user_connections WHERE uc_fk_u_uuid = ? OR  uc_fk_u_uuid = '`+ownId+`'`;
        } else {
            sql = `SELECT uc_socket_id FROM user_connections WHERE uc_fk_u_uuid = ?`;
        }
        let getData     = await helper.getDataOrCount( sql , [userUuid] , 'D' ,false);

        if ( getData ) {
            deferred.resolve(getData);
        } else {
            deferred.resolve([]);
        }
    }
    return deferred.promise;
}

newModelObj.getUserBusySocketId = async function(userUuid , meetingId) {
    let deferred = q.defer();
    if ( userUuid && userUuid != '') {
        let sql         = `SELECT uc_socket_id FROM user_connections WHERE uc_fk_u_uuid = ? AND uc_fk_m_uuid = ?`,
            getData     = await helper.getDataOrCount( sql , [userUuid , meetingId] );

        if ( getData ) {
            deferred.resolve(getData);
        } else {
            deferred.resolve([]);
        }
    }
    return deferred.promise;
}

newModelObj.getOwnSocketIdOtherDevices = async function(userUuid , socketId) {
    let deferred = q.defer();
    if ( userUuid && userUuid != '') {
        let sql         = `SELECT uc_socket_id FROM user_connections WHERE uc_fk_u_uuid = ? AND uc_socket_id != ?`,
            getData     = await helper.getDataOrCount( sql , [userUuid , socketId] );

        if ( getData ) {
            deferred.resolve(getData);
        } else {
            deferred.resolve([]);
        }
    }
    return deferred.promise;
}

/**
 * Used to get user device tokens.
 * @developer   : 
 * @modified    : 
 */
newModelObj.getUserDeviceTokens = async function(userId,bundleId = '') {
    
    let deferred = q.defer();
    
    if ( userId ) {

        let addCondition = '';

        if ( bundleId && bundleId != '' ) {
            addCondition += " AND ud_bundle_id = '"+bundleId+"'";
        }

        let sql     = `SELECT ud_device_id, ud_token FROM user_devices WHERE ud_fk_u_id = ? `+addCondition,
            getData = await helper.getDataOrCount(sql , [userId]);
            
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
 * Used to get user device tokens.
 * @developer   : 
 * @modified    : 
 */
newModelObj.deleteSocketId = async function( dataObj ){
    let deferred     = q.defer(),
        addCondition =  '';

    if ( dataObj && dataObj.socketId && dataObj.socketId != '' ) {

        if ( dataObj.bundleId && dataObj.bundleId != '' ) {
            addCondition += ' AND uc_bundle_id = '+dataObj.bundleId;
        }

        let sql         = `DELETE FROM user_connections WHERE uc_socket_id = ? `+addCondition,
            deleteData  = await helper.getDataOrCount( sql , [dataObj.socketId] );
        if ( deleteData ) {
            deferred.resolve(true);
        } else {
            deferred.resolve(false);
        }
    }
    return deferred.promise;
}
/**
 * Used to get user device tokens.
 * @developer   : 
 * @modified    : 
 */
newModelObj.deleteDeviceSocketId = async function( dataObj ) {
    let deferred     = q.defer(),
        addCondition =  '';

    if ( dataObj && dataObj.deviceId && dataObj.deviceId != '' ) {

        if ( dataObj.bundleId && dataObj.bundleId != '' ) {
            addCondition += " AND uc_bundle_id = '"+dataObj.bundleId+"'";
        }
        let sql         = `DELETE FROM user_connections WHERE uc_device_id = ? `+addCondition,
            deleteData  = await helper.getDataOrCount( sql , [dataObj.deviceId],'',true );
        if ( deleteData ) {
            deferred.resolve(true);
        } else {
            deferred.resolve(false);
        }
    }
    return deferred.promise;
}
/**
 * Function to check if user is available in meeting or not
 * @developer : Anil Guleria
 * @modified  :
 */
newModelObj.getRowIdAll = function( uuid, wherecolname, tablename , selectcolname ='*' ) {
    let deferred = q.defer();
    let sql = 'SELECT '+ selectcolname +' FROM '+ tablename +' WHERE '+wherecolname+' = "'+ uuid +'"';
    pool.query(sql, function(error, record) {
        if(error) {
            deferred.resolve(error);
        } else {
            if (record && record.length > 0) {
                deferred.resolve(record[0]);
            } else {
                deferred.resolve(false);
            }
        }
    })
    return deferred.promise;
}

newModelObj.getUserBalance = function ( userId ) {
    let deferred    = q.defer(),
    sql             = "SELECT * FROM user_wallet WHERE uw_fk_u_id = ? ";
    pool.query(sql ,[userId], function ( error, results, fields ) { 
        if ( error ) {
            deferred.reject(error);
        } else {
            if ( results.length > 0 ) {
                deferred.resolve(results);
            } else {
                deferred.reject({error:'Insufficient Balance'});
            }
            
        }
    });
    return deferred.promise; 
}

/**
 * Function to check if user is available in meeting or not
 * @developer : Anil Guleria
 * @modified  :
 */
newModelObj.checkUserAvailableInMeeting = async function(userId, meetingId , need = 'A') {
    
    let deferred = q.defer();

    if ( userId && meetingId ) {
        
        let sql         = `SELECT meeting_user.* , meeting.m_entry_type FROM meeting_user LEFT JOIN meeting ON meeting.m_id = meeting_user.mu_fk_m_id WHERE mu_fk_m_id = ? AND (mu_fk_u_id_created = ? OR mu_fk_u_id_member = ?) AND mu_status != ? AND mu_cancel_status ='0'`,
            getData     = await helper.getDataOrCount( sql, [meetingId, userId, userId, 'R'] );

        if ( getData ) {
            if ( need == 'A' ) {
                deferred.resolve(getData);
            } else if ( need == 'O' ) {
                deferred.resolve(getData[0]);
            }
        } else {
            deferred.resolve([]);
        }
    } else {
        deferred.resolve(false);
    }
        
    return deferred.promise;
}

/**
 * Function to get selected data from a table.
 * @developer : Anil Guleria
 * @modified  :
 */
newModelObj.getRowById = function(selectcolname, tablename, wherecolname, uuid) {
    
    let deferred = q.defer();

    if ( uuid && wherecolname && selectcolname && tablename ) {

        let sql = 'SELECT '+ selectcolname +' FROM '+ tablename +' WHERE '+wherecolname+' = "'+ uuid +'"';
     let a =    pool.query(sql, function(error, record) {
            
        //console.log(a.sql,'kjhgfhjkflgjhdsadhjklkfdsaahjljgkfd');
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
    } else {
        deferred.resolve(false);
    }
    return deferred.promise;
}

/**
 * 
 * @developer : 
 * @modified  :
 */
newModelObj.userCurrentStatus = function( userUuid = '') {
    
    let deferred = q.defer();

    if ( userUuid  ) {

        let sql = 'SELECT u_is_online , u_is_available , u_ongoing_call , u_id , u_name FROM user WHERE u_active = ? AND u_uuid = ?';
       let rr = pool.query(sql,[ '1' , userUuid], function(error, record) {
            //console.log(rr.sql,'@@@@@@@@@@@@@@@@@@#############');
            if ( error ) {
                deferred.resolve(error);
            } else {
                if ( record && record.length > 0 ) {
                    deferred.resolve(record[0]);
                } else {
                    deferred.resolve(false);
                }
            }
        })
    } else {
        deferred.resolve(false);
    }
    return deferred.promise;
}

/**
 * 
 * @developer : 
 * @modified  :
 */
newModelObj.updateUserOnGoingCall = function( userUuid = '' , status = '') {
    
    let deferred = q.defer();

    if ( userUuid  && status) {

        let sql = "UPDATE `user` SET `u_ongoing_call` = ? WHERE `user`.`u_uuid` = ?;";
        let rr  = pool.query(sql,[ status , userUuid], function(error, record) {
            console.log(rr.sql,'updateUserOnGoingCall-------------------------------------------------------------------------------------------------');
            if ( error ) {
                deferred.resolve(error);
            } else {

                if ( record ) {
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
 * 
 * @developer : 
 * @modified  :
 */
newModelObj.checkUserMeetingRelation = function( userUuid = '' , meetingId = '') {
    
    let deferred = q.defer();

    if ( userUuid  && status) {

        let sql = "UPDATE `user` SET `u_ongoing_call` = ? WHERE `user`.`u_uuid` = ?;";
        let rr = pool.query(sql,[ status , userUuid], function(error, record) {
            //console.log(rr.sql,'updateUserOnGoingCall');
            if ( error ) {
                deferred.resolve(error);
            } else {
                if ( record ) {
                    deferred.resolve(true);
                } else {
                    deferred.resolve(false);
                }
            }
        })
    } else {
        deferred.resolve(false);
    }
    return deferred.promise;
}

/**
 * 
 * @developer : 
 * @modified  :
 */
newModelObj.exitFromMetting = async function(socket) {
    
    let deferred = q.defer();
    let socketId = socket.id;
    if ( socketId ) {

        let sql = `SELECT * FROM user_connections WHERE uc_socket_id = ? `;
        let rr = pool.query(sql,[ socketId ], async function(error, record) {
            ////console.log(rr.sql,'DISCONNECT');
            if ( error ) {
                deferred.resolve(error);
            } else {
                if ( record && record.length > 0) {
                    //console.log(record[0].uc_fk_m_uuid , 'DISCONNECT');
                    if ( record[0].uc_fk_m_uuid  ) {
                        let roomname = record[0].uc_fk_m_uuid;
                        let leftUser = record[0].uc_fk_u_uuid;

                        socket.leave(roomname);

                        var myRoom = io.sockets.adapter.rooms[roomname] || { length: 0 };
                        var numClients = myRoom.length;
                    
                        //console.log(roomname, ' has ', numClients, ' clients');
                        let updatetUserConnectionSql  = helper.sqlUpdate('user_connections', {uc_fk_m_uuid : ''});
                            updatetUserConnectionSql.sql += 'WHERE uc_fk_u_uuid = ? AND uc_socket_id = ?';
                        let updateData           = await helper.getDataOrCount(updatetUserConnectionSql.sql, [null ,  leftUser , socket.id ], 'U' , true);
                        let updateOngoingStatus  = await newModelObj.updateUserOnGoingCall(leftUser, '0');
                            await newModelObj.deleteSocketId({socketId : socketId});
                        let sendData = {
                                event   : 'userLeft', 
                                userid  : socketId,
                                uuid : leftUser,
                                usersOnlineCount :numClients,
                               
                            };
                            //console.log(sendData , 'LEFT USER DATA');
                        socket.to(roomname).emit( 'message', sendData );
                    }
                    deferred.resolve(true);
                } else {
                    deferred.resolve(false);
                }
            }
        })
    } else {
        deferred.resolve(false);
    }
    return deferred.promise;
}

/**
 * 
 * @developer : 
 * @modified  :
 */
newModelObj.getMeetingData = async function( meetingId = '') {
    
    let deferred = q.defer();

    if ( meetingId && meetingId != '') {

        let meetingData  = await newModelObj.getRowIdAll( meetingId , 'm_uuid' , 'meeting' ) ;
        deferred.resolve(meetingData);
    } else {
        deferred.resolve(false);
    }
    return deferred.promise;
}

/**
 * This function is using to insert data
 * @developer   : Anil Guleria
 * @modified    : 
 */
newModelObj.insert = function( tablename, data ) {
    let deferred = q.defer();

    if ( tablename != '' && typeof( data ) == 'object' ) {
       
        let i   = 0;
        let len = Object.keys( data ).length;
        let col = fakeval = '';
        let val = [];
        _.each(data, function ( v, k ) {
            let comma = ',';
            if ( i == len-1 ) {
                comma = '';
            }
            col += k+comma;
            val.push(v);
            fakeval += '?'+comma;
            i++;
        });
        let sql = 'INSERT INTO '+ tablename +'('+ col +') VALUES('+ fakeval +')';

        pool.query( sql, val , function ( error, results, fields ) {
            if ( error ) {
                deferred.resolve(error);
            } else {
                if( results && results.insertId > 0 ) {
                    deferred.resolve(results.insertId);
                } else {
                    deferred.resolve(false);
                }
            }
        })

    }

    return deferred.promise;

}

/**
 * 
 * @developer : 
 * @modified  :
 */
newModelObj.checkUserbolckedStatus = function( blockedBy = '' , bolockedTo = '') {
    
    let deferred = q.defer();

    if ( blockedBy  && bolockedTo) {

        let sql = "SELECT * FROM `users_block` WHERE ub_fk_u_id = ? AND ub_fk_blocked_u_id = ?";
        let rr = pool.query(sql,[ blockedBy , bolockedTo], function(error, record) {
            //console.log(rr.sql,'bolcked USER');
            if ( error ) {
                deferred.resolve(false);
            } else {
                if ( record && record.length > 0) {
                    deferred.resolve(true);
                } else {
                    deferred.resolve(false);
                }
                //console.log(record , 'recordrecord');
            }
        })
    } else {
        deferred.resolve(false);
    }
    return deferred.promise;
}

/**
 * Function     : get_more_record
 * Description  : This function is using to get row by id
 * Developed By : 
 * Modified By  : 
*/
newModelObj.getRowId = function( uuid, wherecolname, selectcolname, tablename ) {
    let deferred = q.defer(),
        sql      = 'SELECT '+ selectcolname +' FROM '+ tablename +' WHERE '+wherecolname+' = "'+ uuid +'"';

    pool.query(sql, function( error, record ) {
        if ( error ) {
            deferred.reject( error )
        } else {

            if ( record && record.length > 0 ) {
                deferred.resolve( record[0][selectcolname] );
            } else {
                deferred.resolve( false );
            }

        }

    });

    return deferred.promise;

}


/**
 * This function is using to get total rating user count
 * @param       : 
 * @returns     : 
 * @developer   : Diksha
 * @ModifiedBy  : 
 */
newModelObj.getEmailText = async function(type) {
    let deferred     = q.defer();

    if ( type ) {

        let sql  = "SELECT me_text FROM master_emails  WHERE me_type = ?",
            data = await newModelObj.commonSqlQuery(sql,[type]);

        if ( data  && data.length > 0 ) {
            deferred.resolve(data[0].me_text);
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
 * @ModifiedBy  : 
 */
newModelObj.commonSqlQuery = async function(sql, dataArray,printQuery = false) {
    let deferred = q.defer();

    let q1 = pool.query(sql, dataArray, function(error, result) {

        if ( printQuery ) {
            console.log(q1.sql);
        }
        if ( error ) {
            deferred.resolve(false);
        } else {
            deferred.resolve(result);
        }

    });

    return deferred.promise;

}

/**
 * This function is using to 
 * @param       : 
 * @returns     : 
 * @developer   : 
 * @ModifiedBy  : 
 */
newModelObj.getVoipTokens = async function(userId ) {
    let deferred = q.defer();
    if ( userId ) {
        let sql         = 'SELECT ud_voip FROM `user_devices` WHERE ud_fk_u_id = ? AND ud_platform = "iOS" AND ( ud_voip != NULL OR ud_voip != "")',
            getData     = await helper.getDataOrCount( sql , [userId] ,"D" ,true);

        if ( getData ) {
            deferred.resolve(getData);
        } else {
            deferred.resolve([]);
        }
    }
    return deferred.promise;
}
/**
 * 
 * @developer :
 * @modified  :
 */
newModelObj.updateBothUserOngoingCallStatus = async function(socket) {
    
    let deferred = q.defer();

    if ( socket ) {

        let socketId = socket.id;

        let sql    = `SELECT * FROM user_connections WHERE uc_socket_id = ? `,
            record = await  newModelObj.commonSqlQuery(sql,[ socketId ],true);
        if ( record && record.length > 0) {

            let userUuid = record[0].uc_fk_u_uuid;


            console.log('userUuiduserUuiduserUuiduserUuid Anshu ',userUuid)

            // let updateOngoingStatus  = await newModelObj.updateUserOnGoingCall(userUuid, '0');

            // if ( updateOngoingStatus ) {

            //     let anotherUserId = await newModelObj.getInstantCallAnotherUserId(userUuid);

            //     if ( anotherUserId ) {
            //         let updateOngoingStatusOne  = await newModelObj.updateUserOnGoingCall(anotherUserId, '0');
            //     }

            //     await newModelObj.updateSocketOnlineStatus({socketId : socketId});
            //     await newModelObj.updateUserOnlineStatus(userUuid);

            //     deferred.resolve(true);

            // } else {
            //     deferred.resolve(false);
            // }
        
        } else {
            deferred.resolve(false);
        }
          
    } else {
        deferred.resolve(false);
    }
    return deferred.promise;
}
/**
 * Function to check if user is available in meeting or not
 * @developer : 
 * @modified  :
 */
newModelObj.updateUserOnlineStatus = async function(userUuid) {
    
    let deferred = q.defer();

    if ( userUuid ) {

        let sql         = `SELECT uc_id FROM user_connections WHERE uc_fk_u_uuid = ? AND uc_online = ?`,
            getData     = await newModelObj.commonSqlQuery( sql, [userUuid,'1'] );

        let sqlOne    = '',
            dataArray = [];

        if ( getData && getData.length > 0 ) {

            sqlOne         = "UPDATE  `user` SET `u_is_online` = ? WHERE `u_uuid` = ? ";
            dataArray      = ['1',userUuid];
        } else {

            sqlOne         = "UPDATE  `user` SET `u_is_online` = ? WHERE `u_uuid` = ? ";
            dataArray      = ['0',userUuid];

        }

        let updateData  = await helper.getDataOrCount( sqlOne , dataArray);

        if ( updateData ) {
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
 * Function to check if user is available in meeting or not
 * @developer : 
 * @modified  :
 */
newModelObj.getInstantCallAnotherUserId = async function(userUuid) {
    
    let deferred = q.defer();

    if ( userUuid ) {

        let userId      = await newModelObj.getRowId(userUuid,'u_uuid','u_id','user');

        if ( userId ) {

            let sql         = `SELECT  m_id FROM meeting WHERE m_fk_u_id = ? AND m_call_status = ? ORDER BY m_id DESC LIMIT 1`,
                getData     = await newModelObj.commonSqlQuery( sql, [userId,'ONGOING'],true );

            if ( getData && getData.length > 0 ) {

                let anotherUserId =  await newModelObj.getRowId(getData[0].m_id,'mu_fk_m_id','mu_fk_u_id_member','meeting_user');
                deferred.resolve(anotherUserId);

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
 * Used to get user device tokens.
 * @developer   : 
 * @modified    : 
 */
newModelObj.updateSocketOnlineStatus = async function( dataObj ) {
    let deferred     = q.defer(),
        addCondition =  '';

    if ( dataObj && dataObj.socketId && dataObj.socketId != '' ) {

        if ( dataObj.bundleId && dataObj.bundleId != '' ) {
            addCondition += ' AND uc_bundle_id = '+dataObj.bundleId;
        }

        let sql         = `UPDATE  user_connections SET uc_online = ? WHERE uc_socket_id = ? `+addCondition,
            updateData  = await helper.getDataOrCount( sql , ['0',dataObj.socketId] );
        if ( updateData ) {
            deferred.resolve(true);
        } else {
            deferred.resolve(false);
        }
    }
    return deferred.promise;
}
/**
 * 
 * @developer : 
 * @modified  :
 */
 newModelObj.updateOnlineStatus = function( userUuid = '' ) {
    
    let deferred = q.defer();

    if ( userUuid ) {

        let sql = "UPDATE `user` SET `u_is_online` = ? WHERE `user`.`u_uuid` = ?;";

        pool.query(sql,[ '1' , userUuid], function(error, record) {

            if ( error ) {
                deferred.resolve(error);
            } else {

                if ( record ) {
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
module.exports = newModelObj;