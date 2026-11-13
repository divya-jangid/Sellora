
const OrderItem = require('../model/orderitemsmodel');
const Inventory = require('../model/inventorymodel');

const releaseReservedInventory = async (order) => {
    const items = await OrderItem.find({
        order: order._id
    });

    const releasedItems = [];

    try {
        for (const item of items) {
            const quantity = Number(item.quantity);

            const result = await Inventory.updateOne(
                {
                    store: order.store,
                    product: item.product,
                    variant: item.variant || null,
                    reservedQuantity: { $gte: quantity }
                },
                {
                    $inc: {
                        reservedQuantity: -quantity,
                        availableQuantity: quantity
                    }
                }
            );

            if (result.modifiedCount !== 1) {
                throw new Error(
                    `Reserved stock could not be released for ${item.productName}`
                );
            }

            releasedItems.push({
                product: item.product,
                variant: item.variant || null,
                quantity
            });
        }

    } catch (error) {
        // Rollback previously released inventory
        for (const item of releasedItems.reverse()) {
            await Inventory.updateOne(
                {
                    store: order.store,
                    product: item.product,
                    variant: item.variant
                },
                {
                    $inc: {
                        reservedQuantity: item.quantity,
                        availableQuantity: -item.quantity
                    }
                }
            );
        }

        throw error;
    }
};

module.exports = releaseReservedInventory;
