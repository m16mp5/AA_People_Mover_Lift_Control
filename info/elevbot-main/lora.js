const relay = require('./relay');
const server = require('./server');
const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const PORT = "/dev/ttyUSB1";
const BAUDRATE = 115200;

const serialport = new SerialPort(PORT,{baudRate: BAUDRATE});
const LORA_POLL_TIME = 3000;
var t;						//global timer handler for force stop timer

lora_listen();					//always listening

exports.LoraBroadcast = function(duration_s){	//call once but self trigger until timeout
  var d;
  if(duration_s){
    t = setInterval(function(){
      if(elevator['door']=='op') d=0x00;
      else if(elevator['door']=='cn') d=0x01;
      else d=0xff; 
      var s = [0xa5, 0x77, 0x03, parseInt(elevator['idle']), d, parseInt(elevator['floor'])];
      var crc = gen_crc(s);
      s.push(crc, 0x0d, 0x0a);
      lora_write(s);				//write to serial port
    },LORA_POLL_TIME);				//write cycle
  }
  else{
    clearInterval(t);				//force to stop
  }
}

function lora_listen(){
  serialport.on('data', function(data){
    console.log(data);

    //reserveIP non-zero, active client initiated from webserver
    //check header, type, trailer
    if(reserveIP!=0 && data[0]==0xa5 && data[1]==0x88 && (data[2]+6)==data.length && data[data.length-2]==0x0d && data[data.length-1]==0x0a){

      //check crc
      if(data[data.length-3] == gen_crc(data.slice(0,data.length-3))){
        var s = reserveIP.split(".");

	//check reserve IP
        if(s[0] == data[3] && s[1] == data[4] && s[2] == data[5] && s[3] == data[6]){

	  //check data validity
          if(data[7]>=0 && data[7]<=9){
	    console.log("Lora: rx decode: "+parseInt(data[7]));

	    //write to relay finally
            if(relay.relay_dry_contact_toggle(data[7])==0)
              console.log("Lora: err: write to relay failed");
	  }
	  else
	    console.log("Lora: rx decode: unknown data");
	}
	else
	  console.log("Lora: rx err: reservation timeout");
      }
      else
        console.log("Lora: rx err: invalid crc");
    }
    else{
      //console.log("lora rx err: unknown packet : "+data);
    }
  });
}

function lora_write(s){
  serialport.write(s, function (err) {
    if (err) {
      return console.log('Lora: Error opening port: ', err.message)
    }
    console.log("Lora tx: "+s);
  });
}

function gen_crc(s){
  var crc=0;
  for(i=0;i<s.length;i++)
    crc += s[i];
  crc%=0x100;
  return crc;
}

function _time(){
  d = new Date();
  return d.toLocaleTimeString("en-GB") + " " + d.toLocaleDateString("en-GB");
}

