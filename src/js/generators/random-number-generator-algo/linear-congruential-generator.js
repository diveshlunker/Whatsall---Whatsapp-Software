// LCG parameters
var m = 2147483648;
var a = 1103515245;
var c = 12345;

var seed = 1234;

async function lcgDecimal() {
  seed = (a * seed + c) % m;
  return (seed / m) * 3;
}

async function generate(){
    var randomNumber = await lcgDecimal();
    return randomNumber;
}