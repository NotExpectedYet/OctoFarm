const getEndpoints = require("express-list-endpoints");
module.exports.listAPI = (app) => {
  if (process.env.NODE_ENV === "development") {
    console.log(
      getEndpoints(app)
        .map((e) => e.path)
        .filter(
          (n) =>
            !n.includes("/settings") &&
            !n.includes("/printers") &&
            !n.includes("/filament") &&
            !n.includes("/history") &&
            !n.includes("/scripts")
        )
    );
  }
};
