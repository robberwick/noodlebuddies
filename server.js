var WebSocketServer = require("ws").Server,
    http = require("http"),
    express = require("express"),
    _ = require('lodash'),
    app = express(),
    port = process.env.PORT || 5000,
    server,
    wss,
    clients;

app.use(express.static(__dirname + "/public"))
server = http.createServer(app);
server.listen(port);

clients = [];
wss = new WebSocketServer({
    server: server
});

wss.on('connection', function(ws) {
    var userId, me;

    userId = _.uniqueId();
    me = {
        id: userId,
        client: ws,
        up_for_noodles: false,
        buddy: null,
        noodle_name: "anonymous"
    };
    clients.push(me);

    function sendMessage(recipient, msg_type, data){
        var msgTypes;

        msgTypes = {
            buddy_found: {
                msg_type: 'found_buddy'
            },
            buddy_lost: {
                msg_type: 'lost_buddy'
            }
        }

        recipient.client.send(JSON.stringify(_.extend(msgTypes[msg_type], data)));
    }

    function getAvailableBuddies(){
        return _.filter(clients, function(item) {
                return (item.id !== userId && item.up_for_noodles === true && item.buddy === null);
            });
    }

    ws.on('message', function(data, flags) {
        var _this, payload,
            client, foundBuddy,
            available_buddies;

        payload = JSON.parse(data);
        if (me.buddy){
            return;
        }
        if (payload.noodle_name) {

            // mark me as available
            me = _.extend(me, {
                up_for_noodles: true,
                noodle_name: payload.noodle_name
            });

            // do we have anyone available?
            available_buddies = getAvailableBuddies();
            if (available_buddies.length > 0) {
                // i have a buddy!
                foundBuddy = available_buddies[0];
                foundBuddy['buddy'] = me;
                me['buddy'] = foundBuddy;

                // tell the new found buddy
                sendMessage(foundBuddy, 'buddy_found', {
                    buddy_status: "found",
                    buddy_name: me.noodle_name
                });

                //tell me
                sendMessage(me, 'buddy_found', {
                    buddy_status: "found",
                    buddy_name: foundBuddy.noodle_name
                });

            } else {
                sendMessage(me, 'buddy_found', {
                    buddy_status: "waiting",
                    buddy_name: ""
                });
            }
        }

    });
    ws.on('close', function() {
        var availableBuddies;

        if (me.buddy) {
            availableBuddies = getAvailableBuddies();

            sendMessage(me.buddy, 'buddy_lost', {
                    buddy_status: 'lost',
                    buddy_name: ""
                });
            me.buddy.buddy = null;
        }
        _.remove(clients, {
            'id': userId
        });
    });
});
