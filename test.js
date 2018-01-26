var mpd = require('mpd'),
    cmd = mpd.cmd
var client = mpd.connect({
  port: 6600,
  host: 'localhost',
});
client.on('ready', function() {
  console.log("ready");
  client.sendCommand(cmd("playlistinfo", []), function(err, msg) {
    if (err) throw err;
    msg = mpd.parseArrayMessage(msg);
    console.log('playlist');
    console.log(msg);
  });
  client.sendCommand(cmd("currentsong", []), function(err, msg) {
    if (err) throw err;
    msg = mpd.parseArrayMessage(msg);
    console.log('currentsong');
    console.log(msg);
  });
  client.sendCommands([ cmd("currentsong", []), cmd("status", []) ] , function(err, msg) {
    if (err) throw err;
    msg = mpd.parseKeyValueMessage(msg);
    console.log('all');
    console.log(msg);
  });
});
client.on('system', function(name) {
    console.log('on system');
  console.log("update", name);
});
client.on('system-player', function() {
    console.log('on system-player');
  client.sendCommand(cmd("status", []), function(err, msg) {
    if (err) throw err;
    console.log("a " + msg);
  });
});