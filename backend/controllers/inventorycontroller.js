const Store = require('../model/storemodel')
const Product = require('../model/productmodel');
const ProductVariant = require('../model/productvariant');
const Inventory = require('../model/inventorymodel');

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
        const {
            page = 1,
            limit = 10,
            search = '',
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query;

        const currentPage = Math.max(1, Number(page));
        const pageLimit = Math.max(1, Number(limit));
        const skip = (currentPage - 1) * pageLimit;

        const filter = {};

        // SEARCH STORE, PRODUCT AND VARIANT
        if (search) {
            const regex = {
                $regex: search,
                $options: 'i'
            };

            const [stores, products, variants] = await Promise.all([
                Store.find({ name: regex }).select('_id'),
                Product.find({ name: regex }).select('_id'),
                ProductVariant.find({ name: regex }).select('_id')
            ]);

            filter.$or = [
                { store: { $in: stores.map(item => item._id) } },
                { product: { $in: products.map(item => item._id) } },
                { variant: { $in: variants.map(item => item._id) } }
            ];
        }

        // ALLOWED SORT FIELDS
        const allowedSortFields = [
            'createdAt',
            'quantity',
            'reservedQuantity',
            'availableQuantity',
            'reorderLevel',
            'maxStockLevel',
            'status'
        ];

        const sortField = allowedSortFields.includes(sortBy)
            ? sortBy
            : 'createdAt';

        const sortOrder = order === 'asc' ? 1 : -1;

        const totalInventory = await Inventory.countDocuments(filter);

        const inventory = await Inventory.find(filter)
            .populate('store')
            .populate('product')
            .populate('variant')
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(pageLimit);

        const totalPages = Math.ceil(totalInventory / pageLimit);

        return res.status(200).json({
            message: 'Inventory fetched successfully',
            status: true,
            inventory,
            pagination: {
                totalInventory,
                totalPages,
                currentPage,
                limit: pageLimit,
                hasNextPage: currentPage < totalPages,
                hasPrevPage: currentPage > 1
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};


const getLowStockInventory = async (req, res) => {
    try {
        const inventory = await Inventory.find({
            status: 'active',
            $expr: {
                $lte: ['$availableQuantity', '$reorderLevel']
            }
        })
            .populate('store')
            .populate('product')
            .populate('variant')

        res.status(200).json({
            message: 'Low stock inventory fetched successfully',
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
        const {
            quantity,
            reservedQuantity,
            ...otherData
        } = req.body

        const updateData = {
            ...otherData
        }

        if (quantity !== undefined || reservedQuantity !== undefined) {
            const inventory = await Inventory.findById(req.params.id)

            if (!inventory) {
                return res.status(404).json({
                    message: 'Inventory not found',
                    status: false
                })
            }

            const newQuantity = Number(quantity ?? inventory.quantity)
            const newReservedQuantity = Number(
                reservedQuantity ?? inventory.reservedQuantity
            )

            if (
                newQuantity < 0 ||
                newReservedQuantity < 0 ||
                newReservedQuantity > newQuantity
            ) {
                return res.status(400).json({
                    message: 'Invalid inventory quantity',
                    status: false
                })
            }

            updateData.quantity = newQuantity
            updateData.reservedQuantity = newReservedQuantity
            updateData.availableQuantity =
                newQuantity - newReservedQuantity
        }

        const inventory = await Inventory.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
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

// UPDATE INVENTORY STATUS
const updateInventoryStatus = async (req, res) => {
    try {
        const { id } = req.params

        const inventory = await Inventory.findById(id)

        if (!inventory) {
            return res.status(404).json({
                message: 'Inventory not found',
                status: false
            })
        }

        // Backend khud status toggle karega
        inventory.status =
            inventory.status === 'active' ? 'inactive' : 'active'

        await inventory.save()

        return res.status(200).json({
            message: 'Inventory status updated successfully',
            status: true,
            data: inventory
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}



module.exports = { createInventory, getAllInventory,  getLowStockInventory , 
    updateInventory, deleteInventory, updateInventoryStatus  }