/*
INHERITS FROM EXCHANGE, IMPLEMENTS EXCHANGE SPECIFIC CALLBACKS. PULLS IN CREDS
AND CONTIANS EXCHANGE SPECIFIC FORMATTERS
*/

var events = require('events');
var emitter = new events.EventEmitter;
var autobahn = require('autobahn');
var wsuri = "wss://api.poloniex.com";
var connection = new autobahn.Connection({
  url: wsuri,
  realm: "realm1"
});
var Moment = require('moment');

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

    if (event.data.type === 'bid') {
      console.log("here's the first bid");
      emitter.emit('NEW_BID', orderData);
    };

    if (event.data.type === 'ask') {

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

var startMarket = function(pair, session) {
  function marketEvent (args,kwarg) {
    args.forEach(function(event) {
      saveRouter(event, pair, kwarg);
    });
  }
  session.subscribe(pair, marketEvent);
};

connection.onopen = function (session) {
  console.log('Opening connection');

  startMarket('BTC_ETH', session);

};

connection.onclose = function () {
  console.log("Websocket connection closed");
};



module.exports = { connection, emitter };