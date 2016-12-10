/* REQUISITES:
npm install cylon cylon-gpio cylon-raspi cylon-i2c cylon-firmata cylon-api-http
// updated version of cylon-one-wire that works with multiple temp sensors
git clone https://github.com/povesma/cylon-one-wire node_modules # TODO: make it submodule

*/
// TODO: implement!
var pace = 1; // 0 - refresh all sensors as fast as possible (can heavily load CPU), >0 - second to wait before refreshing. By the device nature can be more than this number, e.g. 1-wire refresh takes as least 1 second

var express = require('express');

// if you want for some reason read data from pyton script output
//var PythonShell = require('python-shell');
//var flow_sensor = new PythonShell('flowmeter.py', { mode: 'text'} );
// var pressure_sensor = new PythonShell('pressure.py'), { mode: 'text '};

var Cylon = require('cylon');


console.log("Starting an app");

var cfg1 = require ('./settings.js'); // TODO: use config library instead of require;
var cfg = new cfg1();
console.log(cfg);
for (var i in cfg) {
	console.log('#',i);
}
var device_configuration = cfg.device_configuration;
var scan_space = cfg.scan_space;
var one_wire_devices = cfg.one_wire_devices;

var wrks = require('./workers.js'); // TODO: use config library instead of require;
var all_workers = new wrks(cfg, {setState:setState});

// TODO: move to config



function scanPorts (scan_space) { // scans ports and returns array of robots
	var rs = []; // templates for robots
	for (var i = 0; i < scan_space.length; i++) {
		var r = {connections: {
					c1: scan_space[i]
				},
			work:updator
			};
		rs.push(Cylon.robot(r));
	}
	return rs;
}

var all_robots = {};
function initRobots (rs, callback) { // check all connections, get firmware name (TODO: other board ID, now consider working with Arduino only)
	var robots = [];
	for (var i = 0; i < rs.length; i++) {
		rs[i].startConnections(function (e,d) {
			var c_robot = this;
			if (c_robot.alive) {
				return;
			}
			if (e) {
				// error occured when connecting
				console.log("Error when connecting: ", e,'c_robot.name:', c_robot.name);
				c_robot.complete = true;
				c_robot.alive = false;
				// kill the robot
				return;
			}
			var cn = null;
			for (var k in c_robot.connections) { // actually, there's just one connection by design
				cn = c_robot.connections[k];
			}
			var board_id = cn.board.firmware.name; // TODO: support other than Arduino!

			console.log('Connected to: ', board_id);
			c_robot.name = board_id;
			var devs = {};
			// build proper set of device for this robot:
			if (device_configuration[board_id]) { // there's a config for this board. Load it
				devs = Object.assign(device_configuration[board_id].sensors, device_configuration[board_id].actors);
				//delete devs.work;
				console.log('Devices:', devs);
			}

			// create fake robot with proper set of devices to snatch them later for real one:
			// cylon does not allow to update devices after the robot has been created.
			var t1 = Cylon.robot ({name: 't1',
						 				connections: {fake: {adaptor:'firmata',port:'/dev/ttyNEVER'}}, // fake connection
						 				devices:devs
									});
			//copy devices to main robot
			c_robot.devices = Object.assign({}, t1.devices);

			// TODO: kill t1 robot here!
			//Cylon.kill(t1.name);
			//update robot reference in devices
			for (var k in c_robot.devices) {
				c_robot.devices[k].robot = c_robot;
				if (typeof(devs[k].work) == 'function') {
					c_robot.devices[k].work = devs[k].work;
				} 
				if (typeof(devs[k].work) == 'string') {
					c_robot.devices[k].work = all_workers[devs[k].work];
				} 
				c_robot.devices[k].connection = cn;

			}
			all_robots[c_robot.name] = c_robot;
			c_robot.complete = true;
			c_robot.alive = true;
		}.bind(rs[i]));

	}
	function checkConnections(rs, iv) {
		var c = 0; 
		for (var i = 0; i < rs.length; i++) {
			if (rs[i].complete) {
				c +=1;
				//console.log(rs[i].name,'complete. c=',c, 'rs.length:', rs.length);
			} else {
				//console.log(rs[i].name,' INcomplete. c=',c, 'rs.length:', rs.length);
			}
		}
		if (c == rs.length) {
			return true;
		} else {
			return false;
		}
	}
	var iv = false;
	iv = every((1).seconds(), function () {
		//console.log('Checking connections...');
		var b = checkConnections(rs);
		if (b) {
			// console.log(b);
			if (iv) {
				clearInterval(iv);
			}
			callback(rs);
		}
	});
}

function startRobots (rs) { // check all connections, get firmware name (TODO: other board ID, now consider working with Arduino only)
	for (var i = 0; i < rs.length; i++) {
		if (rs[i].alive) {
			console.log('Starting robot', rs[i].name);
			rs[i].start();
			state[rs[i].name] = {
/*				sensors: {},
				actors:{},
				watchdog:undefined // 1 - ok, Text message - reason for bad
*/			};
		}
	}
}

var standard_watchdog = {actors: {
							watchdog_thief: {driver:'direct-pin', pin:13},
						},
						sensors: {
							watchdog_bark: {driver:'direct-pin', pin:12},
						}
					};

var state = {
};

var devices;

function initDevices () {
  state = {};
  devices = [];
  for (var i = 0; i < scan_space.length; i++) {
  	var connection = {};
  	var name = 'conn'+i; // simple connection nameinf
  	connection[name] = scan_space[i];

  	var device = Cylon.robot({name:name,
  		connections:connection,
  		devices:port_config,
  		work:updator});

	devices.push(device);
  }
}

/* The only work function for every device
*/
function updator (robot) { 
	console.log('Running work for ', robot.name);
	// call watch dog to ensure that there's conection with a device
	// scan all sensors and update information in state
	// scan all actors state (like led.isOn) and update in state
	if (robot.devices) {
		for (var i in robot.devices) {
			console.log('Verifying worker for ',robot.devices[i].name,'@',robot.name);
			if (robot.devices[i].work) {
				console.log('Starting worker for ',robot.devices[i].name,'@',robot.name);
				robot.devices[i].work(robot.devices[i]);
			}
		}
	}
	// call watch dog to ensure that there's conection with a device
}

function recoverDevice(robot) { // TODO !!!
	console.log('Trouble:',e);
	//todo: stop this every
	if ((''+e).indexOf('Port is not open')>-1) {
		console.log('Restarting device');
		try {
			robot.halt();
		} catch (e) {}
		
		var iv2 = every ((1).seconds(), function () {
			console.log('Restarting again...');
			try {
				robot.alive = false;
				initRobots(rbts, startRobots);
				if (iv2) {
					clearInterval(iv2);
					console.log('Robot started. Interval for restarting 2 cleared.');
				}
			} catch (e) {
				console.log('Mmmm. baaad.', e);
			}
		});
	}
}

function watchdog (robot) { // TODO !!!
	if (robot.watchdog_thief && robot.watchdog_bark) {
		robot.watchdog_thief.digitalWrite(0, checkZero);
		var init = robot.watchdog_bark.digitalRead();
		robot.watchdog_thief.digitalWrite(1);
		robot.watchdog_thief.digitalWrite(1);
	} else {
		return undefined;
	}
}

function setState (conname, name, value) {
	if (!state[conname]) {
		state[conname] = {};
	}
	if (!state[conname][name]) {
		state[conname][name] = {};
	}
	state[conname][name].value = value;
	console.log(conname,'/',name,'set to', value);
}

function getState (robot = null, dev = null) {
	if (!robot) {
		return state;
	} else {
		if (!dev) {
			if (state[robot]) {
				state[robot][dev];
			} else {
				return {};
			}
		}
		return state[robot];
	}
}

function doAction(path, action, params) { // params - array of max 3.
	//path like 'Device@ArduinoName'
	var p = path.split('@');
	var robot_n = p[1];
	var dev_n = p[0];
	console.log('robot:',robot_n,', dev:', dev_n, ', params', params);
	var robot = all_robots[robot_n];
	var device = robot.devices[dev_n];
	if (!params) {
		device[action]();
	} else {
		if (Array.isArray(params)) {
			if (params.length ==1) {
				device[action](params[0]);
			}
			if (params.length ==2) {
				device[action](params[0], params[2]);
			}
			if (params.length ==3) {
				device[action](params[0], params[1], params[2]);
			}
		}
	}
}

var rbts = scanPorts(scan_space);
initRobots(rbts, startRobots);

Cylon.api('http', {host:'0.0.0.0', port:4001});

process.on('uncaughtException',function(error){
	// DON'T CRASH!!!
	console.log('Ohhhh', error);
	// TODO: restart conection on failure.
});

// HARDCODED LOGIC - to be replased with external logic player (MegaFSM)
every((0.5).seconds(), function () {
	if (state.NewArduino_3) {
		if (state.NewArduino_3.hum) {
			if (state.NewArduino_3.hum.value >= 46) {
				//all_robots.MyArduino_UNO.relay.turnOn();
				doAction('relay@MyArduino_UNO','turnOn');
			} else {
				doAction('relay@MyArduino_UNO','turnOff');
				//all_robots.MyArduino_UNO.relay.turnOff();
			}
			doAction('servo@NewArduino_3','angle', [state.NewArduino_3.hum.value.fromScale(20,110).toScale(0,160)]);
		}
	}
});

var app = express();

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json({ limit:'100MB' ,extended: false });
process.env.TZ = 'Pacific/Auckland';

app.post('/do', jsonParser, function (req, res) {
  try {
  	doAction(req.body.device+'@'+req.body.robot, req.body.action, req.body.params);	
  } catch (e) {
  	//
  }
  res.end({status:"OK"});
});

app.get('/do/:robot/:device/:action/:param?', jsonParser, function (req, res) {
  try {
  	doAction(req.params.device+'@'+req.params.robot, req.params.action, [parseFloat(req.params.param)]);
  } catch (e) {
  	console.log(e);
  }
  res.end(JSON.stringify({status:"OK"}));
});


app.get('/:robot/:dev', function (req, res) {
	res.end(JSON.stringify(getState(req.params.robot, req.params.dev)));
});

app.get('/:robot', function (req, res) {
	res.end(JSON.stringify(getState(req.params.robot)));
});

app.get('/', function (req, res) {
	res.end(JSON.stringify(getState()));
});


var server = app.listen(4004, 'localhost', function () {
    var host = server.address().address;
    var port = server.address().port;
    console.log("SmartThings listening at http://%s:%s", host, port)
});
