import * as http from 'http';
const express = require('express');
import { CacheService } from './cacheService';

console.log('Master process is running with pid:', process.pid)
let app = express();
let server = http.createServer(app);
app.get('/', (req: any, res: any) => {
	res.sendFile(__dirname + '/index.html');
});


const cache = new CacheService();
server.listen(3000, () => {
	console.log('listening on *:3000');
}); 
let io = require('socket.io' ).listen(server);
io.sockets.on('connection', function (socket: any) {
	console.log('a user connected');
	socket.on('command', (msg: any) => {
		//console.log('command: ' + msg);
		if (!msg) {
			socket.emit({ error: 'empty command' });
		}
		let response = cache.command(msg);
		socket.emit('result', response);

	});
	socket.on("disconnect", () => {
		console.info(`Client gone [id=${socket.id}]`);
	});
});
