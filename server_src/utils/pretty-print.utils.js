function prettyPrintArray(array) {
  if (!Array.isArray(array)) throw new Error("PrettyPrintArray | No Array Supplied");

  let arrayText = "";

  array.forEach((l) => {
    if (!arrayText.includes(l)) {
      arrayText += ` ${l}  \n`;
    }
  });

  return arrayText;
}

module.exports = { prettyPrintArray };
