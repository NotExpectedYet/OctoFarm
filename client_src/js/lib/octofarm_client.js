export default class OctoFarmClient {
  static async get(item) {
    const url = `/${item}`;
    const get = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (get.status === 400) {
      throw new Error(`Malformed request! Status: ${get.status} - ${get.statusText}`);
    } else if (get.status === 503) {
      throw new Error("Error contacting server, is it alive?");
    } else if (get.status === 204) {
      return;
    }
    return await get.json();
  }
  static async post(item, data) {
    const url = `/${item}`;
    const post = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    if (post.status === 400) {
      throw new Error(`Malformed request! Status: ${post.status} - ${post.statusText}`);
    } else if (post.status === 503) {
      throw new Error("Error contacting server, is it alive?");
    } else if (post.status === 204) {
      return;
    }

    return await post.json();
  }
}
