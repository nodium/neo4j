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
        model       = Nodium.model,
        transformer = Nodium.transformer,
        NodeEvent   = Nodium.event.NodeEvent,
        EdgeEvent   = Nodium.event.EdgeEvent,
        _defaults   = {
            host: 'localhost',
            port: 7474,
            version: 2
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

            return this.adapter.createNode(nodeData);
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
        updateNodeLabel: function (nodeData) {

            // var url;

            // if (1 === _options.version) {
            //     return;
            // }

            // check if a label was added or removed
            // put in again? or check in consumer??
            // if (!update.changed(model.Node.getLabelsPath())) {
            //     return;
            // }

            // url = createNodeUrl(nodeData._id) + '/labels';

            // $.ajax({
            //     url: url,
            //     type: 'PUT',
            //     contentType: 'application/json',
            //     data: JSON.stringify(nodeData._labels)
            // });

            return this.adapter.call(
                'node/'+nodeData._data.id+'/labels',
                'PUT',
                JSON.stringify(nodeData._labels)
            );
        }
    });

    /**
     * Constructs a url with optional path
     * @param {String} path
     * @returns {String}
     *
     * @author Niko van Meurs <nikovanmeurs@gmail.com>
     */
    function createUrl (path) {

        var options = _options,
            host    = options.host,
            port    = options.port,
            url     = 'http://' + host;

        if (port) {
            url += ':' + port;
        }

        if (path) {
            url += path;
        }

        return url;
    }

    /**
     * Constructs a url to execute a Cypher query
     * @returns {String}
     */
    function createCypherUrl () {

        return createUrl('/db/data/cypher');
    }    

    /**
     * Constructs a url to edit an edge
     * @param {Number} [edgeId]
     * @returns {String}
     */
    function createEdgeUrl (edgeId) {

        var path = '/db/data/relationship';

        if (edgeId) {
            path += '/' + id;
        }

        return createUrl(path);
    }

    /**
     * Constructs a url to edit a node
     * @param {Number} [nodeId]
     * @returns {String}
     */
    function createNodeUrl (nodeId) {

        var path = '/db/data/node';

        if (nodeId) {
            path += '/' + nodeId;
        }

        return createUrl(path);
    }


    return api.Neo4jAPI;
};
