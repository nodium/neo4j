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

        to: function (nodiumNode) {

            var mappedProperties = this.getMappedProperties(nodiumNode),
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
