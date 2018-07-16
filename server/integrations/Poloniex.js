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
    console.log("Order delta:", data);

    if (data && data[2] && data[2][0] && data[2][0][1] && data[2][0][1].hasOwnProperty('orderBook')) {
      // Initial Response:
      let initOrderBook = {
        type: 'ORDERBOOK_INIT'
      }
      initOrderBook.asks = data[2][0][1].orderBook[0];
      initOrderBook.bids = data[2][0][1].orderBook[1];
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
              rate: delta[2],
              amount: delta[3]
            }
            this.emitOrderBook(bidChange);
          } else {
            // 0 for ask
            let askChange = {
              type: 'ASK_UPDATE',
              rate: delta[2],
              amount: delta[3]
            }
            this.emitOrderBook(askChange);
          }
        }
      })
    }
  }
}

module.exports = Poloniex