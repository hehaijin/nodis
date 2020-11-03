#  A Redis like standalone caching service implemented in node.js


### install and usage

`npm install`

`npm run prod`

in browser, open localhost:3000 to connect. 

to run unit tests:

`npm test` 


### connection
The service will be accepting websocket connections from client.

once connected, the client can issue Redis like commands to the service.

when running, it also exposes a webpage that can be used for simple issuing commands for testing purpose.


### supported commands
Currently the service supports commmands:

- set

- get

- expire

- del

- lpush/rpush

- lindex

- lpop/rpop

- showcache:  show current status of cache for debugging purpose.

### caching functinalities
expire:  implemented with javascript's buildin setTimeout function.

least recently used(LRU) cache:  Needs a way to limit memory usage as caching might grow too big and crash. Implemented with a linkedlist. for simplicity, it currently has a limit of key counts of 100000.


### performance
In appCluster.ts, I tried to increase performance by running multiple threads with nodejs cluster module. Each single thread will will have a portion of the whole cache data, based on hashcode of the key. Master process will serve as a load balancer, routing requests to invididual thread. However, it seems the performance bottle neck is not in individual threads, but may be in the websocket. it did not help with performance.

one optimization I can think of now is create a special client, that can hold multiple connections to server. the client will then route different requests to different server threads based on key hashcode. 



