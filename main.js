"use strict";

var utils =    require(__dirname + '/lib/utils');
var adapter = utils.adapter('mikrotik');

var MikroNode = require('mikronode-ng');

var states = {}, old_states ={};
var connect = false;
var _poll, poll_time = 5000;

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

    var connection = MikroNode.getConnection('192.168.88.1','admin','', {
        port: 8728,
        timeout: 10,
        closeOnTimeout: false,
        closeOnDone : false
    });


    connection.getConnectPromise().then(function(conn) {
        adapter.log.info('MikroTik ' + conn.status + ' to: ' + conn.host + JSON.stringify(conn));
        adapter.setState('info.connection', true, true);
        connect = true;
        getSystemInfo(conn);
    });

}

function getSystemInfo(conn){
    conn.getCommandPromise('/system/resource/print').then(function resolved(values) {
        console.log('Addreses: ' + JSON.stringify(values));
        states.interface = values;
        poll(conn);
    }, function rejected(reason) {
        console.log('Oops: ' + JSON.stringify(reason));
    });
}

function poll(conn){
    clearInterval(_poll);
    _poll = setInterval(function() {
        var ch1 = conn.getCommandPromise('/interface/wireless/registration-table/print');
        var ch2 = conn.getCommandPromise('/ip/dhcp-server/lease/print');
        var ch3 = conn.getCommandPromise('/interface/print');
        var ch4 = conn.getCommandPromise('/ip/firewall/filter/print');
        var ch5 = conn.getCommandPromise('/ip/firewall/nat/print');
        Promise.all([ ch1, ch2, ch3, ch4, ch5 ]).then(function resolved(values) {
            adapter.log.info('interface/wireless/registration-table ' + JSON.stringify(values[0]) + '\n\n');
            adapter.log.info('ip/dhcp-server/lease ' + JSON.stringify(values[1]) + '\n\n');
            adapter.log.info('interface ' + JSON.stringify(values[2]) + '\n\n');
            adapter.log.info('ip/firewall/filter ' + JSON.stringify(values[3]) + '\n\n');
            adapter.log.info('ip/firewall/nat ' + JSON.stringify(values[4]) + '\n\n');
            states.wireless = values[0];
            states.dhcp = values[1];
            states.interface = values[2];
            states.filter = values[3];
            states.nat = values[4];
        }, function rejected(reason) {
            err(reason);
        });

    }, poll_time);
}

function err(e){
    console.log('Oops: ' + e);
}

function Parse(data){

}

/*
function getWirelessList(){
    connection.getConnectPromise().then(function(conn) {
        conn.getCommandPromise('/interface/wireless/registration-table/print').then(function resolved(values) {
            console.log('Addreses: ' + JSON.stringify(values));
        }, function rejected(reason) {
            console.log('Oops: ' + JSON.stringify(reason));
        });
    });
}
*/

function SetFirewallFilter(){
    connection.getConnectPromise().then(function(conn) {
        conn.getCommandPromise('/ip/firewall/filter/set\n=disabled=no\n=.id=4').then(function resolved(values) {
            console.log('Addreses: ' + JSON.stringify(values));
        }, function rejected(reason) {
            console.log('Oops: ' + JSON.stringify(reason));
        });
    });
}
/*
function getFirewallFilter(){
    connection.getConnectPromise().then(function(conn) {
        conn.getCommandPromise('/ip/firewall/filter/print').then(function resolved(values) {
            console.log('Addreses: ' + JSON.stringify(values));
        }, function rejected(reason) {
            console.log('Oops: ' + JSON.stringify(reason));
        });
    });
}
*/
/*
function getFirewallNat(){
    connection.getConnectPromise().then(function(conn) {
        conn.getCommandPromise('/ip/firewall/nat/print').then(function resolved(values) {
            console.log('Addreses: ' + JSON.stringify(values));
        }, function rejected(reason) {
            console.log('Oops: ' + JSON.stringify(reason));
        });
    });
}
*/
/*
function getDhcpClient(){
    connection.getConnectPromise().then(function(conn) {
        conn.getCommandPromise('/ip/dhcp-server/lease/print').then(function resolved(values) {
            console.log('Addreses: ' + JSON.stringify(values));
        }, function rejected(reason) {
            console.log('Oops: ' + JSON.stringify(reason));
        });
    });
}
*/

/*
function getAllInterface(){
    connection.getConnectPromise().then(function(conn) {
        conn.getCommandPromise('/interface/print').then(function resolved(values) {
            console.log('Addreses: ' + JSON.stringify(values));
        }, function rejected(reason) {
            console.log('Oops: ' + JSON.stringify(reason));
        });
    });
}
*/
function Reboot(){
    connection.getConnectPromise().then(function(conn) {
        conn.getCommandPromise('/system/reboot').then(function resolved(values) {
            console.log('Addreses: ' + JSON.stringify(values));
        }, function rejected(reason) {
            console.log('Oops: ' + JSON.stringify(reason));
        });
    });
}
