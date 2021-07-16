const printerGroupService = require("../../server_src/services/printer-group.service");
const printerService = require("../../server_src/services/printer.service");
const printerGroupModel = require("../../server_src/models/PrinterGroup");
const dbHandler = require("../db-handler");
const { PrinterGroupMockData } = require("./mock-data/printer-group.data");
/**
 * Connect to a new in-memory database before running any tests.
 */
beforeAll(async () => {
  await dbHandler.connect();
});

/**
 * Clear all test data after every test.
 */
afterEach(async () => {
  await dbHandler.clearDatabase();
});

/**
 * Remove and close the db and server.
 */
afterAll(async () => {
  await dbHandler.closeDatabase();
});

/**
 * PrinterGrouoService test suite.
 */
describe("printerGroup ", () => {
  /**
   * Tests that a valid printer group can be created through the printerGrouoService without throwing any errors.
   */
  it("can be created correctly with printer", async () => {
    // Seed with a mock Printer DTO
    const newPrinterData = PrinterGroupMockData.PrinterMock;
    const createdPrinter = await printerService.create(newPrinterData);
    expect(createdPrinter._id).toBeTruthy();

    // Prepare the CRUD DTO
    const newPrinterGroup = PrinterGroupMockData.PrinterGroupMock;
    newPrinterGroup.printers.push(createdPrinter._id);

    // Create it
    await printerGroupService.create(newPrinterGroup);

    // Assert creation
    const createdPrinterGroup = await printerGroupModel.findOne();
    expect(createdPrinterGroup).toBeTruthy();
  });

  it("can be synced by unique printer's group values", async () => {
    const newPrinterData = PrinterGroupMockData.PrinterMockWithGroup;
    const createdPrinter = await printerService.create(newPrinterData);
    expect(createdPrinter._id).toBeTruthy();

    const groups = await printerGroupService.syncPrinterGroups();
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveProperty("printers");
    expect(groups[0].printers).toContainEqual(createdPrinter._id);
    expect(groups.errors).toBeFalsy();
  });

  it("can be synced with multiple printer's with the same group", async () => {
    const newPrinterData = PrinterGroupMockData.PrinterMockWithGroup;
    const createdPrinter = await printerService.create(newPrinterData);
    expect(createdPrinter._id).toBeTruthy();
    const createdPrinter2 = await printerService.create(newPrinterData);
    expect(createdPrinter2._id).toBeTruthy();
    expect(createdPrinter2._id).toB;

    const groups = await printerGroupService.syncPrinterGroups();
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveProperty("printers");
    expect(groups[0].printers).toHaveLength(2);
    expect(groups[0].printers).toContainEqual(createdPrinter._id);
    expect(groups.errors).toBeFalsy();
  });

  it("can be synced with multiple printer's with multiple groups", async () => {
    const newPrinterData = PrinterGroupMockData.PrinterMockWithGroup;
    const createdPrinter = await printerService.create(newPrinterData);
    expect(createdPrinter._id).toBeTruthy();
    newPrinterData.group = "anotherdifferentGroupName";
    const createdPrinter2 = await printerService.create(newPrinterData);
    expect(createdPrinter2._id).toBeTruthy();
    expect(createdPrinter2._id).toB;

    const groups = await printerGroupService.syncPrinterGroups();
    expect(groups).toHaveLength(2);
    expect(groups[0]).toHaveProperty("printers");
    expect(groups[0].printers).toHaveLength(1);
    expect(groups[1].printers).toHaveLength(1);
    expect(groups[0].printers).toContainEqual(createdPrinter._id);
    expect(groups.errors).toBeFalsy();
  });

  it("return empty array if no groups or printers are present to sync up", async () => {
    const groups = await printerGroupService.syncPrinterGroups();
    expect(groups).toHaveLength(0);
    expect(groups.errors).toBeFalsy();
  });
});
