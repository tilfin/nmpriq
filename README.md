nmpriq
======
Priority queue service based on HTTP with Node.js and MongoDB backend

[![Build Status](https://travis-ci.org/tilfin/nmpriq.svg?branch=master)](https://travis-ci.org/tilfin/nmpriq) [![Coverage Status](https://coveralls.io/repos/tilfin/nmpriq/badge.svg?branch=master)](https://coveralls.io/r/tilfin/nmpriq?branch=master)


About
----------
Nmpriq is a priority queue service which is able to use simple by HTTP protocol.



Prerequisites
-------------
- Node.js
- MongoDB


How to use
----------

### Install

    $ git clone https://github.com/tilfin/nmpriq.git
    $ cd nmpriq
    $ npm install


### Usage

    $ ./bin/nmpriq --help
    Usage: nmpriq [options] <MongoDB URI>
    
    Options:
    
      -h, --help      output usage information
      -V, --version   output the version number
      -p, --port <n>  listening port


### Enqueue and Dequeue

HTTP POST is enqueue.
HTTP GET is dequeue.
The 'key' is main item key.
'queueName' is mongodb collection name.

    $ curl -X POST \
        -H 'Content-Type: application/json' \
        -d '{"key":"item1"}' \
        http://localhost:<port>/<queueName>
    {"message":"success"}


    $ curl -X GET http://localhost:<port>/<queueName>
    {"key":"item1","priority":10}

If a client requests GET when the queue is emtpy, nmpriq server accepts its GET as long-polling.
Receiving new item by other clients, the server immediately returns it.


### Use priority

The dequeue order is higher priority and enqueued order.
A default prority is 10.

'item1' is enqueued first with defalut prority.

    $ curl -X POST \
        -H 'Content-Type: application/json' \
        -d '{"key":"item1"}' \
        http://localhost:<port>/<queueName>
    {"message":"success"}

'item2' is enqueued second with prority is 50.

    $ curl -X POST \
        -H 'Content-Type: application/json' \
        -d '{"key":"item2","prority":50}' \
        http://localhost:<port>/<queueName>
    {"message":"success"}

  

    $ curl -X GET http://localhost:<port>/<queueName>
    {"key":"item2","priority":50}

'item2' is dequeued.

    $ curl -X GET http://localhost:<port>/<queueName>
    {"key":"item1","priority":10}

'item1' is dequeued.


### Priority addition

If an item has already enqueued, its priority is added.

    $ curl -X POST \
        -H 'Content-Type: application/json' \
        -d '{"key":"item1"}' \
        http://localhost:<port>/<queueName>
    {"message":"success"}

item1's priority is 10.

    $ curl -X POST \
        -H 'Content-Type: application/json' \
        -d '{"key":"item1","prority":20}' \
        http://localhost:<port>/<queueName>
    {"message":"success"}

item1's priority is added 20.

    $ curl -X GET http://localhost:<port>/<queueName>
    {"key":"item1","priority":30}


item1's priority is 30.


### With custom values

The 'value' is custom value field.
It is stored as a part of mongodb document.

    $ curl -X POST \
        -H 'Content-Type: application/json' \
        -d '{"key":"item1","value":{"name":"taro","age":25}}' \
        http://localhost:<port>/<queueName>
    {"message":"success"}


    $ curl -X GET http://localhost:<port>/<queueName>
    {"key":"item1","priority":10,"value":{"name":"taro","age":25}}

