<template>
  <v-container>
    <v-row>
      <v-col align="center">
        <v-card class="mx-auto">
          <v-img
            class="white--text align-end"
            height="400px"
            src="~@/assets/images/octofarm-splash.png"
          >
            <v-card-title>About OctoFarm</v-card-title>
          </v-img>
          <v-tabs v-model="tab" centered dark icons-and-text>
            <v-tabs-slider></v-tabs-slider>

            <v-tab href="#tab-who">
              Who?
              <v-icon>mdi-account-box</v-icon>
            </v-tab>

            <v-tab href="#tab-what">
              What?
              <v-icon>mdi-phone</v-icon>
            </v-tab>

            <v-tab href="#tab-where">
              Where?
              <v-icon>mdi-heart</v-icon>
            </v-tab>

            <v-tab href="#tab-why">
              Why?
              <v-icon>mdi-account-box</v-icon>
            </v-tab>
            <v-tab href="#tab-how">
              How?
              <v-icon>mdi-account-box</v-icon>
            </v-tab>
          </v-tabs>

          <v-tabs-items v-model="tab">
            <v-tab-item key="0" :value="'tab-who'">
              <v-card flat>
                <v-card-text>
                  <v-card-subtitle class="pb-0">
                    Who Made OctoFarm?
                  </v-card-subtitle>
                  <v-card-text class="text--primary">
                    <v-card class="mx-auto" max-width="434" tile>
                      <v-img
                        height="100%"
                        src="https://cdn.vuetifyjs.com/images/cards/server-room.jpg"
                      >
                        <v-row align="end" class="fill-height">
                          <v-col align-self="start" class="pa-0" cols="12">
                            <v-avatar
                              class="profile"
                              color="grey"
                              size="164"
                              tile
                            >
                              <v-img
                                src="https://cdn.vuetifyjs.com/images/profiles/marcus.jpg"
                              ></v-img>
                            </v-avatar>
                          </v-col>
                          <v-col class="py-0">
                            <v-list-item color="rgba(0, 0, 0, .4)" dark>
                              <v-list-item-content>
                                <v-list-item-title class="title">
                                  Marcus Obrien
                                </v-list-item-title>
                                <v-list-item-subtitle
                                  >Network Engineer</v-list-item-subtitle
                                >
                              </v-list-item-content>
                            </v-list-item>
                          </v-col>
                        </v-row>
                      </v-img>
                    </v-card>
                  </v-card-text>
                </v-card-text>
              </v-card>
            </v-tab-item>
            <v-tab-item key="1" :value="'tab-what'">
              <v-card flat>
                <v-card-text></v-card-text>
              </v-card>
            </v-tab-item>
            <v-tab-item key="2" :value="'tab-where'">
              <v-card flat>
                <v-card-text></v-card-text>
              </v-card>
            </v-tab-item>
            <v-tab-item key="3" :value="'tab-why'">
              <v-card flat>
                <v-card-text></v-card-text>
              </v-card>
            </v-tab-item>
            <v-tab-item key="4" :value="'tab-how'">
              <v-card flat>
                <v-card-text></v-card-text>
              </v-card>
            </v-tab-item>
          </v-tabs-items>

          <v-card-actions>
            <v-btn
              color="red"
              text
              href="https://www.patreon.com/bePatron?u=19808757"
              target="_blank"
            >
              Become a Patreon!
            </v-btn>

            <v-btn
              color="blue"
              text
              href="https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=QGBJML3E7268L&source=url"
              target="_blank"
            >
              Paypal Donation!
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  data: () => ({
    tab: null,
    text: "TET"
  })
};
</script>
