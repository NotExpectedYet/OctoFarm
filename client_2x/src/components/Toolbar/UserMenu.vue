<template>
  <div class="text-center">
    <v-menu class="ml-5" :close-on-content-click="false" offset-y>
      <template v-slot:activator="{ on, attrs }">
        <v-btn v-bind="attrs" v-on="on" color="primary" x-small fab>
          <v-icon>mdi-account-circle</v-icon>
        </v-btn>
      </template>

      <v-card>
        <v-list>
          <v-list-item>
            <v-list-item-avatar>
              <img src="https://cdn.vuetifyjs.com/images/john.jpg" alt="John" />
            </v-list-item-avatar>

            <v-list-item-content>
              <v-list-item-title>James Mackay</v-list-item-title>
              <v-list-item-subtitle>Administrator</v-list-item-subtitle>
            </v-list-item-content>

            <v-list-item-action>
              <v-btn>
                <v-icon>mdi-cog</v-icon>
              </v-btn>
            </v-list-item-action>
          </v-list-item>
        </v-list>

        <v-divider></v-divider>
      </v-card>
    </v-menu>
  </div>
</template>

<script>
export default {
  name: "UserMenu",
  data: () => ({})
};
</script>
