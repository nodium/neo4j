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
const _ = require('lodash');

module.exports = function (Nodium, undefined) {

    'use strict';

    var Nodium      = Nodium,
        Node        = Nodium.model.Node2,
        transformer = Nodium.transformer;

    /**
     * An interface between the Neo4j data structure and the data structure
     * used by this framework
     */
    transformer.SeraphNodeTransformer = Nodium.createClass(transformer.AbstractDataTransformer, {

        /**
         * @param {Object} A data object from seraph
         * @return {Object} An object structured for Nodium uses
         */
        from: function (seraphNode) {

            var parsedData = this.splitProperties(seraphNode, this.options.map);

            return new Node(
                null,                    // this adapter always uses a unique id
                parsedData.properties,   // the public properties
                parsedData.mapped,       // the private properties
                [],                      // labels will be added later
                { _data: seraphNode }    // this adapter needs raw neo4j data to be stored here
            );
        },

        to: function (nodiumNode) {

            if (!nodiumNode) {
                return;
            }

            var mappedProperties = this.getMappedProperties(nodiumNode._mapped),
                node = _.extend({}, nodiumNode._properties, mappedProperties);

            // place back the neo4j id if it exists
            if (nodiumNode.hasOwnProperty('_data')) {
                node.id = nodiumNode._data.id;
            }

            return node;
        }
    });

    return transformer.SeraphNodeTransformer;
};
