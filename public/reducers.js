const initialState = {
    pointData : [],
    loaded : false,
    modifiedRow : false,
    predictedCount : 0
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
            console.log(data);
            return Object.assign({}, state, {pointData:data, loaded:false, modifiedRow: Object.assign({},action.row)});
        case LOADED:
            return Object.assign({}, state, {loaded:true});
        case ADD_PREDICTION:
            var predictedItems = state.predictedCount + 1;
            return Object.assign({}, state, {predictedCount: predictedItems, loaded: true});
        default:
            return state;
    }
}

var store = Redux.createStore(interactiveViz);
