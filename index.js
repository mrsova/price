var express = require('express');

var app = express();
var config = require('./config');
var mysql = require('mysql');

var server = require('http').Server(app);
var port = process.env.PORT || 5557;
var CircularJSON = require('circular-json');
var io = require('socket.io')(server);

var r;
server.listen(port, function () {
    console.log("listen port: " + port);
});

var client = mysql.createPool({
    host: config.HOST,
    user: config.USER,
    password: config.PASSWORD,
    database: config.DATABASE
});


app.get('/', function (request, response, next) {
    r = request.query.room;
    token = request.query.token; 
    company_id = request.query.company_id; 
    next();
}, function (request, response) {
    response.sendFile(__dirname + '/index.html');
});


app.get('/onlineusers', function (request, response) {
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

        client.getConnection(function (err, connection) {
            if (!err) {
                console.log("Database is connected ");
            } else {
                console.log("Error connecting database ");
                return false;
            }            
            connection.query('SELECT price FROM cscart_product_prices WHERE product_id="'+r+'"', function (error, res, fields) {
                //connect user                   
                
                io.to(r).emit('user joined', {
                    socket_id: socket.id,                    
                    price_product: res[0].price,
                    token: token,
                    product_id: r,
                    company_id: company_id
                });

                console.log('A user connected: ' + socket.id);
                connection.release();
            });
        });


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


    //hidden price
    socket.on('hidden_price', function (result) {
        client.getConnection(function (err, connection) {
            if (!err) {
                console.log("Database is connected ");
            } else {
                console.log("Error connecting database ");
                return false;
            }

            connection.query('UPDATE cscart_product_prices SET price=price-0.25 WHERE product_id="'+r+'"', function (error, res, fields) {
                connection.query('SELECT price FROM cscart_product_prices WHERE product_id="'+r+'"', function (error, res, fields) {
                    result.price_product = res[0].price;                    
                    io.to(result.room).emit('hidden_price', result);
                    //connection.release();
                });
            });
            d = new Date;
            date = Math.floor(d.getTime()/1000);
connection.query("INSERT INTO cscart_vendor_payouts (payout_date, company_id, payout_amount, commission, commission_amount, payout_type, comments)" +
" VALUES('" + date + "','" + result.company_id + "','0.50', '50.00', '0.25', 'click', 'Pay to click')", function (errr, res, fields) {
      console.log(errr);          
    connection.release();                            
});
        });
    });
    //hidden price
    socket.on('by_product', function (result) {
        io.to(result.room).emit('by_product', result);
    });

    socket.on('disconnect', function () {
        console.log('User left: ' + socket.id);
        //disconnected
        socket.broadcast.emit('user left', socket.id);
    });

});
