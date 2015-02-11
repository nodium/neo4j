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
module.exports = function (Nodium, $, undefined) {

    'use strict';

    var api         = Nodium.api,
        model       = Nodium.model,
        transformer = Nodium.transformer,
        NodeEvent   = Nodium.event.NodeEvent,
        EdgeEvent   = Nodium.event.EdgeEvent,
        _defaults   = {
            host: 'localhost',
            port: 7474,
            version: 2
        },
        _options;

    api.Neo4jAPI = Nodium.createClass({

        /**
         * Initializes options object
         * @param {Object} [options]
         */
        construct: function (options) {

            _options = $.extend({}, _defaults, options);
        },

        /**
         * Gets all nodes and edges
         * @returns {Promise}
         */
        getGraph: function () {

            return new Promise(function (resolve, reject) {

                var payload,
                    query,
                    url;

                if (1 === _options.version) {

                    query = 'START n=node(*) RETURN n';

                } else {

                    query = 'START n=node(*) RETURN n, labels(n)';
                }

                payload = {
                    query: query,
                    params: {}
                };
                
                url = createCypherUrl();

                // TODO use promises
                $.post(url, payload)
                    .done(function (nodeResult) {

                    var payload = {
                        query: 'START r=relationship(*) RETURN r',
                        params: {}
                    };

                    $.post(url, payload)
                        .done(function (edgeResult) {

                        var graph = transformer.neo4j.from(nodeResult, edgeResult);

                        resolve(graph);
                     });
                });
            });
        },

        /**
         * Create a node in the neo4j database
         * Store the id to easily delete the node later
         * @param {Object} nodeData
         * @returns {Promise}
         */
        createNode: function (nodeData) {

            return new Promise(function (resolve, reject) {

                var payload,
                    url;
                    
                payload = transformer.neo4j.toNode(nodeData);
                url     = createNodeUrl();

                $.ajax({
                    url: url,
                    data: payload,
                    type: 'POST',
                    async: false // It's inside a promise now, so async false doesn't really do much
                }).done(function (result) {

                    var id = transformer.neo4j.idFromSelf(result.self);
                    resolve(id);
                });
            });
        },

        /**
         * We're doing this with a cypher,
         * because we also have to delete all relationships
         * @param {Object} nodeData
         */
        deleteNode: function (nodeData) {

            var payload,
                query,
                url = createCypherUrl();

            // TODO this query should work, but can't find parameter nodeId
            // query = {
            //      "query" : "START n=node({nodeId}) OPTIONAL MATCH n-[r]-() DELETE n,r",
            //      "params" : {
            //          "nodeId": nodeId
            //  }
            // };

            if (1 === _options.version) {

                query = "START n=node(" + nodeData._id + ") MATCH n-[r?]-() DELETE n,r";

            } else {

                query = "START n=node(" + nodeData._id + ") OPTIONAL MATCH n-[r]-() DELETE n,r";
            }

            payload = {
                query: query,
                params: {}
            };

            $.post(url, payload);
        },

        /**
         * Creates a new edge in Neo4j
         * @param {Object} edgeData
         * @returns {Promise}
         */
        createEdge: function (edgeData) {

            return new Promise(function (resolve, reject) {

                var payload,
                    url;

                payload = {
                    to: createEdgeUrl(edgeData.to._id),
                    type: edgeData.type
                };

                url     = createNodeUrl(edgeData.from._id) + '/relationships';

                $.post(url, payload)
                    .done(function (result) {

                    var id = transformer.neo4j.idFromSelf(result.self);

                    resolve(id);
                 });
            });
        },

        /**
         * Deletes an edge in the Neo4j database
         * @param {Object} edgeData
         */
        deleteEdge: function (edgeData) {

            var url = createEdgeUrl(edgeData._id);

            $.ajax({
                url: url,
                type: 'DELETE'
            });
        },

        /**
         * Updates a node in the Neo4j database
         * @param {Object} nodeData
         */
        updateNode: function (nodeData) {

            var payload,
                url;

            payload = transformer.neo4j.toNode(nodeData);
            url     = createNodeUrl(nodeData._id) + '/properties';

            $.ajax({
                url: url,
                type: 'PUT',
                data: payload
            });
        },

        /**
         * Removes all labels from the node and replaces them with the ones in data
         * @param {String|Array<String>} data
         */
        updateNodeLabel: function (nodeData) {

            var url;

            if (1 === _options.version) {
                return;
            }

            // check if a label was added or removed
            if (!update.changed(model.Node.getLabelsPath())) {
                return;
            }

            url = createNodeUrl(nodeData._id) + '/labels';

            $.ajax({
                url: url,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(nodeData._labels)
            });
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
};
