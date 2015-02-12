/**
 * This file is part of the Nodium Neo4j package
 *
 * (c) Niko van Meurs & Sid Mijnders
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * @author Niko van Meurs <nikovanmeurs@gmail.com>
 * @author Sid Mijnders
 * 
 * Transforms data from the SeraphAdapter to Nodium objects
 */
// const
//     NodeTransformer = require('../transformer/SeraphNodeTransformer');
    // EdgeTransformer = require('../transformer/SeraphEdgeTransformer');
const _ = require('lodash');

module.exports = function (Nodium, undefined) {

    'use strict';

    var Nodium      = Nodium,
        transformer = Nodium.transformer;

    /**
     * An interface between the Neo4j data structure and the data structure
     * used by this framework
     */
    transformer.SeraphTransformer = Nodium.createClass(transformer.AbstractDataTransformer, {

        construct: function () {

            // the transformer builds a node map while parsing nodes
            this.nodeIndexMap = {};
        },

        fromNodes: function (seraphNodes) {

            this.nodeIndexMap = {};

            return _.map(seraphNodes, this.fromNodeAndLabel.bind(this));
        },

        fromNodeAndLabel: function (seraphNodeData, index) {

            var node = this.fromNode(seraphNodeData['n']),
                labels = seraphNodeData['labels(n)'];

            node._labels = labels;

            this.nodeIndexMap[node._data.id] = index;

            return node;
        },

        /**
         * @param {Object} A data object from seraph
         * @return {Object} An object structured for Nodium uses
         */
        fromNode: function (seraphNode) {

            var parsedData = this.splitProperties(seraphNode, this.options.map),
                node = {
                    _data: seraphNode,
                    _id: _.uniqueId(),
                    _labels: [],
                    _properties: parsedData.properties,
                };

            _.extend(node, parsedData.mapped);

            return node;
        },

        fromEdges: function (seraphEdges) {

            var edges = _.map(seraphEdges, this.fromEdge.bind(this));

            return edges;
        },

        fromEdge: function (seraphEdge) {

            return {
                _data: seraphEdge,
                _id: _.uniqueId(),
                _properties: seraphEdge.properties || {},
                source: this.nodeIndexMap[seraphEdge.start],
                target: this.nodeIndexMap[seraphEdge.end],
                type: seraphEdge.type
            };
        },

        toEdge: function (nodiumEdge) {

            var edge = {
                end: nodiumEdge._data.end,
                id: nodiumEdge._data.id,
                properties: nodiumEdge._properties || {},
                start: nodiumEdge._data.start
            };

            return edge;
        },

        toNode: function (nodiumNode) {

            var mappedProperties = this.getMappedProperties(nodiumNode),
                node = _.extend({}, nodiumNode._properties, mappedProperties);

            // place back the neo4j id if it exists
            if (nodiumNode.hasOwnProperty('_data')) {
                node.id = nodiumNode._data.id;
            }

            return node;
        },

        // /**
        //  * Transform data to neo4j nodes and edges
        //  */
        // to: function (nodes, edges) {

        //     var neoNodes = [],
        //         neoEdges = [],
        //         node,
        //         edge,
        //         properties,
        //         mappedProperties,
        //         obj;

        //     if (nodes) {
        //         for (var i = 0; i < nodes.length; i++) {
        //             node = nodes[i];

        //             mappedProperties = this.getMappedProperties(node);
        //             obj = $.extend({}, node._properties, mappedProperties);

        //             neoNodes.push(obj);
        //         }
        //     }

        //     if (edges) {
        //         for (var i = 0; i < edges.length; i++) {
        //             edge = edges[i];

        //             neoEdges.push(edge);
        //         }
        //     }

        //     return {
        //         nodes: neoNodes,
        //         edges: neoEdges
        //     }
        // },

        // toNode: function (node) {
        //     return this.to([node]).nodes[0];
        // }
    });

    return transformer.SeraphTransformer;
};
