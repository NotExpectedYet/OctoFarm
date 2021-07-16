module.exports = {
    "type": "mongodb",
    "synchronize": true,
    "hostname": process.env.TYPEORM_HOSTNAME || "host.docker.internal",
    "database": process.env.TYPEORM_DATABASE || "octofarm2",
    "username": process.env.TYPEORM_USERNAME || "root",
    "password": process.env.TYPEORM_PASSWORD || "",
    "port": process.env.TYPEORM_PORT || 27017,
    "autoLoadEntities": true,
    "useNewUrlParser": true,
    "useUnifiedTopology": true,
    "authSource": "admin",
    "driverExtra": {
        "authSource": process.env.TYPEORM_AUTHSOURCE || "admin"
    },
    "entities": [
        "dist/**/*.entity{.ts,.js}"
    ],
    "subscribers": [
        "dist/**/*.subscriber{.ts,.js}"
    ],
    "migrations": [
        "dist/**/*.migration{.ts,.js}"
    ],
    "cli": {
        "entitiesDir": "src/entity/*",
        "migrationsDir": "src/migration/*",
        "subscribersDir": "src/subscriber/*"
    }
};