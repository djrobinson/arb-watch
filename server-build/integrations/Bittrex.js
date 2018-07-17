'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/*
INHERITS FROM EXCHANGE, IMPLEMENTS EXCHANGE SPECIFIC CALLBACKS. PULLS IN CREDS
AND CONTIANS EXCHANGE SPECIFIC FORMATTERS
*/
var signalR = require('signalr-client');
var jsonic = require('jsonic');
var zlib = require('zlib');
var events = require('events');

var _require = require('./Exchange'),
    Exchange = _require.Exchange;

var Bittrex = function (_Exchange) {
  _inherits(Bittrex, _Exchange);

  function Bittrex() {
    _classCallCheck(this, Bittrex);

    var _this = _possibleConstructorReturn(this, (Bittrex.__proto__ || Object.getPrototypeOf(Bittrex)).call(this));

    _this.exchangeName = 'bittrex';
    // Temp hardcode for testing
    var market = 'BTC-ETH';
    _this.market = market;
    _this.emitter = new events.EventEmitter();
    _this.client;
    console.log('Instantiating Bittrex exchange!');
    return _this;
  }

  _createClass(Bittrex, [{
    key: 'initOrderBook',
    value: function initOrderBook() {
      console.log("Bittrex init order book");
      this.client = new signalR.client('wss://beta.bittrex.com/signalr', ['c2']);

      var market = 'BTC-ETH';

      var self = this;
      var boundParser = this.parseOrderDelta.bind(this);
      var boundInitExchangeDelta = this.initExchangeDelta.bind(this);

      self.client.serviceHandlers.connected = function (connection) {
        console.log('connected');
        self.client.call('c2', 'QueryExchangeState', market).done(function (err, result) {
          if (err) {
            return console.log(err);
          }
          if (result === true) {
            console.log('Subscribed to ' + market);
          }
        });
      };

      self.client.serviceHandlers.connectFailed = function (err) {
        console.log("Bittrex WS Error");
        console.log("Error: ", err);
      };

      self.client.serviceHandlers.onerror = function (err) {
        console.log("Bittrex WS Error");
        console.log("Error: ", err);
      };

      self.client.serviceHandlers.messageReceived = function (message) {
        var data = jsonic(message.utf8Data);
        var json = void 0;

        if (data.hasOwnProperty('R')) {
          var b64 = data.R;

          var raw = new Buffer.from(b64, 'base64');
          zlib.inflateRaw(raw, function (err, inflated) {
            if (!err) {
              var _json = JSON.parse(inflated.toString('utf8'));
              boundParser('ORDER_BOOK_INIT', _json);
              // Start only after order book inits
              boundInitExchangeDelta();
            }
          });
        }
      };
    }
  }, {
    key: 'initExchangeDelta',
    value: function initExchangeDelta() {
      console.log("Bittrex init order book");

      var market = 'BTC-ETH';

      var self = this;
      var boundParser = this.parseOrderDelta.bind(this);

      self.client.call('c2', 'SubscribeToExchangeDeltas', market).done(function (err, result) {
        if (err) {
          return console.log(err);
        }
        if (result === true) {
          console.log('Subscribed to ' + market);
        }
      });

      self.client.serviceHandlers.messageReceived = function (message) {
        var data = jsonic(message.utf8Data);
        var json = void 0;
        if (data.hasOwnProperty('M')) {
          if (data.M[0]) {
            if (data.M[0].hasOwnProperty('A')) {
              if (data.M[0].A[0]) {
                /**
                 *  handling the GZip and base64 compression
                 *  https://github.com/Bittrex/beta#response-handling
                 */
                var b64 = data.M[0].A[0];
                var raw = new Buffer.from(b64, 'base64');

                zlib.inflateRaw(raw, function (err, inflated) {
                  if (!err) {
                    json = JSON.parse(inflated.toString('utf8'));
                    boundParser('ORDER_DELTA', json);
                  }
                });
              }
            }
          }
        }
      };
    }
  }, {
    key: 'parseOrderDelta',
    value: function parseOrderDelta(type, orderDelta) {
      var _this2 = this;

      if (type === 'ORDER_BOOK_INIT' && orderDelta['Z'] && orderDelta['S']) {
        var sortedBids = orderDelta['Z'].sort(function (a, b) {
          return b.R - a.R;
        }).slice(0, 50);
        var sortedAsks = orderDelta['S'].sort(function (a, b) {
          return a.R - b.R;
        }).slice(0, 50);
        var bids = sortedBids.reduce(function (aggregator, bid) {
          var order = {
            exchange: _this2.exchangeName,
            rate: bid.R,
            amount: parseFloat(bid.Q)
          };
          aggregator[_this2.exchangeName + bid.R.toString()] = order;
          return aggregator;
        }, {});
        var asks = sortedAsks.reduce(function (aggregator, ask) {
          var order = {
            exchange: _this2.exchangeName,
            rate: ask.R,
            amount: parseFloat(ask.Q)
          };
          aggregator[_this2.exchangeName + ask.R.toString()] = order;
          return aggregator;
        }, {});
        var initOrderBook = {
          type: type,
          bids: bids,
          asks: asks
        };
        this.emitOrderBook(initOrderBook);
      }
      if (type === 'ORDER_DELTA' && orderDelta['Z'] && orderDelta['S']) {
        orderDelta['Z'].forEach(function (change) {
          var orderDelta = {
            type: 'BID_UPDATE',
            rateString: _this2.exchangeName + change.R.toString(),
            rate: change.R,
            amount: parseFloat(change.Q)
          };
          _this2.emitOrderBook(orderDelta);
        });
        orderDelta['S'].forEach(function (change) {
          var orderDelta = {
            type: 'ASK_UPDATE',
            rateString: _this2.exchangeName + change.R.toString(),
            rate: change.R,
            amount: parseFloat(change.Q)
          };
          _this2.emitOrderBook(orderDelta);
        });
      }
    }
  }]);

  return Bittrex;
}(Exchange);

module.exports = Bittrex;