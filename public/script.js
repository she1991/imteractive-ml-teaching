/*
Visualization script in js
*/

var vizSVG = null;
var viz = null;
var margin = {top: 20, right: 10, bottom: 20, left: 30};
var width = 1000;
var height = 500;
var xScale = null;
var yScale = null;
var indexValue = null;
var crimeInput = null;
var RoomsInput = null;

function initViz(){
    //Attach clean up code
    window.onbeforeunload = cleanUp;
    window.onunload = cleanUp;
    //Find the div
    var vizDiv = d3.select(".visualization");
    //Add the d3 visualization svg
    vizSVG = vizDiv.append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);
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

    var xValue = function(d){return d["rooms"]};
    xScale = d3.scaleLinear().range([0,width]);
    var xMap = function(d){return xScale(xValue(d));};
    var xAxis = d3.axisBottom(xScale);
    var yValue = function(d){return d["median-value"]};
    yScale = d3.scaleLinear().range([0,height]);
    var yMap = function(d){return yScale(yValue(d));};
    var yAxis = d3.axisLeft(yScale);
    var crimeValue = function(d){return d["crime"]};
    var crimeScale = d3.scaleLinear().range([255,0]);
    var crimeMap = function(d){return crimeScale(crimeValue(d));};
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
        .attr("class", "x axis")
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
            .attr("class", "dot")
            .attr("r", function(d){
                //check if index is above indexBorder
                if(indexValue(d) >= indexBorder){
                    return 20;
                }
                return 5;
            })
            .attr("cx", xMap)
            .attr("cy", yMap)
            .attr("fill", function(d){
                return d3.rgb(255, crimeMap(d), crimeMap(d));
            })
            //dragging logic
            .call(d3.drag()
                    .on("drag", dragged)
                    .on("end", dragEnded));
    renderPredictedRow();
}

function dragged(d){
    d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
    //Convert cx position value to x-axis value
    store.dispatch({type:MODIFY_ROW, row:{"index":d["index"], "rooms":xScale.invert(d3.event.x), "median-value":yScale.invert(d3.event.y), "crime":d["crime"]}});
}

function dragEnded(d){
    // dispatch action row modified with row details
    store.dispatch({type:MODIFY_ROW, row:{"index":d["index"], "rooms":xScale.invert(d3.event.x), "median-value":yScale.invert(d3.event.y), "crime":d["crime"]}});
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
    var storeState = store.getState();
    var data = storeState.pointData;
    //Get the value from the input
    var crimeVal = parseFloat(crimeInput.property("value"));
    var roomsVal = parseFloat(roomsInput.property("value"));
    //Predict the value
    var predictedValue = 21.6;
    //Add the value to the store
    //Get the highest index value
    var indexVal = d3.max(data, indexValue) + 1;
    store.dispatch({type:ADD_PREDICTION, row:Object.assign({},{
        "index":indexVal,
        "crime":crimeVal,
        "rooms":roomsVal,
        "median-value":predictedValue
    })});
    //The table will be updated when store is updated
    //The visualization will also update itself.
}

function train(){
    console.log("train");
    //perform cleanup
    cleanUp();
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
                    store.dispatch({type:ADD_ML_SOURCE, row:)
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
    
}

function createNewModel(){
}

function cleanUp(){
    console.log("clean");
    return "Hey";
    //Perform cleanup of dataset source and model
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
