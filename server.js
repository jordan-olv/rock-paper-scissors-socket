"use strict";
const express = require("express");
const http = require("http");
const path = require("path");
const socketio = require("socket.io");
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const { uuid } = require('uuidv4');


const rooms = {};
const usersConnected = {};
app.use(express.static(path.join(__dirname, "public")));

const reload = require('reload')



io.on("connection", (socket) => {
    socket.emit('roomRefresh', rooms);
    socket.on('createRoom', (roomID, mode) => {

        if (rooms[roomID]) {
            console.log('Room already exist')
            return;
        }

        let newRooms = {
            id: roomID,
            players: [],
            move: ['', ''],
            score: [0, 0],
            mode: mode,
            avatar: ['', '']
        }
        rooms[roomID] = newRooms;
        socket.join(roomID);

        for (let i = 0; i < rooms[roomID].avatar.length; i++) {
            const rdm = Math.floor(Math.random() * 5) + 1;
            console.log(rdm);
            rooms[roomID].avatar[i] = rdm;
        }

        joinRoom(roomID);


        io.emit('roomRefresh', rooms);
    });

    socket.on('joinRoom', (roomID) => {
        console.log("Join Room");
        joinRoom(roomID);
    });

    socket.on('replay', (room) => {
        rooms[room.id].score = [0, 0];
        rooms[room.id].move = ['', ''];
        emitToRoom(room.id, 'replayClient');
    });

    socket.on('choice', (value, room) => {
        rooms[room.id].move[room.players.indexOf(socket.client.id)] = value;

        if (rooms[room.id].move[0] != "" && rooms[room.id].move[1] != "") {
            const winner = compareMove(rooms[room.id].move[0], rooms[room.id].move[1]);
            if (winner == 'player1') {
                rooms[room.id].score[0] += 1;
            } else if (winner == 'player2') {
                rooms[room.id].score[1] += 1;
            }
            emitToRoom(room.id, 'result', winner);
            rooms[room.id].move = ['', ''];

            console.log('avatar', rooms[room.id]);
        }
    });

    const joinRoom = (roomID) => {
        console.log("Join Room");

        if (rooms[roomID] && rooms[roomID]["players"].length < 2) {
            rooms[roomID]["players"].push(socket.client.id);
            usersConnected[socket.client.id] = true;
            io.emit('roomRefresh', rooms);
            socket.join(roomID);
            socket.emit('userJoin', rooms[roomID]);


            if (rooms[roomID]["players"].length === 2) {
                emitToRoom(roomID, 'startGame');
            } else {
                emitToRoom(roomID, 'waitGame');
            }
        } else {
            console.log('Room does not exist')
        }
    }



    socket.on('disconnect', () => {
        console.log("User disconnected");
        if (usersConnected[socket.client.id]) {
            delete usersConnected[socket.client.id];

            resetGame(socket.client.id);
        }
        io.emit('roomRefresh', rooms);
    });
    console.log("New WebSocket connection");
});

const resetGame = (socketId) => {
    for (let id in rooms) {
        if (rooms[id]["players"].includes(socketId)) {
            rooms[id]["players"].splice(rooms[id]["players"].indexOf(socketId), 1);
            if (rooms[id]["players"].length == 0) {
                delete rooms[id];
            } else {
                rooms[id].move = ['', ''];
                rooms[id].score = [0, 0];
            }
            emitToRoom(id, 'waitGame');
            break;
        }
    }
}
const compareMove = (move1, move2) => {
    console.log(move1, move2)
    if (move1 == move2) {
        return 'draw';
    } else if (move1 == 'rock') {
        if (move2 == 'paper') {
            return 'player2';
        } else {
            return 'player1';
        }
    } else if (move1 == 'paper') {
        if (move2 == 'scissor') {
            return 'player2';
        } else {
            return 'player1';
        }
    } else if (move1 == 'scissor') {
        if (move2 == 'rock') {
            return 'player2';
        } else {
            return 'player1';
        }
    }
}

const emitToRoom = (roomID, emitContent, value) => {
    console.log(value)
    io.to(roomID).emit(emitContent, rooms[roomID], value || '');
}


// server.listen(5000, () => console.log("Server started on port 5000..."));

reload(app).then(function (reloadReturned) {
    // reloadReturned is documented in the returns API in the README

    // Reload started, start web server
    server.listen(5000, function () {
        console.log('Web server listening on port ' + 5000)
    })
}).catch(function (err) {
    console.error('Reload could not start, could not start server/sample app', err)
})   
