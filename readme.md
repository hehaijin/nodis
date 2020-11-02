#     A Redis like standalone caching service implemented in node.js


### connection
The service will be accepting websocket connections from client.
once connected, the client can issue Redis like commands to the service.
when running, it also exposes a webpage that can be used for simple issuing commands for testing purpose.

### supported commands
Currently the service supports commmands:
set
get
expire
del
lpush/rpush
lindex
lpop/rpop

### caching functinalities
expire:  implemented with javascript's buildin setTimeout function.
least recently used(LRU) cache:  Implemented with a linkedlist. for simplicity, it currently has a limit of key counts of 100000.





