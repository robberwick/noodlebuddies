var WebSocketServer = require("ws").Server,
    http = require("http"),
    express = require("express"),
    _ = require('lodash'),
    moment = require('moment'),
    app = express(),
    port = process.env.PORT || 5000,
    server,
    wss,
    clients,
    days;

app.use(express.static(__dirname + "/public"))
server = http.createServer(app);
server.listen(port);

clients = [];
wss = new WebSocketServer({
    server: server
});

days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function next(day) {

    var today = new Date();
    var today_day = today.getDay();

    day = day.toLowerCase();

    for (var i = 7; i--;) {
        if (day === days[i]) {
            day = (i <= today_day) ? (i + 7) : i;
            break;
        }
    }

    var daysUntilNext = day - today_day;

    return new Date().setDate(today.getDate() + daysUntilNext);
}

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
            },
            buddy_count: {
                msg_type: 'buddy_count'
            },
            reset : {
                msg_type: 'reset'
            }
        }
        recipient.client.send(JSON.stringify(_.extend(msgTypes[msg_type], data)));
    }

    function getAvailableBuddies(){
        return _.filter(clients, function(item) {
                return (item.id !== userId && item.up_for_noodles === true && item.buddy === null);
            });
    }

    function getConnectedBuddies(){
        return _.filter(clients, function(item){
            return item.up_for_noodles === true;
        })
    }

    function updateBuddyCounts(){
        var totalBuddies;

        totalBuddies = getConnectedBuddies();
        _.map(clients, function(connectedBuddy){
            sendMessage(connectedBuddy, 'buddy_count', {
                count: totalBuddies.length
            })
        })
    }

    function dropBuddy() {
        if (me.buddy) {
            sendMessage(me.buddy, 'buddy_lost', {
                    buddy_status: 'lost',
                    buddy_name: ""
                });
            me.buddy.buddy = null;
        }
    };

    updateBuddyCounts();

    ws.on('message', function(data, flags) {
        var _this, payload,
            client, foundBuddy,
            available_buddies;

        payload = JSON.parse(data);
        if (payload.action && payload.action=="cancel"){
            dropBuddy();

            // reset me
            me.buddy = null;
            me.up_for_noodles = false;
            sendMessage(me, 'reset', {
                buddy_status: '',
                buddy_name: ''
            })
        }

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


    updateBuddyCounts();

    });
    ws.on('close', function(){
        dropBuddy();
        _.remove(clients, {
            'id': userId
        });
        updateBuddyCounts();
    });
});