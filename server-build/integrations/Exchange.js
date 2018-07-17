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

    console.log("Trying to start exchange");
    this.exchangeName = '';
    this.apiURlBase = '';
    this.restEndpoints = {
      getMarkets: ''
    };
  }

  _createClass(Exchange, [{
    key: 'getMarkets',
    value: function getMarkets() {
      var markets;
      return regeneratorRuntime.async(function getMarkets$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              _context.next = 3;
              return regeneratorRuntime.awrap(this.get('https://bittrex.com/api/v1.1/public/getmarkets'));

            case 3:
              markets = _context.sent;
              return _context.abrupt('return', Promise.resolve(markets));

            case 7:
              _context.prev = 7;
              _context.t0 = _context['catch'](0);
              return _context.abrupt('return', Promise.reject(_context.t0));

            case 10:
            case 'end':
              return _context.stop();
          }
        }
      }, null, this, [[0, 7]]);
    }
  }, {
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