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