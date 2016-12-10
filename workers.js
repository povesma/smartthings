function workers (config, app) {
	console.log('app:',app);
	setState = app.setState;
	this.directPinDRead = function (device) {
		device.digitalRead(function (e, val) {
			setState(device.robot.name, device.name, val)
		});
	}

	this.readTemperature = function (device) {
		var workEvery = every((4).seconds(), function () {
			device.readTemperature(function (e, val) {
				var name = 'unknown'+parseInt(Math.random()*600);
				for (var i in config.one_wire_devices) {
					//console.log(i,'comparing',one_wire_devices[i].join(''),'and',val.device.join(''));
					if (config.one_wire_devices[i].join('') == val.device.join('')) {
						name = i;
						break;
					}
				}
				val.device = name;
				setState(device.robot.name, device.name, val);
			});
		});
	}

	var prev_values = {};

	this.directPinFreq = function (device) {

		device.digitalRead(function (e, val) {
			var now = Math.floor(new Date());
			var pt = prev_values[device.name+'@'+device.robot.name];
			var q = 20;
			var ticks = prev_values[device.name+'@'+device.robot.name+q];
			if (!pt) {
				pt = Array(q).fill(null);
			}
			if (!ticks) {
				ticks = 0;
			}
			ticks += 1;
			pt.shift();
			pt.push(now);
			var diff = now-pt[0];
			if (pt[0] && diff<=2000*pt.length && diff > 0) { // 1/2 Hz - min freq
				setState(device.robot.name, device.name, 1000/(diff/pt.length));
			}
			prev_values[device.name+'@'+device.robot.name] = pt;
		});
		every((1).seconds(), function () {
			var now = Math.floor(new Date());
			var pt = prev_values[device.name+'@'+device.robot.name];

			if (pt && pt[pt.length-1] && now-pt[pt.length-1]>2000) { // 2 sec idle - reset frequency
				prev_values[device.name+'@'+device.robot.name] = Array(q).fill(null);
				if (ticks >=q) {
					setState(device.robot.name, device.name, null);
					ticks = 0;
				}
				prev_values[device.name+'@'+device.robot.name+q] = ticks;
			}
		})
	}

	this.directPinARead = function (device) {
		var workEvery = every((1).seconds(), function () {
			var v = device.analogRead();
			setState(device.robot.name, device.name, v);
		});
	}

	this.ledFlash = function (device) {
		var workEvery = every((0.2).seconds(), function () {
			try {
				device.toggle();
			} catch (e) {
				if (workEvery) {
					clearInterval(workEvery);
					console.log('Interval cleared.');
				}
				recoverDevice(robot);
			}
		});
	}
	this.readHumidity = function (device) {
		    every((0.5).second(), function() {
		    	try {
			    	var v = device.analogRead()*5/1024; //voltage
			    	var val = Math.round( (v*38.12-39.26)*100)/100;
			    	// console.log( val+' %');
					setState(device.robot.name, device.name, val);
			    } catch (e) {
			    	console.log('====> ERROR SENS: ', e);
			    }
		    });
	}
}

module.exports = workers;
