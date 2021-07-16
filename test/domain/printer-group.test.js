const PrinterGroup = require("../../server_src/models/PrinterGroup");

describe("printer group", function () {
  it("should be invalid if name is empty", function (done) {
    const m = new PrinterGroup();

    m.validate(function (err) {
      expect(err.errors.name).toBeTruthy();
      done();
    });
  });

  it("should be valid if printers array is empty", function (done) {
    const m = new PrinterGroup({
      name: "TestPrinterGroup"
    });

    m.validate(function (err) {
      expect(err).toBe(null);
      done();
    });
  });
});
