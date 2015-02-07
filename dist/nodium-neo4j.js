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
 (function (context) {

    'use strict';

    var Nodium = context.Nodium;
    // var Nodium = context.Nodium || require('nodium');
        
    require('./nodium-neo4j')(Nodium);
}(this));
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

    var graph       = Nodium.graph,
        model       = Nodium.model,
        transformer = Nodium.transformer,
        NodeEvent   = Nodium.event.NodeEvent,
        EdgeEvent   = Nodium.event.EdgeEvent,
        _defaults   = {
            host: 'localhost',
            port: 7474,
            version: 2,
        },
        self;

    graph.Neo4jAPI = Nodium.createClass({

        construct: function (options) {

            this.options = $.extend({}, _defaults, options);

            self = this;
        },

        /**
         * Constructs a url with optional path
         * @param {String} path
         * @returns {String}
         *
         * @author Niko van Meurs <nikovanmeurs@gmail.com>
         */
        createUrl: function (path) {

            var options = this.options,
                host    = options.host,
                port    = options.port,
                url     = 'http://' + this.options.host;

            if (port) {
                url += ':' + port;
            }

            if (path) {
                url += path;
            }

            return url;
        },

        nodeUrl: function (id) {

            var path = '/db/data/node';

            if (id) {
                path += '/' + id;
            }

            return this.createUrl(path);
        },

        edgeUrl: function (id) {

            var path = '/db/data/relationship';

            if (id) {
                path += '/' + id;
            }

            return this.createUrl(path);
        },

        cypherUrl: function () {
            return this.createUrl('/db/data/cypher');
        },

        initialize: function () {
            $(this.kernel).on(NodeEvent.CREATED, this.handleNodeCreated.bind(this));
            $(this.kernel).on(NodeEvent.DESTROYED, this.handleNodeDeleted.bind(this));
            $(this.kernel).on(EdgeEvent.CREATED, this.handleEdgeCreated.bind(this));
            $(this.kernel).on(EdgeEvent.DESTROYED, this.handleEdgeDeleted.bind(this));
            $(this.kernel).on(NodeEvent.UPDATED, this.handleNodeUpdated.bind(this));
            $(this.kernel).on(NodeEvent.UPDATED, this.handleNodeLabelUpdated.bind(this));
        },

        get: function (callback) {

            var nodeQuery = {
                // query: 'START n=node(*) RETURN n, labels(n)',
                query: 'START n=node(*) RETURN n',
                params: {}
            };
            var edgeQuery = {
                query: 'START r=relationship(*) RETURN r',
                params: {}
            };
            var url = this.cypherUrl();
            var graph;

            // TODO use promises
            $.post(url, nodeQuery)
             .done(function (nodeResult) {

            $.post(url, edgeQuery)
             .done(function (edgeResult) {

                graph = transformer.neo4j.from(nodeResult, edgeResult);

                callback(graph);
             });
            });
        },

        /**
         * Create a node in the neo4j database
         * Store the id to easily delete the node later
         */
        handleNodeCreated: function (event, node, data) {

            var url = this.nodeUrl(),
                props = transformer.neo4j.toNode(data);

            $.ajax({
                url: url,
                data: props,
                type: 'POST',
                async: false
            }).done(function (result) {
                data._id = transformer.neo4j.idFromSelf(result.self);
            });
        },

        /**
         * We're doing this with a cypher, because we also have to delete
         * all relationships
         */
        handleNodeDeleted: function (event, data) {

            var query,
                url = this.cypherUrl();

            // TODO this query should work, but can't find parameter nodeId
            // query = {
            //      "query" : "START n=node({nodeId}) OPTIONAL MATCH n-[r]-() DELETE n,r",
            //      "params" : {
            //          "nodeId": nodeId
            //  }
            // };
            query = {
                "query" : "START n=node("+data._id+") OPTIONAL MATCH n-[r]-() DELETE n,r",
                // "query" : "START n=node("+data._id+") MATCH n-[r?]-() DELETE n,r",
                "params" : {}
            };

            $.post(url, query);
        },

        handleEdgeCreated: function (event, data, source, target) {

            var url = this.nodeUrl(source._id) + '/relationships',
                props = {
                    to: this.edgeUrl(target._id),
                    type: data.type
                };

            $.post(url, props)
             .done(function (result) {
                data._id = transformer.neo4j.idFromSelf(result.self);
             });
        },

        handleEdgeDeleted: function (event, data) {

            var url = this.edgeUrl(data._id);

            $.ajax({
                url: url,
                type: 'DELETE'
            });
        },

        handleNodeUpdated: function (event, node, data, update) {

            // check if a property was updated
            if (!update.changed(model.Node.getPropertiesPath()) &&
                !update.changed('_style')) {
                
                return;
            }

            console.log("api: handling node update");
            console.log(data._id);

            var obj = transformer.neo4j.toNode(data),
                url = this.nodeUrl(data._id) + '/properties';

            $.ajax({
                url: url,
                type: 'PUT',
                data: obj
            });
        },

        /**
         * Removes all labels from the node and replaces them with the ones in data
         * @param data string or array<string>
         */
        handleNodeLabelUpdated: function (event, node, data, update) {

            // check if a label was added or removed
            if (!update.changed(model.Node.getLabelsPath())) {
                return;
            }

            console.log("api: handling node label update");
            console.log(data._id);

            var url = this.nodeUrl(data._id) + '/labels';

            $.ajax({
                url: url,
                type: 'PUT',
                contentType: 'application/json',
                data: JSON.stringify(data._labels)
            });
        }
    });
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
