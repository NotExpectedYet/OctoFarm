const groupSelectionDropDown = document.getElementById("filterStates");

export default function initGroupSelect(printers) {
  //Active and fill dropdown...
  console.log(printers);
  const currentGroups = [];
  printers.forEach((printer) => {
    currentGroups.push(printer.group);
  });
  const uniqueGroups = _.uniq(currentGroups);
  if (uniqueGroups.length === 1) {
  } else {
    uniqueGroups.forEach((group) => {
      if (group != "") {
        groupSelectionDropDown.insertAdjacentHTML(
          "beforeend",
          `
                      <option href="#" data-path=".${group.replace(
                        / /g,
                        "_"
                      )}" value="${group.replace(/ /g, "_")}">Group: ${group}</option>
        `
        );
      }
    });
  }
}
