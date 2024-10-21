"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable("items", {
            id: {
                type: Sequelize.DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            name: Sequelize.DataTypes.STRING,
            quantity: Sequelize.DataTypes.INTEGER,
            type: Sequelize.DataTypes.STRING,
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
            updated_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
            },
        });

        await queryInterface.createTable("orders", {
            id: {
                type: Sequelize.DataTypes.INTEGER,
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
            },
            item_id: {
                type: Sequelize.DataTypes.INTEGER,
                allowNull: false,
                references: {
                    model: "items",
                    key: "id",
                },
                onDelete: "CASCADE",
                onUpdate: "CASCADE",
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP"),
            },
            updated_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"),
            },
        });

        await queryInterface.bulkInsert("items", [
            { name: "Es Kopi Susu Little Contrast", quantity: 10, type: "drink" },
            { name: "Coconut Apple", quantity: 10, type: "drink" },
            { name: "Hot Latte", quantity: 10, type: "drink" },
            { name: "Ice Matcha Little Contrast", quantity: 10, type: "drink" },
            { name: "Choco Croissant", quantity: 10, type: "snack" },
            { name: "Red Bean Sea Salt & Garlic Butter Bread", quantity: 10, type: "snack" },
            { name: "Almond Croissant", quantity: 10, type: "snack" },
            { name: "Butter Croissant", quantity: 10, type: "snack" },
        ]);
    },

    async down(queryInterface, Sequelize) {
        /**
         * Add reverting commands here.
         *
         * Example:
         * await queryInterface.dropTable('users');
         */
    },
};
