/*
TODO: CREATE A CLASS THAT HAS THE REST/WS COMMON FUNCTIONS, COMMON
PROPERTIES, AND OVERRIDABLE GETMETHODS FOR MARKETS & ORDERBOOK
*/

require("babel-polyfill");
require('es6-promise').polyfill();
require('isomorphic-fetch');

const availableExchanges = require('./availableExchanges.js');

class Exchange {
  constructor(exchangeName) {
    console.log("Trying to start exchange");
    this.exchangeName = exchangeName;
    this.apiURlBase = '';
    this.restEndpoints = {
      getMarkets: ''
    }
    const exchange = new availableExchanges[exchangeName]();
  }

  async getMarkets() {
    try {
      var markets = await this.get('https://bittrex.com/api/v1.1/public/getmarkets');
      console.log("Markets came back: ");
      // retruns like syncronous code!
      return Promise.resolve(markets);



    } catch (e) {
      console.log("is error from markets", e);
      return Promise.reject(e);
      // promise was rejected, handle errors with try/catch!
    }
  }


  get(url){
    return fetch(url)
      .then(this.handleErrors)
      .then(response => response.json())
  }

  handleErrors(response) {
    if (!response.ok) {
      throw Error(response.statusText);
    }
    return response;
  }
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