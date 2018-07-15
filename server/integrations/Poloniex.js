/*
INHERITS FROM EXCHANGE, IMPLEMENTS EXCHANGE SPECIFIC CALLBACKS. PULLS IN CREDS
AND CONTIANS EXCHANGE SPECIFIC FORMATTERS
*/

const events = require('events');
const emitter = new events.EventEmitter;
const Moment = require('moment');

const WebSocket = require('ws');
const wsuri = "wss://api2.poloniex.com:443";
const socket = new WebSocket(wsuri);

var openPairs = {};

var saveRouter = function(event, pair, kwarg) {


  if (event.type === 'orderBookModify') {

    let orderData = {
      time: Moment().format('lll'),
      kwarg: kwarg.seq,
      pair: pair,
      rate: event.data.rate,
      type: event.type,
      bidask: event.data.type,
      amount: event.data.amount
    }
    // console.log("What is order data: ", orderData);
    if (event.data.type === 'bid') {
      // Turn this into an exchange level method, don't have exchange specific emitters
      emitter.emit('NEW_BID', orderData);
      //Instead of a emitter, send to a bid parser
    };

    if (parseFloat(event.data.rate) < 0.071) {
      console.log(event.data);
      // Send to ask parser
    };
  }

  // if (event.type === 'orderBookRemove') {
  //   var orderData = {
  //     time: Moment().format('lll'),
  //     kwarg: kwarg.seq,
  //     pair: pair,
  //     rate: event.data.rate,
  //     type: event.type,
  //     bidask: event.data.type,
  //   }
  //   console.log("Order Book Remove: ", orderData);

  // }

  // if (event.type === 'newTrade') {
  //   var tradeData = {
  //     time: Moment().format('lll'),
  //     kwarg: kwarg.seq,
  //     tradeID: event.data.tradeID,
  //     pair: pair,
  //     amount: event.data.amount,
  //     rate: event.data.rate,
  //     total: event.data.total,
  //     type: event.data.type
  //   }
  //   console.log("New Trade: ", event, pair, kwarg.seq);
  //   if (event.data.type === 'buy') {

  //   }
  //   if (event.data.type === 'sell') {

  //   }
  // }
};

var startMarket = (pair, session) => {
  function marketEvent (args,kwarg) {
    args.forEach(function(event) {
      saveRouter(event, pair, kwarg);
    });
  }
  session.subscribe(pair, marketEvent);
};

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

module.exports = { socket, emitter };