"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var cacheService_1 = require("../cacheService");
var expect = require('chai').expect;
describe('CacheService Unit tests', function () {
    it('should accept set commands', function () {
        var _a, _b;
        var cache = new cacheService_1.CacheService();
        cache.command('set a 5');
        expect(cache.cacheData.has('a'));
        expect((_b = (_a = cache.head) === null || _a === void 0 ? void 0 : _a.next) === null || _b === void 0 ? void 0 : _b.data).to.be.equal('5');
    });
    it('should accept lpush commands', function () {
        var _a;
        var cache = new cacheService_1.CacheService();
        cache.command('lpush b 5');
        expect(cache.cacheData.has('b'));
        expect((_a = cache.cacheData.get('b')) === null || _a === void 0 ? void 0 : _a.data).to.be.an('array');
    });
    it('should not accept lpush commands on string', function () {
        var cache = new cacheService_1.CacheService();
        cache.command('set a 5');
        var r = cache.command('lpush a 5');
        expect(r.error).to.be.ok;
    });
    it('newly used values is going to be put ahead', function () {
        var _a;
        var cache = new cacheService_1.CacheService();
        cache.command('set a 5');
        cache.command('set b 6');
        expect((_a = cache.head.next) === null || _a === void 0 ? void 0 : _a.key).to.be.equal('b');
    });
    it('should return error when trying to get a non-exist key', function () {
        var cache = new cacheService_1.CacheService();
        var re = cache.command('get a ');
        expect(re.error).to.be.ok;
    });
    it('should return error when trying to expire a non-exist key', function () {
        var cache = new cacheService_1.CacheService();
        var re = cache.command('expire a');
        expect(re.error).to.be.ok;
    });
});
