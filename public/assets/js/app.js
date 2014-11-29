var host, ws,
    btnNoodle,
    NoodleBuddyViewModel, noodleBuddyVM,
    getBuddyTimeout;

host = location.origin.replace(/^http/, 'ws')
ws = new WebSocket(host);
btnNoodle = document.querySelector('#btn-noodles');

NoodleBuddyViewModel = function(){
    var _this;

    _this = this
    this.noodleName = ko.observable('');
    this.buddyStatus = ko.observable('');
    this.buddyName = ko.observable('');
    this.buddyCount = ko.observable(0);
    this.countText = ko.pureComputed(function(){
        return (_this.buddyCount() == 1) ? "buddy" : "buddies";
    });
    this.showPanel = ko.pureComputed(function(){
        return _this.buddyStatus() !== '';
    });
    this.panelClass = ko.pureComputed(function(){
        return (_this.buddyStatus() === '') ? 'hidden' : "panel-" + _this.buddyStatus();
    });
    this.message = ko.pureComputed(function(){
        if (_this.buddyStatus() == '') {
            return "tpl-none"
        } else {
            return "tpl-" + _this.buddyStatus();
        };
    });

    this.buddyCheckTimeout = null;

    this.getBuddy = function(){
        var data;
        if (this.noodleName().length) {
            data = {
                msg_type: 'get_buddy',
                noodle_name: this.noodleName()
            }
            ws.send(JSON.stringify(data));
        }
    }

    this.bailOut = function(){
        var data;

        data = {
            'msg_type': 'cancel'
        }

        this.clearBuddyCheckTimeout();
        ws.send(JSON.stringify(data));
    }

    this.setBuddyCheckTimeout = function(){
        this.buddyCheckTimeout = setTimeout(this.getBuddy.bind(this), 5000);
    }

    this.clearBuddyCheckTimeout = function(){
        if (this.buddyCheckTimeout){
            clearTimeout(this.buddyCheckTimeout);
        }
    }

    this.setBuddyName = function(buddyName){
        this.clearBuddyCheckTimeout();
        this.buddyName(buddyName);
    }
}

noodleBuddyVM = new NoodleBuddyViewModel();

ws.onmessage = function(event) {
    var _this, data,
        messageHandlers, handlerFunc;

    _this = this;
    messageHandlers = {
        waiting: function(data){
            noodleBuddyVM.buddyStatus('waiting');
        },
        found_buddy: function(data){
            noodleBuddyVM.setBuddyName(data['buddy_name'])
            noodleBuddyVM.buddyStatus('found');
        },
        lost_buddy: function(data){
            noodleBuddyVM.setBuddyName('');
            noodleBuddyVM.buddyStatus('lost');
            noodleBuddyVM.setBuddyCheckTimeout();
        },
        buddy_count: function(data){
            noodleBuddyVM.buddyCount(parseInt(data['count'], 10));
        },
        reset : function(){
            noodleBuddyVM.buddyName('');
            noodleBuddyVM.buddyStatus('');
        }
    }

    data = JSON.parse(event.data);

    handlerFunc = messageHandlers[data.msg_type] || function(){console.log('unsupported msg_type')};
    handlerFunc(data);
};


ko.applyBindings(noodleBuddyVM);