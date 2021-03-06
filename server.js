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
const Winner = require('./core/Winner');


/*---------server global setting----------*/
var id_count = 0;
var game_state = 999;	//Game state starts with 100, then 200, 300, 400 up to 500
var game_saving = 32;    //binary 100000

/*---------generate quiz-------------*/

var quiz_easy = [];
var quiz_medium = [];
var quiz_hard = [];

for(var i=0;i<data.length;i++){
        if(data[i].level == 'Easy'){
            quiz_easy.push(data[i]);
        }

        if(data[i].level == 'Medium'){
            quiz_medium.push(data[i]);
        }

        if(data[i].level == 'Hard'){
            quiz_hard.push(data[i]);
        }
 
}

//random quiz generation
var quiz_pool = [];
quizPoolGen();

//initialise winner pool
var winner_pool = [];

/*-------------------quiz pool generation---------------*/
function quizPoolGen(){
    //question 1 easy
    quiz_pool.push(quiz_easy[Math.floor((Math.random()*quiz_easy.length) + 1)]);

    //question 2 medium
    quiz_pool.push(quiz_medium[Math.floor((Math.random()*quiz_medium.length) + 1)]);

    //question 3 hard
    quiz_pool.push(quiz_hard[Math.floor((Math.random()*quiz_hard.length) + 1)]);

    //question 4 random
    var rep = true;
    var rnd;
    //redundancy check
    while(rep){
        rnd = Math.floor((Math.random()*data.length) + 1);
        for(var i=0;i<quiz_pool.length;i++){
            if(quiz_pool[i].id == data[rnd].id){
                break;
            }else{
                continue;
            }
        }
        rep = false;
    }
    quiz_pool.push(data[rnd]);

    //question 5 random
    rep = true;
    //redundancy check
    while(rep){
        rnd = Math.floor((Math.random()*data.length) + 1);
        for(var i=0;i<quiz_pool.length;i++){
            if(quiz_pool[i].id == data[rnd].id){
                break;
            }else{
                continue;
            }
        }
        rep = false;
    }
    quiz_pool.push(data[rnd]);

    console.log(quiz_pool);

}


//--------------Connection Success----------------------
s.on('connection', function(ws) {
    //console.log(ws);
    ws.clientId = id_count;
    id_count++;
    ws.personName = "";
    var gameCountDown = null;
    var startTime, endTime;

    /*---------on Message----------*/
    ws.on('message', function (message) {
        message = JSON.parse(message);  //Convert string to JS object
        console.log(message);

        /*------------Game Mode-------------*/
        if(message.type == "game"){
        	if(message.data == "this-will-activate-game-mode" && (message.id == 1)){
        		game_state = (message.id - 1) + 100;  //Game starts here!!
                let question1 = new Message(game_state,'game','server',quiz_pool[0].question, game_saving).stringify();
        		//wait for the animation finsihes in 3s
                setTimeout(function(){
                    broadcast(question1);
                    gameExit();    //turn off game mode in 20s
                    startTime = new Date();    //internal timer on
                }, 3000);

		    }else if (!(game_state%100)){    //if it's 100, 200, 300, 400,500
                let msgToOthers = new Message(ws.clientId,'message',ws.personName,message.data, game_saving).stringify();
                forward(msgToOthers);
                //check if clients got the right answer
                let currentQuzi = (parseInt(game_state)/100)-1;

                if(message.data.toLowerCase() == quiz_pool[currentQuzi].answer.toLowerCase()){
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

                    //stop internal timer
                    endTime = new Date();
                    var timeDiff = endTime - startTime; //in ms
                    // strip the ms
                    timeDiff /= 1000;

                    //generate winner and push to winner pool
                    var winner = new Winner(ws.clientId, ws.personName, timeDiff);
                    winner_pool.push(winner);
                    console.log(winner_pool);

                    let winNote = new Message(999,'message','this-will-activate-announcement-mode',(ws.personName).concat(' got the right answer!'), game_saving).stringify();
                    let forceGameOver = new Message(game_state,'game','server','Turn off game mode',game_saving).stringify();

                    /*----Game Over------*/
                    if(game_saving >= 60){    //won 3 games
                        //cancel setTimout loop, broadcast winner
                        clearTimeout(gameCountDown);
                        console.log("Countdown cancelled...");
                        broadcast(winNote);
                        let gameWon = new Message(999,'message','this-will-activate-game-won-mode','', game_saving).stringify();
                        broadcast(gameWon);
                        //reset game
                        game_state = 999;
                        game_saving = 32;
                        quiz_pool = [];
                        quizPoolGen();
                        winner_pool = [];
                        startTime = null;
                        endTime = null;
                        return;
                    }

                    //cancel setTimout loop, turn off game mode and broadcast winner
                    clearTimeout(gameCountDown);
                    console.log("Countdown cancelled...");
                    broadcast(forceGameOver);            //send x01
                    broadcast(winNote);                //send 999 
                }
            }else if (message.data == "this-will-activate-game-mode" && !((message.id-1)%100)){    //if it's 101, 201, 301, 401, 501
                let current = ((parseInt(game_state)-1)/100);
                game_state = (message.id - 1) + 100;  //Next game on
                let question = new Message(game_state,'game','server',quiz_pool[current].question, game_saving).stringify();
                broadcast(question);
                gameExit();    //turn off game mode in 20s
                startTime = new Date();    //internal timer on
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
                /*----Game Over------*/
                if(game_state >= 400 || (game_state>=300 && game_saving<48) || (game_state>=400 && game_saving<56)){    //ran out of games or failed 3 times
                    let gameLost = new Message(999,'message','this-will-activate-game-lost-mode','', game_saving).stringify();
                    broadcast(gameLost);
                    //reset game
                    game_state = 999;
                    game_saving = 32;
                    quiz_pool = [];
                    quizPoolGen();
                    winner_pool = [];
                    startTime = null;
                    endTime = null;
                    return;
                }

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