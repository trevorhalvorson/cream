import React, { Component } from "react";
import io from "socket.io-client";

import { CCC } from "../../ccc-streamer-utilities.js";

import './App.css';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      BTC: 0,
      ETH: 0,
      LTC: 0,
    };
    this.dataUnpack = this.dataUnpack.bind(this);
    this.displayData = this.displayData.bind(this);
  }

  componentWillMount() {
    const socket = io("https://streamer.cryptocompare.com/");

    const subscription = [
      "5~CCCAGG~BTC~USD",
      "5~CCCAGG~ETH~USD",
      "5~CCCAGG~LTC~USD",
    ];
    socket.emit("SubAdd", { subs: subscription });

    socket.on("m", message => {
      const messageType = message.substring(0, message.indexOf("~"));
      if (messageType === CCC.STATIC.TYPE.CURRENTAGG) {
        const res = CCC.CURRENT.unpack(message);
        this.dataUnpack(res);
      }
    });
  }

  dataUnpack = function(data) {
    const fromCurr = data["FROMSYMBOL"];
    const to = data["TOSYMBOL"];
    const fsym = CCC.STATIC.CURRENCY.getSymbol(fromCurr);
    const tsym = CCC.STATIC.CURRENCY.getSymbol(to);
    const pair = fromCurr + to;
    let currentPrice = {};

    if (!currentPrice.hasOwnProperty(pair)) {
      currentPrice[pair] = {};
    }

    for (let key in data) {
      currentPrice[pair][key] = data[key];
    }

    if (currentPrice[pair]["LASTTRADEID"]) {
      currentPrice[pair]["LASTTRADEID"] = parseInt(
        currentPrice[pair]["LASTTRADEID"],
        10
      ).toFixed(0);
    }
    currentPrice[pair]["CHANGE24HOUR"] = CCC.convertValueToDisplay(
      tsym,
      currentPrice[pair]["PRICE"] - currentPrice[pair]["OPEN24HOUR"]
    );
    currentPrice[pair]["CHANGE24HOURPCT"] =
      (
        (currentPrice[pair]["PRICE"] - currentPrice[pair]["OPEN24HOUR"]) /
        currentPrice[pair]["OPEN24HOUR"] *
        100
      ).toFixed(2) + "%";
    this.displayData(currentPrice[pair], fromCurr, tsym, fsym);
  };

  displayData = function(current, fromCurr, tsym, fsym) {
    const price = current.PRICE;
    if (price) {
      const fPrice = parseFloat(Math.round(price * 100) / 100).toFixed(2);
      this.setState({ [fromCurr]: fPrice });
    }
  };

  render() {
    return (
      <div className="App">
        <div className="btc container">
          <p className="price">${this.state.BTC}</p>
        </div>
        <div className="eth container">
          <p className="price">${this.state.ETH}</p>
        </div>
        <div className="ltc container">
          <p className="price">${this.state.LTC}</p>
        </div>
      </div>
    );
  }
}

export default App;
