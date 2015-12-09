udp-flood
=====

Flood a host with UDP packets in Node.js.

## Installation

    $ npm install udp-flood
    
## How to use

It's simple to use.

    Usage: flood.js [options]
    
    Options:
    
      -h, --help               output usage information
      -h, --host <host>        Host Name/IP
      -p, --port <port>        If not defined, program will use random ports.
      -w, --workers <workers>  Number of workers to fork in the cluster, default is CPU count.
      -s, --silent <silent>    Silences printing the sent packet count on each cluster.

### Examples

Start UDP flood for `127.0.0.1` with 10 workers:

    node flood.js -h 127.0.0.1 -w 10

Start UDP flood for `127.0.0.1` port `80`:

    node flood.js -h 127.0.0.1 -p 80
