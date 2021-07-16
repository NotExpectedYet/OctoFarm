export function setupPluginSearch() {
  let pluginSearch = document.getElementById("searchPlugins");
  pluginSearch.addEventListener("keyup", (e) => {
    const fileList = document.getElementsByClassName("bootbox-checkbox-list");
    let input = document.getElementById("searchPlugins").value.toUpperCase();

    input = input.replace(/ /g, "_");
    const button = fileList[0].querySelectorAll('*[id^="plugin-"]');
    for (let i = 0; i < button.length; i++) {
      const file = button[i].id.replace("plugin-", "");
      if (file.toUpperCase().indexOf(input) > -1) {
        button[i].parentNode.parentNode.style.display = "";
      } else {
        button[i].parentNode.parentNode.style.display = "none";
      }
    }
  });
}
