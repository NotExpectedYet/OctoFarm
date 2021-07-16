// Test or example task
// TaskManager.registerPeriodicJob(
//   "unique_test_task1",
//   async () => {
//     await new Promise((resolve) => {
//       setTimeout(() => resolve(), 9000);
//     });
//   },
//   {
//   PERIODIC_TASK_PRESET_2500MS
// );

class TASK_PRESETS {
  static PERIODIC = {
    periodic: true,
    logFirstCompletion: true,
    runImmediately: false // Just like setInterval
  };

  static PERIODIC_2500MS = {
    ...this.PERIODIC,
    milliseconds: 2500
  };

  static RUNONCE = {
    runOnce: true, // not optional
    logFirstCompletion: true,
    runImmediately: true
  };

  static RUNDELAYED = {
    runDelayed: true, // not optional
    logFirstCompletion: true,
    runImmediately: false,
    seconds: 0 // other timing units will be ignored (by design)
  };
}

module.exports = {
  TaskPresets: TASK_PRESETS
};
