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
 */
const
    _      = require('lodash');

module.exports = function (Nodium, undefined) {

    'use strict';

    var SeraphAdapter = require('../adapter/SeraphAdapter')(Nodium);

    var api         = Nodium.api,
        NodeEvent   = Nodium.event.NodeEvent,
        EdgeEvent   = Nodium.event.EdgeEvent,
        _defaults   = {
            host: 'localhost',
            port: 7474
        };

    api.Neo4jAPI = Nodium.createClass({

        /**
         * Initializes options object
         * @param {Object} [options]
         */
        construct: function (options, adapter) {

            this._options = _.extend({}, _defaults, options);

            // seraph is the default adapter
            this.adapter = adapter || new SeraphAdapter();
        },

        initialize: function () {

            $(this.kernel).on(NodeEvent.CREATED, this.handleNodeCreated.bind(this));
            $(this.kernel).on(NodeEvent.DESTROYED, this.handleNodeDeleted.bind(this));
            $(this.kernel).on(EdgeEvent.CREATED, this.handleEdgeCreated.bind(this));
            $(this.kernel).on(EdgeEvent.DESTROYED, this.handleEdgeDeleted.bind(this));
            $(this.kernel).on(NodeEvent.UPDATED, this.handleNodeUpdated.bind(this));
            $(this.kernel).on(NodeEvent.UPDATED, this.handleNodeLabelUpdated.bind(this));
        },

        /**
         * Creates a new edge in Neo4j
         * @param {Object} edgeData
         * @returns {Promise}
         */
        createEdge: function (edgeData) {

            return this.adapter.createEdge(edgeData);
        },

        /**
         * Create a node in the neo4j database
         * Store the id to easily delete the node later
         * @param {Object} nodeData
         * @returns {Promise}
         */
        createNode: function (nodeData) {

            console.log('API CREATE');
            console.log(nodeData);

            return this.adapter.createNode(nodeData)
                .then(this.updateNodeLabels.bind(this));
        },

        /**
         * Delete a node and all relationships
         * @param {Object} nodeData
         * @returns {Promise}
         */
        deleteNode: function (nodeData) {

            return this.adapter.deleteNode(nodeData);
        },

        /**
         * Deletes an edge in the Neo4j database
         * @param {Object} edgeData
         * @returns {Promise}
         */
        deleteEdge: function (edgeData) {

            return this.adapter.deleteEdge(edgeData);
        },

        /**
         * Gets all nodes and edges
         * @returns {Promise}
         */
        getGraph: function () {

            var adapter = this.adapter;

            // TODO find way to flatten stuff like this
            return adapter.getNodes()
                .then(function (nodes) {
                    return adapter.getEdges(nodes)
                        .then(function (edges) {
                            return {
                                nodes: nodes,
                                edges: edges
                            };
                        });
                });
        },

        /**
         * Updates a node in the Neo4j database
         * @param {Object} nodeData
         */
        updateNode: function (nodeData) {

            return this.adapter.updateNode(nodeData);
        },

        /**
         * Removes all labels from the node and replaces them with the ones in data
         * @param {String|Array<String>} data
         */
        updateNodeLabels: function (nodeData) {

            return this.adapter.call(
                'node/'+nodeData._data.id+'/labels',
                'PUT',
                nodeData._labels
            ).then(function () {
                return nodeData;
            });
        },


        /*
         * Handlers
         */

        /**
         * Gets the normalized api content
         * @param {Function} callback
         */
        get: function (callback) {

            this.getGraph().then(callback);
        },

        /**
         * Triggered by NodeEvent.CREATED
         * @param {Object} event
         * @param {Node} node
         * @param {Object} data
         */
        handleNodeCreated: function (event, node, data) {

            this.createNode(data);
        },

        /**
         * Triggered by NodeEvent.DELETED
         * @param {Object} event
         * @param {Object} data
         */
        handleNodeDeleted: function (event, data) {

            this.deleteNode(data);
        },

        /**
         * Triggered by EdgeEvent.CREATED
         * @param {Object} event
         * @param {Object} data
         * @param {Object} source
         * @param {target} target
         */
        handleEdgeCreated: function (event, data, source, target) {

            this.createEdge(data);
        },

        /**
         * Triggered by EdgeEvent.DELETED
         * @param {Object} event
         * @param {Object} data
         */
        handleEdgeDeleted: function (event, data) {

            this.deleteEdge(data);
        },

        /**
         * Triggered by NodeEvent.UPDATED
         * @param {Object} event
         * @param {Node} node
         * @param {Object} data
         * @param {Update} update
         */
        handleNodeUpdated: function (event, node, data, update) {

            // check if a property was updated
            if (!update.changed('_properties') &&
                !update.changed('_mapped')) {
                
                return;
            }

            this.updateNode(data);
        },

        /**
         * Triggered by NodeEvent.UPDATEDLABEL
         * @param {Object} event
         * @param {Node} node
         * @param {Object} data
         * @param {Update} update
         */
        handleNodeLabelUpdated: function (event, node, data, update) {

            // check if a label was added or removed
            if (!update.changed('_labels')) {
                return;
            }

            this.updateNodeLabels(data);
        }
    });

    return api.Neo4jAPI;
};
