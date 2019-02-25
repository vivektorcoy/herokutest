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
    connectionString: process.env.DATABASE_URL || 'postgres://tnvkutdzqbdptn:38dd0a8b1255d1a30f01f94bc771e1095e51956398f1c755e5d510fec2e26340@ec2-107-20-167-11.compute-1.amazonaws.com',
    ssl: true,
  });

client.connect();

 app.post('/updateContact',function(req,res)
 {
     var lead_id = req.body.lead_id;
     var opp_id = req.body.opp_id;
     var con_id = req.body.con_id;
     var LoanExt_id = req.body.LoanExt_id;
     var mobile_number = req.body.mobile_number;
     var device_ID = req.body.device_ID;
     var mpin = req.body.mpin;

     /*var queryString = 'UPDATE salesforce.contact SET';
     queryString += 'SET IVL_Device_Id__c= \''+device_ID+'\'';
     queryString += 'IVL_MPIN__c= \''+mpin+'\'';
     queryString += 'WHERE sfid = \''+con_id+'\'';*/

     client.query('UPDATE salesforce.contact SET IVL_Device_Id__c = ${device_ID}, IVL_MPIN__c=${mpin}  WHERE ID = ${con_id}',(err, res) => {
        if(err)
        {
            throw err;
        }
        else
        {
            res.send('Record updated successfully');
        }
    });
 });

 app.set('port', process.env.PORT || 3001);
 app.listen(app.get('port'), function () {
    console.log('Server listening on port ' + app.get('port'));
});
