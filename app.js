var express = require('express'),
http = require('http'),
request = require('request'),
bodyParser = require('body-parser'),
errorHandler = require('express-error-handler'),
app = express();

var pg = require('pg');  
//You can run command "heroku config" to see what is Database URL from Heroku belt

//var conString = process.env.DATABASE_URL || "postgres://postgres:Welcome123@localhost:5432/postgres";
//var client = new pg.Client(conString);
var client = new pg.Client({
    connectionString: process.env.DATABASE_URL || "postgres://postgres:Welcome123@localhost:5432/postgres",
    ssl: true,
  });
client.connect();

app.set('port', process.env.PORT || 3001);
app.get('/', function(request, response) {
    //response.send('Hello World!');
    //var query = client.query("select * from salesforce.contact;"); 
    
    var query = client.query('select Id, LastName, Email, MobilePhone from salesforce.contact;', (err, res) => {
        if (err) throw err;
        response.send(JSON.stringify(response.rows));
        /*for (let row of res.rows) {
          console.log(JSON.stringify(row));
          response.send(JSON.stringify(row));
        }*/
        client.end();
    });
    
});

app.use(errorHandler());
app.listen(app.get('port'), function () {
    console.log('Server listening on port ' + app.get('port'));
});