/**
 * Get last thirty days in a text array
 * @returns {*[]}
 */
export function getLastThirtyDaysText() {
  let today = new Date();
  today = new Date(today);

  let lastThirtyDays = [];
  for (let i = 0; i < 30; i++) {
    let day = (i + 1) * 1000;
    let previousDay = new Date(today - day * 60 * 60 * 24 * 2);
    lastThirtyDays.push(previousDay);
  }

  lastThirtyDays.sort();
  let lastThirtyDaysText = [];
  lastThirtyDays.forEach((day) => {
    lastThirtyDaysText.push(day.getTime());
  });

  return lastThirtyDaysText;
}

export function timeDifference(current, previous) {
  const msPerMinute = 60 * 1000;
  const msPerHour = msPerMinute * 60;
  const msPerDay = msPerHour * 24;
  const msPerMonth = msPerDay * 30;
  const msPerYear = msPerDay * 365;

  const elapsed = current - previous;

  if (elapsed < msPerMinute) {
    return Math.round(elapsed / 1000) + " sec. ago";
  } else if (elapsed < msPerHour) {
    return Math.round(elapsed / msPerMinute) + " min. ago";
  } else if (elapsed < msPerDay) {
    return Math.round(elapsed / msPerHour) + " hours ago";
  } else if (elapsed < msPerMonth) {
    return Math.round(elapsed / msPerDay) + " days ago";
  } else if (elapsed < msPerYear) {
    return Math.round(elapsed / msPerMonth) + " months ago";
  } else {
    return Math.round(elapsed / msPerYear) + " years ago";
  }
}

export function secondsToTime(time) {
  const sec_num = time;
  let hours = Math.floor(sec_num / 3600);
  let minutes = Math.floor((sec_num - hours * 3600) / 60);
  let seconds = sec_num - hours * 3600 - minutes * 60;

  if (hours < 10) {
    hours = "0" + hours;
  }
  if (minutes < 10) {
    minutes = "0" + minutes;
  }
  if (seconds < 10) {
    seconds = "0" + seconds?.toFixed(0);
  } else {
    seconds = seconds?.toFixed(0);
  }
  return hours + ":" + minutes + ":" + seconds;
}
