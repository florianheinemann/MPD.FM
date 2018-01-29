# MPD.FM
A MPD web server and client to listen to your favorite online radio stations. It's great for a Raspberry Pi home audio system.

## Features
- Allows quick switching between your favorite radio stations
- Simple and nicely designed
- Responsive web client - ready for your phone

<img src="https://raw.githubusercontent.com/florianheinemann/florianheinemann.github.io/master/MPD.FM.png" width=300>

## Requirements
MPD.fm has been tested on [Raspbian](https://www.raspberrypi.org/downloads/raspbian/) Stretch Lite. Required are:
- Current version of [Node.js](nodejs.org)
- Installed and configured [MPD](www.musicpd.org/)
- [Git](https://git-scm.com/) (optional to easily keep MPD.fm up-to-date)

## Installation
### Raspbian
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
```

