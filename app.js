'use strict';
const SMTPServer = require('smtp-server').SMTPServer;
const mailParser = require('mailparser').simpleParser;
const nodemailer = require('nodemailer');
const https = require('https');
const fs = require('fs');

var config;
var transporter;

const server = new SMTPServer({
	secure: false,
	name: "Johnny Bravo",
	authOptional: false,
	allowInsecureAuth: true,
	onConnect(session, callback){
        if(session.remoteAddress !== config.nvr.ip){
			console.log("onConnect error");
            return callback(new Error('Unexpected error 0x0001'));
        }
        return callback(); // Accept the connection
    },
    onAuth(auth, session, callback){
        if(auth.username !== config.nvr.user || auth.password !== config.nvr.password){
			console.log("onAuth error");
            return callback(new Error('Invalid username or password'));
        }
        callback(null, {user: 1}); // where 123 is the user id or similar property
    },
    onRcptTo(address, session, callback) {
        if (address.address === config.nvr.sender) {
			console.log("onRcptTo error");
            err = new Error('Unexpected error 0x0002');
            err.responseCode = 452;
            return callback(err);
        }
        callback();
    },
    onData(stream, session, callback){
		var buffers = [];
		stream.on('data', (data) => {
			buffers.push(data);
		});
        stream.on('end', () => {
			mailParser(Buffer.concat(buffers), (err, mail) => {
				var eventType = 'unknown';
				var eventTime = 0;
				var cameraName = '';
				var channelName = '';
				var lines = mail.text.split('\n');
				for(var i in lines) {
					var parts = lines[i].split(':');
					if (parts.length >= 2) {
						var item = parts[0];
						var data = parts.slice(1).join(':').trim();
						switch (item) {
							case 'EVENT TYPE': eventType = data; break;
							case 'EVENT TIME': eventTime = new Date(data); break;
							case 'CAMERA NAME(NUM)':
								var j = data.lastIndexOf('(');
								if (j && data.endsWith(')')) {
									cameraName = data.substring(0, j).trim();
									channelName = data.substring(j + 1, data.length - 1).trim();
								} else {
									cameraName = data;
								}
								break;
							case 'IPC NAME': cameraName = data; break;
							case 'CHANNEL NAME': channelName = data; break;
							//default: console.log("Item: " + item +", Data: " + data); break;
						}
					}
				}
				if (!!eventType && !!cameraName && !!channelName) {
					var body = JSON.stringify({
						eventType: eventType,
						eventTime: eventTime.getTime(),
						cameraName: cameraName,
						channelName: channelName
					});

					var headers = {
						'Content-Type': 'application/json',
						'Content-Length': body.length
					};

					var options = {
						host: config.st.host,
						path: '/api/token/' + config.st.accessToken + '/smartapps/installations/' + config.st.appId + '/event',
						port: 443,
						method: 'PUT',
						headers: headers
					};
					console.log("Event " + eventType + " happened at " + eventTime + " for camera " + cameraName + " on channel " + channelName);
					https.request(options).write(body);
					sendEmail(mail);
					
				} else {
					console.log("Event email not recognized as valid event!");
				}
				//console.log("Event " + eventType + " happened at " + eventTime + ' for camera ' + cameraName + ' on channel ' + channelName);
				//sendEmail(mail);
			});
            callback(null, 'Message queued, maybe...');
        });
    }
});

function sendEmail(mail) {
	// setup email data with unicode symbols
    let mailOptions = {
        from: mail.from.text,
        to: mail.to.text,
        subject: mail.subject,
        text: mail.text,
        html: mail.textAsHtml,
		attachments: mail.attachments
    };
    // send mail with defined transport object
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
    });
}

function loadConfig() {
	fs.readFile(__dirname + '/config.json', function read(err, data) {
		config = JSON.parse(data);
		transporter = nodemailer.createTransport(config.mail);
		server.listen(config.nvr.port, '0.0.0.0');
		console.log("Started the NVR SMTP service on port " + config.nvr.port);
	});
}
loadConfig();
