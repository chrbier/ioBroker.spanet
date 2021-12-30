"use strict";

/*
 * Created with @iobroker/create-adapter v2.0.1
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = require("@iobroker/adapter-core");
const request = require('request');
// VARIABLES - EDIT THIS SECTION
var username = 'YOUR USERNAME'; // <<< FILL THIS IN WITH YOUR SPALINK USERNAME
var spaName = 'YOUR SPA NAME';  // <<< FILL THIS IN WITH A VALID SPA NAME ON YOUR ACCOUNT
var password = 'YOUR HASHED PASSWORD'; // <<< FILL THIS IN WITH YOUR SPALINK ENCRYPTED PASSWORD
// To get your encrypted password, see instructions at section 1.1 on the Github repo https://github.com/BlaT2512/spanet-api/blob/main/spanet.md

// making the web requests


// Load your modules here, e.g.:
// const fs = require("fs");

class Spanet extends utils.Adapter {

    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    constructor(options) {
        super({
            ...options,
            name: "spanet",
        });
        this.on("ready", this.onReady.bind(this));
        this.on("stateChange", this.onStateChange.bind(this));
        // this.on("objectChange", this.onObjectChange.bind(this));
        // this.on("message", this.onMessage.bind(this));
        this.on("unload", this.onUnload.bind(this));
    }

    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here

        // The adapters config (in the instance object everything under the attribute "native") is accessible via
        // this.config:
        this.log.info("config username: " + this.config.username);
        this.log.info("config password: " + this.config.mypassword);
		this.log.info("config poolname: " + this.config.poolname);
		username = this.config.username;
		spaName = this.config.poolname;
		password = this.config.mypassword;
		
		//connection to api
		// First, login to API with your username and encrypted password key to see if user exists, otherwise throw error
		const loginParams = {
		uri: 'https://api.spanet.net.au/api/MemberLogin',
		method: 'POST',
		json: {
		'login': username,
		'api_key': '4a483b9a-8f02-4e46-8bfa-0cf5732dbbd5',
		'password': password,
		},
	};

	// Make the login request
	request(loginParams, (error, response, body) => {
	if (!error && response.statusCode === 200 && body['success']) {

		// If you get to this section, login was successful
		this.log.info('Successfully logged into SpaNET account!');
      
		// Variables needed for next request
		const memberId = body['data']['id_member'];
		const sessionId = body['data']['id_session'];

		// Make the next request which will check the spas on your account
		const spaParams = {
		uri: 'https://api.spanet.net.au/api/membersockets?id_member=' + memberId + '&id_session=' + sessionId,
		method: 'GET',
		};

		request(spaParams, (error, response, body) => {
		if (!error && response.statusCode === 200 && JSON.parse(body)['success']) {
       
			// If you get to this section, the spa request was successful
			this.log.info('Successfully got list of spa\'s linked to SpaNET account!');

			// Parse through the list of spa sockets and check that the spa specified at the top exists
			const bodyJSON = JSON.parse(body);

			if (bodyJSON['sockets'][0] !== undefined){ // Make sure there are at least 1 spas on your account

				let spaFound = false; // Variable to track if the right spa has been found
				for(const result of bodyJSON['sockets']){
            
				// Check whether the name matches the spa name specified at the top
				if (result['name'] === spaName){

					// This is the correct spa that you chose
					spaFound = true;
                
					// WRITE SOME CODE TO DO ONCE THE SPA HAS BEEN FOUND
					// You could connect to it's websocket, this is done in the code-demo.js file in the code-demo folder
					this.log.info('Spa successfully found! Spa name:', spaName);
					this.log.info('Use these details for websocket connection: Spa IP ' + result['spaurl'].slice(0, -5) + ' ; Member ID ' + result['id_member'] + ' ; Socket ID ' + result['id_sockets']);
                
				}

				}

				if (spaFound === false){
					// The spa couldn't be found, do something such as throw an error
					this.log.info('Error: The specified spa does not exist for the SpaLINK account. Please log in with a different account or change the spa name.');
				}

			} else {
				// No spa's are on the linked account, do something such as throw an error
				this.log.info('Error: No spa\'s are linked to the specified SpaLINK account. Please log in with a different account or link a spa in the SpaLINK app.');
			}

		} else {
			// Couldn't make the second request to get spa websockets, do something such as throw an error (unexpected error, highly unlikely if your code is right)
			this.log.info('Error: Unable to obtain spa details from member, but login was successful. Please check your network connection, or open an issue on GitHub (unexpected).');
		}
		});

  } else {
    // Login failed, do something such as throw an error
    this.log.info('Error: Unable to login with details provided. Please ensure that you have the correct username and encrypted password (see 1.1 at https://github.com/BlaT2512/spanet-api/blob/main/spanet.md for details to obtain).');
  }
})

        /*
        For every state in the system there has to be also an object of type state
        Here a simple template for a boolean variable named "testVariable"
        Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
        */
        await this.setObjectNotExistsAsync("testVariable", {
            type: "state",
            common: {
                name: "testVariable",
                type: "boolean",
                role: "indicator",
                read: true,
                write: true,
            },
            native: {},
        });

        // In order to get state updates, you need to subscribe to them. The following line adds a subscription for our variable we have created above.
        this.subscribeStates("testVariable");
        // You can also add a subscription for multiple states. The following line watches all states starting with "lights."
        // this.subscribeStates("lights.*");
        // Or, if you really must, you can also watch all states. Don't do this if you don't need to. Otherwise this will cause a lot of unnecessary load on the system:
        // this.subscribeStates("*");

        /*
            setState examples
            you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
        */
        // the variable testVariable is set to true as command (ack=false)
        await this.setStateAsync("testVariable", true);

        // same thing, but the value is flagged "ack"
        // ack should be always set to true if the value is received from or acknowledged from the target system
        await this.setStateAsync("testVariable", { val: true, ack: true });

        // same thing, but the state is deleted after 30s (getState will return null afterwards)
        await this.setStateAsync("testVariable", { val: true, ack: true, expire: 30 });

        // examples for the checkPassword/checkGroup functions
        let result = await this.checkPasswordAsync("admin", "iobroker");
        this.log.info("check user admin pw iobroker: " + result);

        result = await this.checkGroupAsync("admin", "admin");
        this.log.info("check group user admin group admin: " + result);
    }

    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     * @param {() => void} callback
     */
    onUnload(callback) {
        try {
            // Here you must clear all timeouts or intervals that may still be active
            // clearTimeout(timeout1);
            // clearTimeout(timeout2);
            // ...
            // clearInterval(interval1);

            callback();
        } catch (e) {
            callback();
        }
    }

    // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
    // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
    // /**
    //  * Is called if a subscribed object changes
    //  * @param {string} id
    //  * @param {ioBroker.Object | null | undefined} obj
    //  */
    // onObjectChange(id, obj) {
    //     if (obj) {
    //         // The object was changed
    //         this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
    //     } else {
    //         // The object was deleted
    //         this.log.info(`object ${id} deleted`);
    //     }
    // }

    /**
     * Is called if a subscribed state changes
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    onStateChange(id, state) {
        if (state) {
            // The state was changed
            this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
        } else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }

    // If you need to accept messages in your adapter, uncomment the following block and the corresponding line in the constructor.
    // /**
    //  * Some message was sent to this instance over message box. Used by email, pushover, text2speech, ...
    //  * Using this method requires "common.messagebox" property to be set to true in io-package.json
    //  * @param {ioBroker.Message} obj
    //  */
    // onMessage(obj) {
    //     if (typeof obj === "object" && obj.message) {
    //         if (obj.command === "send") {
    //             // e.g. send email or pushover or whatever
    //             this.log.info("send command");

    //             // Send response in callback if required
    //             if (obj.callback) this.sendTo(obj.from, obj.command, "Message received", obj.callback);
    //         }
    //     }
    // }

}

if (require.main !== module) {
    // Export the constructor in compact mode
    /**
     * @param {Partial<utils.AdapterOptions>} [options={}]
     */
    module.exports = (options) => new Spanet(options);
} else {
    // otherwise start the instance directly
    new Spanet();
}