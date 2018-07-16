/*
INHERITS FROM EXCHANGE, IMPLEMENTS EXCHANGE SPECIFIC CALLBACKS. PULLS IN CREDS
AND CONTIANS EXCHANGE SPECIFIC FORMATTERS
*/

const Moment = require('moment');
const WebSocket = require('ws');


class Poloniex {

  constructor() {
    this.openPairs = {};
  }

  parseOrder(rawOrder) {
    const order = {};
    return order;
  }

  initOrderBook() {
    const wsuri = "wss://api2.poloniex.com:443";
    const socket = new WebSocket(wsuri);
    socket.onopen = session => {
      console.log('Opening connection');
      let params = {command: 'subscribe', channel: 'BTC_ETH'};
      socket.send(JSON.stringify(params));
      // startMarket('BTC_ETH', session);

    };

    socket.onmessage = msg => {
      console.log("Message back from polo: ", msg.data);
    }

    socket.onclose = function () {
      console.log("Websocket connection closed");
    };
  }
}

module.exports = Poloniex