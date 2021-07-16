<template>
  <small>{{ timeSince }}</small>
</template>

<script>
export default {
  name: "TimeSince",
  props: ["timeSet"],
  data() {
    return {
      timeSince: 0,
      interval: false
    };
  },
  methods: {
    generate_time_since(that) {
      let date = new Date(that.timeSet);

      var seconds = Math.floor((new Date() - date) / 1000);

      var interval = seconds / 31536000;

      if (interval > 1) {
        return Math.floor(interval) + " years";
      }
      interval = seconds / 2592000;
      if (interval > 1) {
        return Math.floor(interval) + " months";
      }
      interval = seconds / 86400;
      if (interval > 1) {
        return Math.floor(interval) + " days";
      }
      interval = seconds / 3600;
      if (interval > 1) {
        return Math.floor(interval) + " hours";
      }
      interval = seconds / 60;
      if (interval > 1) {
        return Math.floor(interval) + " minutes";
      }
      that.timeSince = Math.floor(seconds) + " seconds";
    }
  },
  beforeMount: function() {
    let that = this;

    if (!this.interval) {
      that.generate_time_since(that);
      that.interval = setInterval(function() {
        that.generate_time_since(that);
      }, 500);
    }
  },
  beforeDestroy: function() {
    if (this.interval) {
      this.timeSince = null;
      delete this.timeSince;
      clearInterval(this.interval);
      this.interval = null;
      delete this.interval;
    }
  }
};
</script>
