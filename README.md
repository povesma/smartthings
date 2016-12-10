# SmartThings
Internet of things (IoT) framefork based on Cylon.js
# Installation
`npm install cylon cylon-gpio cylon-raspi cylon-i2c cylon-firmata cylon-api-http`

Updated version of cylon-one-wire that works with multiple temp sensors
`git clone https://github.com/povesma/cylon-one-wire node_modules/cylon-one-wire`
TODO: make it submodule

# Setup
Edit settings.js and to define your connections and devices, workers.js to define functions for these devices.

At #HARDCODED LOGIC comment find a function which responds for your software logic. In example it turns servo proportionally to humidity level.

# Run
`node smartthings.js`

