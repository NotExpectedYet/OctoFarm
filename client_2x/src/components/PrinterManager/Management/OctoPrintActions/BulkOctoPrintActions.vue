<template>
  <v-card height="270px">
    <v-card-title>OcotPrint Plugins</v-card-title>
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
              <v-icon>mdi-power-plug</v-icon> Install
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
              <v-icon>mdi-power-plug-off</v-icon> Uninstall
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
              <v-icon>mdi-power-plug</v-icon> Enable
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
              <v-icon>mdi-power-plug-off</v-icon> Disable
            </v-btn>
          </template>
          <span>Send a pre-heat command to select printers / groups</span>
        </v-tooltip>
        <!--          <v-tooltip bottom>-->
        <!--            <template v-slot:activator="{ on, attrs }">-->
        <!--              <v-btn-->
        <!--                color="info"-->
        <!--                class="ma-1"-->
        <!--                v-bind="attrs"-->
        <!--                v-on="on"-->
        <!--              >-->
        <!--                Control-->
        <!--              </v-btn>-->
        <!--            </template>-->
        <!--            <span>Control select printers / groups</span>-->
        <!--          </v-tooltip>-->
        <!--          <v-tooltip bottom>-->
        <!--            <template v-slot:activator="{ on, attrs }">-->
        <!--              <v-btn-->
        <!--                color="secondary"-->
        <!--                class="ma-1"-->
        <!--                v-bind="attrs"-->
        <!--                v-on="on"-->
        <!--              >-->
        <!--                Gcode-->
        <!--              </v-btn>-->
        <!--            </template>-->
        <!--            <span>Send gcode commands to select printers / groups</span>-->
        <!--          </v-tooltip>-->
      </v-col>
    </v-card-text>
  </v-card>
</template>

<script>
export default {};
</script>
