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

//custom components
const Message = require('./core/Message');



/*---------server global setting----------*/
var id_count = 0;
var game_state = 999;	//Game state starts with 100



//--------------Connection Success----------------------
s.on('connection', function(ws) {
    //console.log(ws);
    ws.clientId = id_count;
    id_count++;
    ws.personName = "";
    var gameCountDown;

    var puzzle = {
        question: "How many degrees are found in a circle?",
        answer: "360"
    }

    /*---------on Message----------*/
    ws.on('message', function (message) {
        message = JSON.parse(message);  //Convert string to JS object
        console.log(message);

        /*------------Game Mode-------------*/
        if(message.type == "game"){
        	if(message.data == "this-will-activate-game-mode" && message.id == 99){
        		game_state = 100;  //Game starts here!!
                let question1 = new Message(game_state,'game','server',puzzle.question).stringify();
        		broadcast(question1);
                gameExit();
		    }else{
                let msgToOthers = new Message(ws.clientId,'message',ws.personName,message.data).stringify();
                forward(msgToOthers);
                //check if clients got the right answer
                if(message.data == puzzle.answer){
                    let winNote = new Message(game_state,'game','server',ws.personName+' got the right answer!').stringify();
                    let forceGameOver = new Message(game_state,'gameExit','server','Turn off game mode').stringify();

                    //cancel setTimout loop, turn off game mode and broadcast winner
                    clearTimeout(gameCountDown);
                    broadcast(forceGameOver);
                    broadcast(winNote);
                    
                }
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
	            
	            //send game state back to front end
                let gameState = new Message(game_state,'game','server','').stringify();
	            ws.send(gameState);
	            return;
	        }else{

                //Forward message to others
                let msgToOthers = new Message(ws.clientId,'message',ws.personName,message.data).stringify();
	            forward(msgToOthers);
            }
       	}
    });

    /*---------on Close----------*/
    ws.on('close', function(){
        console.log("I lost a client");
        var clientLeft = new Message(ws.clientId,'message',ws.personName,'left').stringify();
        forward(clientLeft);        
    });

    /*---------Function Declaration---------*/
    function gameExit(){       //Exit game mode after 20s
        gameCountDown = setTimeout(()=>{
            let gameOver = new Message(game_state,'gameExit'
                ,'server','Turn off game mode').stringify();
            broadcast(gameOver);
        }, 20000);
    }

    function broadcast(msg){
        //Travse all clients
        s.clients.forEach(function (client){
            client.send(msg);
        });
    }

    function forward(msg){
        //Travse all clients
            s.clients.forEach(function (client){
                //Exclude the sender
                if(client != ws) {
                    client.send(msg);
                }
            });
    }

});