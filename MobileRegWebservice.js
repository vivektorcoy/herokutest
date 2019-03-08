module.exports = {
	mobileRegWebService: function(req, res, client) {
		if(req.body.mobile_number != null && req.body.mobile_number != '')
		{
			var updatequery;
			if(req.body.mpin == "" || req.body.mpin== null)
			{
				updatequery = 'UPDATE salesforce.contact SET IVL_Device_Id__c = ($1), IVL_MPIN__c=($2)  WHERE sfid = ($3)';      
			}
			else
			{
				updatequery = 'UPDATE salesforce.contact SET IVL_Device_Id__c = ($1), IVL_MPIN__c=($2),CRD_Stage__c =\'Mobile Registered\'  WHERE sfid = ($3)';
			}

			client.query(updatequery,
			[req.body.device_ID, req.body.mpin, req.body.con_id],
			function(err, result) {
				if (err)
				{
					var apiresponse = {sucess: false, error_message: err}
					res.setHeader('Content-Type','application/json');
					res.send(JSON.stringify(apiresponse));
					//client.query('INSERT INTO salesforce.IVL_Error_Log__c (IVL_API_Name__c,IVL_Is_Error_Exception__c,IVL_Contact__c,IVL_Request__c,IVL_Response__c,IVL_Type__c) VALUES(\'mobileregistration\',true,($1),($2),($3),\'inbound\')',
					client.query("SELECT INSERT_OPERATION(\'IVL_Error_Log__c\',\'IVL_API_Name__c=mobileregistration,IVL_Is_Error_Exception__c=true,IVL_Contact__c=($1),IVL_Request__c=($2),IVL_Response__c=($3),IVL_Type__c= inbound\')",
					[req.body.con_id, req.body, JSON.stringify(apiresponse)],
					function(err, result)
					{
						if (err)
							throw err;
					});
				}
				else
				{
					var apiresponse = {sucess: true, error_message: null}
					res.setHeader('Content-Type','application/json');
					res.send(JSON.stringify(apiresponse));
					//client.query('INSERT INTO salesforce.IVL_Error_Log__c (IVL_API_Name__c,IVL_Is_Error_Exception__c,IVL_Contact__c,IVL_Request__c,IVL_Response__c,IVL_Type__c) VALUES(\'mobileregistration\',false,($1),($2),($3),\'inbound\')',
					client.query("SELECT INSERT_OPERATION(\'IVL_Error_Log__c\',\'IVL_API_Name__c=mobileregistration,IVL_Is_Error_Exception__c=false,IVL_Contact__c=($1),IVL_Request__c=($2),IVL_Response__c=($3),IVL_Type__c= inbound\')",
					[req.body.con_id, req.body, JSON.stringify(apiresponse)],
					function(err, result)
					{
						if (err)
							throw err;
					});
				}
			});
		}
		else
		{
			var apiresponse = {sucess: false, error_message: 'Please provide mobile number'}
			res.setHeader('Content-Type','application/json');
			res.send(JSON.stringify(apiresponse));
		}
	}
};