nmpriq
======
Priority queue service based on HTTP with Node.js and MongoDB backend

[![Build Status](https://travis-ci.org/tilfin/nmpriq.png?branch=master)](https://travis-ci.org/tilfin/nmpriq) [![Coverage Status](https://coveralls.io/repos/tilfin/nmpriq/badge.png?branch=master)](https://coveralls.io/r/tilfin/nmpriq?branch=master)


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

