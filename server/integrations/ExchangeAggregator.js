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
      asks: [],
      bids: []
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
    const boundCallback = callback.bind(this);
    this.exchanges.forEach(exchange => this.subscriptions[exchange].initOrderBook())
    emitter.on('ORDER_BOOK_INIT', (event) => { this.mergeOrderBooks(event, boundCallback) })
    emitter.on('ORDER_UPDATE', callback)
  }

  mergeOrderBooks(event, callback) {
    if (this.mergedOrderBook.bids.length > 0) {

      const allBids = this.mergedOrderBook.bids.concat(event.bids);
      console.log("We're merging the bids now", this.mergedOrderBook.bids);
      this.mergedOrderBook.bids = allBids.sort((a, b) => {
        return parseFloat(b.rate) - parseFloat(a.rate);
      });
    } else {
      this.mergedOrderBook.bids = event.bids;
    };

    if (this.mergedOrderBook.asks.length > 0) {
      const allAsks = this.mergedOrderBook.asks.concat(event.asks);
      this.mergedOrderBook.asks = allAsks.sort((a, b) => {
        return parseFloat(a.rate) - parseFloat(b.rate)
      });
    } else {
      this.mergedOrderBook.asks = event.asks;
    };
    console.log("Merging order books");
    const orderBookEvent = {
      type: 'ORDER_BOOK_INIT',
      orderBook: this.mergedOrderBook
    }

    callback(JSON.stringify(orderBookEvent));
  }

}

module.exports = ExchangeAggregator;
