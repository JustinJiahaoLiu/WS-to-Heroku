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
const data = require('./database/data.json');
const Message = require('./core/Message');
const Quiz = require('./core/Quiz');



/*---------server global setting----------*/
var id_count = 0;
var game_state = 999;	//Game state starts with 100, then 200, 300, 400 up to 500
var game_saving = 32;    //binary 100000


//--------------Connection Success----------------------
s.on('connection', function(ws) {
    //console.log(ws);
    ws.clientId = id_count;
    id_count++;
    ws.personName = "";
    var gameCountDown = null;
    
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
        	if(message.data == "this-will-activate-game-mode" && (message.id == 1 ||!((message.id-1)%100))){
        		game_state = (message.id - 1) + 100;  //Game starts here!!
                let question1 = new Message(game_state,'game','server',puzzle.question, game_saving).stringify();
        		broadcast(question1);
                gameExit();    //turn off game mode in 20s

		    }else if (!(game_state%100)){    //if it's 100, 200, 300, 400, 500
                let msgToOthers = new Message(ws.clientId,'message',ws.personName,message.data, game_saving).stringify();
                forward(msgToOthers);
                //check if clients got the right answer
                if(message.data == puzzle.answer){
                    //save game 
                    switch(game_state){
                        case 100:
                        game_saving = game_saving | 16;    //game_saving to 110000(48)
                        break;
                        case 200:
                        game_saving = game_saving | 8;    //111000(56)
                        break;
                        case 300:
                        game_saving = game_saving | 4;    //111100(60)
                        break;
                        case 400:
                        game_saving = game_saving | 2;    //111110(62)
                        break;
                        case 500:
                        game_saving = game_saving | 1;    //111111(63)
                        break
                    }
                    game_state = game_state + 1;   //go to game intervel 

                    let winNote = new Message(999,'message','announcement',(ws.personName).concat(' got the right answer!'), game_saving).stringify();
                    let forceGameOver = new Message(game_state,'game','server','Turn off game mode',game_saving).stringify();

                    //cancel setTimout loop, turn off game mode and broadcast winner
                    clearTimeout(gameCountDown);
                    console.log("Countdown cancelled...");
                    broadcast(forceGameOver);            //send x01
                    broadcast(winNote);                //send 999 
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
                let gameState = new Message(game_state,'game','server','',game_saving).stringify();
	            ws.send(gameState);
	            return;
	        }else{

                //Forward message to others
                let msgToOthers = new Message(ws.clientId,'message',ws.personName,message.data,game_saving).stringify();
                forward(msgToOthers);
	            
            }
       	}
    });

    /*---------on Close----------*/
    ws.on('close', function(){
        console.log(`I lost a client ${ws.personName}`);  //console.log('I lost a client ' + ws.personName);
        var clientLeft = new Message(ws.clientId,'message',ws.personName,'left',game_saving).stringify();
        forward(clientLeft);        
    });

    /*---------Function Declaration---------*/
    function gameExit(){       //Exit game mode after 20s
        gameCountDown = setTimeout(()=>{
                game_state = game_state + 1;   //go to game intervel
                let gameOver = new Message(game_state,'game','server','Turn off game mode',game_saving).stringify();
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