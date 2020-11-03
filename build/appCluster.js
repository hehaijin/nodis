"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var http = __importStar(require("http"));
var express = require('express');
var cluster = require('cluster');
var numOfCpus = require('os').cpus().length - 1;
var cacheService_1 = require("./cacheService");
var hashCode = function (s) { return s.split('').reduce(function (a, b) { return (((a << 5) - a) + b.charCodeAt(0)) | 0; }, 0); };
var availableID = 0;
if (cluster.isMaster) {
    console.log('Master process is running with pid:', process.pid);
    var app = express();
    var server = http.createServer(app);
    app.get('/', function (req, res) {
        res.sendFile(__dirname + '/index.html');
    });
    var workers_1 = [];
    for (var i = 0; i < numOfCpus; i++) {
        console.log('spawining', i);
        var worker = cluster.fork({ workerId: i });
        workers_1.push(worker);
        worker.on('message', function (msg) {
            //console.log('Message from worker:', msg)
        });
    }
    server.listen(3000, function () {
        console.log('listening on *:3000');
    });
    var io = require('socket.io').listen(server);
    io.sockets.on('connection', function (socket) {
        console.log('a user connected');
        var socketid = availableID;
        availableID++;
        for (var i = 0; i < numOfCpus; i++) {
            workers_1[i].on('message', function (msg) {
                //console.log('message from worker', msg);
                var message = msg.message;
                var id = msg.socketid;
                if (id === socketid) {
                    socket.emit('result', message);
                }
            });
        }
        socket.on('command', function (msg) {
            //console.log('command: ' + msg);
            if (!msg) {
                socket.emit({ error: 'empty command' });
            }
            var key = msg.split(/\s+/)[1];
            var hash = hashCode(key) % numOfCpus;
            if (parseInt(key) % 10000 === 0)
                socket.emit('result', key);
            workers_1[hash].send({ message: msg, socketid: socketid });
            //let response = cache.command(msg);
            //socket.emit('result', response);
        });
        socket.on("disconnect", function () {
            console.info("Client gone [id=" + socket.id + "]");
        });
    });
}
else {
    console.log('Worker process is running with pid:', process.pid);
    var cache_1 = new cacheService_1.CacheService();
    process.on('message', function (msg) {
        //console.log(process.pid, ' received message from parent:',msg.socketid, msg.message);
        var socketid = msg.socketid, message = msg.message;
        var re = cache_1.command(message);
        process.send({ socketid: socketid, message: re });
    });
}
