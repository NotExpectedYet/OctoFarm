class OctoprintApiService {
  timeout = null;
  static mockStatus = undefined;
  static mockResponse = undefined;

  constructor(timeoutSettings) {
    this.timeout = timeoutSettings;
  }

  static saveMockResponse(status, response) {
    OctoprintApiService.mockStatus = status;
    OctoprintApiService.mockResponse = response;
  }

  static async getMockResponse() {
    return Promise.resolve({
      status: OctoprintApiService.mockStatus,
      json: () => {
        return OctoprintApiService.mockResponse;
      }
    });
  }

  async getRetry(printerURL, apiKey, item) {
    const message = `Connecting to OctoPrint Mock API: ${item} | ${printerURL}`;
    return await this.get(printerURL, apiKey, item);
  }

  post(printerURL, apiKey, route, data, timeout = true) {
    const url = new URL(route, printerURL).href;
    return OctoprintApiService.getMockResponse();
  }

  get(printerURL, apiKey, route, timeout = true) {
    const url = new URL(route, printerURL).href;
    return OctoprintApiService.getMockResponse();
  }

  patch(printerURL, apiKey, route, data, timeout = true) {
    const url = new URL(route, printerURL).href;
    return OctoprintApiService.getMockResponse();
  }
}

module.exports = {
  OctoprintApiService
};
