//Requirements
var teleinfo = require('teleinfo');
var amqp = require('amqplib');
var when = require('when');
var util = require('util');
var server = require('http').Server(app);
var io = require('socket.io')(server);

//Configuration
var amqp_server = 'localhost';
var amqp_channel = 'teleinfo';
var teleinfo_input = '/dev/ttyAMA0';
var port = 8081;
var amqp_publish_frequency = 5000;
var debug = false;

//Begin teleinfo events
var trameEvents = teleinfo('/dev/ttyAMA0');

//AMQP publisher
setTimeout(function() {

  trameEvents.on('tramedecodee', function (data) {

    amqp.connect('amqp://'+amqp_server).then(function(conn) {

      return when(conn.createChannel().then(function(ch) {

        var ok = ch.assertQueue(amqp_channel, {durable: false});

        return ok.then(function(_qok) {

          var string = JSON.stringify(data);

          ch.sendToQueue(amqp_channel, new Buffer(string));
          
          if (debug) { console.log(" [x] Sent to AMQP '%s'", data); }

          return ch.close();
        });

      })).ensure(function() { conn.close(); });

    }).then(null, console.warn);

  });

}, amqp_publish_frequency );  

//Socket IO: send real time data
trameEvents.on('tramedecodee', function (data) {
  io.sockets.emit('message', data);
  if (debug) { console.log(" [x] Sent to websocket '%s'", data); }
});

//log errors
trameEvents.on('error', function (err) {
  console.log(util.inspect(err));
});

//Start server
console.log('Server listening on port: '.concat(port));
