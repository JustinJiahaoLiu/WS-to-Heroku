
var HOST = location.origin.replace(/^http/, 'ws')
var socket = new WebSocket(HOST);
var name = prompt("What's your name?")


/*----------------------State Setting-----------------------------*/

//-----------Game Mode---------------





socket.onopen = (event) => {
    console.log('Socket Open!');
    socket.send(JSON.stringify({
        type:'name',
        data: name
    }));
    // setTimeout(function () {
    //     socket.send('Hey there');
    // }, 1000)
};

socket.onmessage = (event) =>{
    //console.log(event);
    var json = JSON.parse(event.data);

    /*------------Game Mode------------------*/
    if(json.type == "game" && json.id != 999){
        //Disable game button!!
        document.querySelector("#gameBox").style.display = "none";
        //Set message to game mode
        document.querySelector("#messageBtn").setAttribute('onclick','gameMsg()');

        let elem = document.createElement("h3");
        elem.innerHTML = json.data;
        document.querySelector(".container").appendChild(elem);

    }else if(json.type == "gameExit"){
        
        gameExit();  //Turn off game mode

    }else{
    /*------------Message Mode------------------*/
        //when client left
        if(json.data == "left"){
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
}

function gameStart(){
    socket.send(JSON.stringify({
        id: 99,
        type: 'game',
        data: "this-will-activate-game-mode"
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

