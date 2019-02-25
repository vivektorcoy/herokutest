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
    client.query('UPDATE salesforce.contact SET IVL_Device_Id__c=($1), IVL_MPIN__c=($2)  WHERE sfid=($3)',
     [req.body.device_ID, req.body.mpin, req.body.con_id],
     function(err, result) {
         if (err){
             throw err;
         }
         else{
             res.send(req.body.con_id+'--'+req.body.device_ID+'---'+req.body.mpin);
         }
     }
    );
 });

 app.set('port', process.env.PORT || 3001);
 app.listen(app.get('port'), function () {
    console.log('Server listening on port ' + app.get('port'));
});
