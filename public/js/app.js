var HOST = location.origin.replace(/^http/, 'ws');
var name = prompt("What's your name?");
var socket = new WebSocket(HOST);
var json;




//-----------Game Mode---------------




//Send client name to srever
socket.onopen = (event) => {
    console.log('Socket Open!');
    socket.send(JSON.stringify({
        type:'name',
        data: name
    }));
};


socket.onmessage = (event) =>{
    console.log(event);
    json = JSON.parse(event.data);
    //console.log(json);

    /*------------Game Mode------------------*/
    if(json.type == "game"){

        if(json.id != 999 && !(json.id % 100)){    //if id = 100, 200, 300, 400...
            //Disable game button!!
            document.querySelector("#gameBox").style.display = "none";
            //Set message to game mode
            document.querySelector("#messageBtn").setAttribute('onclick','gameMsg()');
            //check the current steps of the game status

            //show the questions once its from server
            let elem = document.createElement("h3");
            elem.setAttribute("class", "game");
            elem.innerHTML = json.data;
            document.querySelector(".container").appendChild(elem);
        }else if(!((json.id - 1) % 100)){    //game intervel
            console.log("We are in");
            gameExit();
            //Show next button!!
            document.querySelector("#gameBoxNext").style.display = "block";

        }else{
            return; //new user joins under message mode
        }

    }else if(json.type == "gameExit"){

        gameExit();  //Turn off game mode

    }else{
    /*------------Message Mode------------------*/
        //Game announcement
        if(json.type == "message" && json.name == "announcement"){
            let elem = document.createElement("h3");
            elem.setAttribute("class", "game");
            elem.innerHTML = "&#127881;" + json.data + "&#127881;";
            document.querySelector(".container").appendChild(elem);
            return;
        }
        //when client left
        if(json.type == "message" && json.data == "left"){
            let elem = document.createElement("p");
            elem.setAttribute("class", "server");
            elem.innerHTML = json.name + " has left";
            document.querySelector(".container").appendChild(elem);
        }else{
            //normal message
            var elem = document.createElement("li");
            elem.setAttribute("class", "others");
            elem.innerHTML = json.name + ": " + json.data;
            document.querySelector(".container").appendChild(elem);
        }
    }

    //scroll chat box to bottom
    autoScrollBottom();
}


function sendMsg(){

    //Get the message from input
    var msg = document.querySelector("input").value;
	
	//Msg validation
	if(msg == ""){
		document.querySelector("input").focus();
		return;
	}

    //Add the message to screen locally
    var elem = document.createElement("li");
    elem.setAttribute("class", "myself");
    elem.innerHTML = "You: " + msg;
    document.querySelector(".container").appendChild(elem);

    //Send the msg to server
    socket.send(JSON.stringify({
        type: 'message',
        data: msg
    }));
    document.querySelector("input").value = "";
    document.querySelector("input").focus();

    //scroll chat box to bottom
    autoScrollBottom();
}

function gameMsg(){

    //Get the message from input
    var msg = document.querySelector("input").value;

    //Add the message to screen locally
    var elem = document.createElement("li");
    elem.setAttribute("class", "myself");
    elem.innerHTML = "You: " + msg;
    document.querySelector(".container").appendChild(elem);

    //Send the msg to server
    socket.send(JSON.stringify({
        type: 'game',
        data: msg
    }));
    document.querySelector("input").value = "";
    document.querySelector("input").focus();

    //scroll chat box to bottom
    autoScrollBottom();
}

function gameStart(){
    socket.send(JSON.stringify({
        id: 99,        //secret id to initial game mode
        type: 'game',
        data: "this-will-activate-game-mode"        //secret key
    }));
    document.querySelector("#gameBox").style.display = "none";
}

function gameContinue(){
     var gameId = json.id + 99;       //go to next level
    socket.send(JSON.stringify({
        id: gameId,        //secret id to initial game mode
        type: 'game',
        data: "this-will-activate-next-game"        //secret key
    }));
    document.querySelector("#gameBoxNext").style.display = "none";
}

function gameExit(){
    document.querySelector("#messageBtn").setAttribute('onclick','sendMsg()');
}

function pressEnter(ele) {
    if(event.key === 'Enter') {
        if(document.querySelector("#messageBtn").getAttribute('onclick') == 'gameMsg()'){
            gameMsg();

        }else{
            sendMsg();
        }
    }
}

function autoScrollBottom(){
    //scroll chat box to bottom
    var chatBox = document.querySelector(".container");
    chatBox.scrollTop = chatBox.scrollHeight;
}
