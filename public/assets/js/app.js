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
        return (_this.buddyCount() == 1) ? _this.buddyCount() + " buddy" : _this.buddyCount() + " buddies";
    });
    this.showPanel = ko.pureComputed(function(){
        return _this.buddyStatus() !== '';
    });
    this.panelClass = ko.pureComputed(function(){
        return (_this.buddyStatus() === '') ? 'hidden' : "panel-" + _this.buddyStatus();
    });
    this.message = ko.pureComputed(function(){
        var messages;

        messages = {
            'waiting': "The ninjas have been dispatched! Hold on, and you'll have your Noodle Buddy soon.",
            'found': "We found your ideal Noodle Buddy! Now go enjoy your delicious noodles, you crazy kids!",
            'lost': "Oh noes! Your Noodle Buddy has left. We'll try to find you another one."
        }
        if (_this.buddyStatus() == '') {
            return "tpl-none"
        } else {
            return "tpl-" + _this.buddyStatus();
        };
        // return messages[_this.buddyStatus()] || ""
    });
    this.getBuddy = function(){
        var data;
        if (this.noodleName().length) {
            data = {
                noodle_name: this.noodleName()
            }
            ws.send(JSON.stringify(data));
        }
    }

    this.bailOut = function(){
        var data;

        data = {
            'action': 'cancel'
        }

        ws.send(JSON.stringify(data));
    }

}

noodleBuddyVM = new NoodleBuddyViewModel();

ws.onmessage = function(event) {
    var _this, data;

    _this = this;
    data = JSON.parse(event.data);

    if (data['buddy_name']){
        if (getBuddyTimeout){
            clearTimeout(getBuddyTimeout);
        }
        noodleBuddyVM.buddyName(data['buddy_name']);
    }

    if (data['buddy_status']){
        noodleBuddyVM.buddyStatus(data['buddy_status']);
    }

    if (data['count']){
        noodleBuddyVM.buddyCount(parseInt(data['count'], 10));
    }
    if (data['buddy_status'] == "lost"){
        //clear buddy details
        noodleBuddyVM.buddyName('');
        getBuddyTimeout = setTimeout(noodleBuddyVM.getBuddy.bind(noodleBuddyVM), 5000);
    }

    if (data['msg_type'] == 'reset'){
        noodleBuddyVM.buddyName('');
        noodleBuddyVM.buddyStatus('');
    }

};


ko.applyBindings(noodleBuddyVM);