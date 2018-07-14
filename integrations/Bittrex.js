/*
INHERITS FROM EXCHANGE, IMPLEMENTS EXCHANGE SPECIFIC CALLBACKS. PULLS IN CREDS
AND CONTIANS EXCHANGE SPECIFIC FORMATTERS
*/

class Bittrex {
  constructor() {
    console.log('Instantiating Bittrex exchange!');
  }
}

module.exports = Bittrex;