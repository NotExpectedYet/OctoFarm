import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module";
import {INestApplication, Logger, ValidationPipe} from "@nestjs/common";
import {D, Y} from "./utils/logging.util";
import {NestExpressApplication} from '@nestjs/platform-express';
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";
import {ValidationException} from "./providers/validation.exception";
import {FallbackModule} from "./fallback.module";
import * as session from 'express-session';
import * as expressLayouts from 'express-ejs-layouts';
import {join} from "path";
import {ApiService} from "./api/api.service";
import {MongoClient as IMongoClient} from "typeorm";
import {MongoClient} from "mongodb";
import * as cookieParser from "cookie-parser";
import * as flash from "connect-flash";
import {WsAdapter} from "@nestjs/platform-ws";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const db = require("../ormconfig");

const APP_HOST = "127.0.0.1";
const APP_PORT = process.env.OCTOFARM_PORT || 3000;
const logger = new Logger("Main");

function AddSwagger(app: INestApplication): INestApplication {
    const config = new DocumentBuilder()
        .setTitle("OctoFarm2 API docs")
        .setDescription("OctoFarm public API description")
        .setVersion(process.env.npm_package_version)
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api", app, document);

    return app;
}

function printPreBootMessage(error = null) {
    logger.log(`OctoFarm2 ${Y}v${process.env.npm_package_version}${D}`);
    logger.log(`NodeJS ${Y}${process.version}${D}`);
    const startDate = new Date().toDateString();
    const startTime = new Date().toLocaleTimeString();
    const startMoment = `at ${Y}${startTime}${D} on ${Y}${startDate}${D}`;
    if (!error) {
        logger.log(`Booted ${startMoment}!`);
    } else {
        logger.error(error);
        logger.error(`Booted in SAFE MODE with a startup error at ${startMoment}! Please visit http://${APP_HOST}:${APP_PORT} to see more.`);
    }
}

function printPostBootMessage(logger: Logger) {
    logger.log(`Server is listening on http://${APP_HOST}:${APP_PORT}`);
    logger.log(`${Y}Happy printing!${D}`);
}

async function testDatabase() {
    // Test yourself before you wreck yourself
    const typedMongoClient = MongoClient;
    const url = `${db.type}://${db.username}:${db.password}@${db.hostname}/${db.database}?authSource=admin`;
    const result = await typedMongoClient.connect(url);
    await result.close();
    logger.log("Database connection test was a great success! Seems like it's your day today.");
    return;
}

function legacyMiddleware(app: NestExpressApplication) {
    // Bodyparser
    app.use(cookieParser());
    // app.use(express.urlencoded({extended: false}));

    // Express Session Middleware
    app.use(
        session({
            secret: "supersecret",
            resave: true,
            saveUninitialized: true,
        }),
    );
    // app.use(passport.initialize());
    // app.use(passport.session());
    // app.use(passport.authenticate("remember-me"));
    app.use(flash());
    // Global Vars
    app.use((req, res, next) => {
        res.locals.success_msg = req.flash("success_msg");
        res.locals.error_msg = req.flash("error_msg");
        res.locals.error = req.flash("error");
        next();
    });
    app.use(expressLayouts);
    process.env.OCTOFARM_VERSION = `${process.env.NPM_PACKAGE_VERSION}`;

    const assetsPath = join(__dirname, '../..', 'assets', 'public');
    app.useStaticAssets(assetsPath);
    logger.log(Y + "Hosting legacy assets on " + D + assetsPath);
}

function logRoutes(app: INestApplication) {
    const server = app.getHttpServer();
    const router = server._events.request._router;

    const availableRoutes: [] = router.stack
        .map(layer => {
            if (layer.route) {
                return {
                    route: {
                        path: layer.route?.path,
                        method: layer.route?.stack[0].method,
                    },
                };
            }
        })
        .filter(item => item !== undefined);

    // Logger wraps objects, so use console for debugging
    // TODO build own centralized logger which can filter, split and log to files (or find pacakge for it)
    console.log(availableRoutes);
    logger.warn("Want to suppress API/MVC routes? Remove or set the env variable 'PRINT_ROUTES_DEBUG' to anything but 'true'");
}

async function bootstrap<T>(Module: T) {
    const app = await NestFactory.create<NestExpressApplication>(Module, {
        logger: ["error", "warn", "log"],
        abortOnError: true
    });

    app.enableCors();
    app.setBaseViewsDir('views');
    app.setViewEngine('ejs');

    app.useWebSocketAdapter(new WsAdapter(app));

    legacyMiddleware(app);
    app.useGlobalPipes(new ValidationPipe({
        exceptionFactory: (errors) => new ValidationException(errors, "API"),
        whitelist: true
    }));
    AddSwagger(app);

    await app.listen(APP_PORT, APP_HOST, async () => {
        await printPostBootMessage(logger);
        if (process.env["PRINT_ROUTES_DEBUG"] === "true") {
            logRoutes(app);
        }
    });
}

testDatabase()
    .then(() => {
        printPreBootMessage();
        bootstrap(AppModule).then();
    }, error => {
        // Our database test failed
        printPreBootMessage(error);
        ApiService.databaseStartupErrorOccurred = true; // dirty way of propagating the error inside the app...
        bootstrap(FallbackModule).then();
    });
