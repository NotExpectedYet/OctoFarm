<template>
  <v-col>
    <v-data-table
      :headers="headers"
      :items="printers"
      sort-by="sort"
      class="elevation-1"
    >
      <template v-slot:top>
        <v-toolbar
          flat
          dense
        >
          <v-toolbar-title>
            <v-icon>mdi-printer-3d</v-icon>
          </v-toolbar-title>
          <v-divider
            class="mx-4"
            inset
            vertical
          />
          <v-spacer />
          <v-dialog
            v-model="dialog"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                color="success"
                class="ma-1"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>mdi-plus</v-icon> Add
              </v-btn>
            </template>
            <v-card>
              <v-card-title>
                <span class="headline">{{ formTitle }}</span>
              </v-card-title>

              <v-card-text>
                <v-container>
                  <v-row>
                    <v-col
                      cols="12"
                      sm="6"
                      md="4"
                    >
                      <v-text-field
                        v-model="editedItem.name"
                        label="Dessert name"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      sm="6"
                      md="4"
                    >
                      <v-text-field
                        v-model="editedItem.printer_url"
                        label="Printer URL"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      sm="6"
                      md="4"
                    >
                      <v-text-field
                        v-model="editedItem.groups"
                        label="Groups"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      sm="6"
                      md="4"
                    >
                      <v-text-field
                        v-model="editedItem.cam_url"
                        label="Camera URL"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      sm="6"
                      md="4"
                    >
                      <v-text-field
                        v-model="editedItem.apikey"
                        label="API KEY"
                      />
                    </v-col>
                  </v-row>
                </v-container>
              </v-card-text>

              <v-card-actions>
                <v-spacer />
                <v-btn
                  color="blue darken-1"
                  text
                  @click="close"
                >
                  Cancel
                </v-btn>
                <v-btn
                  color="blue darken-1"
                  text
                  @click="save"
                >
                  Save
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                color="info"
                class="ma-1"
                v-bind="attrs"
                v-on="on"
              >
                <v-icon>mdi-application-import</v-icon> Import
              </v-btn>
            </template>
            <span>Import your current printer list</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                color="warning"
                class="ma-1"

                v-bind="attrs"
                v-on="on"
              >
                <v-icon>mdi-application-export</v-icon> Export
              </v-btn>
            </template>
            <span>Export your current printer list</span>
          </v-tooltip>
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <v-btn
                color="success"
                class="ma-1"

                v-bind="attrs"
                v-on="on"
              >
                <v-icon>mdi-printer-3d-nozzle</v-icon> Search
              </v-btn>
            </template>
            <span>Attempt a network scan to find local printers</span>
          </v-tooltip>

          <v-dialog
            v-model="dialogDelete"
            max-width="500px"
          >
            <v-card>
              <v-card-title
                class="headline"
              >
                Are you sure you want to delete this item?
              </v-card-title>
              <v-card-actions>
                <v-spacer />
                <v-btn
                  color="blue darken-1"
                  text
                  @click="closeDelete"
                >
                  Cancel
                </v-btn>
                <v-btn
                  color="blue darken-1"
                  text
                  @click="deleteItemConfirm"
                >
                  OK
                </v-btn>
                <v-spacer />
              </v-card-actions>
            </v-card>
          </v-dialog>
        </v-toolbar>
      </template>
      <template v-slot:item.actions="{ item }">
        <v-icon
          small
          color="warning"
          @click="editItem(item)"
        >
          mdi-pencil
        </v-icon>
        <v-icon
          small
          color="error"
          @click="deleteItem(item)"
        >
          mdi-delete
        </v-icon>
      </template>
      <template v-slot:no-data>
        <h1>Please add some printers to get started</h1>
      </template>
    </v-data-table>
  </v-col>
</template>

<script>
export default {
  name: "Navigation",
  props: {
    printers: {
      type: Array,
    },
  },
  data: () => ({
    dialog: false,
    dialogDelete: false,
    headers: [
      {
        text: "Sort",
        align: "start",
        sortable: true,
        value: "sort_index",
      },
      { text: "Name", value: "name" },
      { text: "Control", value: "controls" },
      { text: "Manage", value: "manage" },
      { text: "Host State", value: "host_state" },
      { text: "Printer State", value: "printer_state" },
      { text: "WebSocket", value: "websocket_state" },
      { text: "Groups", value: "groups" },
      { text: "Firmware", value: "printer_firmware" },
      { text: "OctoPrint", value: "octoprint_version" },
      { text: "Actions", value: "actions" },
    ],
    editedIndex: -1,
    editedItem: {
      name: "",
      url: "",
      groups: "",
      camera_url: 0,
      apikey: 0,
    },
    defaultItem: {
      name: "",
      calories: 0,
      fat: 0,
      carbs: 0,
      protein: 0,
    },
  }),

  computed: {
    formTitle() {
      return this.editedIndex === -1 ? "New Item" : "Edit Item";
    },
  },

  watch: {
    dialog() {
      // val || this.close();
    },
    dialogDelete() {
      // val || this.closeDelete();
    },
  },

  created() {
    this.initialize();
  },
  methods: {
    initialize() {
    },

    editItem(item) {
      this.editedIndex = this.printers.indexOf(item);
      this.editedItem = { ...item };
      this.dialog = true;
    },

    deleteItem(item) {
      this.editedIndex = this.printers.indexOf(item);
      this.editedItem = { ...item };
      this.dialogDelete = true;
    },

    deleteItemConfirm() {
      this.printers.splice(this.editedIndex, 1);
      this.closeDelete();
    },

    close() {
      this.dialog = false;
      this.$nextTick(() => {
        this.editedItem = { ...this.defaultItem };
        this.editedIndex = -1;
      });
    },

    closeDelete() {
      this.dialogDelete = false;
      this.$nextTick(() => {
        this.editedItem = { ...this.defaultItem };
        this.editedIndex = -1;
      });
    },

    save() {
      if (this.editedIndex > -1) {
        Object.assign(this.printers[this.editedIndex], this.editedItem);
      } else {
        this.printers.push(this.editedItem);
      }
      this.close();
    },
  },
};
</script>
