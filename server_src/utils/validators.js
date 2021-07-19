const nodeInputValidator = require("node-input-validator");
const { Validator } = require("node-input-validator");

const arrayValidator = function arrayLengthValidator(minIncl = null, maxIncl = null) {
  return (arrayValue) => {
    let isMinLength = true;
    let isMaxLength = true;
    if (!!minIncl) {
      isMinLength = arrayValue.length >= minIncl;
    }
    if (!!maxIncl) {
      isMaxLength = arrayValue.length <= maxIncl;
    }
    return isMinLength && isMaxLength;
  };
};

function validateMongoURL(mongoURL) {
  const mongoString = mongoURL.toLowerCase();
  const hasMongoPrefix =
    mongoString.toLowerCase().includes("mongodb://") ||
    mongoString.toLowerCase().includes("mongodb+srv://");
  const hasOctoFarmTable = mongoString.includes("/octofarm");

  return {
    hasMongoPrefix,
    hasOctoFarmTable,
    isValid: hasOctoFarmTable || hasMongoPrefix
  };
}

async function validateInput(data, rules) {
  nodeInputValidator.extend("wsurl", ({ value, args }, validator) => {
    const url = new URL(value).href;
    return url.includes("ws://") || url.includes("wss://");
  });

  const v = new nodeInputValidator.Validator(data, rules);

  const matched = await v.check();
  if (!matched) {
    throw v.errors;
  }
}

/**
 * Handle API input validation
 * @param req
 * @param rules
 * @param res
 * @returns {Promise<boolean|any>}
 */
async function handleInputValidation(req, rules, res) {
  const v = new Validator(req.body, rules);
  const matched = await v.check();
  if (!matched) {
    res.status(422).send(v.errors);
    return false;
  } else {
    return v.inputs;
  }
}

module.exports = {
  arrayValidator,
  handleInputValidation,
  validateInput,
  validateMongoURL
};
