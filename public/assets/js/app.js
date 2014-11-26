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

        return messages[_this.buddyStatus()] || ""
    });
}

noodleBuddyVM = new NoodleBuddyViewModel();

ws.onmessage = function(event) {
    var _this, data;

    _this = this;

    data = JSON.parse(event.data);
    //clear the getBuddyTimeout if it's set
    console.log(data);

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
        console.log(data['count']);
        noodleBuddyVM.buddyCount(parseInt(data['count'], 10));
    }
    if (data['buddy_status'] == "lost"){
        //clear buddy details
        noodleBuddyVM.buddyName('');
        console.log("buddy lost - setting timeout");
        getBuddyTimeout = setTimeout(getBuddy.bind(this), 5000);
        console.log("get buddy timeout = ", getBuddyTimeout);
    }

};

getBuddy = function(){
    var data,
        noodleName;

    console.log('getting buddy');
    noodleName = document.querySelector('#noodle-name');

    if (noodleName.value) {
        data = {
            noodle_name: noodleName.value
        }
        ws.send(JSON.stringify(data));
    }
}
btnNoodle.addEventListener('click', getBuddy.bind(this));

ko.applyBindings(noodleBuddyVM);
