/*
Action types
*/

const ADD_ROW = "ADD_ROW"
const MODIFY_ROW = "MODIFY_ROW"
const LOADED = "LOADED"
const ADD_PREDICTION = "ADD_PREDICTION"
const ADD_ML_SOURCE = "ADD_ML_SOURCE"
const ADD_ML_DATASET = "ADD_ML_DATASET"
const ADD_ML_MODEL = "ADD_ML_MODEL"
const ADD_ML_PREDICTION = "ADD_ML_PREDICTION"
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

function addMLSource() {
    return {type:ADD_ML_SOURCE}
}

function addMLDataset() {
    return {type:ADD_ML_DATASET}
}

function addMLModel() {
    return {type:ADD_ML_MODEL}
}

function addMLPrediction() {
    return {type:ADD_ML_PREDICTION}
}
