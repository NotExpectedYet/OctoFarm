const { JobClean } = require("../../../server_src/state/data/jobClean");
const { DateTime } = require("luxon");

// Before luxon
function legacyUUTGetCompletionDate(printTimeLeft, completion) {
  let currentDate = new Date();
  let dateComplete = "";
  if (completion === 100) {
    dateComplete = "No Active Job";
  } else {
    currentDate = currentDate.getTime();
    const futureDateString = new Date(currentDate + printTimeLeft * 1000).toDateString();
    let futureTimeString = new Date(currentDate + printTimeLeft * 1000).toTimeString();
    futureTimeString = futureTimeString.substring(0, 5);
    dateComplete = `${futureDateString}: ${futureTimeString}`;
  }
  return dateComplete;
}

describe("getCompletionDate", function () {
  it("should calculate formatted completion date", async function () {
    const completionDate = JobClean.getCompletionDate(10, 99);
    expect(completionDate).toBeTruthy();
    const cutoffDate = completionDate.substring(0, completionDate.length - 1 - 4);
    const refCutoffDate = legacyUUTGetCompletionDate(10, 99).substring(
      0,
      completionDate.length - 1 - 4
    );
    expect(cutoffDate).toEqual(refCutoffDate);
  });

  it("should generate printer job report", async function () {
    const copiedFileName = "bla.geezcode";
    const printer = {
      fileList: {
        files: [
          {
            name: copiedFileName // Crucial?
          }
        ]
      },
      job: {
        file: {
          name: copiedFileName // Crucial?
        }
      },
      sortIndex: 0, // This is apparently crucial, but no error?
      systemChecks: {
        cleaning: {
          job: {} // Crucial?
        }
      }
    };
    const result = JobClean.generate(printer, null);
    expect(result).toBeUndefined();
    expect(JobClean.getCleanJobAtIndex(0).fileName).toEqual(copiedFileName);
    expect(JobClean.getCleanJobAtIndex(1)).toBeUndefined();
  });
});
