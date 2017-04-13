var express = require('express');
var cool = require('cool-ascii-faces');
var pg = require('pg');
var bodyParser = require('body-parser');
var app = express();

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.get('/cool', function(request, response) {
  response.send(cool());
});

app.get('/times', function(request, response) {
    var result = ''
    var times = process.env.TIMES || 5
    for (i=0; i < times; i++)
      result += i + ' ';
  response.send(result);
});

app.get('/db', function (request, response) {
  pg.connect(process.env.DATABASE_URL, function(err, client, done) {
    client.query('SELECT * FROM test_table', function(err, result) {
      done();
      if (err)
       { console.error(err); response.send("Error " + err); }
      else
       { response.render('pages/db', {results: result.rows} ); }
    });
  });
});

app.post('/source', function(request, response){
    var dataPayload = request.body.data;
    console.log(dataPayload);
    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify({
        sourceId : '232433442f4f243d13d21s12'
    }));
});

app.post('/dataset', function(request, response){
    console.log(request.body);
    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify({
        datasetId : 'dataset32433442f4f243d13d21s12'
    }));
});

app.post('/model', function(request, response){
    console.log(request.body);
    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify({
        modelId : 'model232433442f4f243d13d21s12'
    }));
});

app.post('/prediction', function(request, response){
    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify({
        predicted : '232433442f4f243d13d21s12'
    }));
    console.log('predicted value');
});

app.post('/cleanup', function(request, response){
    console.log(request.body);
    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify({
        cleanUp : 'true'
    }));
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


