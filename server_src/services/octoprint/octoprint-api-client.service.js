const { OPClientErrors } = require("./octoprint-service.constants");
const { checkPluginManagerAPIDeprecation } = require("../../utils/compatibility.utils");
const { OctoprintApiService } = require("./octoprint-api.service");

const octoPrintBase = "/";
const apiBase = octoPrintBase + "api";
const apiSettingsPart = apiBase + "/settings";
const apiFile = (path) => apiBase + "/files/local/" + path;
const apiFiles = (recursive = true) => apiBase + "/files?recursive=" + recursive;
const apiConnection = apiBase + "/connection";
const apiPrinterProfiles = apiBase + "/printerprofiles";
const apiSystem = apiBase + "/system";
const apiSystemInfo = apiSystem + "/info";
const apiSystemCommands = apiSystem + "/commands";
const apiUsers = apiBase + "/users";
const apiLogin = (passive = true) => apiBase + "/login" + (passive ? "?passive=true" : "");

const apiPluginManager = apiBase + "/plugin/pluginmanager";
const apiPluginManagerRepository1_6_0 = octoPrintBase + "plugin/pluginmanager/repository";
const apiSoftwareUpdateCheck = (force) =>
  octoPrintBase + "plugin/softwareupdate/check" + (force ? "?force=true" : "");
const apiPluginPiSupport = apiBase + "/plugin/pi_support";
const apiPluginFilamentManagerSpecificSpool = apiBase + "/plugin/filamentmanager/spools";

const printerValidationErrorMessage = "printer apiKey or URL undefined";

class OctoprintApiClientService extends OctoprintApiService {
  constructor(timeoutSettings) {
    super(timeoutSettings);
  }

  static validatePrinter(printer) {
    if (!printer.apikey || !printer.printerURL) {
      throw printerValidationErrorMessage;
    }
  }

  async postPrinter(printer, route, data, timeout = false) {
    OctoprintApiClientService.validatePrinter(printer);
    return super.post(printer.printerURL, printer.apikey, route, data, timeout);
  }

  async getWithOptionalRetry(printer, route, retry = false) {
    OctoprintApiClientService.validatePrinter(printer);
    if (retry) {
      return await this.getRetry(printer.printerURL, printer.apikey, route);
      // .then(r => r.json());
    } else {
      return await this.get(printer.printerURL, printer.apikey, route);
      // .then(r => r.json());
    }
  }

  async checkApiKeyIsGlobal(printer, retry = false) {
    return this.getWithOptionalRetry(printer, apiSettingsPart, retry)
      .then((res) => res.json())
      .then((data) => {
        if (!data?.api) {
          throw new Error(
            "OctoPrint API did not respond in an expected manner [checkApiKeyIsGlobal]"
          );
        }
        return data.api.key === printer.apikey;
      });
  }

  async getSettings(printer, retry = false) {
    return this.getWithOptionalRetry(printer, apiSettingsPart, retry);
  }

  /**
   * List files recursively or not.
   * @param printer
   * @param recursive
   * @param retry
   * @returns {Promise<*|Promise|Promise<unknown> extends PromiseLike<infer U> ? U : (Promise|Promise<unknown>)|*|undefined>}
   */
  async getFiles(printer, recursive = false, retry = false) {
    return this.getWithOptionalRetry(printer, apiFiles(recursive), retry);
  }

  /**
   * Get a specific file
   * @param printer
   * @param path
   * @param retry
   * @returns {Promise<*|Promise|Promise<unknown> extends PromiseLike<infer U> ? U : (Promise|Promise<unknown>)|*|undefined>}
   */
  async getFile(printer, path, retry = false) {
    return this.getWithOptionalRetry(printer, apiFile(path), retry);
  }

  async getConnection(printer, retry = false) {
    return this.getWithOptionalRetry(printer, apiConnection, retry);
  }

  async getPrinterProfiles(printer, retry = false) {
    return this.getWithOptionalRetry(printer, apiPrinterProfiles, retry);
  }

  async getPluginManager(printer, retry = false) {
    const printerManagerApiCompatible = checkPluginManagerAPIDeprecation(printer.octoPrintVersion);

    const route = printerManagerApiCompatible ? apiPluginManagerRepository1_6_0 : apiPluginManager;

    return this.getWithOptionalRetry(printer, route, retry);
  }

  async getSystemInfo(printer, retry = false) {
    return this.getWithOptionalRetry(printer, apiSystemInfo, retry);
  }

  async getSystemCommands(printer, retry = false) {
    return this.getWithOptionalRetry(printer, apiSystemCommands, retry);
  }

  async getSoftwareUpdateCheck(printer, force, retry = false) {
    return this.getWithOptionalRetry(printer, apiSoftwareUpdateCheck(force), retry);
  }

  async getAdminUserOrDefault(printer) {
    const response = await this.getUsers(printer, true);
    if (response.status != 200) throw "Didnt get 200 response";

    const data = await response.json();
    let opAdminUserName = "admin";
    if (!!data?.users && Array.isArray(data)) {
      const adminUser = data.users.find((user) => !!user.admin);
      if (!adminUser) opAdminUserName = adminUser.name;
    }

    return opAdminUserName;
  }

  async getUsers(printer, retry = false) {
    return this.getWithOptionalRetry(printer, apiUsers, retry);
  }

  async getPluginPiSupport(printer, retry = false) {
    return this.getWithOptionalRetry(printer, apiPluginPiSupport, retry);
  }

  async getPluginFilamentManagerFilament(printer, filamentID) {
    // filamentID needs to be INT numeric
    // https://github.com/malnvenshorn/OctoPrint-FilamentManager/blob/647af691d6081df2f16d400e834f12f11f6eea56/octoprint_filamentmanager/data/__init__.py#L84
    const parsedFilamentID = Number.parseFloat(filamentID);
    if (isNaN(filamentID)) {
      throw OPClientErrors.filamentIDNotANumber;
    }
    const getURL = `${apiPluginFilamentManagerSpecificSpool}/${parsedFilamentID}`;
    return this.getWithOptionalRetry(printer, getURL, false);
  }

  async login(printer, passive = true) {
    return this.postPrinter(printer, apiLogin(passive), {}, false);
  }
}

module.exports = {
  OctoprintApiClientService
};
