import "dotenv/config";

export default {
    development: {
        username: process.env.DBUSER,
        password: process.env.DBPASSWORD,
        database: process.env.DBDATABASE,
        host: process.env.DBHOST,
        dialect: "mysql",
    },
};
