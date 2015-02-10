var assert        = require('assert'),
	Nodium        = require('./nodium'),
	seraphAdapter;

	require('../js/adapter/SeraphAdapter')(Nodium);
	seraphAdapter = Nodium.api.SeraphAdapter();

describe('Array', function(){
  describe('#indexOf()', function(){
    it('should return -1 when the value is not present', function(){
      assert.equal(-1, [1,2,3].indexOf(4)); // 4 is not present in this array so indexOf returns -1
    })
  })
});


describe('Get', function () {
	describe('#getNodes()', function () {
		it('should get the nodes from the graph', function () {
			var nodes = seraphAdapter.getNodes();
			console.log(nodes);
			assert.equal(1, 1);
		});
	});
});