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

            // find the start and end points
            // these can be in two possible places:
            // the node _data and the edge _data
            var id,
                start,
                end;

            if (nodiumEdge.hasOwnProperty('_data')) {
                id = nodiumEdge._data.id;
                start = nodiumEdge._data.start;
                end = nodiumEdge._data.end;
            }

            // try the node _data if we didn't find anything
            if (start === undefined || start === null) {
                start = nodiumEdge.source._data.id;
                end = nodiumEdge.target._data.id;
            }

            var edge = {
                end:        end,
                properties: nodiumEdge._properties || {},
                start:      start,
                type:       nodiumEdge.type
            };

            if (id !== 0 && id) {
                edge.id = id;
            }

            return edge;
        }
    });

    return transformer.SeraphEdgeTransformer;
};
