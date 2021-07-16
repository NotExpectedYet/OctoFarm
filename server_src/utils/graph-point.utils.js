function sumValuesGroupByDate(input) {
  const dates = {};
  input.forEach((dv) => (dates[dv.x] = (dates[dv.x] || 0) + dv.y));
  return Object.keys(dates).map((date) => ({
    x: new Date(date),
    y: dates[date]
  }));
}

module.exports = {
  sumValuesGroupByDate
};
