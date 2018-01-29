# MPD.FM
A MPD web server and client to listen to your favorite online radio stations. It's great for a Raspberry Pi home audio system.

## Features
- Allows quick switching between your favorite radio stations
- Simple and nicely designed
- Responsive web client - ready for your phone
- Designed to be served as home screen app on iOS ("Add to homescreen")

<img src="https://raw.githubusercontent.com/florianheinemann/florianheinemann.github.io/master/MPD.FM.png" width=300>

## Requirements
MPD.fm has been tested on [Raspbian](https://www.raspberrypi.org/downloads/raspbian/) Stretch Lite. Required are:
- Current version of [Node.js](nodejs.org)
- Installed and configured [MPD](www.musicpd.org/)
- [Git](https://git-scm.com/) (optional to easily keep MPD.fm up-to-date)

## Installation
### Raspbian
Do the following as root:
```
# Install MPD if not yet done - configure as needed
# MPD.FM typically works with an out-of-the-box MPD
apt-get update
apt-get install mpd

# Install Git if not yet done
apt-get install git

# Create a user to have the server not as root
useradd -mrU srv-mpd-fm

# Sign into the new user
su srv-mpd-fm
cd /home/srv-mpd-fm

# Download MPD.fm using Git
git clone https://github.com/florianheinemann/MPD.FM.git

# Install dependencies
cd MPD.FM
npm install

# Back to root
exit

# Copy systemd service file
cp /home/srv-mpd-fm/MPD.FM/service/MPD.FM.service /etc/systemd/system/

# Ensure MPD.FM starts with boot and run
systemctl enable MPD.FM
systemctl start MPD.FM

# Check status
systemctl status MPD.FM
```

To update MPD.FM just do the following as root:
```
# Sign into the dedicated user
su srv-mpd-fm
cd /home/srv-mpd-fm/MPD.FM

# Update
git pull
npm install

# Back to root
exit

# Restart MPD.FM
systemctl restart MPD.FM

# Check status
systemctl status MPD.FM
```

## Play!
- Point your browser to \[IP of your server\]:4200 (e.g., http://192.168.1.2:4200)
- On iOS you can display MPD.FM app-like by pressing *Share / Add to Home Screen* in Safari
- Several clients can use MPD.FM simultaneously

## Configuration
### Basic settings
Ports, etc. can be defined by editing the environment variables in `MPD.FM.service` (typically in /etc/systemd/system):
```
# Set to log detailed debug messages
# Environment=DEBUG=mpd.fm:*

# Details of MPD server (Default: localhost:6600)
Environment=MPD_HOST=localhost
Environment=MPD_PORT=6600

# Port to serve HTTP (the user needs special permission to serve on 80; default: 4200)
Environment=PORT=4200

# JSON file with radio stations. If empty [app root]/data/stations.json will be used
Environment=STATION_FILE=
```

### Station list
`stations.json` provides MPD.FM with all the radio stations that should be shown to the users. Each station is stored as follows:
```
{   "id": 1, 
    "station": "Berlin Community Radio",
    "desc": "BCR is a broadcasting platform presenting everything that is influencing Berlin",
    "logo": "http://www.berlincommunityradio.com/sites/all/themes/bcr_bootstrap/images/logospot.png",
    "stream": "http://berlincommunityradio.out.airtime.pro:8000/berlincommunityradio_a"
} 
```

- **id** - A unique identifier of the station (easiest is to simply number them 1, 2, 3, ...
- **station** - Name of the station that should be displayed
- **desc** - Short description of the station (optional)
- **logo** - URL to a logo of the station (any size)
- **stream** - URL to the stream of the radio station (in a format supported by MPD such as MP3, OGG, ...)
