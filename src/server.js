import Hapi from "@hapi/hapi";
import Vision from "@hapi/vision";
import Handlebars from "handlebars";
import Inert from "@hapi/inert";
import yar from "@hapi/yar";
import { fileURLToPath } from "url";
import path from "path";
import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

    await server.register({
        plugin: yar,
        options: {
            storeBlank: false,
            cookieOptions: {
                password: process.env.YARPASSWORD,
                isSecure: true,
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

    server.route({
        method: "GET",
        path: "/",
        handler: async (request, h) => {
            const pool = new Pool();
            const result = await pool.query("SELECT * from items ORDER BY id ASC");
            const items = result.rows;

            const drinks = items.filter((item) => item.type == "drink");
            const snacks = items.filter((item) => item.type == "snack");

            const flashMessages = request.yar.flash();
            const data = { drinks, snacks, flashMessages: JSON.stringify(flashMessages) };

            return h.view("index", data);
        },
    });

    server.route({
        method: "GET",
        path: "/order",
        handler: async (request, h) => {
            const pool = new Pool();
            const result = await pool.query("SELECT * from items ORDER BY id ASC");
            const items = result.rows;

            const drinks = items.filter((item) => item.type == "drink");

            const snacks = items.filter((item) => item.type == "snack");

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
                const pool = new Pool();
                if (drink !== "none") {
                    await pool.query("INSERT into orders (item_id) VALUES ($1)", [drink]);
                    await pool.query("UPDATE items SET quantity = quantity - 1 WHERE id = $1", [drink]);
                }

                if (snack !== "none") {
                    await pool.query("INSERT into orders (item_id) VALUES ($1)", [snack]);
                    await pool.query("UPDATE items SET quantity = quantity - 1 WHERE id = $1", [snack]);
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
                const pool = new Pool();
                const result = await pool.query(
                    `SELECT orders.created_at as time, items.name FROM orders
                    LEFT JOIN items on orders.item_id = items.id
                    ORDER BY orders.created_at DESC`
                );
                const orders = result.rows;

                const todayQuery = await pool.query(
                    `select items.name, type, count(orders.id) as total from items
                    left join orders on items.id = orders.item_id
                    and orders.created_at::date = CURRENT_DATE
                    group by items.id
                    order by items.id asc;
                    `
                );
                const today = todayQuery.rows;
                const todayDrinks = today.filter((item) => item.type == "drink");
                const todaySnacks = today.filter((item) => item.type == "snack");

                const allQuery = await pool.query(
                    `select items.name, type, count(orders.id) as total from items
                    left join orders on items.id = orders.item_id
                    and orders.created_at::date = CURRENT_DATE
                    group by items.id
                    order by items.id asc;
                    `
                );
                const all = allQuery.rows;
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
            const pool = new Pool();
            const result = await pool.query("SELECT * from items ORDER BY id ASC");
            const items = result.rows;

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
                        const pool = new Pool();
                        const result = await pool.query("UPDATE items set quantity = quantity + $1 WHERE id = $2", [stockQuantity, key]);
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
