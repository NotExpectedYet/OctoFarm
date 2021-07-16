const semver = require("semver");

/**
 * OctoPrint's plugin manager has an deprecated API for semver >=1.6.0
 * @param semverString
 */
function checkPluginManagerAPIDeprecation(semverString) {
  return semver.satisfies(semver.coerce(semverString), ">=1.6.0");
}

module.exports = {
  checkPluginManagerAPIDeprecation
};
