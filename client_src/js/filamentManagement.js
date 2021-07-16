import OctoFarmclient from "./lib/octofarm.js";
import UI from "./lib/functions/ui.js";
import {
  selectFilament,
  checkFilamentManager
} from "./lib/modules/filamentGrab.js";
import * as ApexCharts from "apexcharts";
import { getLastThirtyDaysText } from "./utils/time.util";

const jpInit = false;
let filamentManager = false;
const filamentStore = [
  {
    code: "pla",
    display: "PLA",
    density: "1.24"
  },
  {
    code: "abs",
    display: "ABS",
    density: "1.04"
  },
  {
    code: "petg",
    display: "PETG",
    density: "1.27"
  },
  {
    code: "nylon",
    display: "NYLON",
    density: "1.52"
  },
  {
    code: "tpu",
    display: "TPU",
    density: "1.21"
  },
  {
    code: "pc",
    display: "Polycarbonate (PC)",
    density: "1.3"
  },
  {
    code: "wood",
    display: "Wood Fill",
    density: "1.28"
  },
  {
    code: "carbon",
    display: "Carbon Fibre",
    density: "1.3"
  },
  {
    code: "pcabs",
    display: "PC/ABS",
    density: "1.19"
  },
  {
    code: "hips",
    display: "HIPS",
    density: "1.03"
  },
  {
    code: "pva",
    display: "PVA",
    density: "1.23"
  },
  {
    code: "asa",
    display: "ASA",
    density: "1.05"
  },
  {
    code: "pp",
    display: "Polypropylene (PP)",
    density: "0.9"
  },
  {
    code: "acetal",
    display: "Acetal (POM)",
    density: "1.4"
  },
  {
    code: "pmma",
    display: "PMMA",
    density: "1.18"
  },
  {
    code: "fpe",
    display: "Semi Flexible FPE",
    density: "2.16"
  }
];

// export async function returnFilament() {
//     let post = await OctoFarmclient.get("filament/get");
//     post = await post.json();
//     return post;
// }

// async function init() {
//   let post = await OctoFarmclient.get("filament/get");
//   post = await post.json();
//
//   let filamentKeys = Object.entries(filamentStore.filamentStore);
//
//   let filamentSelect = document.getElementById("filementTypeSelect");
//   filamentKeys.forEach((e, index) => {
//     filamentSelect.insertAdjacentHTML(
//       "beforeend",
//       `
//           <option value="${e[0]}">${e[1].display}</option>
//       `
//     );
//   });
// }

// export async function choose(value, i) {
//   let id = { id: value.options[value.selectedIndex].value, index: i };
//   let post = await OctoFarmclient.post("printers/selectFilament", id);
//   post = await post.json();
// }
// Profile functions
async function addProfile(manufacturer, material, density, diameter) {
  const errors = [];

  if (manufacturer.value === "") {
    errors.push({ type: "warning", msg: "Please input manufacturer" });
  }
  if (material.value === "") {
    errors.push({ type: "warning", msg: "Please select or type a material" });
  }
  if (density.value === 0) {
    errors.push({ type: "warning", msg: "Please input a density" });
  }
  if (diameter.value === 0) {
    errors.push({ type: "warning", msg: "Please input a density" });
  }
  if (errors.length > 0) {
    errors.forEach((error) => {
      UI.createMessage(error, "profilesMessage");
    });
    return;
  }
  const opts = {
    manufacturer: manufacturer.value,
    material: material.value,
    density: density.value,
    diameter: diameter.value
  };
  let post = await OctoFarmclient.post("filament/save/profile", opts);
  if (post.status === 200) {
    UI.createMessage(
      {
        type: "success",
        msg: "Successfully added new profile to the database..."
      },
      "profilesMessage"
    );
    post = await post.json();
    manufacturer.value = "";
    material.value = "";
    density.value = 1.25;
    diameter.value = 1.75;
    let profileID = null;
    filamentManager = post.filamentManager;
    if (filamentManager) {
      profileID = post.dataProfile.profile.index;
    } else {
      profileID = post.dataProfile._id;
    }
    post = post.dataProfile;
    updateProfileDrop();
    document.getElementById("addProfilesTable").insertAdjacentHTML(
      "beforeend",
      `
                <tr data-jplist-item>
                  <th style="display: none;">${profileID}</th>
                  <th scope="row"><input class="form-control" type="text" placeholder="${post.profile.manufacturer}"></th>
                  <td><input class="form-control" type="text" placeholder="${post.profile.material}"></td>
                  <td><input class="form-control" type="text" placeholder="${post.profile.density}"></p></td>
                  <td><input class="form-control" type="text" placeholder="${post.profile.diameter}"></p></td>
                  <td><button id="edit-${profileID}" type="button" class="btn btn-sm btn-info edit">
                    <i class="fas fa-edit editIcon"></i>
                  </button>
                  <button id="save-${profileID}" type="button" class="btn btn-sm d-none btn-success save">
                    <i class="fas fa-save saveIcon"></i>
                  </button>
                  <button id="delete-${profileID}" type="button" class="btn btn-sm btn-danger delete">
                    <i class="fas fa-trash deleteIcon"></i>
                  </button></td>
                </tr>
                `
    );
  } else {
    UI.createMessage(
      {
        type: "error",
        msg: "Could not add roll to database... is it alive?"
      },
      "profilesMessage"
    );
  }
}
async function editProfile(e) {
  const row = e.parentElement.parentElement;
  const editable = row.querySelectorAll("input");
  const id = e.parentElement.parentElement.firstElementChild.innerHTML.trim();
  editable.forEach((edit) => {
    edit.disabled = false;
    edit.value = edit.placeholder;
  });
  document.getElementById(`save-${id}`).classList.remove("d-none");
  document.getElementById(`edit-${id}`).classList.add("d-none");
}
async function saveProfile(e) {
  const row = e.parentElement.parentElement;
  const editable = row.querySelectorAll("input");
  const id = e.parentElement.parentElement.firstElementChild.innerHTML.trim();
  const profile = [];
  editable.forEach((edit) => {
    edit.disabled = true;
    edit.placeholder = edit.value;
    profile.push(edit.value);
    edit.value = "";
  });
  const data = {
    id,
    profile
  };
  let post = await OctoFarmclient.post("filament/edit/profile", data);
  if (post.status === 200) {
    post = await post.json();
    updateProfileDrop();
    document.getElementById(`save-${id}`).classList.add("d-none");
    document.getElementById(`edit-${id}`).classList.remove("d-none");
  }
  jplist.refresh();
}
async function deleteProfile(e) {
  document.getElementById("profilesMessage").innerHTML = "";
  if (e.classList.contains("delete") || e.classList.contains("deleteIcon")) {
    let post = await OctoFarmclient.post("filament/delete/profile", {
      id: e.parentElement.parentElement.firstElementChild.innerHTML.trim()
    });
    if (post.status === 200) {
      if (e.classList.contains("deleteIcon")) {
        jplist.resetContent(function () {
          // remove element with id = el1
          e.parentElement.parentElement.parentElement.remove();
        });
      } else {
        jplist.resetContent(function () {
          // remove element with id = el1
          e.parentElement.parentElement.remove();
        });
      }
      post = await post.json();
      updateProfileDrop(post);
    } else {
      UI.createMessage(
        {
          type: "danger",
          msg: "Error: Could not delete roll from database, check connection..."
        },
        "filamentMessage"
      );
    }
  }
}

// Spool functions
async function addSpool(
  spoolsName,
  spoolsProfile,
  spoolsPrice,
  spoolsWeight,
  spoolsUsed,
  spoolsTempOffset
) {
  const errors = [];

  if (spoolsName.value === "") {
    errors.push({ type: "warning", msg: "Please input a spool name" });
  }
  if (spoolsProfile.value === "") {
    errors.push({ type: "warning", msg: "Please select a profile" });
  }
  if (spoolsPrice.value === "") {
    errors.push({ type: "warning", msg: "Please input a spool price" });
  }
  if (spoolsWeight.value === 0 || spoolsWeight.value === "") {
    errors.push({ type: "warning", msg: "Please input a spool weight" });
  }
  if (spoolsUsed.value === "") {
    errors.push({ type: "warning", msg: "Please input spool used weight" });
  }

  if (errors.length > 0) {
    errors.forEach((error) => {
      UI.createMessage(error, "addSpoolsMessage");
    });
    return;
  }
  const opts = {
    spoolsName: spoolsName.value,
    spoolsProfile: spoolsProfile.value,
    spoolsPrice: spoolsPrice.value,
    spoolsWeight: spoolsWeight.value,
    spoolsUsed: spoolsUsed.value,
    spoolsTempOffset: spoolsTempOffset.value
  };
  let post = await OctoFarmclient.post("filament/save/filament", opts);

  if (post.status === 200) {
    UI.createMessage(
      {
        type: "success",
        msg: "Successfully added new roll to the database..."
      },
      "addSpoolsMessage"
    );
    post = await post.json();
    filamentManager = post.filamentManager;
    spoolsName.value = "";
    spoolsPrice.value = "";
    spoolsWeight.value = 1000;
    spoolsUsed.value = 0;
    spoolsTempOffset.value = 0.0;
    post = post.spools;
    let displayNone = "d-none";

    if (filamentManager) {
      displayNone = "";
    } else {
    }
    document.getElementById("addSpoolsTable").insertAdjacentHTML(
      "afterbegin",
      `
                <tr data-jplist-item>
                  <th style="display: none;">${post?._id}</th>
                  <th scope="row"><input class="form-control" type="text" placeholder="${
                    post?.spools?.name
                  }"></th>
                  <td>
                       <span class="d-none material" id="spoolsMaterialText-<%=spool._id%>"></span>
                       <select id="spoolsProfile-${
                         post?._id
                       }" class="form-control" disabled>

                       </select>
                   </td>
                  <td><input class="form-control" type="text" step="0.01" placeholder="${
                    post?.spools?.price
                  }" disabled></td>
                  <td><input class="form-control" type="text" placeholder="${
                    post?.spools?.weight
                  }" disabled></td>
                  <td class="${displayNone}"><input class="form-control" type="text" placeholder="${
        post?.spools?.used
      }"></td>
                  <td class="grams ${displayNone}">${(
        post?.spools?.weight - post?.spools?.used
      ).toFixed(0)}</td>
                  <td class="percent ${displayNone}">${(
        100 -
        (post?.spools?.used / post?.spools?.weight) * 100
      ).toFixed(0)}</td>
                  <td><input class="form-control" type="text" placeholder="${
                    post?.spools?.tempOffset
                  }" disabled></td>
                   <td>
                       <select id="spoolsPrinterAssignment-${
                         post?._id
                       }" class="form-control" disabled>

                       </select>
                   </td>
                  <td><button id="edit-${
                    post?._id
                  }" type="button" class="btn btn-sm btn-info edit">
                    <i class="fas fa-edit editIcon"></i>
                  </button>
                  <button id="save-${
                    post?._id
                  }" type="button" class="btn btn-sm d-none btn-success save">
                    <i class="fas fa-save saveIcon"></i>
                  </button>
                  <button id="delete-${
                    post?._id
                  }" type="button" class="btn btn-sm btn-danger delete">
                    <i class="fas fa-trash deleteIcon"></i>
                  </button></td>
                </tr>
                `
    );
    updatePrinterDrops();
    updateProfileDrop();
  } else {
    UI.createMessage(
      {
        type: "error",
        msg: "Could not add roll to database... is it alive?"
      },
      "addSpoolsMessage"
    );
  }
}
async function editSpool(e) {
  const row = e.parentElement.parentElement;
  const editable = row.querySelectorAll("input");
  const id = e.parentElement.parentElement.firstElementChild.innerHTML.trim();
  editable.forEach((edit) => {
    edit.disabled = false;
    edit.value = edit.placeholder;
  });
  // let profile = await OctoFarmclient.get("filament/get/profile");
  // profile = await profile.json();
  // document.getElementById("spoolsProfile-"+id).innerHTML = "";
  // profile.profiles.forEach(prof => {
  //     let profileID = null;
  //     if(filamentManager){
  //         profileID = prof.profile.index
  //     }else{
  //         profileID = prof._id
  //     }
  //     document.getElementById("spoolsProfile-"+id).insertAdjacentHTML('beforeend',`
  //                  <option value="${profileID}">${prof.profile.manufacturer} (${prof.profile.material})</option>
  //                 `)
  // })
  document.getElementById(`spoolsProfile-${id}`).disabled = false;
  document.getElementById(`save-${id}`).classList.remove("d-none");
  document.getElementById(`edit-${id}`).classList.add("d-none");
}
async function deleteSpool(e) {
  document.getElementById("profilesMessage").innerHTML = "";
  if (e.classList.contains("delete") || e.classList.contains("deleteIcon")) {
    let post = await OctoFarmclient.post("filament/delete/filament", {
      id: e.parentElement.parentElement.firstElementChild.innerHTML.trim()
    });
    if (post.status === 200) {
      if (e.classList.contains("deleteIcon")) {
        jplist.resetContent(function () {
          // remove element with id = el1
          e.parentElement.parentElement.parentElement.remove();
        });
      } else {
        jplist.resetContent(function () {
          // remove element with id = el1
          e.parentElement.parentElement.remove();
        });
      }
      post = await post.json();
    } else {
      UI.createMessage(
        {
          type: "danger",
          msg: "Error: Could not delete roll from database, check connection..."
        },
        "filamentMessage"
      );
    }
  }
}
async function saveSpool(e) {
  const row = e.parentElement.parentElement;
  const editable = row.querySelectorAll("input");
  const id = e.parentElement.parentElement.firstElementChild.innerHTML.trim();
  const spool = [];
  editable.forEach((edit) => {
    edit.disabled = true;
    edit.placeholder = edit.value;
    spool.push(edit.value);
    edit.value = "";
  });

  spool.push(document.getElementById(`spoolsProfile-${id}`).value);
  const data = {
    id,
    spool
  };
  let post = await OctoFarmclient.post("filament/edit/filament", data);
  if (post.status === 200) {
    post = await post.json();
    document.getElementById(`spoolsProfile-${id}`).disabled = true;
    document.getElementById(`save-${id}`).classList.add("d-none");
    document.getElementById(`edit-${id}`).classList.remove("d-none");
  }
  jplist.refresh();
}

async function updateProfileDrop() {
  // Update filament selection profile drop
  const spoolsProfile = document.getElementById("spoolsProfile");
  let profiles = await OctoFarmclient.get("filament/get/profile");
  profiles = await profiles.json();
  let fill = await OctoFarmclient.get("filament/get/filament");
  fill = await fill.json();
  let profile = await OctoFarmclient.get("filament/get/profile");
  profile = await profile.json();
  if (typeof profiles !== "undefined") {
    spoolsProfile.innerHTML = "";
    profiles.profiles.forEach((profile) => {
      let profileID = null;
      profileID = profile?._id;
      spoolsProfile.insertAdjacentHTML(
        "beforeend",
        `
             <option value="${profileID}">${profile?.manufacturer} (${profile?.material})</option>
            `
      );
    });
  }
  // Generate profile assignment
  const printerDrops = document.querySelectorAll("[id^='spoolsProfile-']");
  const printerListMaterials = document.querySelectorAll(
    "[id^='spoolsListMaterial-']"
  );
  const spoolsListManufacture = document.querySelectorAll(
    "[id^='spoolsListManufacture-']"
  );
  const spoolsMaterialText = document.querySelectorAll(
    "[id^='spoolsMaterialText-']"
  );
  printerDrops.forEach((drop, index) => {
    drop.innerHTML = "";
    profiles?.profiles.forEach((prof) => {
      drop.insertAdjacentHTML(
        "beforeend",
        `<option value="${prof?._id}">${prof?.manufacturer} (${prof?.material})</option>`
      );
    });
    const spoolID = drop?.id.split("-");
    const spool = _.findIndex(fill?.Spool, function (o) {
      return o?._id == spoolID[1];
    });
    if (typeof fill?.Spool[spool] !== "undefined") {
      drop.value = fill?.Spool[spool].profile;
      const profileID = _.findIndex(profiles?.profiles, function (o) {
        return o._id == fill?.Spool[spool].profile;
      });
      drop.className = `form-control ${profiles?.profiles[
        profileID
      ]?.material.replace(/ /g, "_")}`;
      spoolsMaterialText[
        index
      ].innerHTML = `${profiles?.profiles[profileID]?.material}`;
    }
  });
  //Fix for not updating main spool list with correct information, not skipping fo shizzle
  spoolsListManufacture.forEach((text) => {
    const spoolID = text.id.split("-");
    const spool = _.findIndex(fill?.Spool, function (o) {
      return o._id == spoolID[1];
    });
    if (typeof fill?.Spool[spool] !== "undefined") {
      const profileID = _.findIndex(profiles?.profiles, function (o) {
        return o._id == fill?.Spool[spool]?.profile;
      });
      text.innerHTML = `${profiles?.profiles[profileID]?.manufacturer}`;
    }
  });
  printerListMaterials.forEach((text) => {
    const spoolID = text.id.split("-");
    const spool = _.findIndex(fill?.Spool, function (o) {
      return o._id == spoolID[1];
    });
    if (typeof fill?.Spool[spool] !== "undefined") {
      const profileID = _.findIndex(profiles?.profiles, function (o) {
        return o._id == fill?.Spool[spool]?.profile;
      });
      text.innerHTML = `${profiles?.profiles[profileID]?.material}`;
    }
  });
}
async function updatePrinterDrops() {
  let printerList = await OctoFarmclient.get("filament/get/printerList");
  printerList = await printerList.json();
  // Generate printer assigment
  let filament = await OctoFarmclient.get("filament/get/filament");

  filament = await filament.json();

  const printerDrops = document.querySelectorAll(
    "[id^='spoolsPrinterAssignment-']"
  );
  const printerAssignments = document.querySelectorAll(
    "[id^='spoolsListPrinterAssignment-']"
  );
  printerDrops.forEach((drop, index) => {
    // Left over from when Printer Assignment actually worked.
    // printerList?.printerList.forEach((printer) => {
    //   console.log(printer)
    //   // drop.insertAdjacentHTML(
    //   //     "beforeend",
    //   //     `<option value="${prof?._id}">${prof?.manufacturer} (${prof?.material})</option>`
    //   // );
    // });

    const split = drop.id.split("-");
    const spoolID = split[1];
    const spool = _.findIndex(filament?.Spool, function (o) {
      return o?._id == spoolID;
    });
    if (typeof filament.Spool[spool] !== "undefined") {
      if (filament?.Spool[spool]?.printerAssignment.length > 0) {
        drop.innerHTML = `<option>${filament?.Spool[spool]?.printerAssignment[0]?.name}: Tool ${filament?.Spool[spool]?.printerAssignment[0]?.tool}</option>`;
      } else {
        drop.innerHTML = `<option>Not Assigned</option>`;
      }
    }
    // Not needed until bring back selecting spool function server side
    // drop.addEventListener("change", (e) => {
    //   const meta = e.target.value.split("-");
    //   const printerId = meta[0];
    //   const tool = meta[1];
    //   const spoolId = e.target.id.split("-");
    //   selectFilament(printerId, spoolId[1], tool);
    // });
  });
  printerAssignments.forEach((text, index) => {
    const split = text.id.split("-");
    const spoolID = split[1];
    const spool = _.findIndex(filament?.Spool, function (o) {
      return o?._id == spoolID;
    });
    if (typeof filament?.Spool[spool] !== "undefined") {
      if (filament?.Spool[spool]?.printerAssignment.length > 0) {
        text.innerHTML =
          filament?.Spool[spool]?.printerAssignment[0]?.name +
          ": Tool" +
          filament?.Spool[spool]?.printerAssignment[0]?.tool;
      } else {
        text.innerHTML = "Not Assigned";
      }
    }
    // Not needed until bring back selecting spool function server side
    // drop.addEventListener("change", (e) => {
    //   const meta = e.target.value.split("-");
    //   const printerId = meta[0];
    //   const tool = meta[1];
    //   const spoolId = e.target.id.split("-");
    //   selectFilament(printerId, spoolId[1], tool);
    // });
  });
}
async function init() {
  let lastThirtyDaysText = getLastThirtyDaysText();

  let historyStatistics = await OctoFarmclient.getHistoryStatistics();
  let usageByDay = historyStatistics.history.totalByDay;
  let usageOverTime = historyStatistics.history.usageOverTime;

  let yAxisSeries = [];
  usageOverTime.forEach((usage, index) => {
    let obj = null;
    if (index === 0) {
      obj = {
        title: {
          text: "Weight"
        },
        seriesName: usageOverTime[0].name,
        labels: {
          formatter: function (val) {
            if (val !== null) {
              return val.toFixed(0) + "g";
            }
          }
        }
      };
    } else {
      obj = {
        show: false,
        seriesName: usageOverTime[0].name,
        labels: {
          formatter: function (val) {
            if (val !== null) {
              return val.toFixed(0) + "g";
            }
          }
        }
      };
    }

    yAxisSeries.push(obj);
  });

  if (typeof usageOverTime[0] !== "undefined") {
    const usageOverTimeOptions = {
      chart: {
        type: "bar",
        width: "100%",
        height: "250px",
        stacked: true,
        stroke: {
          show: true,
          curve: "smooth",
          lineCap: "butt",
          width: 1,
          dashArray: 0
        },
        animations: {
          enabled: true
        },
        plotOptions: {
          bar: {
            horizontal: false
          }
        },
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        },
        background: "#303030"
      },
      dataLabels: {
        enabled: false,
        background: {
          enabled: true,
          foreColor: "#000",
          padding: 1,
          borderRadius: 2,
          borderWidth: 1,
          borderColor: "#fff",
          opacity: 0.9
        },
        formatter: function (val, opts) {
          if (val !== null) {
            return val.toFixed(0) + "g";
          }
        }
      },
      colors: [
        "#ff0000",
        "#ff8400",
        "#ffd500",
        "#88ff00",
        "#00ff88",
        "#00b7ff",
        "#4400ff",
        "#8000ff",
        "#ff00f2"
      ],
      toolbar: {
        show: false
      },
      theme: {
        mode: "dark"
      },
      noData: {
        text: "Loading..."
      },
      series: [],
      yaxis: [
        {
          title: {
            text: "Weight"
          },
          seriesName: usageOverTime[0].name,
          labels: {
            formatter: function (val) {
              if (val !== null) {
                return val.toFixed(0) + "g";
              }
            }
          }
        }
      ],
      xaxis: {
        type: "category",
        categories: lastThirtyDaysText,
        tickAmount: 15,
        labels: {
          formatter: function (value, timestamp) {
            let dae = new Date(value).toLocaleDateString();

            return dae; // The formatter function overrides format property
          }
        }
      }
    };
    let systemFarmTemp = new ApexCharts(
      document.querySelector("#usageOverTime"),
      usageOverTimeOptions
    );
    systemFarmTemp.render();

    const usageOverFilamentTimeOptions = {
      chart: {
        type: "line",
        width: "100%",
        height: "250px",
        stacked: true,
        animations: {
          enabled: true
        },
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        },
        background: "#303030"
      },
      dataLabels: {
        enabled: true,
        background: {
          enabled: true,
          foreColor: "#000",
          padding: 1,
          borderRadius: 2,
          borderWidth: 1,
          borderColor: "#fff",
          opacity: 0.9
        },
        formatter: function (val, opts) {
          if (val !== null) {
            return val.toFixed(0) + "g";
          }
        }
      },
      colors: [
        "#ff0000",
        "#ff8400",
        "#ffd500",
        "#88ff00",
        "#00ff88",
        "#00b7ff",
        "#4400ff",
        "#8000ff",
        "#ff00f2"
      ],
      toolbar: {
        show: false
      },
      stroke: {
        width: 2,
        curve: "smooth"
      },
      theme: {
        mode: "dark"
      },
      noData: {
        text: "Loading..."
      },
      series: [],
      yaxis: yAxisSeries,
      xaxis: {
        type: "category",
        categories: lastThirtyDaysText,
        tickAmount: 15,
        labels: {
          formatter: function (value, timestamp) {
            let dae = new Date(value).toLocaleDateString();

            return dae; // The formatter function overrides format property
          }
        }
      }
    };
    let usageOverFilamentTime = new ApexCharts(
      document.querySelector("#usageOverFilamentTime"),
      usageOverFilamentTimeOptions
    );
    usageOverFilamentTime.render();

    usageOverFilamentTime.updateSeries(usageOverTime);
    systemFarmTemp.updateSeries(usageByDay);
  }

  // Grab data
  const spoolTable = document.getElementById("addSpoolsTable");
  // Initialise materials dropdown
  const dataList = document.getElementById("profilesMaterial");
  dataList.addEventListener("change", function (e) {
    const { value } = this;
    const selection = _.findIndex(filamentStore, function (o) {
      return o.code == value.toLowerCase();
    });
    if (selection != -1) {
      this.value = filamentStore[selection].display;
      document.getElementById("profilesDensity").value =
        filamentStore[selection].density;
    }
  });
  filamentStore.forEach((filament) => {
    document.getElementById("huge_list").insertAdjacentHTML(
      "beforeend",
      `
            <option value="${filament.code.toUpperCase()}">${
        filament.display
      }</option>
        `
    );
  });
  spoolTable.addEventListener("click", (e) => {
    // Remove from UI
    if (e.target.classList.contains("edit")) {
      editSpool(e.target);
    } else if (e.target.classList.contains("delete")) {
      deleteSpool(e.target);
    } else if (e.target.classList.contains("save")) {
      saveSpool(e.target);
    }
  });
  updateProfileDrop();
  updatePrinterDrops();
  // Initialise Profile Listeners
  const profilesBtn = document.getElementById("addProfilesBtn");
  profilesBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById("profilesMessage").innerHTML = "";
    const profilesManufactuer = document.getElementById("profilesManufactuer");
    const profilesMaterial = document.getElementById("profilesMaterial");
    const profilesDensity = document.getElementById("profilesDensity");
    const profilesDiameter = document.getElementById("profilesDiameter");
    await addProfile(
      profilesManufactuer,
      profilesMaterial,
      profilesDensity,
      profilesDiameter
    );
  });
  document.getElementById("addProfilesTable").addEventListener("click", (e) => {
    // Remove from UI
    if (e.target.classList.contains("edit")) {
      editProfile(e.target);
    } else if (e.target.classList.contains("delete")) {
      deleteProfile(e.target);
    } else if (e.target.classList.contains("save")) {
      saveProfile(e.target);
    }
  });

  //    //Init Spools
  document
    .getElementById("addSpoolBtn")
    .addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.getElementById("addSpoolsMessage").innerHTML = "";
      const spoolsName = document.getElementById("spoolsName");
      const spoolsProfile = document.getElementById("spoolsProfile");
      const spoolsPrice = document.getElementById("spoolsPrice");
      const spoolsWeight = document.getElementById("spoolsWeight");
      const spoolsUsed = document.getElementById("spoolsRemaining");
      const spoolsTempOffset = document.getElementById("spoolsTempOffset");
      addSpool(
        spoolsName,
        spoolsProfile,
        spoolsPrice,
        spoolsWeight,
        spoolsUsed,
        spoolsTempOffset
      );
    });
  filamentManager = await checkFilamentManager();

  if (filamentManager) {
    const resyncBtn = document.getElementById("resyncFilament");
    resyncBtn.addEventListener("click", async (e) => {
      resyncBtn.innerHTML =
        '<i class="fas fa-sync fa-spin"></i> <br> Syncing <br> Please Wait...';
      const post = await OctoFarmclient.post("filament/filamentManagerReSync");
      resyncBtn.innerHTML =
        '<i class="fas fa-sync"></i> Re-Sync Filament Manager';
      if (post.status === 200) {
        const meta = await post.json();
        if (meta.success) {
          UI.createAlert(
            "success",
            `Successfully synced filament manager! <br> Profiles - Updated: ${meta.updatedProfiles} / New: ${meta.newProfiles} <br> Spools - Updated: ${meta.updatedSpools} / New: ${meta.newSpools}`,
            4000,
            "Clicked"
          );
        } else {
          UI.createAlert(
            "error",
            `Successfully synced filament manager! <br> Profiles Status: ${meta.profiles} <br> Spools Status: ${meta.spools}`,
            4000,
            "Clicked"
          );
        }
        resyncBtn.disabled = false;
      } else {
        UI.createAlert(
          "error",
          "Could not contact server to sync, is it online?"
        );
        resyncBtn.disabled = false;
      }
    });
  }

  // fill.Spool.forEach((spools) => {
  //   profile.profiles.forEach((prof) => {
  //     let profileID = null;
  //     if (filamentManager) {
  //       profileID = prof.profile.index;
  //     } else {
  //       profileID = prof._id;
  //     }
  //     document.getElementById(`spoolsProfile-${spools._id}`).insertAdjacentHTML(
  //       "beforeend",
  //       `
  //                      <option value="${profileID}">${prof.profile.manufacturer} (${prof.profile.material})</option>
  //                     `
  //     );
  //   });
  //   document.getElementById(`spoolsProfile-${spools._id}`).value =
  //     spools.spools.profile;
  //   if (filamentManager) {
  //     const prof = _.findIndex(profile.profiles, function (o) {
  //       return o.profile.index == spools.spools.profile;
  //     });
  //     document.getElementById(
  //       `spoolsProfile-${spools._id}`
  //     ).className = `form-control ${profile.profiles[
  //       prof
  //     ].profile.material.replace(/ /g, "_")}`;
  //   } else {
  //     const prof = _.findIndex(profile.profiles, function (o) {
  //       return o._id == spools.spools.profile;
  //     });
  //
  //     document.getElementById(
  //       `spoolsProfile-${spools._id}`
  //     ).className = `form-control ${profile.profiles[
  //       prof
  //     ].profile.material.replace(/ /g, "_")}`;
  //   }
  //
  //   const printerListCurrent = document.getElementById(
  //     `spoolsPrinterAssignment-${spools._id}`
  //   );
  //
  //   printerListCurrent.insertAdjacentHTML(
  //     "beforeend",
  //     `
  //                         <option value="0">No Selection</option>
  //                    `
  //   );
  //   printers.forEach((printer) => {
  //     if (printer.stateColour.category !== "Active") {
  //       printerListCurrent.insertAdjacentHTML(
  //         "beforeend",
  //         `
  //                         <option value="${printer._id}">${Validate.getName(
  //           printer
  //         )}</option>
  //                    `
  //       );
  //     } else {
  //       printerListCurrent.insertAdjacentHTML(
  //         "beforeend",
  //         `
  //                         <option value="${
  //                           printer._id
  //                         }" disabled>${Validate.getName(printer)}</option>
  //                    `
  //       );
  //     }
  //     if (
  //       printer.selectedFilament !== null &&
  //       printer.selectedFilament._id === spools._id
  //     ) {
  //       printerListCurrent.value = printer._id;
  //       if (printer.stateColour.category === "Active") {
  //         printerListCurrent.disabled = true;
  //         document.getElementById(`delete-${spools._id}`).disabled = true;
  //         document.getElementById(`edit-${spools._id}`).disabled = true;
  //       }
  //     }
  //   });
  //
  //   printerListCurrent.addEventListener("change", (e) => {
  //     const data = {
  //       printerId: e.target.value,
  //       spoolId: e.target.parentElement.parentElement.firstElementChild.innerHTML.trim(),
  //     };
  //     OctoFarmclient.post("filament/select", data);
  //   });
  // });
  //     //Grab printer list...
  //
  //
  //   //Init Profiles
  //   let post = await OctoFarmclient.get("filament/get/profile");
  //   post = await post.json();
  //   let profileTable = document.getElementById("addProfilesTable");
  //     //profileTable.innerHTML = "";
  //   post.profiles.forEach(profiles => {
  //       let profileID = null;
  //       if(filamentManager){
  //           profileID = profiles.profile.index
  //       }else{
  //           profileID = profiles._id
  //       }
  //     // profileTable.insertAdjacentHTML("beforeend", `
  //     //     <tr data-jplist-item>
  //     //       <td class="d-none" scope="row">
  //     //         ${profileID}
  //     //       </td>

  //     //       </td>
  //     //           <td>
  //     //               <button id="edit-${profileID}" type="button" class="btn btn-sm btn-info edit">
  //     //                 <i class="fas fa-edit editIcon"></i>
  //     //               </button>
  //     //               <button id="save-${profileID}" type="button" class="btn d-none btn-sm btn-success save">
  //     //                 <i class="fas fa-save saveIcon"></i>
  //     //               </button>
  //     //               <button id="delete-${profileID}" type="button" class="btn btn-sm btn-danger delete">
  //     //                 <i class="fas fa-trash deleteIcon"></i>
  //     //               </button>
  //     //           </td>
  //     //     </tr>
  //     // `)
  //
  //       printers.forEach(printer => {
  //           if(printer.selectedFilament !== null && printer.selectedFilament.spools.profile === profileID){
  //               if(printer.stateColour.category === "Active"){
  //                   document.getElementById("delete-"+profileID).disabled = true;
  //                   document.getElementById("edit-"+profileID).disabled = true;
  //               }
  //           }
  //       })
  //   })

  jplist.init({
    storage: "localStorage", // 'localStorage', 'sessionStorage' or 'cookies'
    storageName: "spools-sorting" // the same storage name can be used to share storage between multiple pages
  });

  //   //Update Profiles Spools Dropdown.
  //   updateProfileDrop(post)
  //
}
// async function updateProfileDrop(post){
//
// }
// async function load() {
//    profilesMaterialprofilesMaterial let dataList = document.getElementById("profilesMaterial")
//         dataList.addEventListener('change', function(e){
//             let value = this.value
//             let selection = _.findIndex(filamentStore, function(o) { return o.code == value.toLowerCase(); });
//             if(selection != -1){
//                 this.value = filamentStore[selection].display
//                 document.getElementById("profilesDensity").value = filamentStore[selection].density;
//             }
//
//     });
//     filamentStore.forEach(filament => {
//         document.getElementById("huge_list").insertAdjacentHTML('beforeend',`
//             <option value="${filament.code.toUpperCase()}">${filament.display}</option>
//         `)
//     })
//    // Grab Profile
//

//
//     // document.getElementById("addSpoolsTable").addEventListener("click", e => {
//     //     //Remove from UI
//     //     if(e.target.classList.contains("edit")){
//     //         editSpool(e.target)
//     //     }else if(e.target.classList.contains("delete")){
//     //         deleteSpool(e.target)
//     //     }else if(e.target.classList.contains("save")){
//     //         saveSpool(e.target)
//     //     }
//     // });
//     // Grab Profile
//
//     // document.getElementById("addProfilesTable").addEventListener("click", e => {
//     //     //Remove from UI
//     //     if(e.target.classList.contains("edit")){
//     //         editProfile(e.target)
//     //     }else if(e.target.classList.contains("delete")){
//     //         deleteProfile(e.target)
//     //     }else if(e.target.classList.contains("save")){
//     //         saveProfile(e.target)
//     //     }
//     // });
//
// }

function updateTotals(filtered) {
  const price = [];
  const weight = [];
  const used = [];

  filtered.forEach((row) => {
    price.push(parseInt(row.getElementsByClassName("price")[0].innerHTML));
    weight.push(parseInt(row.getElementsByClassName("weight")[0].innerHTML));
    used.push(parseInt(row.getElementsByClassName("used")[0].innerHTML));
  });
  const usedReduced = used.reduce((a, b) => a + b, 0).toFixed(0);
  const weightReduced = weight.reduce((a, b) => a + b, 0).toFixed(0);
  document.getElementById("totalPrice").innerHTML = price
    .reduce((a, b) => a + b, 0)
    .toFixed(0);
  document.getElementById("totalWeight").innerHTML = weightReduced;
  document.getElementById("totalUsed").innerHTML = usedReduced;
  document.getElementById("totalRemaining").innerHTML = (
    weightReduced - usedReduced
  ).toFixed(0);
  document.getElementById("totalRemainingPercent").innerHTML = (
    100 -
    (usedReduced / weightReduced) * 100
  ).toFixed(0);
}
const element = document.getElementById("listenerSpools");
element.addEventListener(
  "jplist.state",
  (e) => {
    // the elements list after filtering + pagination
    updateTotals(e.jplistState.filtered);
    updateProfileDrop();
    updatePrinterDrops();
  },
  false
);
init();
// load();
