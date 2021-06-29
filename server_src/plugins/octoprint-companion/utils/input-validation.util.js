const { Validator } = require("node-input-validator");

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
  handleInputValidation
};
