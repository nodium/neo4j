module.exports = function (nodium) {

    var jQuery = require('jquery');

    require('./api/Neo4jAPI')(nodium, jQuery);
    require('./transformer/Neo4jTransformer')(nodium, jQuery);
}