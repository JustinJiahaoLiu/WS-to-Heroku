'use strict';

const express = require('express');
const SocketServer = require('ws').Server;
const path = require('path');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
  .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const s = new SocketServer({ server });

s.on('connection', function(ws) {
    console.log("Welcome! New visitor.");

    //ws is the connection object
    ws.on('message', function (message) {
        message = JSON.parse(message);  //Convert string to JS object
        //console.log("Received: " + message);
        //console.log(message.type == 'name'? 'True': 'False');

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
                    name: ws.personName, //send the connection name
                    data: message.data
                }));
            }
        });

        //ws.send(message);
    });

    ws.on('close', function(){
        console.log("I lost a client");
    })
});