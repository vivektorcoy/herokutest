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

var mobileRegWebserviceRoute = require('./mobileregwebservice/mobileRegWebservice.js');

app.post('/updateContact',function(req,res){
    mobileRegWebserviceRoute.mobileRegWebService(req,res,client);
});

app.listen(app.get('port'), function () {
    console.log('Server listening on port ' + app.get('port'));
});