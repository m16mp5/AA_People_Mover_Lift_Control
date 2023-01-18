// Dependencies
const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const relay = require('./relay');
const lora = require("./lora");
const laser = require("./laser");
const bodyParser = require('body-parser');

const app = express();

// Certificate
const privateKey = fs.readFileSync('/etc/letsencrypt/live/knowtouch.ddns.net/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/knowtouch.ddns.net/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/knowtouch.ddns.net/chain.pem', 'utf8');
const STATIC_HTML_PATH = '/home/pi/elevbot/text/index.html';

const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};

// Starting both http & https servers
//const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

//non-zero timeout will cause browser to resend and result in unintentional repeated triggers
httpsServer.setTimeout(0);

//disable http for security
//httpServer.listen(80, () => {
//    console.log('HTTP Server running on port 80');
//});

//define dispatch password
const passwd = "3801";

//session time in seconds
const TIME_RESERVE = 60;

//global, it logs the client IP for the active session
reserveIP = 0;

var lora_trigger = 0;
var laser_trigger = 0;

app.use(bodyParser.urlencoded({extended:true}));

app.get("/", function(req, res){
    res.sendFile(STATIC_HTML_PATH);
});

app.get("/status", function(req, res){
    if(reserveIP == 0){
      elevator["host"]="no";	//no active client
    }
    else if(reserveIP == req.ip.split(":").pop()){
      elevator["host"]="yes";	//current client is the active
    }
    else{
      elevator["host"]="no";	//active client exists, but not this client
    }
    elevator["time"]=_time();
    res.send(elevator);		//send response
});

app.get("/dispatch", function(req, res){
    var rv;

    if(reserveIP == 0 || reserveIP == req.ip.split(":").pop()){	//proceed further if not active session or current client is the active
      if(req.query.pa != passwd)
        console.log("Server: Invalid password !");
      else{
	console.log(req.query);

        rv = relay.ElevatorDispatch(req.query.mo, req.query.bn);//dispatch command
	if(rv == 0){
	  console.log("Server: Dispatch command is failed");
	}

        if(reserveIP==0){
          setTimeout(function(){				//start timer of TIME_RESERVE 
                  console.log("Server: reservation ended"); 
	  	  reserveIP=0;
                  if(lora_trigger){
        	    lora.LoraBroadcast(0);
		    lora_trigger=0;
		    elevator["lora"]="off";
		  }
		  if(laser_trigger){
		    laser.LaserMeasure(0);
		    laser_trigger=0;
		    elevator["laser"]="off";
		  }
		  elevator["busy"] = 0;
           }, TIME_RESERVE*1000);

	  elevator["busy"] = 1;		//session is occupied
	  reserveIP = req.ip.split(":").pop();	//save the active IP
	  console.log("Server: reserved IP : "+reserveIP);
        }

	if (req.query.lo=="tg")	
	{
          lora_trigger++;
          if(lora_trigger%2){
	    elevator["lora"]="on";
            lora.LoraBroadcast(TIME_RESERVE);
	  }else{
	    elevator["lora"]="off";
            lora.LoraBroadcast(0);
	  }
	}

        if (req.query.la=="tg")
	{
          laser_trigger++;
          if (laser_trigger%2){
	    elevator["laser"]="on";
	    laser.LaserMeasure(TIME_RESERVE);
	  }else{
	    elevator["laser"]="off";
	    laser.LaserMeasure(0);
	  }
	}
      }
    }
    res.send(elevator);
});


app.get("*",function(req, res){
    res.status(404);
    res.send("");
});

httpsServer.listen(443, () => {
    console.log('Server: HTTPS Server running on port 443');
});

function _time(){
  d = new Date();
  return d.toLocaleTimeString("en-GB") + " " + d.toLocaleDateString("en-GB");
}
