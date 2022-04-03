const version = 'v0.1.0';

var express = require('express');
const { is } = require('express/lib/request');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/v', (req, res) => {
    res.send(version);
});
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});
app.get('/dev', (req, res) => {
    res.sendFile(__dirname + '/dev.html');
});
app.use('/', express.static(__dirname + '/chess-console/'));

var utot = 0;
var sockets = [];

var isready = [false, false];
var lastgame = 1;

io.on('connection', (socket) => {
    if (utot == 2){
        socket.emit('full');
        console.log('[error] the server is full');
        socket.disconnect();
        return;
    }

    console.log('[info]  a user connected');
    ++ utot;
    sockets.push(socket);  
    console.log(sockets);

    if(utot == 2){
        console.log('[info]  two users in this server, ready to start the game.');
        isready = [false, false];
        io.emit('start');
    }

    socket.on('okStart', () => {
        console.log('[info]  received the user\'s ready signal');

        var i = sockets.indexOf(socket);
        if(isready[i] == false){
            isready[i] = true;
            if(isready[0] && isready[1]){
                console.log('[info]  two users are ready.');
                
                console.log('[info]  sending their colors to them.');
                console.log('[info]  user', lastgame, 'is black.');
                sockets[lastgame].emit('color', 'black');

                if(lastgame == 1)
                    lastgame = 0;
                else
                    lastgame = 1;
                
                sockets[lastgame].emit('color', 'white');
                console.log('[info]  user', lastgame, 'is white.');
            }
        }
        else{
            // something goes wrong
            console.log('[error] the user is already ready. He/She maybe uses a wrong client or a cheat script.');
            socket.emit('buggy');
            socket.disconnect();
            sockets.splice(sockets.indexOf(socket), 1);
            console.log(sockets);
        }
    });

    socket.on('move', (move) => {
        console.log('[info]  received the move signal');
        console.log(move);
        var data = {to: move.to, from: move.from, noreply: true};
        var i = sockets.indexOf(socket);
        if(i == 1){
            sockets[0].emit('move', data);
        }else{
            sockets[1].emit('move', data);
        }

    });

    //disconnect
    socket.on('disconnect', () => {
        console.log('[info]  a user disconnected');
        -- utot;
        sockets.splice(sockets.indexOf(socket), 1);
        console.log(sockets);
    });
});

http.listen(3000, () => {
    console.log('oimaster chess is listening on port 3000');
});