*Triangular arbitrage is a work in progress so master might not run as expected. To see functioning demo with simple arbitrage, checkout the demo tag: https://github.com/djrobinson/arb-watch/tree/demo*

# Arb Watch

*A realtime multi-exchange orderbook analysis tool for finding cross-exchange arbitrage opportunities*

Deployed here: https://fierce-ridge-49535.herokuapp.com/

### Setup

**Server Instructions**: Transpiles code to `server-build` folder and runs the app on `http://localhost:3001`.
```
cd arb-watch
npm i
npm run dev
```
**Client Instructions**: Built using `create-react-app`, runs on `http://localhost3000`. In a new terminal, run:
```
cd arb-watch/client
npm i
npm start
```

**Testing**: The main point of complexity in the app is the data normalization from the Websocket connections to the new local websocket. The integrations are tested in the `arb-watch/server/integrations/test` folder. Simply run:
```
npm test
```

### Adding a New Integration:

To add a new integration, you need to extend the `Exchange` class found in `arb-watch/server/base/Exchange` and implement a few common methods that all descendants of Exchange require. When that is complet, add the exchange to the `/arb-watch/server/exchanges.js` file to begin to see websocket events aggregated into a single orderbook w/ other active exchange events. Here is the basic layout of what a new exchange integration should look like:

```
const { Exchange } = require('../base/Exchange');

class NewIntegration extends Exchange {

  constructor() {
    this.exchangeName // lowercase exchange name
    this.wsuri  // websocket uri for exchange
    this.marketsUrl // Rest endpoint for basic markets data
  }

  // This takes the raw rest response from the exchange's market
  // info and formats it in the following format:
  // [{ market: BTC-LTC }, { market: BTC-DASH }...]

  parseMarkets(marketsResponseFromApi) {
    // ...Parse market here
    // normalizedMarketArray will look like: [{ market: BTC-LTC }, { market: BTC-DASH }...]
    returns normalizedMarketArray
  }

  // ExchangeAggregator will call this method for any exchange
  // included in its requested list and start a websocket connection
  // that broadcasts order info. Returns nothing, but passes received
  // socket info to parser which should emit ORDER_BOOK_INIT and ORDER_DELTA events (explained below)

  initOrderBook(market) {
    // ...Start websocket
    socket.on('myorderevent', (data) => {
      this.myOrderParser(data)
    })
  }

  // ExchangeAggregator uses this to stop websocket connections on page exit or error
  stopOrderBook() {
    // ...kill WS connections
  }

  // Finally needs to import events module to notify ExchangeAggregator of order book updates

  myOrderParser(data) {
    // ...Restructure ws event format to the corresponding event found below
    // Always call emitOrderBook found on parent Exchange class
    this.emitOrderBook(newEvent)
  }
}
```

**Event Types for Exchange.emitOrderBook**: Below are example events to be processed by the ExchangeAggregator and sent to the front end via socket.io. Any new exchange must match this event structure when passing params to `emitOrderBook` to be processed by the aggregator. Check out the unit tests to see examples of how they are processed:

```
  // Initial Orderbook state (might need to get this from REST on a few exchanges)
  {
    type: 'ORDER_BOOK_INIT',
    bids: {
      'bittrex0.0002': {
        rate: 0.0002,
        market: 'BTC-ETH',
        amount: 1000,
        exchange: 'bittrex'
      },
      'bittrex0.00015': {
        rate: 0.00015,
        amount: 1500,
        exchange: 'bittrex'
      },
      ...
    },
    asks: {
      'bittrex0.0003': {
        rate: 0.0003,
        market: 'BTC-ETH',
        amount: 1000,
        exchange: 'bittrex'
      },
      'bittrex0.00035': {
        rate: 0.00035,
        market: 'BTC-ETH',
        amount: 1200,
        exchange: 'bittrex'
      },
      ...
    }
  // New Bid Order. Prepend exchange name to rate for unique ID in combined orderbook
    {
      type: 'BID_UPDATE',
      rateString: '<exchangename>0.0002',
      rate: 0.0002,
      market: 'BTC-ETH',
      amount: 1000
    }

  // New Ask Order
    {
      type: 'ASK_UPDATE',
      rateString: '<exchangename>0.0003',
      rate: 0.0003,
      market: 'BTC-ETH',
      amount: 1000
    }
```
