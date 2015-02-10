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
    seraph = require('seraph'),
    _      = require('lodash');

module.exports = function (Nodium, undefined) {

    'use strict';

    var api         = Nodium.api,
        model       = Nodium.model,
        transformer = Nodium.transformer,
        _defaults   = {
            host: 'localhost',
            port: 7474
        };

    api.SeraphAdapter = Nodium.createClass({

        /**
         * Initializes options object
         * @param {Object} [options]
         */
        construct: function (options) {

            // create the database for this instance
            this._options = _.extend({}, _defaults, options);

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

            return new Promise(function (resolve, reject) {

                var cypher = 'START r=relationship(*) '
                           + 'RETURN r';

                db.query(cypher, function (err, result) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        },

        /**
         * Gets all nodes and edges
         * @returns {Promise}
         */
        getGraph: function () {

            return Promise.all([this.getNodes(), this.getEdges()])
                .then(function (values) {
                    console.log('yaay');
                    console.log(values);
                })
                .catch(function (reason) {
                    console.log('naaay :(');
                    console.log(reason);
                });
        },

        getNodes: function () {

            return new Promise(function (resolve, reject) {

                var cypher = 'START n=node(*) '
                           + 'RETURN n, labels(n)';

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
};
