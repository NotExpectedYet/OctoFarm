export default class OctoFarmclient {
  static async getHistoryStatistics() {
    return this.get("history/statisticsData").then((r) => r.json());
  }

  static get(item) {
    const url = `/${item}`;
    return fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  static delete(item) {
    const url = `/${item}`;
    return fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
  static post(item, data) {
    const url = `/${item}`;
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
  }
}
