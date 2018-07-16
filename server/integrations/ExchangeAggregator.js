/*
CLASS THAT INSTANTIATES MULTIPLE EXCHANGE OBJECTS AND CALLS THEIR
APIS CONCURRENTLY TO THEN RETURN THE VALUES IN A DICTIONARY SO FE
CAN DISPLAY COMBINED EXCHANGE INFORMATION
*/
// const Poloniex = require('./Poloniex');
const Bittrex = require('./Bittrex');

class ExchangeAggregator {

  constructor() {
    console.log("Exchange agg");
    const bittrex = new Bittrex();
    // Poloniex.connection.open();
  }

  sendWebSocket(msg) {
      console.log("What is socket msg ", msg);
  }

  // subscribeToOrderBook(callback) {
  //   console.log("Subscribing callback");
  //   var subscription = Poloniex.emitter.on('NEW_BID', callback);
  // }

  mergeOrderBooks(event) {

  }

}

module.exports = ExchangeAggregator;

