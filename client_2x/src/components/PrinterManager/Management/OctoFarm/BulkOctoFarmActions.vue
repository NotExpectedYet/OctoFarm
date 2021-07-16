<template>
  <v-card
    min-height="100%"
    class="overflow-y-auto"
  >
    <v-card-title>
      User Directory
    </v-card-title>
    <v-list-item three-line>
      <v-list-item-content>
        <v-col>
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                color="success"
                class="ma-1"

                v-bind="attrs"
                v-on="on"
              >
                <v-icon>mdi-power-plug</v-icon> Gcode Scripts
              </v-btn>
            </template>
            <span>Send a connection command to select printers / groups</span>
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
      </v-list-item-content>
    </v-list-item>
  </v-card>
</template>

<script>
export default {};
</script>
