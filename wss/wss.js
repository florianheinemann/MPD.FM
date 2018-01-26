
var stationList = require("../data/stations.json");

function sendWSSMessage(socket, type, data) {
    var msg = {
        type: type,
        data: (data) ? data : {}
    }
    socket.send(JSON.stringify(msg));
}

module.exports = {
    init: function(wss) {
        wss.on('connection', function connection(ws, req) {
            ws.on('message', function incoming(message) {

                var msg = JSON.parse(message);
                switch(msg.type) {
                    case "REQUEST_STATION_LIST":
                        sendWSSMessage(ws, 'STATION_LIST', stationList);
                        break;
                }

            });

        });
    }
};