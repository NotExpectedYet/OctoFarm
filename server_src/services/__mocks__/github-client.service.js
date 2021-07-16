const { AppConstants } = require("../../app.constants");
const githubClientService = jest.createMockFromModule(
  "../github-client.service"
);

/**
 * Test version of: connection-safe acquire data about the installed and latest released OctoFarm versions.
 * @param includePrereleases
 * @returns {Promise<*|null>}
 */
async function getGithubReleasesPromise(includePrereleases = false) {
  if (process.env.test_airgapped) {
    return Promise.resolve(null);
  }
  return Promise.resolve([
    {
      tag_name:
        process.env.testlatest_package_version ||
        process.env[AppConstants.VERSION_KEY],
      draft: false,
      prerelease: false
    }
  ]);
}

githubClientService.getGithubReleasesPromise = getGithubReleasesPromise;
module.exports = githubClientService;
