var host, ws,
    btnNoodle;


host = location.origin.replace(/^http/, 'ws')
ws = new WebSocket(host);
btnNoodle = document.querySelector('#btn-noodles');

ws.onmessage = function(event) {
    var data, buddyStatusEl,
        buddyEl;

    buddyEl = document.querySelector('#buddy');
    buddyStatusEl = document.querySelector('.buddy-status');

    data = JSON.parse(event.data);
    buddyEl.textContent = data['buddy_name'];
    buddyStatusEl.style.display = 'block';

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
