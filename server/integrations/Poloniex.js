/*
INHERITS FROM EXCHANGE, IMPLEMENTS EXCHANGE SPECIFIC CALLBACKS. PULLS IN CREDS
AND CONTIANS EXCHANGE SPECIFIC FORMATTERS
*/
const Moment = require('moment');
const WebSocket = require('ws');
const Exchange = require('./Exchange');

class Poloniex extends Exchange {

  constructor() {
    super();
    this.openPairs = {};
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
      this.emitOrderBook(msg);
    }

    socket.onclose = function () {
      console.log("Websocket connection closed");
    };
  }
}

module.exports = Poloniex