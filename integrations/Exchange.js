/*
TODO: CREATE A CLASS THAT HAS THE REST/WS COMMON FUNCTIONS, COMMON
PROPERTIES, AND OVERRIDABLE GETMETHODS FOR MARKETS & ORDERBOOK
*/


// const availableExchanges = require('./availableExchanges.js');
const Bittrex = require('./Bittrex');
class Exchange {
  constructor(exchangeName) {
    console.log("Trying to start exchange");
    this.exchangeName = exchangeName;
    this.markets = [];
    this.orderBooks = [];
    this.getMarkets();
    this.apiURlBase = '';
    this.restEndpoints = {
      getMarkets: ''
    }

    // const bittrex = new Bittrex();

  }

  getMarkets() {
    const url = this.build
    const requestObject = this.buildRequestObject;
    // const markets = await this.callApi(requestObject);
  }

  async callApi(requestObject) {

  }




  /*
    IMPLEMENTED IN CHILD:
    getMarkets();
    getOrderBooks();
    getOrderBook(); (Specific market)
  */
}

class Market {
  constructor(currencyPair) {
    this.currencyPair = currencyPair;
    this.tradeVolume = 0;
    this.exchangeRate = 0;
    this.lowestAsk = 0;
    this.highestBid = 0;
    this.orderBook = {};
  }
}

class OrderBook {
  constructor() {
    this.bids = [];
    this.asks = [];
  }
}

module.exports = Exchange;