
var socket = null;
const DefaultSongText = 'Select a station';

var timer = {
    // All in ms
    mpdLastUpdate: 0,
    lastMpdUpdateTimestamp: 0,

    displayedTime: 0,
    lastDisplayTimestamp: 0
};

Vue.component('radio-station', {
    props: ['station']
})  

var app = new Vue({
    el: '#app',
    data: {
        stationList: [ ],
        status: 'loading', // playing, stopped, paused
        elapsed: '0:00',
        song: DefaultSongText,
        currentStation: null
    },
    created: function () {
        connectWSS();
        updateElapsed();
    }
})

function connectWSS() {
    // Connect to WebSocket server
    var url = 'ws://'+location.hostname+(location.port ? ':'+location.port: '');
    socket = new ReconnectingWebSocket(url, null, {reconnectInterval: 3000});

    socket.onopen = function () {
        sendWSSMessage('REQUEST_STATION_LIST', null);
        sendWSSMessage('REQUEST_STATUS', null);
    };

    socket.onmessage = function (message) {
        var msg = JSON.parse(message.data);
        switch(msg.type) {
            case "STATION_LIST":
                app.stationList = msg.data;
                break;
            case "STATUS":
                setPlayState(msg.data.state);
                setCurrentStation(msg.data.file);
                setSongName(msg.data.title, msg.data.album, msg.data.artist);
                setElapsedTime(msg.data.elapsed);
            
                break;
        }
    };

    socket.onerror = socket.onclose = function(err) {
        // console.log('close / error');
    };
}

function sendWSSMessage(type, data) {
    var msg = {
        type: type,
        data: (data) ? data : {}
    }
    socket.send(JSON.stringify(msg));
}

function setPlayState(state) {
    switch(state) {
        case 'play':
            app.status = 'playing';
            break;
        case 'stop':
            app.status = 'stopped';
            break;
        case 'pause':
            app.status = 'paused';
            break;
        default:
            app.status = 'loading';
            break;
    }
}

function setCurrentStation(file) {
    app.stationList.forEach(station => {
        if(station.stream === file) {
            app.currentStation = station;
            return;
        }
    });
    currentStation = null;
}

function setSongName(title, album, artist) {
    if(!title && !album && !artist) {
        app.song = DefaultSongText;
    } else {
        var song = '';
        if(typeof artist != 'undefined' && artist.length > 0) {
            song = artist;
        }
        if(typeof album != 'undefined' && album.length > 0) {
            song += ((song.length > 0) ? ' - ' : '') + album;
        }
        if(typeof title != 'undefined' && title.length > 0) {
            song += ((song.length > 0) ? ' - ' : '') + title;
        }
        app.song = song;
    }
}

function setElapsedTime(elapsed) {
    if(!isNaN(parseFloat(elapsed)) && isFinite(elapsed)) {
        timer.mpdLastUpdate = elapsed * 1000;
    } else {
        timer.mpdLastUpdate = 0;
    }
    timer.lastMpdUpdateTimestamp = Date.now();
}

function updateElapsed() {

    var timeout = 1000;
    if(app.status === 'playing') {
        // Last MPD update + the time passed since then
        var bestGuessOnMpdTime = (timer.mpdLastUpdate + Date.now() - timer.lastMpdUpdateTimestamp);

        if(timer.lastDisplayTimestamp <= 0) {
            // Initialize display to latest MPD update + the time passed since then
            timer.displayedTime = bestGuessOnMpdTime;
            timer.lastDisplayTimestamp = Date.now();
        }
        // Advance displayed timer by the time passed since it has been last updated for the user
        timer.displayedTime += Math.max(Date.now() - timer.lastDisplayTimestamp, 0);

        // Calculate difference to best guess
        var delta = timer.displayedTime - bestGuessOnMpdTime;

        if(Math.asb(delta) > 3000) {
            timer.displayedTime = bestGuessOnMpdTime;
        } else {
            var timeoutShorterToRecoverIn10Secs = delta / 10;
            timeout = Math.min(Math.max(timeout - timeoutShorterToRecoverIn10Secs, 0), 2000);
            timer.displayedTime -= timeoutShorterToRecoverIn10Secs;
        }

        console.log('MPD: ' + bestGuessOnMpdTime + ' Current: ' + timer.displayedTime + ' Timeout: ' + timeout);
    } else if(app.status === 'paused') {
        timer.displayedTime = timer.mpdLastUpdate;
    } else {
        timer.displayedTime = 0;
    }

    changeDisplayTimer(timer.displayedTime);
    timer.lastDisplayTimestamp = Date.now();

    setTimeout(() => {
        updateElapsed();
    }, timeout);
}

function changeDisplayTimer(ms) {
    var timeInSec = ms/1000;
    var hours = Math.floor(timeInSec / 3600);
    var minutes = Math.floor((timeInSec / 60) - (hours * 60));
    var seconds = Math.floor(timeInSec - (hours * 3600) - (minutes * 60));
    var strToDisplay = (hours > 0) ? (hours+':') : '';
    strToDisplay += (hours > 0 && minutes < 10) ? ('0' + minutes + ':') : (minutes + ':');
    strToDisplay += (seconds < 10 ? '0' : '') + seconds;
    app.elapsed = strToDisplay;
}