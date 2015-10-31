import { LOAD_GRAPH, SHOW_GRAPH, MOVE_NODE, MOVE_EDGE } from '../actions';
import Graph from '../models/Graph';
import { merge } from 'lodash';

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export default function graphs(state = {}, action) {
  switch (action.type) {
  case LOAD_GRAPH:
    let graph = Graph.prepare(action.graph);
    return merge({}, state, { [graph.id]: graph });
  case MOVE_NODE:
    return merge({}, state, { [action.graphId]: Graph.moveNode(state[action.graphId], action.nodeId, action.x, action.y) });
  case MOVE_EDGE:
    return merge({}, state, { [action.graphId]: Graph.moveEdge(state[action.graphId], action.edgeId, action.cx, action.cy) })
  default:
    return state;
  }
}