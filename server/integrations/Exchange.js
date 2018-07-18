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

  emitOrderBook(order) {
      order['exchange'] = this.exchangeName;
      if (order.type === 'ORDER_BOOK_INIT') {
        emitter.emit(order.type, order);
      } else {
        emitter.emit('ORDER_UPDATE', order);
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

module.exports = { Exchange, emitter };