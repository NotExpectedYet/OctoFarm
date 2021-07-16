<template>
  <v-container fluid>
    <v-row no-gutters>
      <!-- <printer-management :connection_log="connection_log"/> -->
    </v-row>
    <v-row>
      <!-- <printer-table
        :printers="printers"
      /> -->
    </v-row>
  </v-container>
</template>
<script>
// import PrinterTable from "@/components/PrinterManager/Management/OctoFarm/PrinterTable.vue";
// import Management from "@/components/PrinterManager/Management.vue";

export default {
  name: "PrinterManager",
  // components: {"printer-table": PrinterTable, "printer-management": Management},
  data: () => ({
    printers: [
      {
        _id: "blablabla",
        sort_index: 1,
        type: "FDM",
        link: "OctoPrint",
        name: "Bog Saget",
        url: "http://192.168.1.124:5001",
        cam_url: "http://192.168.1.124:5001",
        apikey: "blablablabla",
        host_state: "online",
        printer_state: "disconnected",
        websocket_state: "connected",
        groups: "UPS1",
        octoprint_version: "1.5.3",
        printer_firmware: "Klipper v9.0",
      },
      {
        _id: "blablabla",
        sort_index: 2,
        type: "FDM",
        link: "OctoPrint",
        name: "Charlie Horse",
        url: "http://192.168.1.124:5001",
        cam_url: "http://192.168.1.124:5001",
        apikey: "blablablabla",
        host_state: "online",
        printer_state: "disconnected",
        websocket_state: "connected",
        groups: "UPS2",
        octoprint_version: "1.5.3",
        printer_firmware: "Klipper v9.0",
      },
      {
        _id: "blablabla",
        sort_index: 3,
        type: "FDM",
        link: "OctoPrint",
        name: "Old Yellow",
        url: "http://192.168.1.124:5001",
        cam_url: "http://192.168.1.124:5001",
        apikey: "blablablabla",
        host_state: "online",
        printer_state: "disconnected",
        websocket_state: "connected",
        groups: "UPS1",
        octoprint_version: "1.5.3",
        printer_firmware: "Klipper v9.0",
      },
    ],
    connection_log: [
      {
        time: new Date(),
        printer_url: "http://192.168.1.124:5001",
        message: "I have died... a great death!",
        status: "warning",
      },
      {
        time: new Date(),
        printer_url: "http://192.168.1.124:5001",
        message: "I have died... a great death!",
        status: "danger",
      },
      {
        time: new Date(),
        printer_url: "http://192.168.1.124:5001",
        message: "I have died... a great death!",
        status: "success",
      },
      {
        time: new Date(),
        printer_url: "http://192.168.1.124:5001",
        message: "I have died... a great death!",
        status: "warning",
      },
      {
        time: new Date(),
        printer_url: "http://192.168.1.124:5001",
        message: "I have died... a great death!",
        status: "warning",
      },
      {
        time: new Date(),
        printer_url: "http://192.168.1.124:5001",
        message: "I have died... a great death!",
        status: "danger",
      },
      {
        time: new Date(),
        printer_url: "http://192.168.1.124:5001",
        message: "I have died... a great death!",
        status: "success",
      },
      {
        time: new Date(),
        printer_url: "http://192.168.1.124:5001",
        message: "I have died... a great death!",
        status: "warning",
      },
      {
        time: new Date(),
        printer_url: "http://192.168.1.124:5001",
        message: "I have died... a great death!",
        status: "warning",
      },
      {
        time: new Date(),
        printer_url: "http://192.168.1.124:5001",
        message: "I have died... a great death!",
        status: "danger",
      },
      {
        time: new Date(),
        printer_url: "http://192.168.1.124:5001",
        message: "I have died... a great death!",
        status: "success",
      },
      {
        time: new Date(),
        printer_url: "http://192.168.1.124:5001",
        message: "I have died... a great death!",
        status: "warning",
      },
      {
        time: new Date(),
        printer_url: "http://192.168.1.124:5001",
        message: "I have died... a great death!",
        status: "warning",
      },
      {
        time: new Date(),
        printer_url: "http://192.168.1.124:5001",
        message: "I have died... a great death!",
        status: "danger",
      },
      {
        time: new Date(),
        printer_url: "http://192.168.1.124:5001",
        message: "I have died... a great death!",
        status: "success",
      },
      {
        time: new Date(),
        printer_url: "http://192.168.1.124:5001",
        message: "I have died... a great death!",
        status: "warning",
      },
      {
        time: new Date(),
        printer_url: "http://192.168.1.124:5001",
        message: "I have died... a great death!",
        status: "warning",
      },
      {
        time: new Date(),
        printer_url: "http://192.168.1.124:5001",
        message: "I have died... a great death!",
        status: "danger",
      },
      {
        time: new Date(),
        printer_url: "http://192.168.1.124:5001",
        message: "I have died... a great death!",
        status: "success",
      },
      {
        time: new Date(),
        printer_url: "http://192.168.1.124:5001",
        message: "I have died... a great death!",
        status: "warning",
      },
      {
        time: new Date(),
        printer_url: "http://192.168.1.124:5001",
        message: "I have died... a great death!",
        status: "warning",
      },
      {
        time: new Date(),
        printer_url: "http://192.168.1.124:5001",
        message: "I have died... a great death!",
        status: "danger",
      },
      {
        time: new Date(),
        printer_url: "http://192.168.1.124:5001",
        message: "I have died... a great death!",
        status: "success",
      },
      {
        time: new Date(),
        printer_url: "http://192.168.1.124:5001",
        message: "I have died... a great death!",
        status: "warning",
      },
    ],
  }),
};
</script>
