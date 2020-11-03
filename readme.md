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

-set

-get

-expire

-del

-lpush/rpush

-lindex

-lpop/rpop

-showcache:  show current status of cache for debugging purpose.

### caching functinalities
expire:  implemented with javascript's buildin setTimeout function.

least recently used(LRU) cache:  Needs a way to limit memory usage as caching might grow too big and crash. Implemented with a linkedlist. for simplicity, it currently has a limit of key counts of 100000.


### performance
the caching itself is very fast, while the bottle neck seems on the websocket. so in the current form, running multiple threads with cluster module (in appCluster.ts) does not help with performance.




