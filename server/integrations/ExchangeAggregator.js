/*
CLASS THAT INSTANTIATES MULTIPLE EXCHANGE OBJECTS AND CALLS THEIR
APIS CONCURRENTLY TO THEN RETURN THE VALUES IN A DICTIONARY SO FE
CAN DISPLAY COMBINED EXCHANGE INFORMATION
*/
var events = require('events');
var emitter = new events.EventEmitter;
const Poloniex = require('./Poloniex');

class ExchangeAggregator {

  constructor() {
    console.log("Exchange agg");
    Poloniex.connection.open();
    Poloniex.emitter.on("NEW_BID", data => {
      console.log("Bid from Poloniex: ");
      console.log(data);
    })
  }

  sendWebSocket(msg) {
      console.log("What is socket msg ", msg);
  }

  subscribe() {
    var subscription = events.subscribe('NEW_BID', function(obj) {
      // Do something now that the event has occurred
      console.log("We have a new bid!");
      console.log("Order object: ", obj);
    });
  }

}

module.exports = ExchangeAggregator;

Poloniex.connection.open();
Poloniex.emitter.on("NEW_BID", data => {
  console.log("Bid from Poloniex: ");
  console.log(data);
})
