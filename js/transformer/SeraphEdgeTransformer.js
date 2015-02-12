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
 * Transforms edges from the SeraphAdapter to Nodium edges
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
    transformer.SeraphEdgeTransformer = Nodium.createClass(transformer.AbstractDataTransformer, {

        from: function (seraphEdge, nodeMap) {

            var source,
                target;

            if (nodeMap) {
                source = nodeMap[seraphEdge.start];
                target = nodeMap[seraphEdge.end];
            }

            source = source !== undefined ? source : seraphEdge.start;
            target = target !== undefined ? target : seraphEdge.end

            return {
                _data: seraphEdge,
                _id: _.uniqueId(),
                _properties: seraphEdge.properties || {},
                source: source,
                target: target,
                type: seraphEdge.type
            };
        },

        to: function (nodiumEdge) {

            var edge = {
                end: nodiumEdge._data.end,
                id: nodiumEdge._data.id,
                properties: nodiumEdge._properties || {},
                start: nodiumEdge._data.start
            };

            return edge;
        }
    });

    return transformer.SeraphEdgeTransformer;
};
