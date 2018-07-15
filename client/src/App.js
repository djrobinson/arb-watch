import React, { Component } from 'react';
import './App.css';

class App extends Component {
  state = {markets: []}

  componentDidMount() {
    fetch('/api/getMarkets/bittrex')
      .then(res => res.json())
      .then(data => {
        console.log("howdy! ", data);
        this.setState({ markets: data.result })
      });

    console.log("This data: ", this.state);
  }

  render() {
    return (
      <div className="App">
        <h1>Markets</h1>
        {
          this.state.markets.map((market) => <ul><img src={market.LogoUrl} height="25px" width="25px" />{market.MarketCurrency}/{market.BaseCurrency}</ul>)
        }


      </div>
    );
  }
}

export default App;