
var mpd = require('mpd');
var cmd = mpd.cmd;
var debug = require('debug')('mpd.fm:mpdclient');

// Private
var mpdClient = null;
var mpdOptions = null;
var Status = Object.freeze({"disconnected":1, "connecting":2, "reconnecting":3, "ready":4})
var mpdStatus = Status.disconnected;
var updateClients = [];

function connect() {
    // End existing session, if any
    if(mpdClient && mpdClient.socket) {
        mpdClient.socket.end();
        mpdClient = null;
    }

    mpdStatus = Status.connecting;
    debug('Connecting');
    mpdClient = mpd.connect(mpdOptions);

    mpdClient.on('ready', function() {
        console.log('MPD client ready');

        mpdStatus = Status.ready;
        mpdClient.on('system', function(name) {
            debug('System update received: ' + name);
            if(name === "playlist" || name === "player") {
                sendStatusRequest(function(status) {
                    updateClients.forEach(function(callback) {
                        callback(status);
                    });
                });
            }
        });
    });

    mpdClient.on('end', function() {
        debug('Connection ended');
        retryConnect();
    });

    mpdClient.on('error', function(err) {
        console.error('MPD client socket error: ' + err);
        retryConnect();
    });
}

function retryConnect() {
    if(mpdStatus === Status.reconnecting)
        return;
    mpdClient = null;
    mpdStatus = Status.reconnecting;
    setTimeout(() => {
        connect();
    }, 3000);
}

function sendStatusRequest(callback) {
    mpdClient.sendCommands([cmd("currentsong", []), cmd("status", []) ], 
        function(err, msg) {
            if (err) {
                console.error(err);
            } else {
                var status = mpd.parseKeyValueMessage(msg);
                callback(status);
            }
    });
}

function sendPlayStation(stream, callback) {
    mpdClient.sendCommands([cmd("clear", []), cmd("repeat", [1]), cmd("add", [stream]), cmd("play", []) ], 
        function(err, msg) {
            if (err) {
                console.error(err);
            } else {
                callback();
            }
    });
}

function sendElapsedRequest(callback) {
    mpdClient.sendCommand(cmd("status", []), 
        function(err, msg) {
            if (err) {
                console.error(err);
            } else {
                var data = mpd.parseKeyValueMessage(msg);
                var elapsed = { elapsed: 0 };
                for (const [key, value] of Object.entries(data)) {
                    if(key.toLowerCase() === 'elapsed') {
                        elapsed.elapsed = value;
                        break;
                    }
                }
                callback(elapsed);
            }
    });
}

function sendPlay(play, callback) {
    var command = 'play';
    var arg = [];
    if(!play) {
        command = 'pause';
        arg = [1];
    }

    mpdClient.sendCommand(cmd(command, arg), 
        function(err, msg) {
            if (err) {
                console.error(err);
            } else {
                callback();
            }
    });
}

var self = module.exports = {

    setup: function setup(options) {
        mpdOptions = options;
        connect();
    },

    onStatusChange: function onStatusChange(callback) {
        updateClients.push(callback);
    },

    getMpdStatus: function getMpdStatus(callback) {
        if(mpdStatus !== Status.ready)
            callback('Not connected');
        else
            sendStatusRequest((status) => { callback(null, status); });
    },

    getElapsed: function getElapsed(callback) {
        if(mpdStatus !== Status.ready)
            callback('Not connected');
        else
            sendElapsedRequest((status) => { callback(null, status); });
    },

    play: function play(callback) {
        if(mpdStatus !== Status.ready)
            callback('Not connected');
        else
            sendPlay(true, () => { callback(null); });
    },

    pause: function pause(callback) {
        if(mpdStatus !== Status.ready)
            callback('Not connected');
        else
            sendPlay(false, () => { callback(null); });
    },

    playStation: function playStation(stream, callback) {
        debug('play ' + stream);
        if(mpdStatus !== Status.ready)
            callback('Not connected');
        else
            sendPlayStation(stream, () => { callback(null); });
    },
};