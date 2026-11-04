const Inventory = require('../model/inventorymodel')

const createInventory = async (req, res) => {
    try {
        const {
            store,
            product,
            variant,
            quantity,
            reservedQuantity,
            reorderLevel,
            maxStockLevel,
            status
        } = req.body

        const inventory = new Inventory({
            store,
            product,
            variant,
            quantity,
            reservedQuantity,
            availableQuantity: quantity - (reservedQuantity || 0),
            reorderLevel,
            maxStockLevel,
            status,
            lastRestockedAt: new Date()
        })

        await inventory.save()

        res.status(201).json({
            message: 'Inventory created successfully',
            status: true,
            inventory
        })
    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: false
        })
    }
}

const getAllInventory = async (req, res) => {
    try {
        const inventory = await Inventory.find()
            .populate('store')
            .populate('product')
            .populate('variant')

        res.status(200).json({
            message: 'Inventory fetched successfully',
            status: true,
            inventory
        })

    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: false
        })
    }
}

const updateInventory = async (req, res) => {
    try {
        const inventory = await Inventory.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        )

        res.status(200).json({
            message: 'Inventory updated successfully',
            status: true,
            inventory
        })

    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: false
        })
    }
}

const deleteInventory = async (req, res) => {
    try {
        const inventory = await Inventory.findByIdAndDelete(req.params.id)

        res.status(200).json({
            message: 'Inventory deleted successfully',
            status: true,
            inventory
        })

    } catch (error) {
        res.status(500).json({
            message: error.message,
            status: false
        })
    }
}



module.exports = { createInventory, getAllInventory, updateInventory, deleteInventory }