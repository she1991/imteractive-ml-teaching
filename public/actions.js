/*
Action types
*/

const ADD_ROW = "ADD_ROW"
const MODIFY_ROW = "MODIFY_ROW"
const LOADED = "LOADED"
const ADD_PREDICTION = "ADD_PREDICTION"
/*
Action creators
*/

function addRow( row ) {
    return {type:ADD_ROW, row}
}

function modifyRow( row ) {
    return {type:MODIFY_ROW, row}
}

function loaded() {
    return {type:LOADED}
}

function addPrediction() {
    return {type:ADD_PREDICTION}
}
