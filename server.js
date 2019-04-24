'use strict';

const express = require('express');
const SocketServer = require('ws').Server;
const path = require('path');

const PORT = process.env.PORT || 3000;
//const INDEX = path.join(__dirname, 'index.html');

//create an express http server as the base
const server = express()
  .use(express.static(__dirname + '/public'))
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

//create WS server based on http server
const s = new SocketServer({ server });

/*---------server global setting----------*/
var id_count = 0;
var game_state = 999;	//Game state starts with 100



//--------------Connection Success----------------------
s.on('connection', function(ws) {
    //console.log(ws);
    ws.clientId = id_count;
    id_count++;
    ws.personName = "";

    /*---------on Message----------*/
    ws.on('message', function (message) {
        message = JSON.parse(message);  //Convert string to JS object
        console.log(message);


        /*------------Game Mode-------------*/
        if(message.type == "game"){
        	if(message.data == "this-will-activate-game-mode" && message.id == 99){
        		game_state = 100;  //Game starts here!!
        		//Travse all clients
        		s.clients.forEach(function (client){
                	client.send(JSON.stringify({
                		id: game_state,
                		type: 'game',
                    	name: 'server',
                    	data: 'How many degrees are found in a circle?'
                	}));
        		});
        		
        		//Exit game mode after 20s
		        setTimeout(()=>{
		            //Travse all clients
        		s.clients.forEach(function (client){
                	client.send(JSON.stringify({
                		id: game_state,
                		type: 'gameExit',
                    	name: 'server',
                    	data: 'Turn off game mode'
                	}));
        		});

        		//Game state change to 101
        		game_state++;
		        }, 20000);
		        }

		}else{
		/*------------Message Mode-------------*/
	        //Fetch name of client
	        if(message.type == 'name'){

	        	ws.personName = message.data;	//assign name to ws connection

	        	//check name duplication
	        	s.clients.forEach(function (client){
	        		
	        		if(client.personName == message.data && client != ws){	//exclude itself

	        			ws.personName = message.data + "." + ws.clientId;	//add client id to duplicated name

	        		}
	        	});
	            
	            //console.log("Client Name: " + ws.personName);

	            //send game state back to front end
	            ws.send(JSON.stringify({
	            	id: game_state,
            		type: 'game',
                	name: 'server', 
                	data: ''
	            }));
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