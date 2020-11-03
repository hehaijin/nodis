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
var cacheService_1 = require("./cacheService");
console.log('Master process is running with pid:', process.pid);
var app = express();
var server = http.createServer(app);
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html');
});
var cache = new cacheService_1.CacheService();
server.listen(3000, function () {
    console.log('listening on *:3000');
});
var io = require('socket.io').listen(server);
io.sockets.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('command', function (msg) {
        //console.log('command: ' + msg);
        if (!msg) {
            socket.emit({ error: 'empty command' });
        }
        var response = cache.command(msg);
        socket.emit('result', response);
    });
    socket.on("disconnect", function () {
        console.info("Client gone [id=" + socket.id + "]");
    });
});
