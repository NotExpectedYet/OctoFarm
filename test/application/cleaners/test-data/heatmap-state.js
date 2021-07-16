const dayName = new Intl.DateTimeFormat(["en"], {
  weekday: "long" // ?? what should I put here
}).format(new Date());

module.exports = {
  zeroedHeatMap: [
    {
      name: "Completed",
      data: [
        {
          x: dayName,
          y: 0,
          figure: 0
        }
      ]
    },
    {
      name: "Active",
      data: [
        {
          x: dayName,
          y: 0,
          figure: 0
        }
      ]
    },
    {
      name: "Idle",
      data: [
        {
          x: dayName,
          y: 0,
          figure: 0
        }
      ]
    },
    {
      name: "Offline",
      data: [
        {
          x: "Friday",
          y: 0,
          figure: 0
        }
      ]
    },
    {
      name: "Disconnected",
      data: [
        {
          x: dayName,
          y: 0,
          figure: 0
        }
      ]
    }
  ],
  nanFigureHeatmap: [
    {
      name: "Completed",
      data: [
        {
          x: dayName,
          y: 0,
          figure: NaN
        }
      ]
    },
    {
      name: "Active",
      data: [
        {
          x: dayName,
          y: 0,
          figure: NaN
        }
      ]
    },
    {
      name: "Idle",
      data: [
        {
          x: dayName,
          y: 0,
          figure: NaN
        }
      ]
    },
    {
      name: "Offline",
      data: [
        {
          x: dayName,
          y: 0,
          figure: NaN
        }
      ]
    },
    {
      name: "Disconnected",
      data: [
        {
          x: dayName,
          y: 0,
          figure: NaN
        }
      ]
    }
  ]
};
