'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
TODO: CREATE A CLASS THAT HAS THE REST/WS COMMON FUNCTIONS, COMMON
PROPERTIES, AND OVERRIDABLE GETMETHODS FOR MARKETS & ORDERBOOK
*/

require('babel-polyfill');
require('es6-promise').polyfill();
require('isomorphic-fetch');
var events = require('events');
var emitter = new events.EventEmitter();

var Exchange = function () {
  function Exchange() {
    _classCallCheck(this, Exchange);
  }

  _createClass(Exchange, [{
    key: 'emitOrderBook',
    value: function emitOrderBook(order) {
      order['exchange'] = this.exchangeName;
      if (order.type === 'ORDER_BOOK_INIT') {
        emitter.emit(order.type, order);
      } else {
        emitter.emit('ORDER_UPDATE', order);
      }
    }
  }, {
    key: 'get',
    value: function get(url) {
      return fetch(url).then(this.handleErrors).then(function (response) {
        return response.json();
      });
    }
  }, {
    key: 'handleErrors',
    value: function handleErrors(response) {
      if (!response.ok) {
        throw Error(response.statusText);
      }
      return response;
    }
  }]);

  return Exchange;
}();

module.exports = { Exchange: Exchange, emitter: emitter };