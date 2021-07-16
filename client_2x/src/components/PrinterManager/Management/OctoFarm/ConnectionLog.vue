<template>
  <v-card
    max-height="270px"
    style="overflow:hidden"
  >
    <v-card-title>
      Connection Log
    </v-card-title>
    <v-divider />
    <v-list
      dense
    >
      <v-list-item
        v-for="log in connection_log"
        :key="log.status"
      >
        <v-list-item-subtitle
          class="text-wrap"
          style="font-family: monospace;"
        >
          {{ log.time.toLocaleString() }} | {{ log.printer_url }} | {{ log.message }}
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script>
export default {
  name: "ConnectionLog",
  props: {
    connection_log: {
      type: Array,
    },
  },
};
</script>
