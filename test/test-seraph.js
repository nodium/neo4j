var assert        = require('assert'),
	chai          = require('chai'),
	should        = chai.should(),
	Nodium        = require('nodium-core'),
	SeraphAdapter = require('../js/adapter/SeraphAdapter')(Nodium),
	seraphAdapter = new SeraphAdapter(),
	Neo4jAPI      = require('../js/api/Neo4jAPI')(Nodium),
	api           = new Neo4jAPI();

	chai.use(require('chai-as-promised'));
	// require('../js/adapter/SeraphAdapter')(Nodium);

describe('Seraph adapter', function () {
	describe('#construct()', function () {
		it('should construct and connect to the database', function () {
			assert.ok(seraphAdapter.db);
		});
	});
	describe('#getNodes()', function () {
		it('should get the nodes from the graph', function () {
			return seraphAdapter.getNodes().should.be.fulfilled;
		});
	});
	describe('#getEdges()', function () {
		it('should get the edges from the graph', function () {
			return seraphAdapter.getEdges().should.be.fulfilled;
		});
	});
});

describe('Neo4j API', function () {
	describe('#getGraph()', function () {
		it('should fetch the graph and return an object with nodes and edges', function () {
			return api.getGraph().should.be.fulfilled;
		});
	});
});