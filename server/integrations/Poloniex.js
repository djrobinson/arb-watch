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
      const bidRates = Object.keys(stringBids);
      const bids = bidRates.reduce((aggregator, bid) => {
        aggregator[bid] = parseFloat(stringBids[bid])
        return aggregator;
      }, {});

      const stringAsks = data[2][0][1].orderBook[0];
      const askRates = Object.keys(stringAsks);
      const asks = askRates.reduce((aggregator, ask) => {
        aggregator[ask] = parseFloat(stringAsks[ask])
        return aggregator;
      }, {});

      initOrderBook.asks = asks;
      initOrderBook.bids = bids;
      console.log("Orderbook asks: ", initOrderBook.asks);
      this.emitOrderBook(initOrderBook);
    }
    if (data && data[2]) {
      data[2].forEach(delta => {
        if (delta[0] === 'o') {
          if (delta[1]) {
            // 1 for Bid
            let bidChange = {
              type: 'BID_UPDATE',
              rate: parseFloat(delta[2]),
              amount: parseFloat(delta[3])
            }
            this.emitOrderBook(bidChange);
          } else {
            // 0 for ask
            let askChange = {
              type: 'ASK_UPDATE',
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