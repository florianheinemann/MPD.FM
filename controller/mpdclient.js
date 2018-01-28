"use strict";

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
        console.log('MPD client ready and connected to ' + mpdOptions.host + ':' + mpdOptions.port);

        mpdStatus = Status.ready;
        mpdClient.on('system', function(name) {
            debug('System update received: ' + name);
            if(name === "playlist" || name === "player") {
                sendStatusRequest(function(error, status) {
                    if(!error) {
                        updateClients.forEach(function(callback) {
                            callback(status);
                        });
                    }
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

function sendCommands(commands, callback) {
    try {
        if(mpdStatus !== Status.ready)
            callback('Not connected');

        var cb = function(err, msg) {
            if(err) {
                console.error(err);
                callback(err);
            } else {
                callback(null, msg);
            }
        };

        if(Array.isArray(commands))
            mpdClient.sendCommands(commands, cb);
        else
            mpdClient.sendCommand(commands, cb);
    } catch(error) {
        callback(error)
    }
}

function sendStatusRequest(callback) {
    sendCommands([cmd("currentsong", []), cmd("status", []) ], 
        function(err, msg) {
            if (err) {
                callback(err);
            } else {
                var status = mpd.parseKeyValueMessage(msg);
                callback(null, status);
            }
    });
}

function sendPlayStation(stream, callback) {
    sendCommands([cmd("clear", []), cmd("repeat", [1]), cmd("add", [stream]), cmd("play", []) ], 
        function(err, msg) {
            if (err) {
                callback(err);
            } else {
                callback();
            }
    });
}

function sendElapsedRequest(callback) {
    sendCommands(cmd("status", []), 
        function(err, msg) {
            if (err) {
                callback(err);
            } else {
                var data = mpd.parseKeyValueMessage(msg);
                var elapsed = { elapsed: 0 };
                for (const [key, value] of Object.entries(data)) {
                    if(key.toLowerCase() === 'elapsed') {
                        elapsed.elapsed = value;
                        break;
                    }
                }
                callback(null, elapsed);
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

    sendCommands(cmd(command, arg), 
        function(err, msg) {
            if (err) {
                callback(err);
            } else {
                callback(null);
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
        sendStatusRequest(callback);
    },

    getElapsed: function getElapsed(callback) {
        sendElapsedRequest(callback);
    },

    play: function play(callback) {
        sendPlay(true, callback);
    },

    pause: function pause(callback) {
        sendPlay(false, callback);
    },

    playStation: function playStation(stream, callback) {
        debug('play ' + stream);
        sendPlayStation(stream, callback);
    },
};