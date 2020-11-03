"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
var CacheNode = /** @class */ (function () {
    function CacheNode(key, data) {
        this.key = key;
        this.data = data;
        this.next = undefined;
        this.pre = undefined;
    }
    return CacheNode;
}());
var CacheService = /** @class */ (function () {
    function CacheService() {
        this.sizeLimit = 100000;
        this.cacheData = new Map();
        this.timers = new Map();
        this.head = new CacheNode('head', undefined);
        this.tail = new CacheNode('tail', undefined);
        this.head.next = this.tail;
        this.tail.pre = this.head;
    }
    CacheService.prototype.updateNodePosition = function (key) {
        var curr = this.cacheData.get(key);
        if (!curr)
            return;
        //  happens when the node is not in linked-list yet.
        if (curr.pre) {
            curr.pre.next = curr.next;
            if (curr.next)
                curr.next.pre = curr.pre;
        }
        var n = this.head.next;
        this.head.next = curr;
        curr.pre = this.head;
        curr.next = n;
        if (n)
            n.pre = curr;
    };
    CacheService.prototype.handleSet = function (key, data, expire) {
        var _a;
        try {
            if (this.cacheData.has(key))
                this.handleDel(key);
            //if (parseInt(key) % 10000 === 0) console.log('setting', key);
            if (this.cacheData.size > this.sizeLimit) {
                var lru = ((_a = this.tail.pre) === null || _a === void 0 ? void 0 : _a.key) || '';
                this.handleDel(lru);
            }
            var node = new CacheNode(key, data);
            this.cacheData.set(key, node);
            this.updateNodePosition(key);
            if (expire)
                return this.handleLExpire(key, expire);
            return { result: 'OK' };
        }
        catch (error) {
            return { error: error };
        }
    };
    CacheService.prototype.handleGet = function (key) {
        this.updateNodePosition(key);
        var curr = this.cacheData.get(key);
        if (curr)
            return { result: JSON.stringify(curr.data) };
        else
            return { error: 'Key Miss' };
    };
    CacheService.prototype.handleDel = function (key) {
        var node = this.cacheData.get(key);
        if (node === undefined)
            return { error: "key " + key + " does not exist" };
        if (this.timers.has(key))
            clearTimeout(this.timers.get(key));
        this.timers.delete(key);
        if (node.pre)
            node.pre.next = node.next;
        if (node.next)
            node.next.pre = node.pre;
        this.cacheData.delete(key);
        return { result: 'OK' };
    };
    CacheService.prototype.handleLExpire = function (key, time) {
        var _this = this;
        try {
            if (!this.cacheData.has(key)) {
                return { error: "key " + key + " does not exist" };
            }
            if (this.timers.has(key)) {
                clearTimeout(this.timers.get(key));
                this.timers.delete(key);
            }
            var num = parseInt(time);
            var timer = setTimeout(function () {
                _this.handleDel(key);
            }, num);
            this.timers.set(key, timer);
            var result = 'OK';
            return { result: result };
        }
        catch (error) {
            return { error: error };
        }
    };
    CacheService.prototype.handlePush = function (key, data, dir) {
        var node = this.cacheData.get(key);
        if (node) {
            if (Array.isArray(node.data)) {
                if (dir === 'right')
                    node.data.push(data);
                else if (dir === 'left') {
                    node.data.unshift(data);
                }
                this.updateNodePosition(key);
            }
            else {
                return { error: "type mismatch: key " + key + " type is not Array, can not use rpush" };
            }
        }
        else {
            var node_1 = new CacheNode(key, []);
            node_1.data.push(data);
            this.cacheData.set(key, node_1);
            this.updateNodePosition(key);
        }
        var result = 'OK';
        return { result: result };
    };
    CacheService.prototype.handleLIndex = function (key, index) {
        try {
            var i = parseInt(index);
            var node = this.cacheData.get(key);
            if (node) {
                if (Array.isArray(node.data)) {
                    var len = node.data.length;
                    if (i < len) {
                        this.updateNodePosition(key);
                        return { result: node.data[i] };
                    }
                    else {
                        return { error: "index out of range for key " + key + " of index " + i + " on array length of " + len };
                    }
                }
                else {
                    return { error: "type mismatch: key " + key + " type is not Array, can not use lindex" };
                }
            }
            else {
                return { error: "key " + key + " does not exist" };
            }
        }
        catch (err) {
            return { error: err };
        }
    };
    CacheService.prototype.handlePop = function (key, dir) {
        try {
            var node = this.cacheData.get(key);
            if (node) {
                if (Array.isArray(node.data)) {
                    var len = node.data.length;
                    if (len > 0) {
                        var result = void 0;
                        if (dir === 'left') {
                            result = node.data.shift();
                        }
                        else {
                            result = node.data.pop();
                        }
                        this.updateNodePosition(key);
                        return { result: result };
                    }
                    else {
                        return { error: "key " + key + " has a empty array, can not use pop" };
                    }
                }
                else {
                    return { error: "type mismatch: key " + key + " type is not Array, can not use pop" };
                }
            }
            else {
                return { error: "key " + key + " does not exist" };
            }
        }
        catch (err) {
            return { error: err };
        }
    };
    //  showing the cache data based on access 
    CacheService.prototype.handleShowCache = function () {
        var r = [];
        var curr = this.head.next;
        while (curr !== this.tail) {
            r.push([curr === null || curr === void 0 ? void 0 : curr.key, curr === null || curr === void 0 ? void 0 : curr.data]);
            curr = curr === null || curr === void 0 ? void 0 : curr.next;
        }
        return { result: JSON.stringify(r) };
    };
    CacheService.prototype.command = function (cmd) {
        cmd = cmd.trim().toLowerCase();
        var cmds = cmd.split(/\s+/);
        switch (cmds[0]) {
            case 'set': {
                return this.handleSet(cmds[1], cmds[2], cmds[3]);
            }
            case 'get': {
                return this.handleGet(cmds[1]);
            }
            case 'del': {
                return this.handleDel(cmds[1]);
            }
            case 'expire': {
                return this.handleLExpire(cmds[1], cmds[2]);
            }
            case 'rpush': {
                return this.handlePush(cmds[1], cmds[2], 'right');
            }
            case 'lpush': {
                return this.handlePush(cmds[1], cmds[2], 'left');
            }
            case 'lindex': {
                return this.handleLIndex(cmds[1], cmds[2]);
            }
            case 'lpop': {
                return this.handlePop(cmds[1], 'left');
            }
            case 'rpop': {
                return this.handlePop(cmds[1], 'right');
            }
            case 'showcache': {
                return this.handleShowCache();
            }
            default: {
                return { error: 'command not recognized' };
            }
        }
    };
    return CacheService;
}());
exports.CacheService = CacheService;
