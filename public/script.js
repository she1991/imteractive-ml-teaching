/*
Visualization script in js
*/

var vizSVG = null;
var viz = null;
var margin = {top: 20, right: 10, bottom: 50, left: 50};
var width = 1000;
var height = 500;
var xScale = null;
var yScale = null;
var indexValue = null;
var crimeInput = null;
var RoomsInput = null;

var crimeScale = null;
var crimeValue = null;
var crimeMap = null;
var xScale = null;
var xValue = null;
var xMap = null;
var yScale = null;
var yValue = null;
var yMap = null;

var predictedDotColor = "#F44336";

var tip = d3.tip()
  .attr('class', 'd3-tip')
  .offset([-10, 0])
  .html(function(d) {
    return "<strong>Market Value:</strong> &nbsp;<span>" + d["median-value"] + "</span><br/>\
            <strong>Crime:</strong> &emsp;&emsp;&emsp;&nbsp;<span>" + d["crime"] + "</span><br/>\
            <strong>Rooms:</strong> &emsp;&emsp;&emsp;<span>" + d["rooms"] + "</span><br/>";
  });

function initViz(){
    //Attach clean up code
    window.onbeforeunload = cleanUp;
    window.onunload = cleanUp;
    //Find the div
    var vizDiv = d3.select(".visualization");
    //Add the d3 visualization svg
    vizSVG = vizDiv.append("svg")
                //.attr("width", width + margin.left + margin.right)
                //.attr("height", height + margin.top + margin.bottom);
		.attr("width", "100%")
                //.attr("height", "100%")
		.attr("viewBox", "0 0 "+ (width + margin.left + margin.right) +" "+ (height + margin.top + margin.bottom) )
		.attr("preserveAspectRatio", "none");
    //Add margin and create a grouped object
    viz = vizSVG.append("g")
                .attr("transform","translate(" + margin.left + "," + margin.top + ")");
    //Get the references to inputs
    crimeInput = d3.select(".crime-input");
    roomsInput = d3.select(".rooms-input");
    //Attach all subscribers to the store
    store.subscribe(drawViz);
    store.subscribe(renderTable);
    store.subscribe(updateTable);
    parseData();
}

/*
Load TSV data into store
*/
function parseData(){
    d3.tsv("data.tsv", function(d){
        //dispatch add row actions on app store for each
        for(var i = 0; i < d.length; i++){
            store.dispatch({type:ADD_ROW, row:Object.assign({},{
                "index":parseInt(d[i]["INDEX"]),
                "crime":parseFloat(d[i]["CRIM"]),
                "rooms":parseFloat(d[i]["RM"]),
                "median-value":parseFloat(d[i]["MEDV"])
            })});
        }
        //dispatch a loaded action on store after all data is loaded
        store.dispatch({type:LOADED});
        //Also train on the data you have
        train();
    });
}

/*
Draws visualization from redux store
*/
function drawViz(){
    //begin!
    //Verify loaded state of store
    var storeState = store.getState();
    if(!storeState.loaded){
        return;
    }
    var data = storeState.pointData;
    var addedPredictions = storeState.predictedCount;

    xValue = function(d){return d["rooms"]};
    xScale = d3.scaleLinear().range([0,width]);
    xMap = function(d){return xScale(xValue(d));};
    var xAxis = d3.axisBottom(xScale);
    yValue = function(d){return d["median-value"]};
    yScale = d3.scaleLinear().range([0,height]);
    yMap = function(d){return yScale(yValue(d));};
    var yAxis = d3.axisLeft(yScale);
    crimeValue = function(d){return d["crime"]};
    crimeScale = d3.scaleLinear().range([10,30]);
    crimeMap = function(d){return crimeScale(crimeValue(d));};
    indexValue = function(d){return d["index"]};
    //All values including and above this index have been added
    var indexBorder = (d3.max(data, indexValue) + 1) - addedPredictions;
        

    data.forEach(function(d){
        xScale.domain([d3.min(data, xValue)-1, d3.max(data, xValue)+1]);
        yScale.domain([d3.max(data, yValue)+1, d3.min(data, yValue)-1]);
        crimeScale.domain([d3.min(data, crimeValue), d3.max(data, crimeValue)]);
    });

    //Cleanup
    viz.selectAll("*").remove();

    // x-axis
    viz.append("g")
        .attr("class", "x  axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // y-axis
    viz.append("g")
        .attr("class", "y axis")
        .call(yAxis);
    
    // draw dots
    viz.selectAll(".dot")
        .data(data)
            .enter().append("circle")
            .attr("class", function(d){
                if(indexValue(d) >= indexBorder){
                    return "predicted-dot";
                }
                return "dot";
            })
            .attr("r", function(d){
                //check if index is above indexBorder
                if(indexValue(d) >= indexBorder){
                    return crimeMap(d);
                }
                return crimeMap(d);
            })
            .style("fill", function(d) {

            })
            .attr("cx", xMap)
            .attr("cy", yMap)
            //dragging logic
            .call(d3.drag()
		    .on("start", dragStart)
                .on("drag", dragged)
                .on("end", dragEnded))
            .on('mouseover', tip.show)
            .on('mouseout', tip.hide);
    renderPredictedRow();

    viz.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x",0 - (height / 2))
        .attr("dy", "1.5em")
        .style("text-anchor", "middle")
        .text("Market Value (Thousands)");

    viz.append("text")   
        .attr("class", "axis-label")          
        .attr("transform",
            "translate(" + (width/2) + " ," + 
            (height + margin.top + 20) + ")")
        .style("text-anchor", "middle")
        .text("Number of Rooms (function of property size)");
    
    viz.call(tip);
}

function dragStart(d){
   //Drawing ghost dot
   viz.append("circle")
	    .attr("class", "ghost-dot")
	    .attr("r", d3.select(this).attr("r"))
            .attr("cx", d3.select(this).attr("cx"))
            .attr("cy", d3.select(this).attr("cy"));
}

function dragged(d){
    d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
    //Convert cx position value to x-axis value
    store.dispatch({type:MODIFY_ROW, row:{"index":d["index"], "rooms":xScale.invert(d3.event.x), "median-value":yScale.invert(d3.event.y), "crime":d["crime"]}});
    //Remove previous x and y axis cross hairs
    viz.selectAll(".crosshair").remove();
    //Draw the x and y axis cross hairs
    viz.append("line")
	.attr("class", "crosshair")
	.attr("x1", 0)
	.attr("y1", d3.select(this).attr("cy"))
	.attr("x2", d3.select(this).attr("cx"))
	.attr("y2", d3.select(this).attr("cy"));
    viz.append("line")
        .attr("class", "crosshair")
        .attr("x1", d3.select(this).attr("cx"))
        .attr("y1", d3.select(this).attr("cy"))
        .attr("x2", d3.select(this).attr("cx"))
        .attr("y2", height);
}

function dragEnded(d){
    // dispatch action row modified with row details
    store.dispatch({type:MODIFY_ROW, row:{"index":d["index"], "rooms":xScale.invert(d3.event.x), "median-value":yScale.invert(d3.event.y), "crime":d["crime"]}});
    // remove ghost dot
    viz.selectAll(".ghost-dot").remove();
    //Remove previous x and y axis cross hairs
    viz.selectAll(".crosshair").remove();
}

/*
Render table of data
*/
function renderTable(){
    //Verify loaded state of store
    var storeState = store.getState();
    if(!storeState.loaded || storeState.predictedCount != 0){
        return;
    }
    //second check for train issue
    //Check if last row of data is present
    var lastRow = storeState.pointData[storeState.pointData.length - 1];
    var tableLastRow = d3.select("._"+lastRow["index"]);
    if(!tableLastRow.empty()){
        return;
    }
    //For every value
    //enter data into the table
    var table = d3.select(".tsv-data");
    storeState.pointData.forEach(function(d){
    var tableRow = table.append("tr")
        .attr("class", "_"+d.index);
    tableRow.append("td")
        .attr("class", "index")
        .text(d["index"])
    tableRow.append("td")
        .attr("class", "crime")
        .text(d["crime"]);
    tableRow.append("td")
        .attr("class","rooms")
        .text(d["rooms"]);
    tableRow.append("td")
        .attr("class","median-value")
        .text(d["median-value"]);
    });
}

function renderPredictedRow(){
    var storeState = store.getState();
    if(storeState.predictedCount == 0){
        return;
    }
    //Check if last row of data is present
    var lastRow = storeState.pointData[storeState.pointData.length - 1];
    var tableLastRow = d3.select("._"+lastRow["index"]);
    //if not add it to table
    var table = d3.select(".tsv-data");
    if(tableLastRow.empty()){
        //append a table row for new data point
        var tableRow = table.append("tr")
            .attr("class", "_"+lastRow["index"]);
        tableRow.append("td")
            .attr("class", "index")
            .text(lastRow["index"])
        tableRow.append("td")
            .attr("class", "crime")
            .text(lastRow["crime"]);
        tableRow.append("td")
            .attr("class","rooms")
            .text(lastRow["rooms"]);
        tableRow.append("td")
            .attr("class","median-value")
            .text(lastRow["median-value"]);
    }
}

/*
Modify table value to reflect changes to store
*/
function updateTable(){
    //Verify if modified row is present
    var storeState = store.getState();
    if(storeState.modifiedRow == false){
        return;
    }
    var row = storeState.modifiedRow;
    //Locate table row with index of modified row
    var tableRow = d3.selectAll("._"+row["index"]);
    tableRow.selectAll(".rooms")
        .text(row["rooms"]);
    tableRow.selectAll(".median-value")
        .text(row["median-value"]);
}

function predictValue(){
    //set the top div to be loading-mask
    var topDiv = d3.select(".top-div");
    topDiv.attr('class', 'loading-mask');
    var storeState = store.getState();
    var data = storeState.pointData;
    //Get the value from the input
    var crimeVal = parseFloat(crimeInput.property("value"));
    var roomsVal = parseFloat(roomsInput.property("value"));
    //Add the value to the store
    //Get the highest index value
    var indexVal = d3.max(data, indexValue) + 1;
    //Get the model value
    var model = storeState.mlModel;
    //Call the prediction service
    var payload = JSON.stringify({
        'model' : model,
        'input_data' : {
            '000000' : indexVal,
            '000001' : crimeVal,
            '000002' : roomsVal
        }
    });
    fetch("/prediction", {
        method: "POST",
        body: payload,
        headers: {
            "Content-Type": "application/json"
        }
    }).then(
        function(response){
            response.json().then(function(json){
                if(json.medianValue && json.predictionId){
                    //Add this value to the store and the system will handle the rest
                    store.dispatch({type:ADD_PREDICTION, row:Object.assign({},{
                        "index":indexVal,
                        "crime":crimeVal,
                        "rooms":roomsVal,
                        "median-value":json.medianValue
                    })});
                    store.dispatch({type:ADD_ML_PREDICTION, row: Object.assign({},{
                        "mlPrediction":json.predictionId
                    })});
                    //reset top div
                    //remove loading-mask
                    var topDiv = d3.select(".loading-mask");
                    topDiv.attr('class', 'top-div container-fluid');
                    return {"predictionId" : json.predictionId};
                }
            }).then(deletePrediction);
        },
        function(error){
            //Return unsuccessful promise
            console.log(error);
            return {"error": error};
        }
    );
}

function train(){
    console.log("train");
    //perform cleanup
    cleanUp();
    //reset the predicted count on the store
    //set the top div to be loading-mask
    var topDiv = d3.select(".top-div");
    topDiv.attr('class', 'loading-mask');
    store.dispatch({type: RESET_PREDICTION});
    createNewSource();
}

function createNewSource(){
    //create new source
    //Get all the data as a CSV string to send over to server
    var csv = getDataAsCSV();
    var postBody = JSON.stringify({"data" : csv});
    var returnPromise = null;
    fetch("/source", {
        method: "POST",
        body: postBody,
        headers: {
            "Content-Type": "application/json"
        }
    }).then(
        function(response){
            //Check for new source id
            var sourceId = null;
            response.json().then(function(json){
                if(json.sourceId){
                    console.log(json.sourceId);
                    //update store's sourceId
                    store.dispatch({type:ADD_ML_SOURCE, row: {"mlSource" : json.sourceId}});
                    return {"sourceId": json.sourceId};
                }
            }).then(createNewDataset);
        },
        function(error){
            //Return unsuccessful promise
            console.log(error);
            return {"error": error};
        }
    );
}

function createNewDataset(sourceIdObj){
    //If sourceIdObj contains an error..abort
    if(sourceIdObj.hasOwnProperty("error")){
        //error is present
        return sourceIdObj;
    }
    else{
        //fetch call for creating dataset
        //We have the sourceId from the sourceIdObj
        var postBody = JSON.stringify(sourceIdObj);
        //give BigML some time to process the source
        setTimeout(function(){
        fetch("/dataset", {
        method: "POST",
        body: postBody,
        headers: {
            "Content-Type": "application/json"
        }
        }).then(
            function(response){
                //Check for new dataset id
                var datasetId = null;
                response.json().then(function(json){
                    if(json.datasetId){
                        console.log(json.datasetId);
                        //update store's datasetId
                        store.dispatch({type:ADD_ML_DATASET, row: {"mlDataset" : json.datasetId}});
                        return {"datasetId": json.datasetId};
                    }
                }).then(createNewModel);
            },
            function(error){
                //Return unsuccessful promise
                console.log(error);
                return {"error": error};
            }
        );
        }, 3000);
    }
}

function createNewModel(datasetIdObj){
    //If datasetIdObj contains an error..abort
    if(datasetIdObj.hasOwnProperty("error")){
        //error is present
        return datasetIdObj;
    }
    else{
        //fetch call for creating dataset
        //We have the sourceId from the sourceIdObj
        var postBody = JSON.stringify(datasetIdObj);
        //give BigML some time to process the dataset
        setTimeout(function(){
        fetch("/model", {
        method: "POST",
        body: postBody,
        headers: {
            "Content-Type": "application/json"
        }
        }).then(
            function(response){
                //Check for new dataset id
                var modelId = null;
                response.json().then(function(json){
                    if(json.modelId){
                        console.log(json.modelId);
                        //update store's modelId
                        store.dispatch({type:ADD_ML_MODEL, row: {"mlModel" : json.modelId}});
                        //remove the class on the top div
                        //set the top div to be loading-mask
                        var topDiv = d3.select(".loading-mask");
                        topDiv.attr('class', 'top-div container-fluid');
                        return {"datasetId": json.modelId};
                    }
                });
            },
            function(error){
                //Return unsuccessful promise
                console.log(error);
                return {"error": error};
            }
        );
        }, 3000);
    }
}

function cleanUp(){
    console.log("clean");
    //Perform cleanup of dataset source and model
    //get all ids togetehr into and object and send to cleanup service
    var storeState = store.getState();
    var payloadObj = JSON.stringify({
        "sourceId" : storeState.mlSource,
        "datasetId" : storeState.mlDataset,
        "modelId" : storeState.mlModel
    });
    fetch("/cleanup", {
        method: "POST",
        body: payloadObj,
        headers: {
            "Content-Type": "application/json"
        }
    });
}

function deletePrediction(predictionIdObj){
    //Delete the prediction
    //give some time for prediction and store to gain state
    setTimeout(function(){
    var storeState = store.getState();
    var payloadObj = JSON.stringify({
        "predictionId" : predictionIdObj.predictionId
    });
    fetch("/deleteprediction", {
        method: "POST",
        body: payloadObj,
        headers: {
            "Content-Type": "application/json"
        }
    });
    }, 1000);
}

function getDataAsCSV(){
    //return data as a CSV string
    //Get the data
    var storeState = store.getState();
    var data = storeState.pointData;
    var opString = "";
    var headersDone = false;
    //for the first element, record and push all headers
    data.forEach(function(d){
        if(!headersDone){
            for(propName in d){
                opString = opString + propName + ",";
            }
            //remove trailing comma
            opString = opString.slice(0, -1);
            //add new line
            opString = opString + "\n";
            headersDone = true;
        }
        for(propName in d){
            opString = opString + d[propName] + ",";
        }
        //remove trailing comma
        opString = opString.slice(0, -1);
        //add new line
        opString = opString + "\n";
    });
    return opString;
    //push all data
}
