const relay = require('./relay');
const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const PORT = "/dev/ttyUSB0";
const BAUDRATE = 9600;

const MODE_CONTINUOUS = 1;	//around 1s per data, need stop command to stop
const MODE_SINGLE = 0;		//slower but auto stop without extra command

var DATA=[];

var s, t;

exports.LaserMeasure = function(duration_s){
  laser_meter_start(duration_s);
}

//async function with await
async function laser_meter_start(duration_s){	//call once but repeatly read inside

  if(duration_s){
    await laserm_status();			//check laser meter status
    console.log(DATA);

    await laserm_read_temp();			//check laser meter temperature
    console.log(DATA);

    t = setTimeout(function(){			//duration is passed, timer to break while loop
      s = 0;
    }, duration_s* 1000);

    s = 1;
    while(s){
      await laserm_read(MODE_CONTINUOUS);	//blocking read
      console.log(DATA);
      elevator["ldata"]=DATA[0]["data"];
      elevator["ltime"]=DATA[0]["time"];
    }
    await laserm_stop_continuous();		//must send stop command
  }

  else{
    s = 0;
    clearTimeout(t);				//interrupt to stop
    await laserm_stop_continuous();		//must send stop command
  }
};

function error_handler(e){
  switch (e){
        case '100':
          err = "Device Normal";
          break;
        case '252':
          err = "Over temperature!";
          break;
        case '253':
          err = "Under temperature!";
          break;
        case '601':
          err = "Hardware error!";
          break;
        case '255':
          err = "Reflected beam is under powered!";
          break;
        case '256':
          err = "Reflected beam is over powered!";
          break;
	case '206':
          err = "Out of beam range!";
          break;
        case '301':
          err = "Sender CRC error!";
          break;
        case '302':
          err = "Receiver CRC error!";
          break;
        default:
          err = "Unknown error";
          break;
      }
  return err;
}

function laserm_status(){
  var c = ":01GP";
  var s = c+gen_crc(c)+"\r\n";

  const serialport = new SerialPort(PORT,{baudRate: BAUDRATE});

  serialport.write(s, function (err) {
    if (err) {
      return console.log('Error opening port: ', err.message)
    }

    const parser = serialport.pipe(new Readline('\r\n'));
    parser.on('data', function(data) {
      //console.log('data received: ', data);

      var d=data.search(/GP\+/);
      var e=data.search(/GP\@/);

      if(d>0){
        s=data.slice(6,9);
        r={'data':error_handler(s), 'time':_time()};
      }

      else if(e>0){
        s = data.slice(6,9);
        r={'data':error_handler(s), 'time':_time()};
      }
      DATA=[];
      DATA.push(r);
      serialport.close();
    });
  });

  return new Promise(resolve=>serialport.on("close", resolve));
}


function laserm_read_temp(){
  var c = ":01GT";
  var s = c+gen_crc(c)+"\r\n";

  const serialport = new SerialPort(PORT,{baudRate: BAUDRATE});

  serialport.write(s, function (err) {
    if (err) {
      return console.log('Error opening port: ', err.message)
    }
    const parser = serialport.pipe(new Readline({delimiter:'\r\n'}));
    parser.on('data',function(data){
      //console.log('data received: ', data);
      var d = data.search(/GT\+/);
      var e = data.search(/GT\@/);

      if(d>0){
        s = data.slice(5,9);
        r = {'data': s.slice(0,3)+"."+s.slice(3,4)+" C", 'time':_time()};
      }
      else if(e>0){
        s = data.slice(6,9);
        r = {'data': error_handler(s), 'time':_time()};
      }
      DATA=[];
      DATA.push(r);
      serialport.close();
    });
  });
  return new Promise(resolve=>serialport.on("close", resolve));
}

function laserm_read(mode){
  if (mode==0) 
    var c = ":01S1";
  else
    var c = ":01C1";
  var s = c + gen_crc(c) + "\r\n";

  const serialport = new SerialPort(PORT,{baudRate: BAUDRATE});

  serialport.write(s, function (err) {
    if (err) {
      return console.log('Error opening port: ', err.message)
    }

    const parser = serialport.pipe(new Readline({delimiter:'\r\n'}));
    parser.on('data', function(data) {
      //console.log('data received: ', data);

      var d = data.search(/1\+/);
      var e = data.search(/1\@/);

      if(d>0){
        s = data.slice(6,13);
        r = {'data': s.slice(0,3)+"."+s.slice(3,7)+" m", 'time':_time()};
      }
      else if(e>0){
        s = data.slice(6,9);
        r = {'data': error_handler(s), 'time':_time()};
      }
      DATA=[];
      DATA.push(r);
      serialport.close();
    });
  });

  return new Promise(resolve=>serialport.on("close", resolve));
}

function laserm_stop_continuous(){
  var c = ":01T1";
  var s = c+gen_crc(c)+"\r\n";

  const serialport = new SerialPort(PORT,{baudRate: BAUDRATE});

  serialport.write(s, function(err){
    if(err){
      return console.log('Error opening port: ', err.message);
    }

    const parser = serialport.pipe(new Readline({delimiter:'\r\n'}));
    parser.on('data', function(data) {
      //console.log('data received: ', data);

      var d = data.search(/T1\?/);
      var e = data.search(/T1\@/);
      if(d>0){
        r = "stop ok";
      }
      else if(e>0){
        s = data.slice(6,9);
	r = s;
      }
      console.log(r);
      serialport.close();
    });
  });

  return new Promise(resolve=>serialport.on("close", resolve));
}

function gen_crc(s){		//special method to calculate CRC according to laser meter spec
  var crc=0;
  for(i=0;i<s.length;i++)
    crc += s.charCodeAt(i);
  crc%=0x100;
  r=crc.toString(16).toUpperCase().padStart(2,"0");
  return r;
}


function _time(){
  d = new Date();
  return d.toLocaleTimeString("en-GB") + " " + d.toLocaleDateString("en-GB");
}

