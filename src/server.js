import Hapi from "@hapi/hapi";
import Vision from "@hapi/vision";
import Handlebars from "handlebars";
import Inert from "@hapi/inert";
import Yar from "@hapi/yar";
import Basic from "@hapi/basic";
import bcrypt from "bcrypt";
import { fileURLToPath } from "url";
import path from "path";
import mysql from "mysql2/promise";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const validate = async (request, username, password, h) => {
    if (username != process.env.LOGINUSER) {
        console.log("masuk");
        return { credentials: null, isValid: false };
    }

    const isValid = await bcrypt.compare(password, process.env.LOGINPASS);
    const credentials = { name: process.env.LOGINUSER };

    return { isValid, credentials };
};

const init = async () => {
    const server = Hapi.server({
        port: process.env.PORT,
        host: process.env.HOST,
        routes: {
            cors: {
                origin: ["*"],
            },
        },
    });

    await server.register(Basic);

    server.auth.strategy("simple", "basic", { validate });
    server.auth.default("simple");

    await server.register({
        plugin: Yar,
        options: {
            storeBlank: false,
            cookieOptions: {
                password: process.env.YARPASSWORD,
                isSecure: false,
            },
        },
    });

    await server.register(Vision);
    server.views({
        engines: {
            html: Handlebars,
        },
        relativeTo: __dirname,
        path: "templates",
    });

    Handlebars.registerHelper("formatTime", function (time) {
        const datetime = new Date(Date.parse(time));

        return datetime.toLocaleString("id-ID");
    });

    Handlebars.registerHelper("inc", function (value, options) {
        return parseInt(value) + 1;
    });

    await server.register(Inert);

    const pool = mysql.createPool({
        host: process.env.DBHOST,
        user: process.env.DBUSER,
        database: process.env.DBDATABASE,
        password: process.env.DBPASSWORD,
        waitForConnections: true,
        connectionLimit: 10,
    });

    server.route({
        method: "GET",
        path: "/",
        handler: async (request, h) => {
            const [results] = await pool.query("SELECT * from items ORDER BY id ASC");

            const drinks = results.filter((item) => item.type == "drink");
            const snacks = results.filter((item) => item.type == "snack");

            const flashMessages = request.yar.flash();

            const data = { drinks, snacks, flashMessages: JSON.stringify(flashMessages) };

            return h.view("index", data);
        },
    });

    server.route({
        method: "GET",
        path: "/order",
        handler: async (request, h) => {
            const [results] = await pool.query("SELECT * from items ORDER BY id ASC");

            const drinks = results.filter((item) => item.type == "drink");

            const snacks = results.filter((item) => item.type == "snack");

            const data = { drinks, snacks };
            return h.view("order", data);
        },
    });

    server.route({
        method: "POST",
        path: "/order",
        handler: async (request, h) => {
            const { drink, snack } = request.payload;
            try {
                if (drink !== "none") {
                    await pool.query("INSERT into orders (item_id) VALUES (?)", [drink]);
                    await pool.query("UPDATE items SET quantity = quantity - 1 WHERE id = ?", [drink]);
                }

                if (snack !== "none") {
                    await pool.query("INSERT into orders (item_id) VALUES (?)", [snack]);
                    await pool.query("UPDATE items SET quantity = quantity - 1 WHERE id = ?", [snack]);
                }
            } catch (e) {
                console.log(e);
            }
            request.yar.flash("success", "Order added");
            return h.redirect("/");
        },
    });

    server.route({
        method: "GET",
        path: "/history",
        handler: async (request, h) => {
            try {
                const [orders] = await pool.query(
                    `SELECT orders.created_at as time, items.name FROM orders
                    LEFT JOIN items on orders.item_id = items.id
                    ORDER BY orders.created_at DESC`
                );

                const [today] = await pool.query(
                    `select items.name, type, count(orders.id) as total from items
                    left join orders on items.id = orders.item_id
                    and DATE(orders.created_at) = CURDATE()
                    group by items.id
                    order by items.id asc;
                    `
                );
                const todayDrinks = today.filter((item) => item.type == "drink");
                const todaySnacks = today.filter((item) => item.type == "snack");

                const [all] = await pool.query(
                    `select items.name, type, count(orders.id) as total from items
                    left join orders on items.id = orders.item_id
                    group by items.id
                    order by items.id asc;
                    `
                );
                const allDrinks = all.filter((item) => item.type == "drink");
                const allSnacks = all.filter((item) => item.type == "snack");

                const data = { orders, todayDrinks, todaySnacks, allDrinks, allSnacks };

                return h.view("history", data);
            } catch (e) {
                console.log(e);
            }
        },
    });

    server.route({
        method: "GET",
        path: "/stock",
        handler: async (request, h) => {
            const [items] = await pool.query("SELECT * from items ORDER BY id ASC");

            const drinks = items.filter((item) => item.type == "drink");

            const snacks = items.filter((item) => item.type == "snack");

            const data = { drinks, snacks };
            return h.view("stock", data);
        },
    });

    server.route({
        method: "POST",
        path: "/stock",
        handler: async (request, h) => {
            const payload = request.payload;

            await Promise.all(
                Object.keys(payload).map(async function (key) {
                    console.log(key + " - " + payload[key]);

                    const stockQuantity = parseInt(payload[key]);
                    if (stockQuantity > 0 || stockQuantity < 0) {
                        const result = await pool.query("UPDATE items set quantity = quantity + ? WHERE id = ?", [stockQuantity, key]);
                    }
                })
            );

            return h.redirect("/");
        },
    });

    server.route({
        method: "GET",
        path: "/public/{param*}",
        handler: {
            directory: {
                path: path.resolve(__dirname, "public"),
            },
        },
    });

    await server.start();
    console.log("Server running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
    console.log(err);
    process.exit(1);
});

init();
