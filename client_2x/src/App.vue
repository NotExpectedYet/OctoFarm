<template>
  <v-app>
    <Toolbar />
    <!-- Sizes your content based upon application components -->
    <v-main>
      <!-- Provides the application the proper gutter -->
      <v-container fluid>
        <!-- If using vue-router -->
        <router-view></router-view>
      </v-container>
    </v-main>

    <v-footer app>
      <!-- -->
    </v-footer>
  </v-app>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Toolbar from "@/components/Toolbar/Toolbar.vue";

@Component({
  name: "OctoFarm",
  components: {
    Toolbar
  }
})
export default class OctoFarm extends Vue {

}
</script>

<style>
main {
  background-color: black;
  background-image: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)),
    url("../src/assets/images/bg.jpg");
  background-attachment: fixed;
  background-repeat: no-repeat;
  -webkit-background-size: cover;
  -moz-background-size: cover;
  -o-background-size: cover;
  background-size: cover;
  background-position: center;
}
</style>
