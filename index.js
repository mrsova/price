var express = require('express');

var app = express();

var server = require('http').Server(app);
var port = process.env.PORT || 5557;
var CircularJSON = require('circular-json');
var io = require('socket.io')(server);

var r;
server.listen(port, function () {
    console.log("listen port: " + port);
});


app.get('/', function (request, response, next) {
    r = request.query.room;
    next();
}, function (request, response) {
    response.sendFile(__dirname + '/index.html');
});


app.get('/onlineusers', function (request, response) {
    //response.send(CircularJSON.stringify(io));
    response.send(room);
});


app.use(express.static(__dirname));

io.on('connection', function (socket) {
    socket.join(r);

    //add name user
    socket.on('add nameuser', function (user) {
        room = {};
        for (key in io.sockets.adapter.rooms) {
            if (user.id === key) {
                io.sockets.adapter.rooms[key].name = user.name;
            }
        }
        for (key in io.sockets.adapter.rooms) {
            if (key === r) {
                var sockets = {};

                for (var k in io.sockets.adapter.rooms[key].sockets) {
                    sockets[k] = io.sockets.adapter.rooms[k].name;
                }
                room[key] = {
                    'sockets': sockets
                }
            }
        }
        //connect user
        io.to(r).emit('user joined', socket.id);
        console.log('A user connected: ' + socket.id);
    });

//client message
    socket.on('chat.message', function (message) {
        io.to(message.room).emit('chat.message', message.message);
    });

//client sends user typing event server
    socket.on('user typing', function (username) {
        io.to(username.room).emit('user typing', username.id);
    });

//clients stopped typing
    socket.on('stopped typing', function (username) {
        io.to(username.room).emit('stopped typing', username.id);
    });

    socket.on('disconnect', function () {
        console.log('User left: ' + socket.id);
        //disconnected
        socket.broadcast.emit('user left', socket.id);
    })

});