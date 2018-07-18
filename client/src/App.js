import React, { Component } from 'react';
import { Col, Row } from 'react-bootstrap';
import openSocket from 'socket.io-client';
import './App.css';

class App extends Component {
  state = {
    markets: [],
    bids: {},
    asks: {}
  }

  componentDidMount() {
    fetch('/api/getMarkets')
      .then(res => res.json())
      .then(data => {
        console.log("Markets data: ", data);
        this.setState({ markets: data })
      });

    // const socket = openSocket('http://localhost:3001');
    // // Bring this link out
    // // const socket = openSocket('https://fierce-ridge-49535.herokuapp.com');

    // socket.emit('startMarket', { market: 'BTC-ZEC'});

    // socket.on('test', (message) => {
    //   let data = JSON.parse(message);
    //   if (data.type === 'ORDER_BOOK_INIT') {
    //     this.setState({
    //       bids: data.orderBook.bids,
    //       asks: data.orderBook.asks
    //     })
    //   }
    // });
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

            { (Object.keys(this.state.bids).length) &&
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
              (Object.keys(this.state.asks).length) &&
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
          this.state.markets.map((market, i) => <ul key={i} ><img src={market.logo} height="25px" width="25px" />{market.market}</ul>)
        }

      </div>
    );
  }
}

export default App;