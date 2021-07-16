<template>
  <v-card height="270px">
    <v-card-title>
      Printer Actions
    </v-card-title>
    <v-divider />
    <v-card-text>
      <v-col>
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              color="success"
              class="ma-1"
              small
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>mdi-link-variant-plus</v-icon>  Connect
            </v-btn>
          </template>
          <span>Send a connection command to select printers / groups</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              color="error"
              class="ma-1"
              small
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>mdi-link-variant-remove</v-icon>   Disconnect
            </v-btn>
          </template>
          <span>Send a disconnect command to select printers / groups</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              color="warning"
              class="ma-1"
              small
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>mdi-power</v-icon>   Power
            </v-btn>
          </template>
          <span>Send a power command to select printers / groups</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              color="accent"
              class="ma-1"
              small
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>mdi-thermometer-plus</v-icon>   Pre-Heat
            </v-btn>
          </template>
          <span>Send a pre-heat command to select printers / groups</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              color="info"
              class="ma-1"
              small
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>mdi-controller-classic</v-icon>   Control
            </v-btn>
          </template>
          <span>Control select printers / groups</span>
        </v-tooltip>
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              color="secondary"
              class="ma-1"
              small
              v-bind="attrs"
              v-on="on"
            >
              <v-icon>mdi-file-code-outline</v-icon>   Gcode
            </v-btn>
          </template>
          <span>Send gcode commands to select printers / groups</span>
        </v-tooltip>
      </v-col>
    </v-card-text>
  </v-card>
</template>

<script>
export default {};
</script>
