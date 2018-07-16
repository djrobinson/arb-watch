/*
TODO: CREATE A CLASS THAT HAS THE REST/WS COMMON FUNCTIONS, COMMON
PROPERTIES, AND OVERRIDABLE GETMETHODS FOR MARKETS & ORDERBOOK
*/

require('babel-polyfill');
require('es6-promise').polyfill();
require('isomorphic-fetch');
const events = require('events');
const emitter = new events.EventEmitter;

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
      return Promise.resolve(markets);



    } catch (e) {
      console.log("is error from markets", e);
      return Promise.reject(e);
    }
  }

  emitOrderBook(order) {

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

module.exports = Exchange;