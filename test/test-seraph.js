var assert        = require('assert'),
	chai          = require('chai'),
	expect        = chai.expect;
	should        = chai.should(),
	Nodium        = require('nodium-core'),
	SeraphTransformer = require('../js/transformer/SeraphTransformer')(Nodium),
	transformer   = new SeraphTransformer(),
	SeraphAdapter = require('../js/adapter/SeraphAdapter')(Nodium),
	seraphAdapter = new SeraphAdapter(),
	Neo4jAPI      = require('../js/api/Neo4jAPI')(Nodium),
	api           = new Neo4jAPI();

	chai.use(require('chai-as-promised'));

describe('Seraph transformer', function () {
	describe('#toNode()', function () {
		it('should transform the nodium node for use in seraph', function () {
			var node = transformer.toNode({
				_properties: {
					test: 'test',
					blaaa: 'bla'
				}
			});
			return node.should.contain.keys('blaaa', 'test');
		});
	});
	describe('#toNode()', function () {
		it('should transform the nodium node for use in seraph and set the id', function () {
			var node = transformer.toNode({
				_properties: {
					test: 'test',
					blaaa: 'bla'
				},
				_data: {
					id: 123457689
				}
			});
			return expect(node).to.have.property('id', 123457689);
		});
	});
	describe('#toEdge()', function () {
		it('should transform the nodium edge for use with seraph', function () {
			var edge = transformer.toEdge({
				_data: {
					id: 12347890,
					start: 12345678,
					end: 12345679
				}
			});
			return expect(edge).to.have.property('start', 12345678)
		});
	});
});

describe('Seraph adapter', function () {
	describe('#construct()', function () {
		it('should construct and connect to the database', function () {
			assert.ok(seraphAdapter.db);
		});
	});
	describe('#getNodes()', function () {
		it('should get the nodes from the graph', function () {
			return seraphAdapter.getNodes()
				// .then(function (nodes) {
				// 	console.log(nodes);
				// 	return nodes;
				// })
				.should.be.fulfilled;
		});
	});
	describe('#getEdges()', function () {
		it('should get the edges from the graph', function () {
			return seraphAdapter.getEdges()
				// .then(function (edges) {
				// 	console.log(edges);
				// 	return edges;
				// })
				.should.be.fulfilled;
		});
	});
	describe('#createNode() && #deleteNode()', function () {
		it('should create a new node and delete it', function () {
			return seraphAdapter.createNode({
				_properties: {
					test: 'test',
					blaaa: 'bla'
				}
			})
			// .then(function (node) {
			// 	console.log(node);
			// 	return node;
			// })
			.then(seraphAdapter.deleteNode.bind(seraphAdapter))
			// .then(function (result) {
			// 	console.log(result);
			// })
			.should.be.fulfilled;
		});
	});
});

describe('Neo4j API', function () {
	describe('#getGraph()', function () {
		it('should fetch the graph and return an object with nodes and edges', function () {
			return api.getGraph()
				// .then(function (graph) {
				// 	console.log(graph.edges[graph.edges.length-1])
				// })
				.should.be.fulfilled;
		});
	});
});