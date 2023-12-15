// Middle-square method parameters
var seed = 1234;

async function middleSquareDecimal() {
  seed = Math.pow(seed, 2);
  seed = ("0000" + seed).substr(-8, 4);
  return (seed / 10000) * 3;
}

// generate 10 random decimal numbers between 0 and 3
async function generate(){
    randomNumber = await middleSquareDecimal();
    return randomNumber;
}
