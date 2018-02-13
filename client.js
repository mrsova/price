var socket = io();

function in_array(what, where) {
    for (var i = 0; i < where.length; i++)
        if (what == where[i].id)
            return true;
    return false;
}

new Vue({
    el: '#app',
    data: {
        connectedUsers: [],
        messages: [],
        message: {
            'type': '',
            'action': '',
            'user': '',
            'text': '',
            'timestamp': '',
            'reg': false
        },
        hidden: true,
        product:{
            price_product: '',
            name_product: ''
        },

        price_user: 100.00,
        price_company: 0.00,
        price_prod: 0.00,
        stop: false,
        room: '',
        areTyping: []
    },
    created: function () {
        //if server emits user joined, update connectedUsers array
        socket.on('user joined', function (result) {
            this.product.price_product = result.price_product;
            this.product.name_product = result.name_product;
            //get connected user first
            axios.get('/onlineusers')
                .then(function (response) {
                    for (key in response.data) {
                        this.room = key;
                        for (var k in response.data[key].sockets) {
                            if (!in_array(k, this.connectedUsers)) {
                                this.connectedUsers.push({id: k, name: response.data[key].sockets[k]});
                            }
                        }
                    }
                    for (key in this.connectedUsers) {
                        if (this.connectedUsers[key].id == result.socket_id) {
                            var infoMsg = {
                                "type": "info",
                                "msg": "Пользователь " + this.connectedUsers[key].name + " Присоединился"
                            }
                            this.messages.push(infoMsg);
                        }
                    }
                }.bind(this));
        }.bind(this));
        //if server broadcast 'user left' remuve leaving users connected users
        socket.on('user left', function (socketId) {
            for (key in this.connectedUsers) {
                if (this.connectedUsers[key].id == socketId) {
                    var infoMsg = {
                        "type": "info",
                        "msg": "Пользователь " + this.connectedUsers[key].name + " покинул сервер"

                    }
                    this.messages.push(infoMsg);
                    this.connectedUsers.splice(key, 1);
                }
            }

        }.bind(this));

        socket.on('hidden_price', function (result) {
            this.product.price_product = result.price_product;
            this.price_company = result.price_company;
            this.price_prod = result.price_prod;
        }.bind(this));

        socket.on('by_product', function (result) {
            this.stop = result.stop;

        }.bind(this));
    },
    methods: {
        send: function () {
            for (key in this.connectedUsers) {
                if (this.connectedUsers[key].id == socket.id) {
                    this.message.user = this.connectedUsers[key].name;
                }
            }
            this.message.type = "chat";
            lt = new Date();
            Hour = lt.getHours();
            Minutes = lt.getMinutes();
            this.message.timestamp = Hour + ':' + Minutes;
            socket.emit('chat.message', {message: this.message, room: this.room});
            this.message.type = '';
            this.message.user = '';
            this.message.text = '';
            this.message.timastamp = '';

            $("#messages").bind('DOMSubtreeModified', function () { // отслеживаем изменение содержимого блока
                document.getElementById('panB').scrollTop = 10000000000000000000000000;
            });
        },
        sendReg: function (res) {
            this.message.reg = true;
            console.log(res.target.elements.username.value);
            socket.emit('add nameuser', {
                name: res.target.elements.username.value,
                id: socket.id
            });
        },
        show_price: function (event) {
            var self = this;
            self.hidden = false;
            this.price_user = this.price_user - 0.50;
            this.product.price_product = this.product.price_product - 0.25;
            this.price_company = this.price_company + 0.25;
            this.price_prod = this.price_prod + 0.25;

            socket.emit('hidden_price', {
                id: socket.id,
                room: this.room,
                price_product: this.product.price_product,
                price_company: this.price_company,
                price_prod: this.price_prod
            });

            function fun() {
                self.hidden = true;
            }
            setTimeout(fun, 3000);
        },
        by_product: function(event){
            this.stop = true;
            socket.emit('by_product', {
                room: this.room,
                stop: this.stop
            });
            window.location.reload();
        }

    }
});
