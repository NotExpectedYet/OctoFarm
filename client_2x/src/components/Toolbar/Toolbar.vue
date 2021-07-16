<template>
  <nav>
    <v-app-bar
      flat
      app
      dense
    >
      <v-app-bar-nav-icon @click.stop="mini = !mini" />
      <h1> {{ this.$route.name }} </h1> 
      <v-spacer />
      <!--      <UserNotifications />-->
      <!--      <UserMenu />-->
    </v-app-bar>
    <v-navigation-drawer
      app
      :mini-variant="mini"
      permanent
    >
      <Navigation @update_nav_drawer="update_drawer" />
    </v-navigation-drawer>
  </nav>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'
import Navigation from "./Navigation.vue"
// import UserMenu from "@/components/Toolbar/UserMenu";
// import UserNotifications from "@/components/Toolbar/UserNotifications";

@Component({
  name: "Toolbar",
  components: {
      Navigation
  }
})
export default class Toolbar extends Vue {
    private mini = true
    private menu_reload_key = 0
    private update_drawer(toggle: boolean): void {
        this.mini = toggle
    }
}
</script>
