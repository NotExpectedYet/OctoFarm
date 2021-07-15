module.exports = {
  floatOrZero: (n) => (isNaN(n) || !n ? 0 : parseFloat(n))
};
