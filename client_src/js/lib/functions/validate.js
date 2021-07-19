export default class Validate {
  //Check the validity of a URL
  static URL(u) {
    let elm;
    if (!elm) {
      elm = document.createElement("input");
      elm.setAttribute("type", "url");
    }
    elm.value = u;
    return elm.validity.valid;
  }
  static IP(ipaddress) {
    if (
      /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
        ipaddress
      )
    ) {
      return true;
    } else {
      return false;
    }
  }
  static JSON(file) {
    if (
      /^[\],:{}\s]*$/.test(
        file
          .replace(/\\["\\\/bfnrtu]/g, "@")
          .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]")
          .replace(/(?:^|:|,)(?:\s*\[)+/g, "")
      )
    ) {
      return true;
    } else {
      return false;
    }
  }
  static getName(printer) {
    if (typeof printer.settingsAppearance != "undefined") {
      if (printer.settingsAppearance.name === "" || printer.settingsAppearance.name === null) {
        return printer.printerURL;
      } else {
        return printer.settingsAppearance.name;
      }
    } else {
      return printer.printerURL;
    }
  }
  static stripHTML(text) {
    var tmp = document.createElement("DIV");
    tmp.innerHTML = text;
    var res = tmp.textContent || tmp.innerText || "";
    res.replace("\u200B", ""); // zero width space
    res = res.trim();
    return res;
  }
}
