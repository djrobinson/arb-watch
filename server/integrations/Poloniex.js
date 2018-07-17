/*
INHERITS FROM EXCHANGE, IMPLEMENTS EXCHANGE SPECIFIC CALLBACKS. PULLS IN CREDS
AND CONTIANS EXCHANGE SPECIFIC FORMATTERS
*/
const Moment = require('moment');
const WebSocket = require('ws');
const { Exchange } = require('./Exchange');

class Poloniex extends Exchange {

  constructor() {
    super();
    this.exchangeName = 'poloniex';
  }

  parseOrder(rawOrder) {
    const order = {};
    return order;
  }

  initOrderBook() {
    console.log("Poloniex init order book");
    const wsuri = "wss://api2.poloniex.com:443";
    const socket = new WebSocket(wsuri);
    socket.onopen = session => {
      console.log('Opening connection');
      let params = {command: 'subscribe', channel: 'BTC_ETH'};
      socket.send(JSON.stringify(params));
    };

    socket.onerror = error => {
      console.log("Poloniex WS Error!");
      console.log("Error: ", error);
    }

    socket.onmessage = msg => {
      if (msg && msg.data) {
        this.parseOrderDelta(msg.data);
      }
    }

    socket.onclose = function () {
      console.log("Websocket connection closed");
    };
  }

  parseOrderDelta(orderDelta) {
    const data = JSON.parse(orderDelta);

    if (data && data[2] && data[2][0] && data[2][0][1] && data[2][0][1].hasOwnProperty('orderBook')) {
      // Initial Response:
      let initOrderBook = {
        type: 'ORDER_BOOK_INIT'
      }
      const stringBids = data[2][0][1].orderBook[1];
      const bidRates = Object.keys(stringBids).slice(0, 50);
      const bids = bidRates.reduce((aggregator, bid) => {
        let order = {
          exchange: this.exchangeName,
          rate: parseFloat(bid),
          amount: parseFloat(stringBids[bid])
        };
        aggregator[this.exchangeName + bid] = order;
        return aggregator;
      }, {});

      const stringAsks = data[2][0][1].orderBook[0];
      const askRates = Object.keys(stringAsks).slice(0, 50);
      const asks = askRates.reduce((aggregator, ask) => {
        let order = {
          exchange: this.exchangeName,
          rate: parseFloat(ask),
          amount: parseFloat(stringAsks[ask])
        };
        aggregator[this.exchangeName + ask] = order;
        return aggregator;
      }, {});

      // Take first 500 to match bittrex. Would be in config if more exchanges
      initOrderBook.asks = asks;
      initOrderBook.bids = bids;
      this.emitOrderBook(initOrderBook);
    }
    if (data && data[2]) {
      data[2].forEach(delta => {
        if (delta[0] === 'o') {
          if (delta[1]) {
            // 1 for Bid
            let bidChange = {
              type: 'BID_UPDATE',
              rateString: this.exchangeName + delta[2],
              rate: parseFloat(delta[2]),
              amount: parseFloat(delta[3])
            }
            this.emitOrderBook(bidChange);
          } else {
            // 0 for ask
            let askChange = {
              type: 'ASK_UPDATE',
              rateString: this.exchangeName + delta[2],
              rate: parseFloat(delta[2]),
              amount: parseFloat(delta[3])
            }
            this.emitOrderBook(askChange);
          }
        }
      })
    }
  }
}

module.exports = Poloniex