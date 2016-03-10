var teleinfo = require('teleinfo');
var amqp = require('amqplib');
var when = require('when');
var util = require('util');

var amqp_server = 'localhost';
var amqp_channel = 'teleinfo';

amqp.connect('amqp://'+amqp_server).then(function(conn) {
  return when(conn.createChannel().then(function(ch) {

    var ok = ch.assertQueue(amqp_channel, {durable: false});

    return ok.then(function(_qok) {

      var trameEvents = teleinfo('/dev/ttyAMA0');

      //log errors
      trameEvents.on('error', function (err) {
        console.log(util.inspect(err));
      });

      trameEvents.on('tramedecodee', function (data) {
        console.log(data);
        ch.sendToQueue(amqp_channel, new Buffer('test'));
        console.log(" [x] Sent '%s'", data);
      });

      return ch.close();
    });
  })).ensure(function() { conn.close(); });
}).then(null, console.warn);
