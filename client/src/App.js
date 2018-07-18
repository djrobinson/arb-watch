import React, { Component } from 'react';
import { Col, Row } from 'react-bootstrap';
import OrderBook from './OrderBook';
import './App.css';

class App extends Component {
  state = {
    markets: [],
    showOrderBook: false,
    selectedMarket: ''
  }

  componentDidMount() {
    fetch('/api/getMarkets')
      .then(res => res.json())
      .then(data => {
        console.log("Markets data: ", data);
        this.setState({ markets: data })
      });
  }

  selectMarket(mkt) {

  }

  render() {
    return (
      <div className="App">
        <Row className="header-row">
          <div className="header">
            <h1>Arbitrage Watch</h1>
          </div>
        </Row>
        <Row>
          <Col md={4} className="coin-tiles">
            {
              this.state.markets.map((market, i) => {
                return (
                  <Col md={4} className="coin-tile" key={i} >
                    <h5>{market.market}</h5>
                    <img src={market.logo ? market.logo : ''} alt="" height="75px" width="75px" />
                  </Col>
                );
              })
            }
          </Col>
          <Col md={8}>

          </Col>
        </Row>
      </div>
    );
  }
}

export default App;