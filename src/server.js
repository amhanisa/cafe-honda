import Hapi from "@hapi/hapi";
import Vision from "@hapi/vision";
import Handlebars from "handlebars";
import Inert from "@hapi/inert";
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

    await server.register(Vision);
    server.views({
        engines: {
            html: Handlebars,
        },
        relativeTo: __dirname,
        path: "templates",
    });

    await server.register(Inert);

    server.route({
        method: "GET",
        path: "/",
        handler: async (request, h) => {
            const pool = new Pool();
            const result = await pool.query("SELECT * from items");
            const items = result.rows;

            console.log(items);

            const drinks = items.filter((item) => item.type == "drink");

            const snacks = items.filter((item) => item.type == "snack");

            const data = { drinks, snacks };
            console.log(data);
            return h.view("index", data);
        },
    });

    server.route({
        method: "GET",
        path: "/order",
        handler: async (request, h) => {
            const pool = new Pool();
            const result = await pool.query(
                "SELECT variants.id, variants.name as name,d.id as drink_id, d.name as drink, s.id as snack_id, s.name as snack from variants LEFT JOIN items d on variants.drink_id = d.id  LEFT JOIN items s on variants.snack_id = s.id"
            );
            const variants = result.rows;

            console.log(variants);

            const data = { variants };
            return h.view("order", data);
        },
    });

    server.route({
        method: "POST",
        path: "/order",
        handler: async (request, h) => {
            const { variant } = request.payload;
            console.log(variant);

            const pool = new Pool();
            const variantDetail = await pool.query("SELECT * FROM variants WHERE id = $1", [variant]);
            const variants = variantDetail.rows[0];
            const inputOrder = await pool.query("INSERT into orders (variant_id) VALUES ($1)", [variant]);
            try {
                await pool.query("UPDATE items SET quantity = quantity - 1 WHERE id = $1", [variants.drink_id]);
                await pool.query("UPDATE items SET quantity = quantity - 1 WHERE id = $1", [variants.snack_id]);
            } catch (e) {
                console.log(e);
            }

            return h.redirect("/");
        },
    });

    server.route({
        method: "GET",
        path: "/history",
        handler: async (request, h) => {
            const pool = new Pool();
            const result = await pool.query("SELECT orders.created_at as time, variants.name as variant FROM orders LEFT JOIN variants on orders.variant_id = variants.id");
            const orders = result.rows;
            const data = { orders };
            console.log(orders);
            return h.view("history", data);
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
