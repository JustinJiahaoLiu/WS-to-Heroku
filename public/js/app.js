var HOST = location.origin.replace(/^http/, 'ws');
var name = prompt("What's your name?");
var socket = new WebSocket(HOST);





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
    var json = JSON.parse(event.data);
    //console.log(json);

    /*------------Game Mode------------------*/
    if(json.type == "game"){

        if(json.id != 999 && !(json.id % 100)){
            //Disable game button!!
            document.querySelector("#gameBox").style.display = "none";
            //Set message to game mode
            document.querySelector("#messageBtn").setAttribute('onclick','gameMsg()');
            //check the current steps of the game status

            //show the questions once its from server
            let elem = document.createElement("h3");
            elem.innerHTML = json.data;
            document.querySelector(".container").appendChild(elem);
        }else{
            return; //new user joins under message mode
        }

    }else if(json.type == "gameExit"){

        gameExit();  //Turn off game mode

    }else{
    /*------------Message Mode------------------*/
        //when client left
        if(json.type == "message" && json.data == "left"){
            let elem = document.createElement("p");
            elem.innerHTML = json.name + " has left";
            document.querySelector(".container").appendChild(elem);
        }else{
            //normal message
            var elem = document.createElement("li");
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

    //Add the message to screen locally
    var elem = document.createElement("li");
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
