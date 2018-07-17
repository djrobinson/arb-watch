import React, { Component } from 'react';
import { Col, Row } from 'react-bootstrap';
import './App.css';

class App extends Component {
  state = {
    markets: [],
    bids: {},
    asks: {}
  }

  componentDidMount() {
    fetch('/api/getMarkets/bittrex')
      .then(res => res.json())
      .then(data => {
        this.setState({ markets: data.result })
      });

    const socket = new WebSocket('ws://localhost:3001/api/echo');

    console.log("What is socket: ", socket);

    socket.onopen = (event) => {
      console.log("Socket has opened");
    };

    socket.onmessage = (message) => {
        let data = JSON.parse(message.data);
        if (data.type === 'ORDER_BOOK_INIT') {

          this.setState({
            bids: data.orderBook.bids,
            asks: data.orderBook.asks
          })
        }
        if (data.type === 'ASK_UPDATE' || data.type === 'BID_UPDATE') {
          this.updateOrderBook(data);
        }
    };

  }


  updateOrderBook(event) {
    if (event.type === 'BID_UPDATE') {
      const book = this.state.bids;
      if (!event.amount) {
        if (book[event.rateString]) {
          delete book[event.rateString];
        }
        this.setState({ bids: book })
      } else {
        let order = {
          exchange: event.exchange,
          rate: event.rate,
          amount: event.amount
        };
        book[event.rateString] = order;
        this.setState({ bids: book })

      }
    }
    if (event.type === 'ASK_UPDATE') {
      const book = this.state.asks;
      if (!event.amount) {
        if (book[event.rateString]) {
          delete book[event.rateString];
        }
        this.setState({ asks: book })
      } else {
        let order = {
          exchange: event.exchange,
          rate: event.rate,
          amount: event.amount
        };
        book[event.rateString] = order;
        this.setState({ asks: book })

      }
    }


  }


  render() {
    return (
      <div className="App">
        <h1>Markets</h1>
        <Row>
          <Col md={6}>
            <h2>Bids</h2>

            {
              Object.keys(this.state.bids).map((bid, i) => {
                return (
                  <div key={i}>
                    <Col md={4}>{this.state.bids[bid].exchange}</Col>
                    <Col md={4}>{this.state.bids[bid].rate}</Col>
                    <Col md={4}>Size: {this.state.bids[bid].amount}</Col>
                  </div>

                );
              })
            }
          </Col>
          <Col md={6}>
            <h2>Asks</h2>
            {
              Object.keys(this.state.asks).map((ask, i) => {
                return (
                  <div key={i}>
                    <Col md={4}>{this.state.asks[ask].exchange}</Col>
                    <Col md={4}>{this.state.asks[ask].rate}</Col>
                    <Col md={4}>Size: {this.state.asks[ask].amount}</Col>
                  </div>
                );
              })
            }
          </Col>
        </Row>
        {
          this.state.markets.map((market, i) => <ul key={i} ><img src={market.LogoUrl} height="25px" width="25px" />{market.MarketCurrency}/{market.BaseCurrency}</ul>)
        }

      </div>
    );
  }
}

export default App;