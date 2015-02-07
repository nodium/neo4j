(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * This file is part of the Nodium core package
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
 (function (window, undefined) {

    'use strict';

    require('./nodium-neo4j')(window.Nodium);

}(window));
},{"./nodium-neo4j":3}],2:[function(require,module,exports){
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

            console.log("api: handling node label update");
            console.log(nodeData._id);

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

        if (id) {
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

        if (id) {
            path += '/' + nodeId;
        }

        return createUrl(path);
    }
};

},{}],3:[function(require,module,exports){
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
module.exports = function (Nodium) {

    var jQuery = Nodium.context.jQuery;

    // Augment Nodium with the classes in the Neo4j package
    require('./api/Neo4jAPI')(Nodium, jQuery);
    require('./transformer/Neo4jTransformer')(Nodium, jQuery);
}
},{"./api/Neo4jAPI":2,"./transformer/Neo4jTransformer":4}],4:[function(require,module,exports){
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

    var Nodium      = Nodium,
        model       = Nodium.model,
        transformer = Nodium.transformer;

    /**
     * An interface between the Neo4j data structure and the data structure
     * used by this framework
     */
    transformer.Neo4jTransformer = Nodium.createClass(transformer.AbstractDataTransformer, {

        construct: function () {

            // transformer should only be instantiated once per Nodium
            transformer.neo4j = this;
        },

        /**
         * Extract the node id from neo4j node's self property
         */
        idFromSelf: function (selfString) {

            var index = selfString.lastIndexOf('/'),
                id;

            if (index == -1) {
                return null;
            }

            id = selfString.substring(index + 1, selfString.length);

            return id;
        },

        /**
         * Transform data from neo4j
         */
        from: function (neo4jNodes, neo4jEdges) {

            var nodes = [],
                edges = [],
                node, id, nodeData, nodeLabels,
                nodeIndexMap = {}, nodeCount = 0,
                edge,
                properties,
                map = this.options.map,
                mappedProperties;

            for (var i = 0; i < neo4jNodes.data.length; i++) {

                properties = {};
                mappedProperties = {};

                nodeData = neo4jNodes.data[i][0];
                nodeLabels = neo4jNodes.data[i][1];

                if (!nodeData || nodeIndexMap[nodeData.self] !== undefined) {
                    continue;
                }

                // split data properties from mNodiumed Nodium properties
                for (var j in nodeData.data) {
                    if (map.hasOwnProperty(j)) {
                        mappedProperties[map[j]] = nodeData.data[j];
                    } else {
                        properties[j] = nodeData.data[j];
                    }
                }

                nodeIndexMap[nodeData.self] = nodeCount;
                nodeCount++;

                node = model.Node.create(
                    properties,
                    nodeLabels,
                    this.idFromSelf(nodeData.self)
                );

                $.extend(node, mappedProperties);
                nodes.push(node);
            }

            // convert the edges to an array of d3 edges,
            // which have node indices as source and target
            for (var i = 0; i < neo4jEdges.data.length; i++) {
                edge = neo4jEdges.data[i][0];

                if (!edge) {
                    continue;
                }

                edges.push({
                    _id: this.idFromSelf(edge.self),
                    source: nodeIndexMap[edge.start],
                    target: nodeIndexMap[edge.end],
                    type: edge.type
                });
            }

            console.log("nodes");
            console.log(nodes);

            return {
                nodes: nodes,
                edges: edges
            }
        },

        /**
         * Transform data to neo4j nodes and edges
         */
        to: function (nodes, edges) {

            var neoNodes = [],
                neoEdges = [],
                node,
                edge,
                properties,
                mappedProperties,
                obj;

            if (nodes) {
                for (var i = 0; i < nodes.length; i++) {
                    node = nodes[i];

                    mappedProperties = this.getmappedProperties(node);
                    obj = $.extend({}, node._properties, mappedProperties);

                    neoNodes.push(obj);
                }
            }

            if (edges) {
                for (var i = 0; i < edges.length; i++) {
                    edge = edges[i];

                    neoEdges.push(edge);
                }
            }

            return {
                nodes: neoNodes,
                edges: neoEdges
            }
        },

        toNode: function (node) {
            return this.to([node]).nodes[0];
        }
    });

};
},{}]},{},[1]);
