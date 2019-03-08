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

					var contactId = req.body.con_id;
					var requestBody = req.body;
					var jsonApiResponse = JSON.stringify(apiresponse);

					var param1 = 'IVL_Error_Log__c';
					var param2 = 'IVL_API_Name__c=mobileregistration,IVL_Is_Error_Exception__c=true,IVL_Contact__c='+contactId+',IVL_Request__c='+requestBody+',IVL_Response__c='+jsonApiResponse+',IVL_Type__c= inbound';
					var queryData="SELECT INSERT_OPERATION(\'"+param1+"\',\'"+param2+"\')";
					console.log("query data :::: "+queryData);

					//client.query('INSERT INTO salesforce.IVL_Error_Log__c (IVL_API_Name__c,IVL_Is_Error_Exception__c,IVL_Contact__c,IVL_Request__c,IVL_Response__c,IVL_Type__c) VALUES(\'mobileregistration\',true,($1),($2),($3),\'inbound\')',
					client.query(queryData,
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

					var contactId = req.body.con_id;
					var requestBody = JSON.stringify(req.body);
					var jsonApiResponse = JSON.stringify(apiresponse);

					var param1 = 'IVL_Error_Log__c';
					var param2 = 'IVL_API_Name__c=mobileregistration,IVL_Is_Error_Exception__c=false,IVL_Request__c= test_request,IVL_Response__c= test_response,IVL_Type__c= inbound';
					var queryData="SELECT INSERT_OPERATION(\'"+param1+"\',\'"+param2+"\')";
					console.log("query data else :::: "+queryData);
					//client.query('INSERT INTO salesforce.IVL_Error_Log__c (IVL_API_Name__c,IVL_Is_Error_Exception__c,IVL_Contact__c,IVL_Request__c,IVL_Response__c,IVL_Type__c) VALUES(\'mobileregistration\',false,($1),($2),($3),\'inbound\')',
					client.query(queryData,
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