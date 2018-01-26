
var stationList = require("../data/stations.json");
var mpdClient = require("./mpdclient.js");
var debug = require('debug')('mpd.fm:wss');
const WebSocket = require('ws');

function sendWSSMessage(client, type, data, showDebug = true) {
    showDebug && debug('Send: ' + type + ' with %o', data);
    var msg = {
        type: type,
        data: (data) ? data : {}
    }
    client.send(JSON.stringify(msg));
}

function broadcastMessage(server, type, data) {
    debug('Broadcast: ' + type + ' with %o', data);
    server.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            sendWSSMessage(client, type, data, false);
        }
    });
}

module.exports = {
    init: function(wss) {
        wss.on('connection', function connection(ws, req) {
            ws.on('message', function incoming(message) {

                var msg = JSON.parse(message);
                switch(msg.type) {
                    case "REQUEST_STATION_LIST":
                        debug('Received REQUEST_STATION_LIST');
                        sendWSSMessage(ws, 'STATION_LIST', stationList);
                        break;

                    case "REQUEST_STATUS":
                        debug('Received REQUEST_STATUS');
                        mpdClient.getMpdStatus(function(err, status) {
                            if(err) {
                                sendWSSMessage(ws, 'MPD_OFFLINE', status);
                            } else {
                                sendWSSMessage(ws, 'STATUS', status);
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