var express = require('express'),
http = require('http'),
request = require('request'),
bodyParser = require('body-parser'),
errorHandler = require('express-error-handler'),
app = express();
app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({
    extended: true
  }));

var pg = require('pg');

var client = new pg.Client({
    connectionString: process.env.DATABASE_URL || 'postgres://tnvkutdzqbdptn:38dd0a8b1255d1a30f01f94bc771e1095e51956398f1c755e5d510fec2e26340@ec2-107-20-167-11.compute-1.amazonaws.com:5432/d41ujuv92orjdv',
    ssl: true,
  });

client.connect();

 app.post('/updateContact',function(req,res)
 {
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
                var apiresponse = {sucess:true,error_message: err}
                res.setHeader('Content-Type','application/json');
                res.send(JSON.stringify(apiresponse)); 
                client.query('INSERT INTO salesforce.IVL_Error_Log__c (IVL_API_Name__c,IVL_Is_Error_Exception__c,IVL_Contact__c,IVL_Request__c,IVL_Response__c,IVL_Type__c) VALUES(\'mobileregistration\',false,($1),($2),($3),\'inbound\')',
                [req.body.con_id, req.body, JSON.stringify(apiresponse)],
                function(err, result) 
                {
                    if (err)
                        throw err;   
                });
            }
            else
            {
                var apiresponse = {sucess:true,error_message: null}
                res.setHeader('Content-Type','application/json');
                res.send(JSON.stringify(apiresponse)); 
                client.query('INSERT INTO salesforce.IVL_Error_Log__c (IVL_API_Name__c,IVL_Is_Error_Exception__c,IVL_Contact__c,IVL_Request__c,IVL_Response__c,IVL_Type__c) VALUES(\'mobileregistration\',false,($1),($2),($3),\'inbound\')',
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
        var apiresponse = {sucess:false,error_message: 'Please provide mobile number!'}
        res.setHeader('Content-Type','application/json');
        res.send(JSON.stringify(apiresponse));
    }
     
});
 
 app.set('port', process.env.PORT || 3001);
 app.listen(app.get('port'), function () {
    console.log('Server listening on port ' + app.get('port'));
});