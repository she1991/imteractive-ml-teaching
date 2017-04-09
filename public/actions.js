/*
Action types
*/

const ADD_ROW = "ADD_ROW"
const MODIFY_ROW = "MODIFY_ROW"
const LOADED = "LOADED"
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
