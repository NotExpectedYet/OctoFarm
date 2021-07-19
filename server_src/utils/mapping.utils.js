function mapProgressToColor(progress) {
  progress = parseInt(progress);
  if (progress === 0) {
    return "dark";
  }
  if (progress < 25) {
    return "secondary";
  }
  if (progress >= 25 && progress <= 50) {
    return "primary";
  }
  if (progress > 50 && progress <= 75) {
    return "info";
  }
  if (progress > 75 && progress < 100) {
    return "warning";
  }
  if (progress === 100) {
    return "success";
  }
}

function checkTempRange(state, target, actual, heatingVariation, coolDown) {
  if (state === "Active" || state === "Idle") {
    if (
      actual > target - parseInt(heatingVariation) &&
      actual < target + parseInt(heatingVariation)
    ) {
      return "tempSuccess";
    }
    return "tempActive";
  }
  if (state === "Complete") {
    if (actual > parseInt(coolDown)) {
      return "tempCooling";
    }
    return "tempCool";
  }
  // Offline
  return "tempOffline";
}

module.exports = {
  mapProgressToColor,
  checkTempRange
};
