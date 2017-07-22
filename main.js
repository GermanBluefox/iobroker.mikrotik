"use strict";

var utils =    require(__dirname + '/lib/utils');
var adapter = utils.adapter('mikrotik');
var MikroNode = require('mikronode');

var device = new MikroNode('192.168.88.1');

adapter.on('unload', function (callback) {
    try {
        adapter.log.info('cleaned everything up...');
        callback();
    } catch (e) {
        callback();
    }
});

adapter.on('objectChange', function (id, obj) {
    adapter.log.info('objectChange ' + id + ' ' + JSON.stringify(obj));
});

adapter.on('stateChange', function (id, state) {
    adapter.log.info('stateChange ' + id + ' ' + JSON.stringify(state));
    if (state && !state.ack) {
        adapter.log.info('ack is not set!');
    }
});

adapter.on('message', function (obj) {
    if (typeof obj == 'object' && obj.message) {
        if (obj.command == 'send') {
            // e.g. send email or pushover or whatever
            console.log('send command');

            // Send response in callback if required
            if (obj.callback) adapter.sendTo(obj.from, obj.command, 'Message received', obj.callback);
        }
    }
});

adapter.on('ready', function () {
    main();
});

function main() {
    //adapter.subscribeStates('*');

    device.connect('admin','password').then(function(conn) {

        var chan = conn.openChannel("addresses"); // open a named channel
        var chan2 = conn.openChannel("firewall_connections",true); // open a named channel, turn on "closeOnDone"

        chan.write('/ip/address/print');

        chan.on('done',function(data) {

            // data is all of the sentences in an array.
            data.forEach(function(item) {
                console.log('Interface/IP: '+item.data.interface+"/"+item.data.address);
            });

            //chan.close(); // close the channel.
            //conn.close(); // when closing connection, the socket is closed and program ends.

        });


        chan.write('/ip/firewall/print');

        chan.done.subscribe(function(data){

            // data is all of the sentences in an array.
            data.forEach(function(item) {
                var data = MikroNode.resultsToObj(item.data); // convert array of field items to object.
                console.log('Interface/IP: '+data.interface+"/"+data.address);
            });

        });

    });
}
