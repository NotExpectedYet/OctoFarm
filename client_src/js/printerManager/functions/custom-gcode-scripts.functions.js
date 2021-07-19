import OctoFarmClient from "../../lib/octofarm_client";
import UI from "../../lib/functions/ui";
import { customGcodeScriptTemplate } from "../templates/gcode-scripts-table.template";

const createNewScriptBtn = document.getElementById("createNewScriptBtn");
const scriptTable = document.getElementById("gcodeScriptTable");

async function newGcodeScript(newScript) {
  const keys = Object.keys(newScript);
  let errors = [];
  for (const key of keys) {
    if (newScript["name"] === "") {
      errors.push(key);
    }
    if (newScript["gcode"] === "") {
      errors.push(key);
    }
  }
  if (errors.length !== 0) {
    UI.createAlert("error", "You have blank fields sony jim!, sort them out...", 3000, "Clicked");
    return false;
  } else {
    let lines = newScript.gcode.match(/[^\r\n]+/g);
    newScript.gcode = lines.map(function (name) {
      if (!name.includes("=")) {
        return name.toLocaleUpperCase();
      } else {
        return name;
      }
    });
    if (newScript.id) {
      try {
        const post = await OctoFarmClient.post("settings/customGcode/edit", newScript);
        console.info(post);
      } catch (e) {
        console.error(e);
        UI.createAlert("error", "Unable to create scripts table... please check logs: ", e);
      }
    } else {
      try {
        const post = await OctoFarmClient.post("settings/customGcode", newScript);
        drawScriptTable(post);
      } catch (e) {
        console.error(e);
        UI.createAlert("error", "Unable to create scripts table... please check logs: ", e);
      }
    }
  }
  return true;
}

function editScript(script) {
  document.getElementById(`script_name_${script._id}`).disabled = false;
  document.getElementById(`script_desc_${script._id}`).disabled = false;
  document.getElementById(`script_lines_${script._id}`).disabled = false;
  document.getElementById(`script_name_${script._id}`).value = document.getElementById(
    `script_name_${script._id}`
  ).placeholder;
  document.getElementById(`script_desc_${script._id}`).value = document.getElementById(
    `script_desc_${script._id}`
  ).placeholder;
  document.getElementById(`script_lines_${script._id}`).value = document.getElementById(
    `script_lines_${script._id}`
  ).placeholder;
  document.getElementById(`editScript-${script._id}`).classList.toggle("d-none");
  document.getElementById(`saveScript-${script._id}`).classList.toggle("d-none");
}
async function deleteScript(script) {
  try {
    await OctoFarmClient.get("settings/customGcode/delete/" + script._id);
    UI.createAlert("success", "Successfully deleted your script...", 3000, "Clicked");
    document.getElementById("scriptRow-" + script._id).remove();
  } catch (e) {
    console.error(e);
    UI.createAlert(
      "error",
      `Something went wrong deleting your script, please check the logs: ${e}`,
      3000,
      "Clicked"
    );
  }
}

async function saveScript(script) {
  let newScript = {
    id: document.getElementById(`script_id_${script._id}`).innerHTML,
    name: document.getElementById(`script_name_${script._id}`).value,
    description: document.getElementById(`script_desc_${script._id}`).value,
    gcode: document.getElementById(`script_lines_${script._id}`).value
  };
  const save = await newGcodeScript(newScript);
  if (save) {
    document.getElementById(`script_name_${script._id}`).placeholder = document.getElementById(
      `script_name_${script._id}`
    ).value;
    document.getElementById(`script_desc_${script._id}`).placeholder = document.getElementById(
      `script_desc_${script._id}`
    ).value;
    document.getElementById(`script_lines_${script._id}`).placeholder = document.getElementById(
      `script_lines_${script._id}`
    ).value;
    document.getElementById(`script_name_${script._id}`).value = "";
    document.getElementById(`script_desc_${script._id}`).value = "";
    document.getElementById(`script_lines_${script._id}`).value = "";
    document.getElementById(`script_name_${script._id}`).disabled = true;
    document.getElementById(`script_desc_${script._id}`).disabled = true;
    document.getElementById(`script_lines_${script._id}`).disabled = true;
    document.getElementById(`editScript-${script._id}`).classList.toggle("d-none");
    document.getElementById(`saveScript-${script._id}`).classList.toggle("d-none");
  }
}

function drawScriptTable(script) {
  let scriptTable = document.getElementById("gcodeScriptTable");
  let scriptLines = "";

  script.gcode.forEach((e) => {
    scriptLines += `${e}\n`;
  });

  scriptTable.insertAdjacentHTML("beforeend", customGcodeScriptTemplate(script, scriptLines));
  document.getElementById("deleteScript-" + script._id).addEventListener("click", async (e) => {
    await deleteScript(script);
  });
  document.getElementById("editScript-" + script._id).addEventListener("click", async (e) => {
    editScript(script);
  });
  document.getElementById("saveScript-" + script._id).addEventListener("click", async (e) => {
    await saveScript(script);
  });
}

createNewScriptBtn.addEventListener("click", async (e) => {
  let newScript = {
    name: document.getElementById("gcodeScriptName").value,
    description: document.getElementById("gcodeScriptDescription").value,
    gcode: document.getElementById("gcodeScriptScript").value
  };
  await newGcodeScript(newScript);
  document.getElementById("gcodeScriptName").value = "";
  document.getElementById("gcodeScriptDescription").value = "";
  document.getElementById("gcodeScriptScript").value = "";
});

export async function loadCustomGcodeScriptsModel() {
  try {
    const customScripts = await OctoFarmClient.get("settings/customGcode");
    //Draw Scripts
    scriptTable.innerHTML = "";
    customScripts.forEach((script) => {
      drawScriptTable(script);
    });
  } catch (e) {
    console.error(e);
    UI.createAlert("error", "Unable to create scripts table... please check logs: ", e);
  }
}
