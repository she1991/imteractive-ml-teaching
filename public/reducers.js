const initialState = {
    pointData : [],
    loaded : false,
    modifiedRow : false,
    predictedCount : 0,
    mlSource : null,
    mlDataset : null,
    mlModel : null,
    mlPrediction : null
}

function interactiveViz (state = initialState, action) {
    switch (action.type) {
        case ADD_ROW:
            var data = Object.assign([], state.pointData);
            data.push(Object.assign({},action.row));
            return Object.assign({}, state, {pointData: data});
        case MODIFY_ROW:
            //find row with same index
            var data = Object.assign([], state.pointData);
            for (var i=0; i < data.length; i++) {
                if(state.pointData[i].index == action.row.index) {
                    //delete it
                    data.splice(i, 1);             
                }
            }
            //add new element to state
            data.push(action.row);
            return Object.assign({}, state, {pointData:data, loaded:false, modifiedRow: Object.assign({},action.row)});
        case LOADED:
            return Object.assign({}, state, {loaded:true});
        case ADD_PREDICTION:
            var predictedItems = state.predictedCount + 1;
            var data = Object.assign([], state.pointData);
            data.push(Object.assign({},action.row));
            return Object.assign({}, state, {predictedCount: predictedItems, loaded: true, pointData: data});
        case ADD_ML_SOURCE:
            return Object.assign({}, state, {mlSource : action.row.mlSource});
        case ADD_ML_DATASET:
            return Object.assign({}, state, {mlDataset : action.row.mlDataset});
        case ADD_ML_MODEL:
            return Object.assign({}, state, {mlModel : action.row.mlModel});
        case ADD_ML_PREDICTION:
            return Object.assign({}, state, {mlPrediction : action.row.mlPrediction});
        default:
            return state;
    }
}

var store = Redux.createStore(interactiveViz);
