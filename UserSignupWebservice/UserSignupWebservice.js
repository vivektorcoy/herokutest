module.exports = {

	initiateWebService: function(req, res, client) {
		var userSignupWebserviceRoute = require('./UserSignupWebservice/UserSignupWebservice.js');
		userSignupWebserviceRoute.cardLogic(req, res, client, userSignupWebserviceRoute);
	},

	cardLogic: async function(req, res, client, userSignupWebserviceRoute) {
		if (req.source != null && req.source == 'Flipkart')
		{
			var cardId;

			let contactForCardList = await client.query('SELECT sfid, MobilePhone, LeadSource, IVL_MPIN__c FROM salesforce.contact WHERE MobilePhone= ($1) LIMIT 1',
				[req.mobile_number],
				function(err, result){
					if (err)
						console.error(err.stack);
				});

			if(contactForCardList != null && !contactForCardList.err && contactForCardList.length > 0)
			{
				let contactRelatedCardList = await client.query('SELECT sfid, Name, CRD_Card_Status__c FROM CRD_Card__c LIMIT 1 WHERE CRD_Customer_ID_LF__c= ($1)',
					[contactForCardList.rows[0].sfid],
					function(err, result){
						if (err)
							console.error(err.stack);
					});

				if(contactRelatedCardList != null  && !contactRelatedCardList.err && contactRelatedCardList.length > 0)
				{
					cardId = contactRelatedCardList.rows[0].sfid;
				}
				else
				{
					var contactIdFromQuery = contactForCardList.rows[0].sfid; //var having contactId from the query
					var opportunityQuery = 'SELECT sfid FROM salesforce.opportunity WHERE IVL_Contact__c = \''+contactIdFromQuery+ '\' AND StageName !=\'Archived\'';
					let opportunityList = await client.query(opportunityQuery, (err, res) => {
						if (err)
							console.error(err.stack);
					});

					if(opportunityList.length == 0 && !opportunityList.err)
					{
						//insert Card record
						var cardInsertQuery = 'INSERT INTO salesforce.CRD_Card__c (CRD_Customer_ID_LF__c,CRD_Card_Status__c,CRD_Mobile__c,CRD_Lead_Source__c) VALUES ( ($1),($2),($3),($4) )';
						client.query(cardInsertQuery,
							[contactIdFromQuery,'Basic Customer Details Captured',req.mobile_number,req.source],
							function(err, result) {
								if(err)
									console.error(err.stack);
							});

						//update lead source on contact
						var contactLeadSourceUpdateQuery = 'UPDATE salesforce.contact SET LeadSource= ($1) WHERE sfid= ($2)';
						client.query(contactLeadSourceUpdateQuery, [req.source,contactIdFromQuery],
							function(err, result){
								if(err)
									console.error(err.stack);
							});
					}
					//update Mpin value in contact if its not found
					if(contactForCardList.rows[0].IVL_MPIN__c == null || contactForCardList.rows[0].IVL_MPIN__c == '')
					{
						var randomNumber = Math.random();
						var newMPIN = randomNumber.substring(2,6);
						var contactMPINUpdateQuery = 'UPDATE salesforce.contact SET IVL_MPIN__c= ($1) WHERE sfid= ($2)';
						client.query(contactMPINUpdateQuery, [newMPIN,contactIdFromQuery],
							function(err, result){
								if(err)
									console.error(err.stack);
							});
					}
				}
			}
			else
			{
				//insert Account
				let accountInsertedList = await client.query('INSERT INTO salesforce.account (Name) VALUES (($1)) returning sfid',
					[req.mobile_number],function(err, result){
						if(err)
							console.error(err.stack);
					});
				if(!accountInsertedList.err)
				{
					//insert Contact
					var customerRecordTypeId;
					var randomNumber = Math.random();
					var newMPIN = randomNumber.substring(2,6);

					let contactInsertedList = await client.query('INSERT INTO salesforce.contact (AccountId,LastName,RecordTypeId,MobilePhone,LeadSource,IVL_MPIN__c,CRD_Stage__c) VALUES ( ($1),($2),($3),($4),($5),($6),($7) )',
						[accountInsertedList.rows[0].sfid, req.mobile_number,customerRecordTypeId,req.mobile_number,req.source,newMPIN,'Mobile Registered'],
						function(err, result){
							if(err)
								console.error(err.stack);
						});
					if(!contactInsertedList.err)
					{
						//insert Card
						let cardInsertedList = await client.query('INSERT INTO salesforce.CRD_Card__c (CRD_Card_Status__c,CRD_Customer_ID_LF__c,CRD_Mobile__c,CRD_Lead_Source__c) VALUES ( ($1),($2),($3),($4) ) returning sfid',
							['Basic Customer Details Captured',contactInsertedList.rows[0].sfid,req.mobile_number,req.source],
							function(err, result){
								if(err)
									console.error(err.stack);
							});

						if(!cardInsertedList.err && cardInsertedList != null && cardInsertedList.length > 0)
							cardId = cardInsertedList.rows[0].sfid
					}
				}
			}

			userSignupWebserviceRoute.initiateIdValues(req, res, client, cardId, userSignupWebserviceRoute);
		}
		else
		{
			userSignupWebserviceRoute.initiateIdValues(req, res, client, userSignupWebserviceRoute);
		}
	},

	initiateIdValues: function(req, res, client, cardId, userSignupWebserviceRoute) {
		if(req.body.mobile_number != null && req.body.mobile_number != '')
		{
			if(req.fail_status == 'Success')
			{
				var idJSONobject = {lead_record_id: req.lead_record_id,
					opp_id: req.opp_id,
					con_id: req.con_id,
					acc_id: req.acc_id,
					cardId: req.card_id};

				userSignupWebserviceRoute.furtherpart1(req, res, client, idJSONobject, cardId, userSignupWebserviceRoute);
			}
			else
			{
				userSignupWebserviceRoute.getRecordIds(req, res, client, cardId, userSignupWebserviceRoute);
			}
		}
		else
		{
			var apiresponse = {sucess: false, error_message: 'Please provide mobile number'}
			res.setHeader('Content-Type','application/json');
			res.send(JSON.stringify(apiresponse));
		}
	},

	getRecordIds: async function(req, res, client, cardId, userSignupWebserviceRoute) {
		var mobileNumber = req.body.mobile_number;
		var idJSONobject = {lead_record_id: '', opp_id: '', con_id: '', acc_id: ''};

		//RecordType ids
		var contactDSARecordTypeId;
		var contactEntityRecordTypeId;
		var contactEntityDSARecordTypeId;
		var oppTSTPRecordTypeId;
		var oppTNSTPRecordTypeId;

		//Querying contact
		let contactForRecordIdsList = await client.query('SELECT sfid, AccountId FROM salesforce.contact WHERE MobilePhone = ($1) AND RecordTypeId != ($2) AND RecordTypeId != ($3) AND RecordTypeId != ($4) LIMIT 1',
			[mobileNumber,contactDSARecordTypeId,contactEntityRecordTypeId,contactEntityDSARecordTypeId],
			function(err, result){
				if(err)
					console.error(err.stack);
			});

		let contactRelatedOppForRecordIdsList = await client.query('SELECT sfid FROM salesforce.opportunity WHERE IVL_Contact__c = ($1) AND RecordTypeId != ($2) AND RecordTypeId != ($3) AND StageName != ($4) and StageName != ($5) ORDER BY createdDate DESC',
			[contactForRecordIdsList.rows[0].sfid,oppTSTPRecordTypeId,oppTNSTPRecordTypeId,'Archived','Loan Foreclosed'],
			function(err, result){
				if(err)
					console.error(err.stack);
			});

		let contactRelatedCardForRecordIdsList = await client.query('SELECT sfid,Name,CRD_EMI_Due_Day__c,CRD_Customer_ID_LF__c,CRD_Loan_Amount__c,CRD_EMI_Card_Charges__c,CRD_Card_Limit__c,CRD_Card_Status__c,Card_Threshold__c,CRD_Lead_Source__c,CRD_Email__c,CRD_Mandate_Limit__c,CRD_PAN_Number__c,CRD_Tenure_In_Months_Applied__c,CRD_Aadhaar_First_Name__c,CRD_Aadhaar_Middle_Name__c,CRD_Aadhaar_Last_Name__c,CRD_Decline_Reason__c,CRD_Card_Number__c,CRD_Name_as_on_Aadhaar__c From salesforce.CRD_Card__c WHERE CRD_Customer_ID_LF__c=($1)',
			[contactForRecordIdsList.rows[0].sfid],
			function(err, result){
				if(err)
					console.error(err.stack);
			});

		let contactRelatedLeadForRecordIdsList = await client.query('SELECT sfid FROM salesforce.Lead WHERE isConverted = false And Status != ($1) AND IVLCD_Customer_Contact__c = ($2)',
			['Archived',contactForRecordIdsList.rows[0].sfid],
			function(err, result){
				if(err)
					console.error(err.stack);
			});

		if(contactForRecordIdsList != null && !contactForRecordIdsList.err && contactForRecordIdsList.length > 0)
		{
			idJSONobject.con_id = contactForRecordIdsList.rows[0].sfid;
			idJSONobject.acc_id = contactForRecordIdsList.rows[0].AccountId;

			if(contactRelatedOppForRecordIdsList != null && !contactRelatedOppForRecordIdsList.err && contactRelatedOppForRecordIdsList.length > 0)
			{
				idJSONobject.opp_id = contactRelatedOppForRecordIdsList.rows[0].sfid;
			}
			if(contactRelatedCardForRecordIdsList != null && !contactRelatedCardForRecordIdsList.err && contactRelatedCardForRecordIdsList.length > 0)
			{
				idJSONobject.card_id = contactRelatedCardForRecordIdsList.rows[0].sfid;
				//idJSONobject.objCard = lstContact[0].Cards__r[0]; //Have to do this
			}
			else if(contactRelatedLeadForRecordIdsList != null && !contactRelatedLeadForRecordIdsList.err && contactRelatedLeadForRecordIdsList.length > 0)
			{
				idJSONobject.lead_record_id = contactRelatedLeadForRecordIdsList.rows[0].sfid;
			}
		}
		else
		{
			let leadForRecordIdsList = await client.query('SELECT sfid FROM salesforce.Lead WHERE isConverted = false And Status != ($1) AND MobilePhone = ($2)',
			['Archived',mobileNumber],
			function(err, result){
				if(err)
					console.error(err.stack);
			});

			if(leadForRecordIdsList != null && !leadForRecordIdsList.err && leadForRecordIdsList.length > 0)
			{
				idJSONobject.lead_record_id = leadForRecordIdsList.rows[0].sfid;
			}
		}

		userSignupWebserviceRoute.furtherpart1(req, res, client, idJSONobject, cardId, userSignupWebserviceRoute);
	},

	furtherpart1: function(req, res, client, idJSONobject, receivedcardId, userSignupWebserviceRoute) {
		var oppId = idJSONobject.opp_id;
		var conId = idJSONobject.con_id;
		var accId = idJSONobject.acc_id;
		var cardId;
		//var objCardRecord = idJSONobject.objCard;
		if(req.card_id != null && req.card_id !='')
			cardId = req.card_id;
		else
			cardId = receivedcardId;

		//For Card
		if(cardId != null && cardId != '' && conId != null && conId != '')
		{

		}

	}
};