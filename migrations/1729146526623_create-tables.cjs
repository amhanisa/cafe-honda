exports.up = (pgm) => {
    pgm.createTable("items", {
        id: "id",
        name: { type: "varchar(1000)", notNull: true },
        quantity: {
            type: "integer",
            notNull: true,
        },
        type: {
            type: "varchar(10)",
            notNull: true,
        },
        created_at: {
            type: "timestamp",
            notNull: true,
            default: pgm.func("current_timestamp"),
        },
    });

    pgm.createTable("variants", {
        id: "id",
        name: { type: "varchar(1000)", notNull: true },
        drink_id: {
            type: "integer",
            notNull: true,
            references: '"items"',
            onDelete: "cascade",
        },
        snack_id: {
            type: "integer",
            notNull: true,
            references: '"items"',
            onDelete: "cascade",
        },
        created_at: {
            type: "timestamp",
            notNull: true,
            default: pgm.func("current_timestamp"),
        },
    });

    pgm.createTable("orders", {
        id: "id",
        item_id: {
            type: "integer",
            notNull: true,
            references: '"items"',
            onDelete: "cascade",
        },
        created_at: {
            type: "timestamp",
            notNull: true,
            default: pgm.func("current_timestamp"),
        },
    });

    pgm.sql(`
        INSERT INTO items (name, quantity, type) VALUES
        ('Es Kopi Susu Little Contrast', 10, 'drink'),
        ('Coconut Apple', 10, 'drink'),
        ('Hot Latte', 10, 'drink'),
        ('Ice Matcha Little Contrast', 10, 'drink'),
        ('Choco Croissant', 10, 'snack'),
        ('Red Bean Sea Salt & Garlic Butter Bread', 10, 'snack'),
        ('Almond Croissant', 10, 'snack'),
        ('Butter Croissant', 10, 'snack');
        `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {};
