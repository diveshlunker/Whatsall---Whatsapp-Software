// Blum Blum Shub parameters
var p = 499;
var q = 547;
var seed = 1234;
var n = p * q;

async function bbsDecimal() {
  seed = (seed * seed) % n;
  return (seed / n) * 3;
}


async function generate(){
    var randomNumber = await bbsDecimal();
    return randomNumber;
}
