'use strict';

const express = require('express');
const SocketServer = require('ws').Server;
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
  .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

//Server instance
const s = new SocketServer({ server });

/*---------server global setting----------*/
var id_count = 0;



//--------------Connection Success----------------------
s.on('connection', function(ws) {
    //console.log(ws);
    ws.clientId = id_count;
    id_count++;
    ws.personName = "";

    /*---------on Message----------*/
    ws.on('message', function (message) {
        message = JSON.parse(message);  //Convert string to JS object
        //console.log("Received: " + message);
        //console.log(message.type == 'name'? 'True': 'False');
        console.log(message);


        /*------------Game Mode-------------*/
        if(message.type == "game"){
        	if(message.data == "this-will-activate-game-mode"){
        		//Travse all clients
        		s.clients.forEach(function (client){
                	client.send(JSON.stringify({
                		id: '',
                		type: 'game',
                    	name: 'server', //send the connection name
                    	data: 'How many degrees are found in a circle?'
                	}));
        		});
        	}

		}else{
		/*------------Message Mode-------------*/
	        //Fetch name of client
	        if(message.type == 'name'){
	            ws.personName = message.data;
	            console.log("Client Name: " + ws.personName);
	            return;
	        }

	        //Travse all clients
	        s.clients.forEach(function (client){
	            //Exclude the sender
	            if(client != ws) {
	                client.send(JSON.stringify({
	                	id: ws.clientId,
	                	type: 'message',
	                    name: ws.personName, //send the connection name
	                    data: message.data
	                }));
	            }
	        });

       	}
    });

    /*---------on Close----------*/
    ws.on('close', function(){
        console.log("I lost a client");
        //Travse all clients
        s.clients.forEach(function (client){
                client.send(JSON.stringify({
                	id: ws.clientId,
                    name: ws.personName, //send the connection name
                    data: 'left'
                }));
        });
    })

});