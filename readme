# Hikvision NVR

Hikvision NVR is an interface between a Hikvision/LaView NVR and SmartThings, allowing motion sensors to be available to ST

# Community

If you're having any issues, feel free to open issues and PRs here.

# Installation

**Note:** There are two parts to the installation:
 * Install the SmartApp and its associated Device Handlers
 * Install the NVR NodeJS server

# Installing the SmartApp and its associated Device Handlers

Go to your SmartThings [IDE](https://graph.api.smartthings.com/login/auth) and go to your [SmartApps](https://graph.api.smartthings.com/ide/apps). Click on Settings and add a new repository with owner **ady624**, name **hikvision-nvr** and branch **master**. Click Ok.

Click on the Update from Repo button and select the hikvision-nvr repo. Select the Hikvision Motion Sensors application and install it. Do the same for the Device Handlers, selecting Hikvision Motion Sensor.

# Installing the NVR NodeJS server

Install NodeJS. You can follow these [instructions](https://nodejs.org/en/download/package-manager/) to install Node JS 8.x or later.

On your linux machine, create a folder /var/node (if it doesn't exist yet). Download the nvr folder onto your linux machine. I use this on a Raspberry Pi running Raspbian. Install necessary modules:

    sudo npm install smtp-server
    sudo npm install mailparser
    sudo npm install nodemailer

Test the application:

        node /var/node/nvr/app.js


#Making the app a bash executable (optional)

Create the file /usr/bin/nvr with this content:

    #!/usr/bin/env node
    //
    // This executable sets up the environment and runs the NVR SMTP server.
    //
    
    'use strict';
    process.title = 'nvr';
    
    // Run HomeCloudHub
    require('/var/node/nvr/app.js');

Give it execute rights:

    sudo chmod 755 /usr/bin/nvr

#Testing your server

**VERY IMPORTANT**: If you have a firewall installed, make sure you allow inbound connections to port 26275.

Edit the configuration file. Copy the provided config.json.sample and rename it as config.json

    {
    	"nvr": {
    		"ip": "a.b.c.d",
    		"port": 26275,
    		"sender": "user@domain.com",
    		"user": "user",
    		"password": "password"
    	},
    	"st": {
    		"host": "graph.api.smartthings.com",
    		"accessToken": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    		"appId": "ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj"
    	},
    	"mail": {
    	    "host": "smtp.gmail.com",
    	    "port": 587,
    	    "secure": false,
    	    "auth": {
    	        "user": "user@domain.com",
    	        "pass": "password"
    	    }
    	}
    }

The nvr.ip reffers to the IP of your NVR, it is used to authenticate the source.
The nvr.sender needs to match the NVR's Sender's Address configured below.
The nvr.user and nvr.password must match the username and password entered in your NVR settings configured below.
For ST, the host is whatever your IDE host resides on, for US customers, most likely graph.api.smartthings.com - use the URL in your IDE. The accessToken and appId need a little digging, until the app will be adapted to provide them. Open your IDE and go to Locations, then click on the smartapps link in the location you installed the app, then find it in the list and click on its name. The access token is found in the Application State. You can find all three parameters in the endpoint field of the form https://{{host}}:443/api/token/{{accessToken}}/smartapps/installations/{{appId}}/
If you want your mail forwarded over, you'll need to enter your email settings in the mail section.
Save the config.json file and then, to run the server, run either

        node /var/node/nvr/app.js

or, alternatively, if you made an executable at the optional step above:

        nvr


With nvr running, go to your SmartThings app and go to Marketplace. Scroll down to My Apps and click on the Hikvision Motion Sensors app. Open the application once and exit it. Then configure your NVR for email as follows:

Go to Configuration > Network > Advanced Settings

Enter a name for Sender
Enter a valid email address for Sender's Address
Enter your server (RaspberryPI)'s IP for the SMTP server
Enter port 26275

Enter the username matching the config.json
Enter the password matching the config.json

# Installing nvr as a system service

Create a new system username to run nvr under:

    sudo useradd --system nvr

**NOTE**: Some Operating Systems may require the .service extension within the systemd ecosystem. CentOS/RedHat seems to be one of them, according to Keo (thank you). Debian seems to not need it.

Create the /etc/default/nvr file with this content:

    # Defaults / Configuration options for nvr
    
    # If you uncomment the following line, nvr will log more.
    # You can display this via systemd's journalctl: journalctl -f -u nvr
    # DEBUG=*

Create the /etc/systemd/system/nvr file with this content:

    [Unit]
    Description=Node.js Local NVR SMTP Server
    After=syslog.target
    
    [Service]
    Type=simple
    User=nvr
    EnvironmentFile=/etc/default/nvr
    ExecStart=/usr/bin/node /var/node/nvr/app.js
    Restart=on-failure
    RestartSec=10
    KillMode=process
    
    [Install]
    WantedBy=multi-user.target

Setup the systemctl service by running:

    sudo systemctl daemon-reload
    sudo systemctl enable nvr
    sudo systemctl start nvr

Check the service status:

    sudo systemctl status nvr

Enjoy! :)
