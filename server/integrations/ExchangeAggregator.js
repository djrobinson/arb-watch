/*
CLASS THAT INSTANTIATES MULTIPLE EXCHANGE OBJECTS AND CALLS THEIR
APIS CONCURRENTLY TO THEN RETURN THE VALUES IN A DICTIONARY SO FE
CAN DISPLAY COMBINED EXCHANGE INFORMATION
*/
const Exchange = require('./Exchange');

const availableExchanges = require('./availableExchanges.js');


class ExchangeAggregator {

  constructor(exchanges) {
    console.log("What are exchanges: ", exchanges);
    this.subscriptions = {};
    this.exchanges = [];
    if (exchanges.length) {
      exchanges.forEach(exchangeName => {
        this.exchanges.push(exchangeName);
        const instantiatedExchange = new availableExchanges[exchangeName]();
        this.subscriptions[exchangeName] = instantiatedExchange;
      })
    }
    console.log("Exchange agg");
  }

  sendWebSocket(msg) {
      console.log("What is socket msg ", msg);
  }

  subscribeToOrderBooks(callback) {
    console.log("Subscribing callback");
    this.exchanges.forEach(exchange => this.subscriptions[exchange].initOrderBook())
    // var subscription = Poloniex.emitter.on('NEW_BID', callback);
  }

  mergeOrderBooks(event) {

  }

}

module.exports = ExchangeAggregator;

