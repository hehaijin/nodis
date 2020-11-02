import * as http from 'http';
const express = require('express');
const cluster = require('cluster');
const numOfCpus = require('os').cpus().length - 1;
import { CacheService } from './cacheService';
const hashCode = (s: string) => s.split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0)
let availableID = 0;

if (cluster.isMaster) {
	console.log('Master process is running with pid:', process.pid)
	let app = express();
	let server = http.createServer(app);
	app.get('/', (req: any, res: any) => {
		res.sendFile(__dirname + '/index.html');
	});

	const workers: any[] = [];
	for (let i = 0; i < numOfCpus; i++) {
		console.log('spawining', i);
		let worker = cluster.fork({ workerId: i });
		workers.push(worker);
		worker.on('message', (msg: any) => {
			//console.log('Message from worker:', msg)
		});
	}


	server.listen(3000, () => {
		console.log('listening on *:3000');
	});
	let io = require('socket.io').listen(server);
	io.sockets.on('connection', function (socket: any) {
		console.log('a user connected');
		const socketid = availableID;
		availableID++;
		for (let i = 0; i < numOfCpus; i++) {
			workers[i].on('message', (msg: any) => {
				//console.log('message from worker', msg);
				let message = msg.message;
				let id = msg.socketid;
				if (id === socketid) {
					socket.emit('result', message);
				}
			})
		}
		socket.on('command', (msg: any) => {
			//console.log('command: ' + msg);
			if (!msg) {
				socket.emit({ error: 'empty command' });
			}
			let key = msg.split(/\s+/)[1];
			let hash = hashCode(key) % numOfCpus;
			if (parseInt(key) % 10000 === 0)
				socket.emit('result', key);
			workers[hash].send({ message: msg, socketid });
			//let response = cache.command(msg);

			//socket.emit('result', response);
		});
		socket.on("disconnect", () => {
			console.info(`Client gone [id=${socket.id}]`);
		});
	});

} else {
	console.log('Worker process is running with pid:', process.pid);
	let cache = new CacheService();

	process.on('message', msg => {
		//console.log(process.pid, ' received message from parent:',msg.socketid, msg.message);
		let { socketid, message } = msg;
		let re = cache.command(message);
		(process as any).send({ socketid, message: re });
	});
}

