const Store = require('../model/storemodel');
const User = require('../model/usermodel');


// CREATE STORE
const createStore = async (req, res) => {
    try {
        const {
            name,
            code,
            manager,
            phone,
            address,
            location,
            serviceRadius
        } = req.body;

        if (!name || !code || !manager || !phone ||
            !address || serviceRadius === undefined) {
            return res.status(400).json({
                message: 'Please fill all required fields',
                status: false
            });
        }

        // Check manager exists
        const managerExists = await User.findById(manager);

        if (!managerExists) {
            return res.status(404).json({
                message: 'Manager not found',
                status: false
            });
        }

        // Check duplicate store code
        const existingStore = await Store.findOne({ code });

        if (existingStore) {
            return res.status(409).json({
                message: 'Store code already exists',
                status: false
            });
        }

        const store = new Store({
            name,
            code,
            manager,
            phone,
            address,
            location,
            serviceRadius
        });

        await store.save();

        return res.status(201).json({
            message: 'Store created successfully',
            status: true,
            data: store
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};


// GET ALL STORES
const getAllStores = async (req, res) => {
    try {
        const stores = await Store.find()
            .populate('manager', 'name firstName lastName');

        return res.status(200).json({
            message: 'Stores fetched successfully',
            status: true,
            data: stores
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};


// UPDATE STORE
const updateStore = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        if (updateData.manager) {
            const managerExists = await User.findById(
                updateData.manager
            );

            if (!managerExists) {
                return res.status(404).json({
                    message: 'Manager not found',
                    status: false
                });
            }
        }

        const store = await Store.findByIdAndUpdate(
            id,
            updateData,
            {
                new: true,
                runValidators: true
            }
        ).populate('manager', 'name firstName lastName');

        if (!store) {
            return res.status(404).json({
                message: 'Store not found',
                status: false
            });
        }

        return res.status(200).json({
            message: 'Store updated successfully',
            status: true,
            data: store
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};


// DELETE STORE
const deleteStore = async (req, res) => {
    try {
        const { id } = req.params;

        const store = await Store.findByIdAndDelete(id);

        if (!store) {
            return res.status(404).json({
                message: 'Store not found',
                status: false
            });
        }

        return res.status(200).json({
            message: 'Store deleted successfully',
            status: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};


module.exports = { createStore, getAllStores, updateStore, deleteStore }