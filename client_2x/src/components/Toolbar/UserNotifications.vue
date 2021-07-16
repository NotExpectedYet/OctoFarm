<template>
  <v-menu
    transition="slide-y-transition"
    bottom
    offset-y
    :close-on-content-click="closeOnContentClick"
  >
    <template v-slot:activator="{ on }">
      <v-btn
        icon
        v-on="on"
        @click="forceRerender"
      >
        <v-icon color="primary">
          mdi-bell
        </v-icon>
      </v-btn>
    </template>
    <v-card class="mx-auto">
      <v-subheader>Notifications</v-subheader>

      <v-list two-line>
        <v-list-item-group multiple>
          <template v-for="item in notifications">
            <v-alert
              :type="item.type"
              :icon="item.icon"
              :key="item.index"
              dense
              outlined
              dismissible
              colored-border
              border="left"
              transition="scale-transition"
            >
              <v-row align="center">
                <v-col class="grow">
                  <p class="mb-0 pb-0">
                    {{ item.message }}
                  </p>
                </v-col>
                <v-col class="shrink">
                  <v-subheader>
                    <time-since
                      :time-set="item.date"
                    />
                  </v-subheader>
                </v-col>
              </v-row>
            </v-alert>
          </template>
        </v-list-item-group>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script>
import TimeSince from "@/components/Functions/Date and Time/TimeSince.vue";

export default {
  name: "UserNotifications",
  components: { "time-since": TimeSince },
  data: () => ({
    closeOnContentClick: false,
    notifications: [
      {
        index: 0,
        _id: "yadadadadwa",
        seen: false,
        hidden: false,
        icon: "mdi-printer-3d-nozzle-alert",
        type: "success",
        date: new Date(),
        message: "Bob Saget has finished printing",
      },
      {
        index: 1,
        _id: "yadadeadada",
        seen: false,
        hidden: false,
        icon: "mdi-printer-3d-nozzle-alert",
        type: "success",
        date: new Date(),
        message: "Bob Saget has finished printing",
      },
      {
        index: 3,
        _id: "yadadawedada",
        seen: false,
        hidden: false,
        icon: "mdi-printer-3d-nozzle-alert",
        type: "success",
        date: new Date(),
        message: "Bob Saget has finished printing",
      },
      {
        index: 4,
        _id: "yadadadsdaada",
        seen: false,
        hidden: false,
        icon: "mdi-printer-3d-nozzle-alert",
        type: "success",
        date: new Date(),
        message: "Bob Saget has finished printing",
      },
      {
        index: 5,
        _id: "yadadadadfda",
        seen: false,
        hidden: false,
        icon: "mdi-printer-3d-nozzle-alert",
        type: "success",
        date: new Date(),
        message: "Bob Saget has finished printing",
      },
      {
        index: 6,
        _id: "yadadadsdfada",
        seen: false,
        hidden: false,
        icon: "mdi-printer-3d-nozzle-alert",
        type: "success",
        date: new Date(),
        message: "Bob Saget has finished printing",
      },
    ],
  }),
  methods: {
    forceRerender() {
      this.notifications.forEach((noti) => {
        noti.index += 1;
      });
    },
  },
};
</script>
