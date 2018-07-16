/*
CLASS THAT INSTANTIATES MULTIPLE EXCHANGE OBJECTS AND CALLS THEIR
APIS CONCURRENTLY TO THEN RETURN THE VALUES IN A DICTIONARY SO FE
CAN DISPLAY COMBINED EXCHANGE INFORMATION
*/
const { emitter } = require('./Exchange');
const availableExchanges = require('./availableExchanges.js');


class ExchangeAggregator {

  constructor(exchanges) {
    console.log("What are exchanges: ", exchanges);
    this.subscriptions = {};
    this.exchanges = [];
    this.mergedOrderBook = {
      asks: {},
      bids: {}
    };
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
    // emitter.on('ORDER_BOOK_INIT', this.mergeOrderBooks(event, callback))
    emitter.on('ORDER_UPDATE', callback)
  }

  mergeOrderBooks(event, callback) {
    console.log("Merging order books");

    callback(this.mergedOrderBook)
  }

}

module.exports = ExchangeAggregator;
