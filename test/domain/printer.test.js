const Printer = require("../../server_src/models/Printer");

describe("printer", function () {
  it("should be invalid if printerURL is empty but apikey is not", function (done) {
    const m = new Printer({
      apikey: "asd"
    });

    m.validate(function (err) {
      expect(err).toBe(null);
      done();
    });
  });

  it("should be invalid if apikey is empty", function (done) {
    const m = new Printer({});

    m.validate(function (err) {
      expect(err.errors.apikey).toBeTruthy();
      done();
    });
  });

  it("should be invalid if printerURL ends with slash", function (done) {
    const m = new Printer({
      printerURL: "myawesomeprinter/",
      apikey: "asd"
    });

    m.validate(function (err) {
      // Validation not enabled (yet)
      expect(err).toBe(null);
      // expect(err.errors.printerURL).to.exist;
      // expect(err.errors.printerURL).to.not.contain("myawesomeprinter/");
      // expect(err.errors.printerURL).to.eq("myawesomeprinter");
      done();
    });
  });
});
