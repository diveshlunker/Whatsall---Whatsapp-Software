// Park-Miller algorithm parameters
var m = 2147483647;
var a = 16807;
var seed = 1234;

async function parkMillerDecimal() {
  seed = (a * seed) % m;
  return (seed / m) * 3;
}


async function generate(){
    randomNumber = await parkMillerDecimal();
    return randomNumber;
}

