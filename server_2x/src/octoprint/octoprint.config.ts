import {registerAs} from "@nestjs/config";
import {RestConnectionParams} from "./models/rest-connection.params";
import {Logger} from "@nestjs/common";

export const TEST_PRINTER_URL = "TEST_PRINTER_URL";
export const TEST_PRINTER_KEY = "TEST_PRINTER_KEY";

export const OCTOPRINT_CONFIG = "OCTOPRINT_CONFIG_KEY";

function getEnvTestPrinter(): RestConnectionParams {
    const envTestPrinterURL = process.env[TEST_PRINTER_URL];
    const envTestPrinterKey = process.env[TEST_PRINTER_KEY];

    if (!!envTestPrinterURL && !!envTestPrinterKey) {
        return new RestConnectionParams(envTestPrinterURL, envTestPrinterKey);
    } else return null;
}

export const OctoPrintConfig = registerAs(OCTOPRINT_CONFIG, () => {
    const testPrinterConnectionParams = getEnvTestPrinter();
    if (!testPrinterConnectionParams) {
        new Logger().warn(
            `You have registered a test octoprint connection sucessfully with environment variables
                url:${TEST_PRINTER_URL} and key:****!`);
    }
    return testPrinterConnectionParams;
});