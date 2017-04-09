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

function initViz(){
    //Find the div
    var vizDiv = d3.select(".visualization");
    //Add the d3 visualization svg
    vizSVG = vizDiv.append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom);
    //Add margin and create a grouped object
    viz = vizSVG.append("g")
                .attr("transform","translate(" + margin.left + "," + margin.top + ")");
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
    var xValue = function(d){return d["rooms"]},
        xScale = d3.scaleLinear().range([0,width]);
    var xMap = function(d){return xScale(xValue(d));},
        xAxis = d3.axisBottom(xScale);
    var yValue = function(d){return d["median-value"]},
        yScale = d3.scaleLinear().range([0,height]);
    var yMap = function(d){return yScale(yValue(d));},
        yAxis = d3.axisLeft(yScale);
    var crimeValue = function(d){return d["crime"]},
        crimeScale = d3.scaleLinear().range([255,0]);
    var crimeMap = function(d){return crimeScale(crimeValue(d));};
        

    data.forEach(function(d){
        xScale.domain([d3.min(data, xValue)-1, d3.max(data, xValue)+1]);
        yScale.domain([d3.max(data, yValue)+1, d3.min(data, yValue)-1]);
        crimeScale.domain([d3.min(data, crimeValue), d3.max(data, crimeValue)]);
    });

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
            .attr("r", 9)
            .attr("cx", xMap)
            .attr("cy", yMap)
            .attr("fill", function(d){
                return d3.rgb(255, crimeMap(d), crimeMap(d));
            })
            //dragging logic
            .call(d3.drag()
                    .on("drag", dragged)
                    .on("end", dragEnded));
}

function dragged(d){
    d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
    store.dispatch({type:MODIFY_ROW, row:{"index":d["index"], "rooms":d["rooms"], "median-value":d["median-value"]}});
}

function dragEnded(d){
    // dispatch action row modified with row details
    store.dispatch({type:MODIFY_ROW, row:{"index":d["index"], "rooms":d["rooms"], "median-value":d["median-value"]}});
}

/*
Render table of data
*/
function renderTable(){
    //Verify loaded state of store
    var storeState = store.getState();
    if(!storeState.loaded){
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
            .text(d["median-value"])
    });
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
        .text(xScale.invert(row["rooms"]));
    tableRow.selectAll(".median-value")
            .text(yScale.invert(row["median-value"]));
}

function predictValue(){
    
}

function train(){

}
