/** #################################
	Project		 : Bobotracker
	Module		 : Node Server
    Created		 : 2021-11-14
	Developed By : Anil Guleria 
    Description	 : Routes file.
*/

const _commonModel = require('../models/configCommon'),
      helper	   = require('../../configCommon/helpers');
		

let configuration = {};

/**
 * This function is using to get countries listing
 Anil Guleria
 */
configuration.getCountryList = async function(req, res) {

    // console.log('start working data', req.body);

    if(req && typeof req == 'object' ) {
        let userId = await helper.getUUIDByTocken(req);
       
                let result =  await _commonModel.getCountryList(req.body,userId);
               
                if ( result ) {
    
                    helper.successHandler(res, { 
                        payload : result 
                    }, 200);
    
                } else {
                    
                    let obj = {
                        code 	: 'AAA -E1001',
                        message : 'Failed, Please try again.',
                        status  : false
                    };
                    helper.successHandler(res, obj);
    
                }
            
        } else {
    
            helper.errorHandler(res, {
                status  : false
            });
            
        };
}

/**
 * This function is using to add community id
 Anil Guleria
 */
configuration.getStateList = async function(req, res) {
    let returnMessage   = '',
        returnStatus    = false,
        returnCode		= '';
        
    if ( req && req.body && req.body.countryId ) {

        let result = await _commonModel.getAll( req.body.countryId, 'country_id', 'states' );

        if ( result && typeof(result) == 'object' ) {

            returnMessage = {
                payload : result
            };

        } else {

            returnMessage = { 
                message : 'No Record Found.'
            };

        }
        
    } else {

        returnCode = "AAA-E1000";

    }

    if ( typeof returnMessage == 'object' ) {

        helper.successHandler(res, returnMessage, 200);
        
    } else {

        helper.errorHandler(res, {
            status  : returnStatus,
            message : returnMessage,
            code	: returnCode
        }, 500);

    }

}

module.exports = configuration;
