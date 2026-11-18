const Store = require('../model/storemodel')
const Product = require('../model/productmodel');
const ProductVariant = require('../model/productvariant');
const Inventory = require('../model/inventorymodel');
const mongoose = require('mongoose')


const createInventory = async (req, res) => {
    try {
        const {
            store,
            product,
            variant,
            quantity,
            reservedQuantity,
            reorderLevel,
            maxStockLevel
        } = req.body;

        // CHECK REQUIRED FIELDS
        if (
            quantity === undefined ||
            reservedQuantity === undefined ||
            reorderLevel === undefined ||
            maxStockLevel === undefined
        ) {
            return res.status(400).json({
                message: 'Quantity, reserved quantity, reorder level and max stock level are required',
                status: false
            });
        }

        // CONVERT VALUES TO NUMBERS
        const totalQuantity = Number(quantity);
        const reserved = Number(reservedQuantity);
        const reorder = Number(reorderLevel);
        const maxStock = Number(maxStockLevel);

        // CHECK VALID NUMBERS
        if (
            !Number.isFinite(totalQuantity) ||
            !Number.isFinite(reserved) ||
            !Number.isFinite(reorder) ||
            !Number.isFinite(maxStock) ||
            totalQuantity < 0 ||
            reserved < 0 ||
            reorder < 0 ||
            maxStock < 0
        ) {
            return res.status(400).json({
                message: 'Please enter valid non-negative inventory values',
                status: false
            });
        }

        // VALIDATION 1: RESERVED QUANTITY < TOTAL QUANTITY
        if (reserved >= totalQuantity) {
            return res.status(400).json({
                message: 'Reserved quantity must be less than total quantity',
                status: false
            });
        }

        // VALIDATION 2: REORDER LEVEL < RESERVED QUANTITY
        if (reorder >= reserved) {
            return res.status(400).json({
                message: 'Reorder level must be less than reserved quantity',
                status: false
            });
        }

        // VALIDATION 3: TOTAL QUANTITY < MAX STOCK LEVEL
        if (totalQuantity >= maxStock) {
            return res.status(400).json({
                message: 'Quantity must be less than max stock level',
                status: false
            });
        }

        // CREATE INVENTORY
        const inventory = new Inventory({
            store,
            product,
            variant: variant || null,
            quantity: totalQuantity,
            reservedQuantity: reserved,
            availableQuantity: totalQuantity - reserved,
            reorderLevel: reorder,
            maxStockLevel: maxStock,
            lastRestockedAt: new Date()
        });

        await inventory.save();

        return res.status(201).json({
            message: 'Inventory created successfully',
            status: true,
            inventory
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};



const getAllInventory = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            sortBy = 'createdAt',
            order = 'desc',
            storeId
        } = req.query;

        const currentPage = Math.max(1, Number(page) || 1);
        const pageLimit = Math.max(1, Number(limit) || 10);
        const skip = (currentPage - 1) * pageLimit;

        const sortOrder = order === 'asc' ? 1 : -1;

        const allowedSortFields = [
            'createdAt',
            'quantity',
            'reservedQuantity',
            'availableQuantity',
            'reorderLevel',
            'maxStockLevel'
        ];

        const sortField = allowedSortFields.includes(sortBy)
            ? sortBy
            : 'createdAt';

        const filter = {};

        const isPublic = req.path.endsWith('/public');

        // VALIDATE STORE ID
        if (storeId && !mongoose.Types.ObjectId.isValid(storeId)) {
            return res.status(400).json({
                message: 'Invalid store ID',
                status: false
            });
        }

        // STORE MANAGER: GET ONLY ASSIGNED STORE
        if (req.user?.role === 'store manager') {

            const assignedStore = await Store.findOne({
                manager: req.user._id
            }).select('_id');

            if (!assignedStore) {
                return res.status(403).json({
                    message: 'No store assigned to this manager',
                    status: false
                });
            }

            // PREVENT ACCESS TO OTHER STORE
            if (
                storeId &&
                String(storeId) !== String(assignedStore._id)
            ) {
                return res.status(403).json({
                    message: 'You cannot access another store inventory',
                    status: false
                });
            }

            filter.store = assignedStore._id;
        }

        // SEARCH STORE, PRODUCT AND VARIANT
        if (search.trim()) {
            const regex = {
                $regex: search.trim(),
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

        // STORE SELECTED OR PUBLIC API
        if (storeId || isPublic) {


            // For non-manager users, apply requested store filter
            if (storeId && req.user?.role !== 'store manager') {
                filter.store = storeId;
            }

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
        }

        // MAIN PAGE: GROUP INVENTORY BY STORE
        const storeSortFields = {
            createdAt: 'createdAt',
            quantity: 'totalQuantity',
            reservedQuantity: 'totalReserved',
            availableQuantity: 'totalAvailable'
        };

        const storeSortField =
            storeSortFields[sortField] || 'createdAt';

        const result = await Inventory.aggregate([
            { $match: filter },

            {
                $group: {
                    _id: '$store',
                    productCount: { $sum: 1 },
                    totalQuantity: { $sum: '$quantity' },
                    totalReserved: { $sum: '$reservedQuantity' },
                    totalAvailable: { $sum: '$availableQuantity' },
                    createdAt: { $max: '$createdAt' }
                }
            },

            {
                $lookup: {
                    from: Store.collection.name,
                    localField: '_id',
                    foreignField: '_id',
                    as: 'store'
                }
            },

            { $unwind: '$store' },

            {
                $sort: {
                    [storeSortField]: sortOrder
                }
            },

            {
                $facet: {
                    stores: [
                        { $skip: skip },
                        { $limit: pageLimit },
                        {
                            $project: {
                                _id: 0,
                                store: 1,
                                productCount: 1,
                                totalQuantity: 1,
                                totalReserved: 1,
                                totalAvailable: 1,
                                createdAt: 1
                            }
                        }
                    ],
                    total: [
                        { $count: 'totalStores' }
                    ]
                }
            }
        ]);

        const stores = result[0]?.stores || [];
        const totalStores = result[0]?.total[0]?.totalStores || 0;
        const totalPages = Math.ceil(totalStores / pageLimit);

        return res.status(200).json({
            message: 'Stores inventory fetched successfully',
            status: true,
            stores,
            pagination: {
                totalStores,
                totalPages,
                currentPage,
                limit: pageLimit,
                hasNextPage: currentPage < totalPages,
                hasPrevPage: currentPage > 1
            }
        });

    } catch (error) {
        console.log('GET INVENTORY ERROR:', error);

        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};




const updateInventory = async (req, res) => {
    try {
        const inventory = await Inventory.findById(req.params.id);

        if (!inventory) {
            return res.status(404).json({
                message: 'Inventory not found',
                status: false
            });
        }

        const {
            quantity,
            reservedQuantity,
            reorderLevel,
            maxStockLevel,
            ...otherData
        } = req.body;

        // UPDATED OR EXISTING VALUES
        const newQuantity = Number(quantity ?? inventory.quantity);

        const newReservedQuantity = Number(
            reservedQuantity ?? inventory.reservedQuantity
        );

        const newReorderLevel = Number(
            reorderLevel ?? inventory.reorderLevel
        );

        const newMaxStockLevel = Number(
            maxStockLevel ?? inventory.maxStockLevel
        );

        // VALID NUMBER CHECK
        if (
            !Number.isFinite(newQuantity) ||
            !Number.isFinite(newReservedQuantity) ||
            !Number.isFinite(newReorderLevel) ||
            !Number.isFinite(newMaxStockLevel) ||
            newQuantity < 0 ||
            newReservedQuantity < 0 ||
            newReorderLevel < 0 ||
            newMaxStockLevel < 0
        ) {
            return res.status(400).json({
                message: 'Please enter valid non-negative inventory values',
                status: false
            });
        }

        // MAX STOCK LEVEL VALIDATION
        if (newQuantity > newMaxStockLevel) {
            return res.status(400).json({
                message: 'Quantity cannot exceed maximum stock level',
                status: false
            });
        }

        // RESERVED QUANTITY VALIDATION
        // Quantity 0 is allowed only when no stock is reserved.
        if (newReservedQuantity > newQuantity) {
            return res.status(400).json({
                message: 'Reserved quantity cannot exceed total quantity',
                status: false
            });
        }

        // REORDER LEVEL VALIDATION
        if (newReorderLevel > newMaxStockLevel) {
            return res.status(400).json({
                message: 'Reorder level cannot exceed maximum stock level',
                status: false
            });
        }

        // AVAILABLE QUANTITY
        const availableQuantity =
            newQuantity - newReservedQuantity;

        // UPDATE DATA
        const updateData = {
            ...otherData,
            quantity: newQuantity,
            reservedQuantity: newReservedQuantity,
            reorderLevel: newReorderLevel,
            maxStockLevel: newMaxStockLevel,
            availableQuantity
        };

        // UPDATE RESTOCK DATE
        if (newQuantity > inventory.quantity) {
            updateData.lastRestockedAt = new Date();
        }

        const updatedInventory = await Inventory.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            {
                new: true,
                runValidators: true
            }
        );

        return res.status(200).json({
            message: 'Inventory updated successfully',
            status: true,
            inventory: updatedInventory
        });

    } catch (error) {
        console.log('UPDATE INVENTORY ERROR:', error);

        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};


const getLowStockInventory = async (req, res) => {
    try {
        const filter = {
            $expr: {
                $lte: ['$availableQuantity', '$reorderLevel']
            }
        };

        // STORE MANAGER: ONLY ASSIGNED STORE
        if (req.user?.role === 'store manager') {
            const assignedStore = await Store.findOne({
                manager: req.user._id
            }).select('_id');

            if (!assignedStore) {
                return res.status(403).json({
                    message: 'No store assigned to this manager',
                    status: false
                });
            }

            filter.store = assignedStore._id;
        }

        const inventory = await Inventory.find(filter)
            .populate('store')
            .populate('product')
            .populate('variant');

        return res.status(200).json({
            message: 'Low stock inventory fetched successfully',
            status: true,
            inventory
        });

    } catch (error) {
        console.log('GET LOW STOCK ERROR:', error);

        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};


const deleteInventory = async (req, res) => {
    try {
        const inventory = await Inventory.findByIdAndDelete(req.params.id)

        if (!inventory) {
            return res.status(404).json({
                message: 'Inventory not found',
                status: false
            })
        }

        return res.status(200).json({
            message: 'Inventory deleted successfully',
            status: true,
            inventory
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}



module.exports = { createInventory, getAllInventory,  getLowStockInventory , 
    updateInventory, deleteInventory  }