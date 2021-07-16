/**
 * Unit under test and under conversion
 * @param history
 * @returns {{path: null, uploadDate: null, size: null, lastPrintTime: null, name: *, averagePrintTime: null}}
 */
function legacyGetFile(history) {
  const file = {
    name: history.fileName,
    uploadDate: null,
    path: null,
    size: null,
    averagePrintTime: null,
    lastPrintTime: null
  };
  if (typeof history.job !== "undefined" && typeof history.job.file) {
    file.uploadDate = history.job.file.date;
    file.path = history.job.file.path;
    file.size = history.job.file.size;
    file.averagePrintTime = history.job.averagePrintTime;
    file.lastPrintTime = history.job.lastPrintTime;
  } else {
    file.path = history.filePath;
  }
  return file;
}

describe("getFile_unmocked", function () {
  const realHistoryService = jest.requireActual(
    "../../../server_src/services/history.service"
  );
  it("should tolerate on empty input or props as input", () => {
    const testInput = {};
    expect(
      realHistoryService.getFileFromHistoricJob(testInput).path
    ).toBeUndefined();
    expect(legacyGetFile(testInput).path).toBeUndefined();
  });
  it("should throw non-friendly exception for non-object input", () => {
    const errorMessage = "Cannot read property 'fileName' of undefined";
    expect(realHistoryService.getFileFromHistoricJob).toThrow(errorMessage);
    expect(legacyGetFile).toThrow(errorMessage);
  });
  it("should be fine for any 'filePath' and 'fileName' property input", () => {
    const inputUnderTest = { fileName: null };
    const resultUnderSpec =
      realHistoryService.getFileFromHistoricJob(inputUnderTest);
    const resultLegacyUnderSpec = legacyGetFile({ fileName: null });
    expect(resultUnderSpec).toBeTruthy();
    expect(resultLegacyUnderSpec).toBeTruthy();
    expect(resultLegacyUnderSpec).toEqual(resultUnderSpec);
  });
  it("", () => {
    const inputUnderTest = { fileName: null, filePath: null };
    const resultUnderSpec =
      realHistoryService.getFileFromHistoricJob(inputUnderTest);
    Object.entries(resultUnderSpec).forEach((e) => {
      // TODO fileName and filePath are not nullified!
      expect(e[1]).toBeNull();
    });
  });
});
