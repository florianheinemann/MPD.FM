
var mpd = require('mpd');
var cmd = mpd.cmd;
var debug = require('debug')('mpd.fm:mpdclient');

// Private
var mpdClient = null;
var mpdOptions = null;
var Status = Object.freeze({"disconnected":1, "connecting":2, "ready":3})
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
        debug('Ready');

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
        console.Error('Socket error: ' + err);
        retryConnect();
    });
}

function retryConnect() {
    mpdClient = null;
    mpdStatus = connecting;
    setTimeout(() => {
        connect();
    }, 1000);
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
    }

};