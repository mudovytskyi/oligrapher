import Node from './Node';
import Edge from './Edge';
import NodeDisplaySettings from '../NodeDisplaySettings';
import helpers from './Helpers';
import { merge } from 'lodash';
import { values } from 'lodash';

class Graph {
  static generateId() {
    return helpers.generateId();
  }

  static defaults() {
    return {
      id: this.generateId(),
      title: "Untitled Graph"
    };
  }

  static setDefaults(graph) {
    return merge({}, this.defaults(), graph);
  }

  static prepare(graph) {
    return this.prepareEdges(this.prepareNodes(this.setDefaults(graph)));
  }

  static prepareEdges(graph) {
    return merge({}, graph, { 
      edges: values(graph.edges).reduce((result, edge) => { 
        return merge({}, result, { [edge.id]: this.updateEdgePosition(Edge.setDefaults(edge), graph) });
      }, {}) 
    });
  }

  static prepareNodes(graph) {
    let nodes = values(graph.nodes).reduce((result, node) => {
      return merge({}, result, { [node.id]: Node.setDefaults(node) });
    }, {});
    nodes = this.prepareNodePositions(nodes);
    return merge({}, graph, { nodes: nodes });
  }

  static prepareNodePositions(nodes) {
    // arrange unpositioned nodes into a circle
    let ary = values(nodes).filter(n => !(n.display.x && n.display.y));
    let radius = Math.pow(ary.length * 100, 0.85);

    return merge({}, nodes, ary.reduce((result, node, i) => {
      let angle = (2 * Math.PI) * (i / ary.length);
      return merge({}, result, { 
        [node.id]: { display: { 
          x: Math.cos(angle) * radius, 
          y: Math.sin(angle) * radius 
        } } 
      });
    }, {}));
  }

  static updateEdgePosition(edge, graph) {
    // get nodes connected by edge
    let n1 = graph.nodes[edge.node1_id];
    let n2 = graph.nodes[edge.node2_id];

    // shortcut variables
    let x1 = n1.display.x;
    let y1 = n1.display.y;
    let x2 = n2.display.x;
    let y2 = n2.display.y;
    let s1 = n1.display.scale;
    let s2 = n2.display.scale;

    return this.calculateEdgePosition(edge, x1, y1, x2, y2, s1, s2);
  }

  static calculateEdgePosition(edge, x1, y1, x2, y2, scale1, scale2) {
    let cx = edge.display.cx;
    let cy = edge.display.cy;
    let r1 = scale1 * NodeDisplaySettings.circleRadius;
    let r2 = scale2 * NodeDisplaySettings.circleRadius;

    // set edge position at midpoint between nodes
    let x = (x1 + x2) / 2;
    let y = (y1 + y2) / 2;

    // keep track of which node is on left and right ("a" is left, "b" is right)
    let xa, ya, xb, yb, is_reverse;
    if (x1 < x2) {
      xa = x1;
      ya = y1;
      xb = x2;
      yb = y2;
      is_reverse = false;
    } else {
      xa = x2;
      ya = y2;
      xb = x1;
      yb = y1;
      is_reverse = true;
    }

    // generate curve offset if it doesn't exist
    if (cx == null || cy == null) {
      let strength = 0.1;
      cx = -(ya - y) * strength;
      cy = (xa - x) * strength;
    }

    // calculate absolute position of curve midpoint
    let mx = cx + x;
    let my = cy + y;

    // curves should not reach the centers of nodes but rather stop at their edges, so we:

    // calculate spacing between curve endpoint and node center
    let sa = is_reverse ? scale2 : scale1;
    let sb = is_reverse ? scale1 : scale2;
    let ra = (is_reverse ? r2 : r1) + (sa * NodeDisplaySettings.circleSpacing);
    let rb = (is_reverse ? r1 : r2) + (sb * NodeDisplaySettings.circleSpacing);

    // calculate angle from curve midpoint to node center
    let angleA = Math.atan2(ya - my, xa - mx);
    let angleB = Math.atan2(yb - my, xb - mx);

    // x and y offsets for curve endpoints are the above spacing times the cos and sin of the angle
    let xma = ra * Math.cos(angleA);
    let yma = ra * Math.sin(angleA);
    let xmb = rb * Math.cos(angleB);
    let ymb = rb * Math.sin(angleB);

    // finally update edge with new curve endpoints
    xa = xa - xma;
    ya = ya - yma;
    xb = xb - xmb;
    yb = yb - ymb;

    return merge({}, edge, { display: { x, y, cx, cy, is_reverse, xa, ya, xb, yb } });
  }

  static moveNode(graph, nodeId, x, y) {
    // first update the node
    graph = merge({}, graph, { nodes: { [nodeId]: { display: { x, y } } } });

    // then update the edges
    return merge({}, graph, { edges: values(graph.edges).reduce((result, edge) => {
      return merge({}, result, { [edge.id]: (edge.node1_id == nodeId || edge.node2_id == nodeId) ? this.updateEdgePosition(edge, graph) : edge });
    }, {}) });

  }

  static moveEdge(graph, edgeId, cx, cy) {
    return merge({}, graph, { edges: { [edgeId]: this.updateEdgePosition(merge({}, graph.edges[edgeId], { display: { cx, cy } }), graph) } });
  }

  static edgesConnectedToNode(graph, nodeId) {
    return values(graph.edges).filter((e) => e.node1_id == nodeId || e.node2_id == nodeId);
  }
}

module.exports = Graph;
