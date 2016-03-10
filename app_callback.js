var teleinfo = require('teleinfo');
var amqp = require('amqplib/callback_api');
var util = require('util');

var amqp_server = 'localhost';
var amqp_channel = 'teleinfo';

function bail(err, conn) {
  console.error(err);
  if (conn) conn.close(function() { process.exit(1); });
}

function on_connect(err, conn) {
  if (err !== null) return bail(err);

  function on_channel_open(err, ch) {
    if (err !== null) return bail(err, conn);
    ch.assertQueue(amqp_channel, {durable: false}, function(err, ok) {
      if (err !== null) return bail(err, conn);

      var trameEvents = teleinfo('/dev/ttyAMA0');
      trameEvents.on('tramedecodee', function (data) {

        ch.sendToQueue(amqp_channel, new Buffer(data));
        console.log(" [x] Sent '%s'", data);

      });

      //log errors
      trameEvents.on('error', function (err) {
        console.log(util.inspect(err));
      });

      ch.close(function() { conn.close(); });
    });
  }

  conn.createChannel(on_channel_open);
}


amqp.connect(on_connect);


