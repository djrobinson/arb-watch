/*
INHERITS FROM EXCHANGE, IMPLEMENTS EXCHANGE SPECIFIC CALLBACKS. PULLS IN CREDS
AND CONTIANS EXCHANGE SPECIFIC FORMATTERS
*/
const signalR = require ('signalr-client');
const jsonic = require('jsonic');
const zlib = require('zlib');

class Bittrex {
  constructor() {
    // Temp hardcode for testing
    let market = 'BTC-ETH';
    this.market = market;
    console.log('Instantiating Bittrex exchange!');
  }

  initOrderBook() {
    console.log("Trying websocket");
    const client  = new signalR.client (
      'wss://beta.bittrex.com/signalr',
      ['c2']
    );

    let market = 'BTC-ETH',
        data,
        b64,
        raw,
        json;

    client.serviceHandlers.connected = function (connection) {
      console.log ('connected');
      client.call ('c2', 'SubscribeToExchangeDeltas', market).done (function (err, result) {
        if (err) { return console.error (err); }
        if (result === true) {
          console.log ('Subscribed to ' + market);
        }
      });
    }

    client.serviceHandlers.messageReceived = function (message) {
      data = jsonic (message.utf8Data);
      if (data.hasOwnProperty ('M')) {
        if (data.M[0]) {
          if (data.M[0].hasOwnProperty ('A')) {
            if (data.M[0].A[0]) {
              /**
               *  handling the GZip and base64 compression
               *  https://github.com/Bittrex/beta#response-handling
               */
              b64 = data.M[0].A[0];
              raw = new Buffer.from(b64, 'base64');

              zlib.inflateRaw (raw, function (err, inflated) {
                if (! err) {
                  json = JSON.parse (inflated.toString ('utf8'));
                  console.log (json);
                }
              });
            }
          }
        }
      }
    };
  }


  subscribeExchangeDeltas() {
    console.log("Try init exchange delta");
    client.call ('c2', 'SubscribeToExchangeDeltas', this.market).done (function (err, result) {
      if (err) { return console.log(err); }
      if (result === true) {
        console.log ('Subscribed to ' + this.market);
      }
    });
  }

  wsResponseHandler(message) {
    let data = jsonic (message.utf8Data);
    if (data.hasOwnProperty ('M')) {
      if (data.M[0]) {
        if (data.M[0].hasOwnProperty ('A')) {
          if (data.M[0].A[0]) {
            /**
             *  handling the GZip and base64 compression
             *  https://github.com/Bittrex/beta#response-handling
             */
            let b64 = data.M[0].A[0];
            let raw = new Buffer.from(b64, 'base64');

            zlib.inflateRaw (raw, function (err, inflated) {
              if (!err) {
                let json = JSON.parse (inflated.toString ('utf8'));
                console.log (json);
              }
            });
          }
        }
      }
    }
    if (data.hasOwnProperty ('R')) {
      let b64 = data.R;

      let raw = new Buffer.from(b64, 'base64');
      console.log("What is b64", raw);
      zlib.inflateRaw (raw, function (err, inflated) {
        if (! err) {
          let json = JSON.parse (inflated.toString ('utf8'));
          console.log ("R json: ", json);
        }
      });
    }
  }
}


/*
{ M: 'BTC-ETH',
  N: 279673,
  Z:
   [ { TY: 0, R: 0.07059001, Q: 0.434918 },
     { TY: 1, R: 0.07058497, Q: 0 },
     { TY: 1, R: 0.06950001, Q: 0 },
     { TY: 0, R: 0.0601, Q: 0.11489342 } ],
  S:
   [ { TY: 1, R: 0.07102, Q: 0 },
     { TY: 0, R: 0.07103, Q: 22.1222 },
     { TY: 0, R: 0.071207, Q: 51.552 },
     { TY: 1, R: 0.0712294, Q: 0 } ],
  f: [] }
*/


module.exports = Bittrex;