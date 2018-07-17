'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/*
INHERITS FROM EXCHANGE, IMPLEMENTS EXCHANGE SPECIFIC CALLBACKS. PULLS IN CREDS
AND CONTIANS EXCHANGE SPECIFIC FORMATTERS
*/
var Moment = require('moment');
var WebSocket = require('ws');

var _require = require('./Exchange'),
    Exchange = _require.Exchange;

var Poloniex = function (_Exchange) {
  _inherits(Poloniex, _Exchange);

  function Poloniex() {
    _classCallCheck(this, Poloniex);

    var _this = _possibleConstructorReturn(this, (Poloniex.__proto__ || Object.getPrototypeOf(Poloniex)).call(this));

    _this.exchangeName = 'poloniex';
    return _this;
  }

  _createClass(Poloniex, [{
    key: 'parseOrder',
    value: function parseOrder(rawOrder) {
      var order = {};
      return order;
    }
  }, {
    key: 'initOrderBook',
    value: function initOrderBook() {
      var _this2 = this;

      console.log("Poloniex init order book");
      var wsuri = "wss://api2.poloniex.com:443";
      var socket = new WebSocket(wsuri);
      socket.onopen = function (session) {
        console.log('Opening connection');
        var params = { command: 'subscribe', channel: 'BTC_ETH' };
        socket.send(JSON.stringify(params));
      };

      socket.onerror = function (error) {
        console.log("Poloniex WS Error!");
        console.log("Error: ", error);
        // Might do a retry here... seems to get 521s often
      };

      socket.onmessage = function (msg) {
        if (msg && msg.data) {
          _this2.parseOrderDelta(msg.data);
        }
      };

      socket.onclose = function () {
        console.log("Websocket connection closed");
      };
    }
  }, {
    key: 'parseOrderDelta',
    value: function parseOrderDelta(orderDelta) {
      var _this3 = this;

      var data = JSON.parse(orderDelta);

      if (data && data[2] && data[2][0] && data[2][0][1] && data[2][0][1].hasOwnProperty('orderBook')) {
        // Initial Response:
        var initOrderBook = {
          type: 'ORDER_BOOK_INIT'
        };
        var stringBids = data[2][0][1].orderBook[1];
        var bidRates = Object.keys(stringBids).slice(0, 50);
        var bids = bidRates.reduce(function (aggregator, bid) {
          var order = {
            exchange: _this3.exchangeName,
            rate: parseFloat(bid),
            amount: parseFloat(stringBids[bid])
          };
          aggregator[_this3.exchangeName + bid] = order;
          return aggregator;
        }, {});

        var stringAsks = data[2][0][1].orderBook[0];
        var askRates = Object.keys(stringAsks).slice(0, 50);
        var asks = askRates.reduce(function (aggregator, ask) {
          var order = {
            exchange: _this3.exchangeName,
            rate: parseFloat(ask),
            amount: parseFloat(stringAsks[ask])
          };
          aggregator[_this3.exchangeName + ask] = order;
          return aggregator;
        }, {});

        // Take first 500 to match bittrex. Would be in config if more exchanges
        initOrderBook.asks = asks;
        initOrderBook.bids = bids;
        this.emitOrderBook(initOrderBook);
      }
      if (data && data[2]) {
        data[2].forEach(function (delta) {
          if (delta[0] === 'o') {
            if (delta[1]) {
              // 1 for Bid
              var bidChange = {
                type: 'BID_UPDATE',
                rateString: _this3.exchangeName + delta[2],
                rate: parseFloat(delta[2]),
                amount: parseFloat(delta[3])
              };
              _this3.emitOrderBook(bidChange);
            } else {
              // 0 for ask
              var askChange = {
                type: 'ASK_UPDATE',
                rateString: _this3.exchangeName + delta[2],
                rate: parseFloat(delta[2]),
                amount: parseFloat(delta[3])
              };
              _this3.emitOrderBook(askChange);
            }
          }
        });
      }
    }
  }]);

  return Poloniex;
}(Exchange);

module.exports = Poloniex;