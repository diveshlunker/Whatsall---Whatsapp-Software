// CSPRNG parameters
var crypto = require('crypto');

async function csprngDecimal() {
  return (crypto.randomBytes(4).readUInt32LE(0) / 4294967296) * 3;
}

async function generate(){
    var randomNumber = await csprngDecimal();
    return randomNumber;
}