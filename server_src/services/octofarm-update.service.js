const Logger = require("../handlers/logger.js");

const logger = new Logger("OctoFarm-SoftwareUpdateChecker");

class OctofarmUpdateService {
  #lastSuccessfulReleaseCheckMoment = null;
  #latestReleaseKnown = null;
  #lastReleaseCheckFailed = null;
  #lastReleaseCheckError = null;
  #airGapped = null;
  #loadedWithPrereleases = null;
  #installedReleaseFound = null;
  #notificationReady = false;

  // Resolved
  #serverVersion;
  #githubClientService;

  constructor({ serverVersion, githubClientService }) {
    this.#serverVersion = serverVersion;
    this.#githubClientService = githubClientService;
  }

  static findGithubRelease(releases, prerelease = false, tag_name = null) {
    return releases.find(
      (r) =>
        r.draft === false &&
        (tag_name ? r.tag_name === tag_name : true) &&
        (r.prerelease === false || prerelease)
    );
  }

  /**
   * Connection-safe acquire data about the installed and latest released OctoFarm versions.
   * @param includePre
   * @returns {Promise<*|null>}
   */
  async syncLatestOctoFarmRelease(includePre = false) {
    await this.#githubClientService
      .getGithubReleasesPromise()
      .then((githubReleases) => {
        this.#airGapped = !githubReleases;
        if (!githubReleases) {
          return Promise.resolve(null);
        } else {
          if (!!githubReleases && githubReleases.length > 0) {
            const latestRelease = OctofarmUpdateService.findGithubRelease(
              githubReleases,
              includePre
            );
            // Whether the package version exists at all - developer at work if not!
            this.#installedReleaseFound = !!OctofarmUpdateService.findGithubRelease(
              githubReleases,
              includePre,
              this.#serverVersion
            );
            if (!!latestRelease && !!latestRelease.tag_name) {
              delete latestRelease.body;
              delete latestRelease.author;
              this.#loadedWithPrereleases = includePre;
              this.#lastSuccessfulReleaseCheckMoment = new Date();
              this.#lastReleaseCheckFailed = false;
              this.#latestReleaseKnown = latestRelease;
              this.#notificationReady =
                latestRelease.tag_name !== this.#serverVersion && !!this.#installedReleaseFound;
            } else if (!latestRelease.tag_name) {
              // Falsy tag_name is very unlikely - probably tests only
              this.#lastReleaseCheckFailed = false;
              this.#notificationReady = false;
            } else {
              console.log("Latest release check failed because latestRelease not set");
              this.#lastReleaseCheckFailed = true;
            }
          } else {
            console.log("Latest release check failed because releases from gitty empty");
            this.#lastReleaseCheckFailed = true;
          }
        }
      })
      .catch((e) => {
        logger.error(e);
        this.#lastReleaseCheckError = e;
        this.#lastReleaseCheckFailed = true;
      });
  }

  /**
   * Get state of this runner
   * @returns {{airGapped: null, lastReleaseCheckFailed: null, loadedWithPrereleases: null, lastSuccessfulReleaseCheckMoment: null, latestReleaseKnown: null}}
   */
  getLastReleaseSyncState() {
    return {
      latestReleaseKnown: this.#latestReleaseKnown,
      lastSuccessfulReleaseCheckMoment: this.#lastSuccessfulReleaseCheckMoment,
      lastReleaseCheckFailed: this.#lastReleaseCheckFailed,
      loadedWithPrereleases: this.#loadedWithPrereleases,
      airGapped: this.#airGapped,
      ...(this.#lastReleaseCheckFailed && { lastReleaseCheckError: this.#lastReleaseCheckError })
    };
  }

  getAirGapped() {
    return this.#airGapped;
  }

  /**
   * Returns a notification message ready to be alerted on frontend, but does not fail without such information.
   * @returns {boolean}
   */
  getUpdateNotificationIfAny() {
    if (this.#notificationReady === true && airGapped !== true) {
      const latestReleaseCheckState = this.getLastReleaseSyncState();
      return {
        update_available: true,
        installed_release_found: this.#installedReleaseFound,
        message:
          "You can update OctoFarm to the latest version available: " +
          latestReleaseCheckState.latestReleaseKnown.tag_name,
        current_version: this.#serverVersion,
        ...latestReleaseCheckState
      };
    } else {
      return {
        update_available: false,
        installed_release_found: this.#installedReleaseFound,
        air_gapped: this.#airGapped,
        current_version: this.#serverVersion
      };
    }
  }

  /**
   * Logs whether a firmware update is ready
   */
  checkReleaseAndLogUpdate() {
    if (!!this.#lastReleaseCheckFailed) {
      logger.error(
        "Cant check release as it was not fetched yet or the last fetch failed. Call and await 'syncLatestOctoFarmRelease' first."
      );
      return;
    }
    const latestRelease = this.getLastReleaseSyncState().latestReleaseKnown;
    if (!latestRelease || !latestRelease.tag_name) {
      // Tests only, silence it
      return;
    }

    const packageVersion = this.#serverVersion;

    const latestReleaseTag = latestRelease.tag_name;
    if (!this.#installedReleaseFound) {
      logger.info(
        `\x1b[36mAre you a god? A new release ey? Bloody terrific mate!\x1b[0m
    Here's github's latest released: \x1b[32m${latestReleaseTag}\x1b[0m
    Here's your release tag: \x1b[32m${packageVersion}\x1b[0m
    Appreciate the hard work, you rock!`
      );
      return;
    }

    if (!!packageVersion && packageVersion !== latestReleaseTag) {
      if (!!this.#airGapped) {
        logger.warning(
          `Installed release: ${packageVersion}. Skipping update check (air-gapped/disconnected from internet)`
        );
      } else {
        logger.info(
          `Update available! New version: ${latestReleaseTag} (prerelease: ${latestRelease.prerelease})`
        );
      }
    } else if (!packageVersion) {
      return logger.error(
        "Cant check release as package.json version environment variable is not set. Make sure OctoFarm is run from a 'package.json' or NPM context."
      );
    } else {
      return logger.debug(`Installed release: ${packageVersion}. You are up to date!`);
    }
  }
}

module.exports = OctofarmUpdateService;
