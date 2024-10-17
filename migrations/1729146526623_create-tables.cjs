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
        variant_id: {
            type: "integer",
            notNull: true,
            references: '"variants"',
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
        ('item 1', 10, 'drink'),
        ('item 2', 10, 'drink'),
        ('item 3', 10, 'drink'),
        ('item 4', 10, 'snack'),
        ('item 5', 10, 'snack'),
        ('item 6', 10, 'snack');

        INSERT INTO variants (name, drink_id, snack_id) VALUES
        ('var 1', 1, 4),
        ('var 2', 2, 5),
        ('var 3', 3, 6),
        ('var 4', 1, 6),
        ('var 5', 2, 4),
        ('var 6', 3, 5);
        `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {};
