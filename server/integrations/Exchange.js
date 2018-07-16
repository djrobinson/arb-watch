/*
TODO: CREATE A CLASS THAT HAS THE REST/WS COMMON FUNCTIONS, COMMON
PROPERTIES, AND OVERRIDABLE GETMETHODS FOR MARKETS & ORDERBOOK
*/

require('babel-polyfill');
require('es6-promise').polyfill();
require('isomorphic-fetch');
const events = require('events');
const emitter = new events.EventEmitter;

class Exchange {
  constructor(exchangeName) {
    console.log("Trying to start exchange");
    this.exchangeName = exchangeName;
    this.apiURlBase = '';
    this.restEndpoints = {
      getMarkets: ''
    }
  }

  async getMarkets() {
    try {
      var markets = await this.get('https://bittrex.com/api/v1.1/public/getmarkets');
      return Promise.resolve(markets);
    } catch (e) {
      return Promise.reject(e);
    }
  }

  emitOrderBook(order) {
      console.log("We're emitting the order", order);
      emitter.emit('ORDER_UPDATE', JSON.stringify(order));
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

module.exports = { Exchange, emitter };