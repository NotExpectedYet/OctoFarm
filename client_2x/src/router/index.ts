import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Dashboard from "../views/Dashboard.vue";

Vue.use(VueRouter);

const routes: RouteConfig[] = [
  {
    path: "/",
    name: "Dashboard",
    component: Dashboard,
    meta: {
      icon: "mdi-view-dashboard-variant"
    }
  },
   // {
  //   path: "/schedule",
  //   name: "Scheduler",
  //   icon: "mdi-calendar-text",
  //   component: JobQueues,
  // },
  {
    name: "Monitoring",
    path: "/monitoring",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/Monitoring.vue"),
    meta: {
      icon: "mdi-eye"
    }
  },
  {
    name: "File Manager",
    path: "/file-manager",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/FileManager.vue"),
    meta: {
      icon: "mdi-file-code"
    }
  },
  {
    name: "History",
    path: "/history",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/History.vue"),
    meta: {
      icon: "mdi-history"
    }
  },
  // {
  //   name: "Stock Manager",
  //   path: "/stock",
  //   component: () =>
  //    import(/* webpackChunkName: "about" */ "../views/Monitoring.vue"),
  // meta: {
  //   icon: "mdi-warehouse"
  // }
  // },
  // {
  //   name: "Maintenance",
  //   path: "/maintenance",
  //   component: () =>
  //    import(/* webpackChunkName: "about" */ "../views/Monitoring.vue"),
  // meta: {
  //   icon: "mdi-hammer-wrench"
  // }
  // },
  {
    name: "Printer Manager",
    path: "/printers",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/admin/PrinterManager.vue"),
    meta: {
      icon: "mdi-printer-3d"
    }
  },
  {
    name: "User Accounts",
    path: "/admin/users",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/admin/UserAccounts.vue"),
    meta: {
      icon: "mdi-account-reactivate"
    }
  },
  {
    name: "Notifications",
    path: "/admin/alerts",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/admin/Notifications.vue"),
    meta: {
      icon: "mdi-shield-alert"
    }
  },
  {
    name: "System Settings",
    path: "/admin/server",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/admin/SystemSettings.vue"),
    meta: {
      icon: "mdi-cog"
    }
  },
  {
    name: "Database Manager",
    path: "/admin/database",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/admin/DatabaseManager.vue"),
    meta: {
      icon: "mdi-database-edit"
    }
  },
  {
    name: "Logs",
    path: "/admin/logs",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/admin/Logs.vue"),
    meta: {
      icon: "mdi-card-text"
    }
  },
  {
    name: "About",
    path: "/about",
    component: () =>
      import(/* webpackChunkName: "about" */ "../views/About.vue"),
    meta: {
      icon: "mdi-information"
    }
  },
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes,
});

export default router;
