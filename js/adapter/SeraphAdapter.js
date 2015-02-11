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

module.exports = function (Nodium, undefined) {

    'use strict';

    var SeraphTransformer = require('../transformer/SeraphTransformer')(Nodium);

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
        construct: function (options, transformer) {

            // create the database for this instance
            this._options = _.extend({}, _defaults, options);

            // use the default seraph transformer if no transformer is injected
            this.transformer = transformer || new SeraphTransformer();

            this.db = seraph(this.createUrl());
        },

        /**
         * Constructs a url with optional path
         * @param {String} path
         * @returns {String}
         */
        createUrl: function (path) {

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
        },

        getEdges: function () {

            var cypher = 'START r=relationship(*) '
                       + 'RETURN r';

            return this
                .promiseCypher(cypher)
                .then(function (value) {
                    return this.transformer.fromEdges(value);
                }.bind(this));
        },

        /**
         * Gets all nodes
         * @returns {Promise}
         */
        getNodes: function () {

            var cypher = 'START n=node(*) '
                       + 'RETURN n, labels(n)';

            return this
                .promiseCypher(cypher)
                .then(function (value) {
                    return this.transformer.fromNodes(value);
                }.bind(this));
        },

        /**
         * Function that wraps cypher calls in a Promise
         *
         * @param {String} cypher
         * @returns {Promise}
         */
        promiseCypher: function (cypher) {

            var db = this.db;

            return new Promise(function (resolve, reject) {
                db.query(cypher, function (err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        }
    });

    return api.SeraphAdapter;
};
