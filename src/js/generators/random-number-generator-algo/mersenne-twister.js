// Mersenne Twister parameters
var MT = require('mersenne-twister');

async function mtDecimal() {
  var mt = new MT();
  return mt.random() * 3;
}

async function generate(){
    var randomNumber = await mtDecimal();
    return randomNumber;
}