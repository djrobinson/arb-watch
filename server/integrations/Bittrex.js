/*
INHERITS FROM EXCHANGE, IMPLEMENTS EXCHANGE SPECIFIC CALLBACKS. PULLS IN CREDS
AND CONTIANS EXCHANGE SPECIFIC FORMATTERS
*/
const signalR = require ('signalr-client');
const jsonic = require('jsonic');
const zlib = require('zlib');
const events = require('events');
const { Exchange } = require('./Exchange');

class Bittrex extends Exchange {
  constructor() {
    super();
    this.exchangeName = 'bittrex';
    // Temp hardcode for testing
    let market = 'BTC-ETH';
    this.market = market;
    this.emitter = new events.EventEmitter;
    this.client;
    console.log('Instantiating Bittrex exchange!');
  }

  initOrderBook() {
    console.log("Bittrex init order book");
    this.client = new signalR.client (
      'wss://beta.bittrex.com/signalr',
      ['c2']
    );

    let market = 'BTC-ETH';

    const self = this;
    const boundParser = this.parseOrderDelta.bind(this);
    const boundInitExchangeDelta = this.initExchangeDelta.bind(this);

    self.client.serviceHandlers.connected = function (connection) {
      console.log ('connected');
      self.client.call ('c2', 'QueryExchangeState', market).done (function (err, result) {
        if (err) { return console.log(err); }
        if (result === true) {
          console.log ('Subscribed to ' + market);
        }
      });
    }


    self.client.serviceHandlers.messageReceived = function (message) {
      let data = jsonic (message.utf8Data);
      let json;

      if (data.hasOwnProperty ('R')) {
        let b64 = data.R;

        let raw = new Buffer.from(b64, 'base64');
        zlib.inflateRaw (raw, function (err, inflated) {
          if (! err) {
            let json = JSON.parse (inflated.toString ('utf8'));
            boundParser('ORDER_BOOK_INIT', json);
            // Start only after order book inits
            boundInitExchangeDelta();
          }
        });
      }
    }
  }

  initExchangeDelta() {
    console.log("Bittrex init order book");

    let market = 'BTC-ETH';

    const self = this;
    const boundParser = this.parseOrderDelta.bind(this);


    self.client.call ('c2', 'SubscribeToExchangeDeltas', market).done (function (err, result) {
      if (err) { return console.log (err); }
      if (result === true) {
        console.log ('Subscribed to ' + market);
      }
    });


    self.client.serviceHandlers.messageReceived = function (message) {
      let data = jsonic (message.utf8Data);
      let json;
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
                if (! err) {
                  json = JSON.parse(inflated.toString ('utf8'));
                  boundParser('ORDER_DELTA', json);
                }
              });
            }
          }
        }
      }
    }
  }

  parseOrderDelta(type, orderDelta) {
    if (type === 'ORDER_BOOK_INIT' && orderDelta['Z'] && orderDelta['S']) {
      const sortedBids = orderDelta['Z'].sort((a, b) => {
        return b.R - a.R;
      }).slice(0, 50);
      const sortedAsks = orderDelta['S'].sort((a, b) => {
        return a.R - b.R;
      }).slice(0, 50);
      const bids = sortedBids.reduce((aggregator, bid) => {
          let order = {
            exchange: this.exchangeName,
            rate: bid.R,
            amount: parseFloat(bid.Q)
          };
          aggregator[this.exchangeName + bid.R.toString()] = order;
          return aggregator;
      }, {})
      const asks = sortedAsks.reduce((aggregator, ask) => {
          let order = {
            exchange: this.exchangeName,
            rate: ask.R,
            amount: parseFloat(ask.Q)
          };
          aggregator[this.exchangeName + ask.R.toString()] = order;
          return aggregator;
      }, {})
      let initOrderBook = {
        type,
        bids: bids,
        asks: asks
      }
      this.emitOrderBook(initOrderBook);
    }
    if (type === 'ORDER_DELTA' && orderDelta['Z'] && orderDelta['S']) {
      orderDelta['Z'].forEach(change => {
        let orderDelta = {
          type: 'BID_UPDATE',
          rateString: this.exchangeName + change.R.toString(),
          rate: change.R,
          amount: parseFloat(change.Q)
        }
        this.emitOrderBook(orderDelta);
      });
      orderDelta['S'].forEach(change => {
        let orderDelta = {
          type: 'ASK_UPDATE',
          rateString: this.exchangeName + change.R.toString(),
          rate: change.R,
          amount: parseFloat(change.Q)
        }
        this.emitOrderBook(orderDelta);
      });

    }
  }
}

module.exports = Bittrex;