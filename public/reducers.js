const initialState = {
    pointData : [],
    loaded : false,
    modifiedRow : false
}

function interactiveViz (state = initialState, action) {
    switch (action.type) {
        case ADD_ROW:
            return Object.assign({}, state, state.pointData.push(action.row));
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
            return Object.assign({}, state, {pointData:data, loaded:false, modifiedRow:action.row});
        case LOADED:
            return Object.assign({}, state, {loaded:true});
        default:
            return state;
    }
}

var store = Redux.createStore(interactiveViz);
