# Arb Watch

*A realtime multiexchange orderbook analysis tool for finding cross-exchange arbitrage opportunities*

## Setup

**Server Instructions**: Transpiles code to `server-build` folder and runs the app on http://localhost:3001.
```
cd arb-watch
npm i
npm run dev
```
**Client Instructions**: Built using `create-react-app`, runs on http://localhost3001. In a new terminal, run:
```
cd arb-watch/client
npm i
npm start
```

**Testing**: The main point of complexity in the app is the data normalization from the Websocket connections to the new local websocket. The integrations are tested in the `arb-watch/server/integrations/test` folder. Simply run:
```
npm test
```

## Adding a New Integration:

To add a new integration, you need to extend the `Exchange` class found in `arb-watch/server/base/Exchange` and implement a few common methods that all descendants of Exchange require:

```
const { Exchange } = require('../base/Exchange');

class NewIntegration extends Exchange {
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

**Event Types for Exchange.emitOrderBook**: Below is the required structure of events to be processed by the ExchangeAggregator and sent to the front end via socket.io. Check out the unit tests to see examples of how they are processed:
```
  // Initial Orderbook state (might need to get this from REST on a few exchanges)
  {
    type: 'ORDER_BOOK_INIT',
    bids: {
      'bittrex0.0002': {
        rate: 0.0002,
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
        amount: 1000,
        exchange: 'bittrex'
      },
      'bittrex0.00035': {
        rate: 0.00035,
        amount: 1200,
        exchange: 'bittrex'
      },
      ...
    }
  // New Bid Order. Prepend exchange to rate for unique ID in combined orderbook
    {
      type: 'BID_UPDATE',
      rateString: '<exchangename>0.0002',
      rate: 0.0002,
      amount: 1000
    }
  
  // New Ask Order
    {
      type: 'ASK_UPDATE',
      rateString: 'bittrex0.0003',
      rate: 0.0003,
      amount: 1000
    }
```

