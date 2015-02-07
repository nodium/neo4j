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