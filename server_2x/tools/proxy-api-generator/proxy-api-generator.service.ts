import * as fs from "fs";
import {transform} from 'json-to-typescript';
import {HttpService, Inject, Injectable} from "@nestjs/common";
import {OctoPrintClientService} from "../../src/octoprint/services/octoprint-client.service";
import * as path from "path";
import {Observable} from "rxjs";
import {OctoPrintConfig} from "../../src/octoprint/octoprint.config";
import {ConfigType} from "@nestjs/config";

@Injectable()
export class ProxyApiGeneratorService {
    private outputFolder: string;

    constructor(
        private httpService: HttpService,
        private octoprint: OctoPrintClientService,
        @Inject(OctoPrintConfig.KEY) private testPrinterConnectionParams: ConfigType<typeof OctoPrintConfig>,
    ) {
    }

    async generateSchemas(folder: string) {
        const params = this.testPrinterConnectionParams;
        this.outputFolder = path.join(folder, "temp");
        this.generateOutputFolder();

        await this.generateSchema(
            this.octoprint.getSettings(params),
            "octoprint-settings.dto.ts",
            "OctoPrintSettingsDto"
        );

        await this.generateSchema(
            this.octoprint.getCurrentUser(params),
            "octoprint-currentuser.dto.ts",
            "OctoPrintCurrentUserDto"
        );

        await this.generateSchema(
            this.octoprint.loginUserSession(params),
            "octoprint-session.dto.ts",
            "OctoPrintSessionDto"
        );
    }

    generateSchema(callable$: Observable<any>, tsName: string, interfaceName: string) {
        return callable$.toPromise().then(result => {
            const schemaDtoFile = path.join(this.outputFolder, tsName);
            transform(interfaceName, result)
                .then(transformation => {
                    fs.writeFileSync(schemaDtoFile, transformation);
                });
        });
    }

    private generateOutputFolder() {
        if (!fs.existsSync(this.outputFolder)) {
            console.log("Creating folder", path.resolve(this.outputFolder));
            fs.mkdirSync(this.outputFolder, {recursive: true});
        }
    }
}