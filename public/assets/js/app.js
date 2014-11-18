var host, ws,
    btnNoodle,
    NoodleBuddyViewModel, noodleBuddyVM;


host = location.origin.replace(/^http/, 'ws')
ws = new WebSocket(host);
btnNoodle = document.querySelector('#btn-noodles');

NoodleBuddyViewModel = function(){
    var _this;

    _this = this
    this.buddyStatus = ko.observable('');
    this.buddyName = ko.observable('');
    this.showPanel = ko.pureComputed(function(){
        return _this.buddyStatus() !== '';
    });
    this.panelClass = ko.pureComputed(function(){
        return (_this.buddyStatus() === '') ? 'hidden' : "panel-" + _this.buddyStatus();
    });
    this.message = ko.pureComputed(function(){
        var messages;

        messages = {
            'waiting': "Trying to hook you up now - hold tight",
            'found': "We found your ideal Noodle Buddy! Now go enjoy your delicious noodles, you crazy kids!",
            'lost': "Oh noes! Your Noodle Buddy has left. We'll try to find you another one."
        }

        return messages[_this.buddyStatus()] || ""
    });
}


noodleBuddyVM = new NoodleBuddyViewModel();

ws.onmessage = function(event) {
    var data;

    data = JSON.parse(event.data);

    noodleBuddyVM.buddyName(data['buddy_name']);
    noodleBuddyVM.buddyStatus(data['buddy_status']);

};

btnNoodle.addEventListener('click', function() {
    var data,
        noodleName;

    noodleName = document.querySelector('#noodle-name');

    if (noodleName.value) {
        data = {
            noodle_name: noodleName.value
        }
        ws.send(JSON.stringify(data));
    }
})

ko.applyBindings(noodleBuddyVM);
