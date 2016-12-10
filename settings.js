function config () {
	this.device_configuration = {
								 'MyArduino_UNO':{
								 	sensors:{
									 	flowmeter: { driver: 'direct-pin', pin: 8, work:'directPinFreq'}
									 },
									 actors: {
									 	led: { driver: 'led', pin: 13},
								 		relay: { driver: 'relay', pin: 2, type: "closed"}
								 	},
								 	watchdog: 'standard',
								 },
								 'ArduinoWIthWires':{
								 	actors: {
									 	light: { driver: 'relay', pin: 2, type: "closed"},
									 	led: { driver: 'led', pin: 13, work:'ledFlash'},
									 	pump:  { driver: 'relay', pin: 3, type: "closed"}
									 },
									 sensors:{
					 					pressure:{driver: 'analog-sensor', pin: 1, work:'directPinARead'},
									 }
								 },
								 'NewArduino_3':{
								 	actors: {
					 					servo: {driver: 'servo', pin: 9},
									 	led: { driver: 'led', pin: 13, work:'ledFlash' }
									 },
									 sensors:{
									 	//pin: {driver:'direct-pin', pin:8, work:directPinDRead},
									 	//moisture: {driver:'analog-sensor', pin:5, work:directPinARead},
					 					//hum:{driver: 'analog-sensor', pin: 0, work:readHumidity},
					 					temp:{driver: 'ds18b20', pin: 2, module:'cylon-one-wire',work:'readTemperature'}
									 }
								 },
								};

	// TODO: move to config
	this.scan_space = [  // for *nix
						/*{adaptor:'firmata',port:'/dev/ttyUSB0'},
					    {adaptor:'firmata',port:'/dev/ttyUSB1'},
					    {adaptor:'firmata',port:'/dev/ttyUSB2'},
					    {adaptor:'firmata',port:'/dev/ttyUSB3'},
					    {adaptor:'firmata',port:'/dev/ttyUSB4'},
					    {adaptor:'firmata',port:'/dev/ttyUSB5'},
					    {adaptor:'firmata',port:'/dev/ttyUSB6'},
					    {adaptor:'firmata',port:'/dev/ttyUSB7'},
					    {adaptor:'firmata',port:'/dev/ttyUSB8'},
					    {adaptor:'firmata',port:'/dev/ttyUSB9'},
					    {adaptor:'firmata',port:'/dev/ttyUSB10'},
					    {adaptor:'firmata',port:'/dev/ttyUSB11'},
					    {adaptor:'firmata',port:'/dev/ttyUSB12'},
					    {adaptor:'firmata',port:'/dev/ttyUSB13'},
					    {adaptor:'firmata',port:'/dev/ttyUSB14'}, */
					    {adaptor:'firmata',port:'/dev/ttyUSB15'},
					    // for Windows
					    {adaptor:'firmata',port:'COM20'},
					    {adaptor:'firmata',port:'COM21'},
					    {adaptor:'firmata',port:'COM22'},
					    {adaptor:'firmata',port:'COM23'},
					    {adaptor:'firmata',port:'COM24'},
					    {adaptor:'firmata',port:'COM25'},
					    {adaptor:'firmata',port:'COM26'},
					    //{adaptor:'raspi'}
				   ];

	this.one_wire_devices = { // TODO: move to config
		'sensor1':[ 40, 75, 71, 224, 6, 0, 0, 179 ],
		'sensor2':[ 40, 183, 13, 58, 6, 0, 0, 242 ],
		'sensor3':[ 40, 71, 142, 203, 6, 0, 0, 251 ]
	};
}
module.exports = config;
