const net = require('net');
const relay_ip = '192.168.1.101';
const relay_port = 50000;

const relay_table = {'do':0, 'dc':1, '-2': 2, 	'-1': 3,
                     '0': 4, '1': 5, '2': 6,	'3': 7,
                     '4': 8, '5': 9, 'vi': 10};

const RELAY_POLL_TIME 		= 1000;		//self polling independent of client's requests
const VIP_MODE_WAIT_LIFT_IDLE 	= 10;		//minimum idle time to allow VIP mode to engage
const VIP_MODE_ARM_TIMEOUT 	= 60 * 1000;

var DATA=[];
var vip_state=0;
var last_run_time = _ts();

elevator = {	"vip"	:	0,
		"idle"	:	0,
		"door"	:	0,
		"floor"	:	0,
		"host"	:	0,
		"busy"	:	0,
		"laser"	:	0,
		"ldata"	:	0,
		"ltime"	:	0,
		"lora"	:	0,
		"time"	:	0	}

setInterval(function(){
  if(optocoupler_poll()==0)
    console.log("relay: Error unable to poll relay inputs"); 
}, RELAY_POLL_TIME);	//poll of relay inputs

exports.ElevatorDispatch = function(mode, ctrl){
  var rv;

  if(mode=='vi')							//check first parameter
  {
      vip_state=1;
      if(elevator["idle"] > VIP_MODE_WAIT_LIFT_IDLE){			//only allow for sufficient idle time before enabling VIP

        setTimeout(function(){						//set timer to define end time
	  vip_state=0;
          console.log("relay: vipm ended");
        }, VIP_MODE_ARM_TIMEOUT);

        rv = relay_dry_contact_toggle(relay_table['vi']);		//fire relay toggle command, duty defined by relay_set_toggle_delay
	if(rv==0) return 0;
      }
      else{
        console.log("relay: vip is unable");				//do nothing
      }
  }
  if(ctrl)								//check second parameter
  {
    rv = relay_dry_contact_toggle(relay_table[ctrl]);			//fire relay toggle command, duty defined by relay_set_toggle_delay
    if(rv == 0) return 0;
  }
  return 1;
}

exports.relay_dry_contact_toggle = function(s){
  relay_dry_contact_toggle(s);
}

exports.ElevatorStatus = function(){
  return elevator;
}

function _floor(data){
	d = data & 0x00ff;		//mask lsb 8-bit

	if(d == 0x01)
	  f = "-2";
	else if(d == 0x02)
	  f = "-1";
	else if(d == 0x04)
	  f = "0";
	else if(d == 0x08)
	  f = "1";
	else if(d == 0x10)
	  f = "2";
	else if(d == 0x20)
	  f = "3";
	else if(d == 0x40)
	  f = "4";
	else if(d == 0x80)
	  f = "5";
	else
	  f = 0;

	return f;
}

function _door(data){
	if((data & 0x0300) == 0x0100){		//door open 
	  return "op";
	}
	else if((data & 0x0300) == 0x0200){	//door closed
	  return "cd";
	}
	else{					//door is opening or closing
	  last_run_time = _ts();		//only door in transit can reset last run time
	  return "tx";
	}
}

function _run(data){
	if(data & 0x0400){			//lift car is going up or down
	  last_run_time = _ts();		//reset last run time
	  return 0;
        }
	else{					//lift car is stopped
	  var t = _ts() - last_run_time;	//idle time
          if(t > 180) t = 180;			//max = 180s
	  return t;
	}
}

function relay_write(d){			//serial write function
  var client = new net.Socket();

  client.connect(relay_port, relay_ip, function() {
    var buf = new Buffer(d, 'hex');
    client.write(buf);
    console.log('relay: Sent: ' + buf.toString('hex'));

    client.on('data', function(data){
      console.log('relay: Received: '+data.toString('hex'));
      DATA=data;				//temporaily save to global
      client.destroy();
    });
  });

  return new Promise(resolve=>client.on('close', resolve));	//return the "promise"
}

//async function with await
async function relay_dry_contact_toggle(contact_bit)		//single packet to output relay toggle, contact bit = [0,15]
{
  if(contact_bit > 15){
    console.log("relay: err: relay contact bit: [0, 15]");
    return 0;
  }
  var bits = (0x01 << contact_bit);
  var s = [0xcc, 0xdd, 0x33, 0x01, parseInt(bits/256), bits%256, parseInt(bits/256), bits%256];

  s.push(get_crc(s, 2, s.length));
  s.push(get_crc(s, 2, s.length));

  await relay_write(s);						//await a promise return, blocking or synchronous read
  if(DATA[0]==0x4f && DATA[1]==0x4b && DATA[2]==0x21)		//check buffer, relay shall return OK!
    return 1;
  else
    return 0;
}

//async function with await
async function optocoupler_poll()				//polling of inputs
{
  var s = [0xcc, 0xdd, 0xc0, 0x01, 0x00, 0x00, 0x0d];

  s.push(get_crc(s, 2, s.length));
  s.push(get_crc(s, 2, s.length));

  await relay_write(s);						//await a promise return, must wait until reading is completed
  var d = DATA;							//save global buffer to temp. buffer
  if( d[d.length-2]==get_crc(d, 2, d.length-2) &&
      d[d.length-1]==get_crc(d, 2, d.length-1) ){

    var r = (d[4] << 8) + d[5];
    elevator["idle"] = _run(r);
    elevator["door"] = _door(r);
    elevator["floor"] = _floor(r);
    if(vip_state==0) elevator["vip"]="off";
    else elevator["vip"]="on";
    return 1;
  }
  return 0;							//CRC error
}

//async function with await
async function relay_read_toggle_time()
{
  var s = [0x55, 0xaa, 0x88, 0x01, 0, 0, 0, 0, 0xaa, 0x55];

  await relay_write(s);
  var d = DATA;
  if( d[d.length-2]==get_crc(d, 2, d.length-2) &&
      d[d.length-1]==get_crc(d, 2, d.length-1) ){
     return (d[4] << 8) + d[5];
  }
  return 0;
}

//async function with await
async function relay_set_toggle_delay()
{
  //default all relay to 1s toggle time and in particular relay 10 (to VIP) is set to 61s
                                 //default=0x0001		     //60		//S
  var s = [0x55, 0xaa, 0x77, 0x01, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 60, 0, 0, 0, 0, 0, 1];

  s.push(get_crc(s, 2, s.length));
  s.push(get_crc(s, 2, s.length));

  await relay_write(s);
  if(DATA[0]==0x4f && DATA[1]==0x4b && DATA[2]==0x21)
    return 1;
  else
    return 0;
}

//async function with await
async function relay_read_contacts()	//this function is unable to read relay actual status if toggle output command is used
{
  var s = [0xcc, 0xdd, 0xb0, 0x01, 0x00, 0x00, 0x0d];

  s.push(get_crc(s, 2, s.length));
  s.push(get_crc(s, 2, s.length));

  await relay_write(s);
  var d = DATA;
  if( d[d.length-2]==get_crc(d, 2, d.length-1) &&
      d[d.length-1]==get_crc(d, 2, d.length) ){
     return (d[4] << 8) + d[5];
  }
  return 0;
}

//async function with await
async function relay_dry_contact(contact_bit, on_off)	//drive contacts to close or open
{
  if(contact_bit > 15 && contact_bit != 0xffff){
    console.log("relay contact bit: [0, 15] or 255");
    return 0;
  }
  if(on_off > 1){
    console.log("on_off bit: [0,1]");
    return 0;
  }

  if(contact_bit == 0xffff){
    var maskbits = contact_bit;
    var setbits = (contact_bit & on_off);
  }
  else{
    var maskbits = (0x01 << contact_bit);
    var setbits = (on_off << contact_bit);
  }
  var s = [0xcc, 0xdd, 0xa1, 0x01, parseInt(setbits/256), setbits%256, parseInt(maskbits/256), maskbits%256];

  s.push(get_crc(s, 2, s.length));
  s.push(get_crc(s, 2, s.length));

  await relay_write(s);
  if(DATA[0]==0x4f && DATA[1]==0x4b && DATA[2]==0x21)
    return 1;
  else
    return 0;
}

function relay_init(){		//init function is not regular called, only for first time configure a new setting

  if(relay_dry_contact(0xffff, 0)==0)
    return 0;

  if(relay_set_toggle_delay()==0)
    return 0;

  if(relay_read_toggle_time()==0)
    return 0;
}

function get_crc(d, start_index, end_index){	//sum all from start to end-1
  var sum = 0;
  for(let i=0;i<end_index-start_index;i++)
    sum += d[start_index+i];
  sum = sum % 256;
  //console.log(sum);
  return sum;
}

function _time(){
  d = new Date();
  return d.toLocaleTimeString("en-GB") + " " + d.toLocaleDateString("en-GB");
}

function _ts(){					//timestamp in seconds
  return Math.floor(Date.now() / 1000);
}
