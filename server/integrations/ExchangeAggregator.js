/*
CLASS THAT INSTANTIATES MULTIPLE EXCHANGE OBJECTS AND CALLS THEIR
APIS CONCURRENTLY TO THEN RETURN THE VALUES IN A DICTIONARY SO FE
CAN DISPLAY COMBINED EXCHANGE INFORMATION
*/
const Poloniex = require('./Poloniex');

class ExchangeAggregator {

  constructor() {
    console.log("Exchange agg");
    Poloniex.connection.open();
    // Poloniex.emitter.on("NEW_BID", data => {
    //   console.log("Bid from Poloniex: ");
    //   console.log(data);
    // })
  }

  sendWebSocket(msg) {
      console.log("What is socket msg ", msg);
  }

  subscribe(callback) {
    console.log("Subscribing callback");
    var subscription = Poloniex.emitter.on('NEW_BID', callback);
  }

}

module.exports = ExchangeAggregator;

// Poloniex.connection.open();
// Poloniex.emitter.on("NEW_BID", data => {
//   console.log("Bid from Poloniex: ");
//   console.log(data);
// })
