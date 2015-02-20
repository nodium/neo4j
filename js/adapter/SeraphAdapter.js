/**
 * This file is part of the Nodium Neo4j package
 *
 * (c) Niko van Meurs & Sid Mijnders
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 *
 * The Seraph adapter interfaces with the Seraph neo4j driver.
 * It uses Seraph to query the database and returns objects
 * usable by Nodium.
 */

/**
 * @author Niko van Meurs <nikovanmeurs@gmail.com>
 * @author Sid Mijnders
 */
const
    seraph            = require('seraph'),
    _                 = require('lodash');
    request           = require('request');

module.exports = function (Nodium, undefined) {

    'use strict';

    // var SeraphTransformer = require('../transformer/SeraphTransformer')(Nodium);
    var SeraphNodeTransformer = require('../transformer/SeraphNodeTransformer')(Nodium);
    var SeraphEdgeTransformer = require('../transformer/SeraphEdgeTransformer')(Nodium);

    var api         = Nodium.api,
        _defaults   = {
            host: 'localhost',
            port: 7474
        };

    api.SeraphAdapter = Nodium.createClass({

        /**
         * Initializes options object
         * @param {Object} [options]
         */
        construct: function (options, nodeTransformer, edgeTransformer) {

            this._options = _.extend({}, _defaults, options);

            // use the default seraph transformers if no transformers are injected
            this.nodeTransformer = nodeTransformer || new SeraphNodeTransformer();
            this.edgeTransformer = edgeTransformer || new SeraphEdgeTransformer();

            this.db = seraph(createUrl.call(this));
            this.db._request = request.bind(this);
        },

        call: function (path, method, data) {

            var operation = this.db.operation(path, method, data);

            return this.wrapPromise(this.db.call)(operation);
        },

        createEdge: function (edge) {

            var payload = this.edgeTransformer.to(edge);

            console.log('CREATING EDGE');
            console.log(edge);
            console.log(payload);

            return this
                .wrapPromise(this.db.relate)(
                    payload.start,
                    payload.type,
                    payload.end,
                    payload.properties
                )
                .then(function (seraphEdge) {
                    edge._data = seraphEdge;
                    return edge;
                });
        },

        /**
         * @param {Object} node
         * @returns {Promise}
         */
        createNode: function (node) {

            var payload = this.nodeTransformer.to(node);

            console.log(payload);

            return this
                .wrapPromise(this.db.save)(payload)
                .then(function (seraphNode) {
                    console.log('SERAPH RES');
                    console.log(seraphNode);
                    node._data = seraphNode;
                    return node;
                });
        },

        deleteEdge: function (edge) {

            var payload = this.edgeTransformer.to(edge);

            return this
                .wrapPromise(this.db.rel.delete)(payload)
                .then(function () {
                    return edge;
                });
        },

        /**
         * @param {Object} nodeData An object with the data of the node
         * @returns {Promise} A promise with the data of the deleted node
         */
        deleteNode: function (node) {

            var payload = this.nodeTransformer.to(node);

            return this
                .wrapPromise(this.db.delete)(payload, true)
                .then(function () {
                    return node;
                });
        },

        getEdges: function (nodes) {

            var cypher = 'START r=relationship(*) '
                       + 'RETURN r';

            // create a map from neo4j id to index used by nodium
            var nodeMap = createNodeMap(nodes);

            // prepare the transformer with the node map for all calls
            var transformEdge = _.partialRight(
                _.rearg(this.edgeTransformer.from, [0, 3, 1, 2]),
                nodeMap
            );

            // prepare the map function so it executes when it has received two arguments
            var transformEdges = _.curry(_.map, 2)(_, transformEdge);

            return this
                .promiseCypher(cypher)
                .then(transformEdges);
        },

        /**
         * Gets all nodes
         * @returns {Promise}
         */
        getNodes: function () {

            var cypher = 'START n=node(*) '
                       + 'RETURN n, labels(n)';

            // TODO where to put this???
            var transformNodeAndLabels = function (nodeAndLabels) {
                var node = this.nodeTransformer.from(nodeAndLabels['n']),
                    labels = nodeAndLabels['labels(n)'];

                node._labels = labels;

                return node;
            }.bind(this);

            // prepare the map function so it executes when it has received two arguments
            var transformNodesAndLabels = _.curry(_.map, 2)(_, transformNodeAndLabels);

            return this
                .promiseCypher(cypher)
                .then(transformNodesAndLabels, console.log.bind(console));

            /*
            return this
                .promiseCypher(cypher)
                .then(function (nodesAndLabels) {
                    _.chain(nodesAndLabels) // [{n: node, labels(n): labels}]
                        .map(_.pairs) // [[['n', node], ['labels(n)', labels]]]
                        .map(function (nodeLabelArray) {
                            var nodeArray = nodeLabelArray[0],
                                labelArray = nodeLabelArray[1];
                            return [nodeArray[1], labelArray[1]]
                        }) // [[node, labels]]
                        .map(function (// [[nodiumNode, labels]]
                        // [nodiumNode with labels]
                })
            */
        },

        /**
         * Function that wraps cypher calls in a Promise
         *
         * @param {String} cypher
         * @returns {Promise}
         */
        promiseCypher: function (cypher) {

            return this.wrapPromise(this.db.query)(cypher);
        },

        /**
         * Same as create
         */
        updateNode: function (node) {

            var payload = this.nodeTransformer.to(node);

            return this
                .wrapPromise(this.db.save)(payload)
                .then(function (seraphNode) {
                    node._data = seraphNode;
                    return node;
                });
        },

        wrapPromise: function (fn) {

            return function () {

                var args = arguments;

                return new Promise(function (resolve, reject) {

                    _.partialRight(fn, function (err, result) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    }).apply(this, args);
                });
            }
        }
    });

    /**
     * Constructs a url with optional path
     * @param {String} path
     * @returns {String}
     */
    function createUrl (path) {

        var options = this._options,
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

    function getNeo4jNodeId (node) {

        if (node.hasOwnProperty('_data')) {
            return node._data.id;
        }

        return null;
    }

    function createNodeMap (nodes) {

        var map = {};

        _.forEach(nodes, function (node, index) {
            var id = getNeo4jNodeId(node);
            if (id !== null) {
                map[id] = index;
            }
        });

        return map;
    }

    function request(requestOpts, callback) {

        var url = requestOpts.uri,
            payload = requestOpts.json,
            method = requestOpts.method,
            headers = requestOpts.headers;

        sendRequest(url, payload, method, headers)
            .then(function (response) {
                callback(null, response, response.body);
            }, callback);
    }

    function sendRequest (url, payload, method, headers) {

        headers = headers || {};

        return new Promise (function (resolve, reject) {
            var request = new XMLHttpRequest(),
                requestBody;

            request.open(method, url, true);

            // Resolves the Promise if response is OK,
            // rejects the Promise otherwise
            request.onload = function () {

                if (request.status > 199 && request.status < 300) {

                    var body = parseJSON(request.response),
                        self;

                    if (body) {
                        self = body.self;
                    }

                    resolve({
                        statusCode: request.status,
                        body: body,
                        headers: {
                            location: self
                        }
                    });

                } else {

                    reject(Error(request.statusText));
                }
            };

            // Rejects the Promise
            request.onerror = function () {

                reject(Error("Network- or CORS Error"));
            };

            // Add a request body if payload is present
            // Converts the payload to JSON if payload is not of type string
            if (payload) {

                requestBody = (payload instanceof String) ? payload : JSON.stringify(payload);
                headers['Content-type'] = 'application/json';
            }

            setHeaders(request, headers);

            request.send(requestBody);
        });
    }

    /**
     * Attaches the headers to the request
     * @param {XMLHttpRequest} request
     * @param {Object} headers
     */
    function setHeaders(request, headers) {

        // set headers, pass request as scope
        _.forEach(headers, setHeader, request);
    }

    /**
     * Attaches a header to the request object,
     * Note: the request object needs to be set as the method's scope
     * @param {String} value
     * @param {String} key
     */
    function setHeader (value, key) {

        this.setRequestHeader(key, value);
    }

    function parseJSON (body) {
        if (body === '') {
            body = null;
        } else if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch (e) {}
        }

        return body
    }

    return api.SeraphAdapter;
};
