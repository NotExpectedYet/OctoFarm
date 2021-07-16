<template>
  <v-row>
    <v-col
      cols="12"
      md="6"
      lg="6"
      xl="4"
    >
      <connection-log :connection_log="connection_log" />
    </v-col>
    <v-col
      cols="12"
      md="6"
      lg="3"
      xl="4"
    >
      <management-card />
    </v-col>
    <v-col
      cols="12"
      md="6"
      lg="3"
      xl="4"
    >
      <octoprint-card />
    </v-col>
  </v-row>
</template>

<script>
import BulkPrinterActions from "@/components/PrinterManager/Management/UniversalPrinterActions/BulkPrinterActions.vue";
import BulkOctoPrintActions from "@/components/PrinterManager/Management/OctoPrintActions/BulkOctoPrintActions.vue";
import ConnectionLog from "@/components/PrinterManager/Management/OctoFarm/ConnectionLog.vue";

export default {
  name: "Management",
  props: {
    connection_log: {
      type: Array,
    },
  },
  components: { "management-card": BulkPrinterActions, "octoprint-card": BulkOctoPrintActions, "connection-log": ConnectionLog },
};
</script>
