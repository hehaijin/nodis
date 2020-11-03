interface Result {
	result?: string;
	error?: string
}

class CacheNode {
	pre: CacheNode | undefined;
	next: CacheNode | undefined;
	constructor(public key: string, public data: any) {
		this.next = undefined;
		this.pre = undefined;
	}
}

export class CacheService {
	cacheData: Map<string, CacheNode>;
	timers: Map<string, any>;
	head: CacheNode;
	tail: CacheNode;
	sizeLimit = 100000;
	constructor() {
		this.cacheData = new Map();
		this.timers = new Map();
		this.head = new CacheNode('head', undefined);
		this.tail = new CacheNode('tail', undefined);
		this.head.next = this.tail;
		this.tail.pre = this.head;
	}

	updateNodePosition(key: string) {
		let curr = this.cacheData.get(key);
		if (!curr) return;
		//  happens when the node is not in linked-list yet.
		if (curr.pre) {
			curr.pre.next = curr.next;
			if (curr.next)
				curr.next.pre = curr.pre;
		}
		let n = this.head.next;
		this.head.next = curr;
		curr.pre = this.head;
		curr.next = n;
		if (n)
			n.pre = curr;
	}

	handleSet(key: string, data: any, expire?: string) {
		try {
			if (this.cacheData.has(key)) this.handleDel(key);
			//if (parseInt(key) % 10000 === 0) console.log('setting', key);
			if (this.cacheData.size > this.sizeLimit) {
				let lru = this.tail.pre?.key || '';
				this.handleDel(lru);
			}
			let node = new CacheNode(key, data);
			this.cacheData.set(key, node);
			this.updateNodePosition(key);
			if (expire) return this.handleLExpire(key, expire);
			return { result: 'OK' };
		} catch (error) {
			return { error };
		}
	}

	handleGet(key: string): Result {
		this.updateNodePosition(key);
		let curr = this.cacheData.get(key);
		if (curr)
			return { result: JSON.stringify(curr.data) };
		else return { error: 'Key Miss' };
	}

	handleDel(key: string): Result {
		let node = this.cacheData.get(key);
		if (node === undefined) return { error: `key ${key} does not exist` };
		if (this.timers.has(key)) clearTimeout(this.timers.get(key));
		this.timers.delete(key);
		if (node.pre)
			node.pre.next = node.next;
		if (node.next)
			node.next.pre = node.pre;
		this.cacheData.delete(key);
		return { result: 'OK' };
	}

	handleLExpire(key: string, time: string): Result {
		try {
			if (!this.cacheData.has(key)) {
				return { error: `key ${key} does not exist` };
			}
			if (this.timers.has(key)) {
				clearTimeout(this.timers.get(key));
				this.timers.delete(key);
			}
			let num = parseInt(time);
			if(isNaN(num)){
				return {error: `${time} must be of number format`}; 
			}
			let timer: NodeJS.Timeout = setTimeout(() => {
				this.handleDel(key);
			}, num);
			this.timers.set(key, timer);
			let result = 'OK';
			return { result };
		} catch (error) {
			return { error };
		}
	}

	handlePush(key: string, data: string, dir: string): Result {
		let node = this.cacheData.get(key);
		if (node) {
			if (Array.isArray(node.data)) {
				if (dir === 'right')
					node.data.push(data);
				else if (dir === 'left') {
					node.data.unshift(data);
				}
				this.updateNodePosition(key)
			} else {
				return { error: `type mismatch: key ${key} type is not Array, can not use rpush` }
			}
		} else {
			let node = new CacheNode(key, []);
			node.data.push(data);
			this.cacheData.set(key, node);
			this.updateNodePosition(key)
		}
		let result = 'OK';
		return { result };
	}

	handleLIndex(key: string, index: string): Result {
		try {
			let i = parseInt(index);
			let node = this.cacheData.get(key);
			if (node) {
				if (Array.isArray(node.data)) {
					let len = node.data.length;
					if (i < len) {
						this.updateNodePosition(key)
						return { result: node.data[i] }
					} else {
						return { error: `index out of range for key ${key} of index ${i} on array length of ${len}` };
					}

				} else {
					return { error: `type mismatch: key ${key} type is not Array, can not use lindex` }
				}
			} else {
				return { error: `key ${key} does not exist` }
			}
		} catch (err) {
			return { error: err };
		}
	}

	handlePop(key: string, dir: string) {
		try {
			let node = this.cacheData.get(key);
			if (node) {
				if (Array.isArray(node.data)) {
					let len = node.data.length;
					if (len > 0) {
						let result;
						if (dir === 'left') {
							result = node.data.shift();
						} else {
							result = node.data.pop();
						}
						this.updateNodePosition(key)
						return { result: result }
					} else {
						return { error: `key ${key} has a empty array, can not use pop` };
					}

				} else {
					return { error: `type mismatch: key ${key} type is not Array, can not use pop` }
				}
			} else {
				return { error: `key ${key} does not exist` }
			}
		} catch (err) {
			return { error: err };
		}
	}

	//  showing the cache data based on access 
	handleShowCache() {
		let r = [];
		let curr = this.head.next;
		while (curr !== this.tail) {
			r.push([curr?.key, curr?.data]);
			curr = curr?.next;
		}
		return { result: JSON.stringify(r) };
	}

	command(cmd: string): Result {
		cmd = cmd.trim().toLowerCase();
		let cmds = cmd.split(/\s+/);
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
	}
}