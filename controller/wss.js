"use strict";

var fs = require('fs');
var path = require('path');
var mpdClient = require("./mpdclient.js");
var debug = require('debug')('mpd.fm:wss');
const WebSocket = require('ws');

var stationFile = process.env.STATION_FILE || path.join(__dirname, '../data/stations.json');

function sendWSSMessage(client, type, data, showDebug = true) {
    data = objectToLowerCase(data);
    showDebug && debug('Send: ' + type + ' with %o', data);
    var msg = {
        type: type,
        data: (data) ? data : {}
    }
    client.send(JSON.stringify(msg), function(error) {
        if(error)
            debug('Failed to send data to client %o', error);
    });
}

function broadcastMessage(server, type, data) {
    data = objectToLowerCase(data);
    debug('Broadcast: ' + type + ' with %o', data);
    server.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            sendWSSMessage(client, type, data, false);
        }
    });
}

function objectToLowerCase(data) {
    if(Array.isArray(data)) {
        return data.map(value => objectToLowerCase(value));
    } else if(typeof data === 'object') {
        var retData = {};
        for (const [key, value] of Object.entries(data)) {
            retData[key.toLowerCase()] = objectToLowerCase(value);
        }
        return retData;
    } else {
        return data;
    }
}

module.exports = {
    init: function(wss) {
        wss.on('connection', function connection(ws, req) {
            ws.on('message', function incoming(message) {

                var msg = JSON.parse(message);
                debug('Received %s with %o', msg.type, msg.data);
                switch(msg.type) {
                    case "REQUEST_STATION_LIST":

                        fs.readFile(stationFile, 'utf8', function (err, data) {
                            if (err) {
                                console.error('Can\'t read station file: "' + stationFile + '": ' + err);
                                return;
                            }
                            try {
                                var stationList = JSON.parse(data);
                                sendWSSMessage(ws, 'STATION_LIST', stationList);
                            } catch (error) {
                                console.error('Can\'t interpret station file: "' + stationFile + '": ' + error);
                            }
                        });
                        break;

                    case "REQUEST_STATUS":
                        mpdClient.getMpdStatus(function(err, status) {
                            if(err) {
                                sendWSSMessage(ws, 'MPD_OFFLINE', status);
                            } else {
                                sendWSSMessage(ws, 'STATUS', status);
                            }
                        });
                        break;

                    case "REQUEST_ELAPSED":
                        mpdClient.getElapsed(function(err, status) {
                            if(err) {
                                sendWSSMessage(ws, 'MPD_OFFLINE', status);
                            } else {
                                sendWSSMessage(ws, 'ELAPSED', status);
                            }
                        });
                        break;

                    case "PLAY":
                        if(msg.data && msg.data.stream) {
                            mpdClient.playStation(msg.data.stream, function(err) {
                                if(err) {
                                    sendWSSMessage(ws, 'MPD_OFFLINE', status);
                                }
                            });
                        } else {
                            mpdClient.play(function(err) {
                                if(err) {
                                    sendWSSMessage(ws, 'MPD_OFFLINE', status);
                                }
                            });
                        }
                        break;

                    case "PAUSE":
                        mpdClient.pause(function(err) {
                            if(err) {
                                sendWSSMessage(ws, 'MPD_OFFLINE', status);
                            }
                        });
                        break;
                }

            });

        });

        mpdClient.onStatusChange(function(status) {
            broadcastMessage(wss, 'STATUS', status);                       
        });
    }
};