import { CacheService } from '../cacheService';
const expect = require('chai').expect;

describe('CacheService Unit tests', () => {
	it('should accept set commands', () => {
		let cache = new CacheService();
		cache.command('set a 5');
		expect(cache.cacheData.has('a'));
		expect(cache.head?.next?.data).to.be.equal('5');
	});

	it('should accept lpush commands', () => {
		let cache = new CacheService();
		cache.command('lpush b 5');
		expect(cache.cacheData.has('b'));
		expect(cache.cacheData.get('b')?.data).to.be.an('array');
	});

	it('should not accept lpush commands on string', () => {
		let cache = new CacheService();
		cache.command('set a 5');
		let r = cache.command('lpush a 5');
		expect(r.error).to.be.ok;
	});

	it('newly used values is going to be put ahead', () => {
		let cache = new CacheService();
		cache.command('set a 5');
		cache.command('set b 6');
		expect(cache.head.next?.key).to.be.equal('b');
	});
	it('should return error when trying to get a non-exist key', () => {
		let cache = new CacheService();
		let re= cache.command('get a ');
		expect(re.error).to.be.ok;
	});

	it('should return error when trying to expire a non-exist key', () => {
		let cache = new CacheService();
		let re= cache.command('expire a');
		expect(re.error).to.be.ok;
	});
});