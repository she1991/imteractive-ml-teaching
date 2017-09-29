var express = require('express');
var cool = require('cool-ascii-faces');
var pg = require('pg');
var bodyParser = require('body-parser');
var app = express();
var fetch = require('node-fetch');

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
    console.log('source creation');
    var dataPayload = request.body.data;
    fetch('https://bigml.io/source?' + process.env.BIGML_AUTH, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(
            {'data' : dataPayload}
        )
    }).then(
        function(resp){
            console.log(resp);
            resp.json().then(function(json){
                //parse this response for the source id
                if(json.resource){
                    return {"sourceId" : json.resource};
                }
            }).then(
                function(sourceIdObj){
                    //send the source id to client
                    response.setHeader('Content-Type', 'application/json');
                    response.send(JSON.stringify(sourceIdObj));
                }
            ).catch(function(){
                console.log('promise rejected resp bigml');
            });
        },
        function(error){
            //an error occured
            //send that error to the client
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({
                'error': error
            })); 
        }
    ).catch(function(ex){
        console.log('promise rejected to bigml');
    });
});

app.post('/dataset', function(request, response){
    console.log('dataset creation');
    var sourceId = request.body.sourceId;
    fetch('https://bigml.io/dataset?' + process.env.BIGML_AUTH, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(
            {
                'source' : sourceId,
                'excluded_fields' : ['000000'],
                'objective_field' : {'id' : '000003'}
            }
        )
    }).then(
        function(resp){
            resp.json().then(function(json){
                //parse this response for the dataset id
                if(json.resource){
                    return {"datasetId" : json.resource};
                }
            }).then(
                function(datasetIdObj){
                    //send the dataset id to client
                    response.setHeader('Content-Type', 'application/json');
                    response.send(JSON.stringify(datasetIdObj));
                }
            ).catch(function(){
                console.log('promise rejected resp bigml');
            });
        },
        function(error){
            //an error occured
            //send that error to the client
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({
                'error': error
            }));
        }
    ).catch(function(ex){
        console.log('promise rejected to bigml');
    });
});

app.post('/model', function(request, response){
    console.log('model creation');
    var datasetId = request.body.datasetId;
    fetch('https://bigml.io/model?' + process.env.BIGML_AUTH, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(
            {
                'dataset' : datasetId
            }
        )
    }).then(
        function(resp){
            resp.json().then(function(json){
                //parse this response for the model id
                if(json.resource){
                    return {"modelId" : json.resource};
                }
            }).then(
                function(modelIdObj){
                    //send the dataset id to client
                    response.setHeader('Content-Type', 'application/json');
                    response.send(JSON.stringify(modelIdObj));
                }
            ).catch(function(){
                console.log('promise rejected resp bigml');
            });
        },
        function(error){
            //an error occured
            //send that error to the client
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({
                'error': error
            }));
        }
    ).catch(function(ex){
        console.log('promise rejected to bigml');
    });
});

app.post('/prediction', function(request, response){
    console.log('prediction');
    var predictionPayload = request.body;
    fetch('https://bigml.io/prediction?' + process.env.BIGML_AUTH, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(predictionPayload)
    }).then(
        function(resp){
            resp.json().then(function(json){
                //parse this response for the prediction and prediction id
                if(json.resource && json.prediction){
                    var predictionVal = parseFloat(json.prediction['000003']);
                    return {'predictionId' : json.resource, 'medianValue': predictionVal};
                }
            }).then(
                function(predictionObj){
                    //send the dataset id to client
                    response.setHeader('Content-Type', 'application/json');
                    response.send(JSON.stringify(predictionObj));
                }
            ).catch(function(){
                console.log('promise rejected resp bigml');
            });
        },
        function(error){
            //an error occured
            //send that error to the client
            response.setHeader('Content-Type', 'application/json');
            response.send(JSON.stringify({
                'error': error
            }));
        }
    ).catch(function(ex){
        console.log('promise rejected to bigml');
    });
});

app.post('/cleanup', function(request, response){
    console.log('cleanup');
    //check for sourceId
    if(request.body.hasOwnProperty('sourceId')){
        fetch('https://bigml.io/'+ request.body.sourceId + '?' + process.env.BIGML_AUTH, {
            method: 'DELETE'
        });
    }
    if(request.body.hasOwnProperty('datasetId')){
        fetch('https://bigml.io/'+ request.body.datasetId + '?' + process.env.BIGML_AUTH, {
            method: 'DELETE'
        });
    }
    if(request.body.hasOwnProperty('modelId')){
        fetch('https://bigml.io/'+ request.body.modelId + '?' + process.env.BIGML_AUTH, {
            method: 'DELETE'
        });
    }
    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify({
        cleanUp : 'true'
    }));
});            

app.post('/deleteprediction', function(request, response){
    console.log('delete prediction');
    //check for sourceId
    if(request.body.hasOwnProperty('predictionId')){
        fetch('https://bigml.io/'+ request.body.predictionId + '?' + process.env.BIGML_AUTH, {
            method: 'DELETE'
        });
    }
    response.setHeader('Content-Type', 'application/json');
    response.send(JSON.stringify({
        predictionCleanUp : 'true'
    }));
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});


