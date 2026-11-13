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

        // SEARCH BY STORE NAME AND CITY
        const filter = {};

        if (search) {
            filter.$or = [
                {
                    name: {
                        $regex: search,
                        $options: 'i'
                    }
                },
                {
                    city: {
                        $regex: search,
                        $options: 'i'
                    }
                }
            ];
        }

        // ALLOWED SORT FIELDS
        const allowedSortFields = [
            'createdAt',
            'name',
            'status'
        ];

        const sortField = allowedSortFields.includes(sortBy)
            ? sortBy
            : 'createdAt';

        const sortOrder = order === 'asc' ? 1 : -1;

        // TOTAL STORES
        const totalStores = await Store.countDocuments(filter);

        // GET STORES
        const stores = await Store.find(filter)
            .populate('manager', 'name firstName lastName')
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(pageLimit);

        const totalPages = Math.ceil(totalStores / pageLimit);

        return res.status(200).json({
            message: 'Stores fetched successfully',
            status: true,
            data: stores,
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
}


// UPDATE STORE STATUS
const updateStoreStatus = async (req, res) => {
    try {
        const { id } = req.params

        const store = await Store.findById(id)

        if (!store) {
            return res.status(404).json({
                message: 'Store not found',
                status: false
            })
        }

        // Backend khud status toggle karega
        store.status =
            store.status === 'active' ? 'inactive' : 'active'

        await store.save()

        return res.status(200).json({
            message: 'Store status updated successfully',
            status: true,
            data: store
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}


// FIND NEAREST ACTIVE STORE
const getNearestStore = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        const customerLat = Number(latitude);
        const customerLng = Number(longitude);

        if (
            latitude === undefined ||
            longitude === undefined ||
            !Number.isFinite(customerLat) ||
            !Number.isFinite(customerLng) ||
            customerLat < -90 || customerLat > 90 ||
            customerLng < -180 || customerLng > 180
        ) {
            return res.status(400).json({
                message: 'Valid latitude and longitude are required',
                status: false
            });
        }

        // Fetch active stores with location
        const stores = await Store.find({
            status: 'active',
            'location.latitude': { $ne: null },
            'location.longitude': { $ne: null }
        });

        // Calculate distance using Haversine formula
        const calculateDistance = (lat1, lon1, lat2, lon2) => {
            const R = 6371;

            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLon = (lon2 - lon1) * Math.PI / 180;

            const a =
                Math.sin(dLat / 2) ** 2 +
                Math.cos(lat1 * Math.PI / 180) *
                Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) ** 2;

            const c = 2 * Math.atan2(
                Math.sqrt(a),
                Math.sqrt(1 - a)
            );

            return R * c;
        };

        let nearestStore = null;
        let minimumDistance = Infinity;

        for (const store of stores) {
            const storeLat = Number(store.location.latitude);
            const storeLng = Number(store.location.longitude);

            if (!Number.isFinite(storeLat) || !Number.isFinite(storeLng)) {
                continue;
            }

            const distance = calculateDistance(
                customerLat,
                customerLng,
                storeLat,
                storeLng
            );

            // Check service radius (in KM)
            if (
                distance <= store.serviceRadius &&
                distance < minimumDistance
            ) {
                minimumDistance = distance;
                nearestStore = store;
            }
        }

        if (!nearestStore) {
            return res.status(404).json({
                message: 'Sorry, service is not available in your area',
                status: false
            });
        }

        return res.status(200).json({
            message: 'Nearest store found successfully',
            status: true,
            data: {
                store: nearestStore,
                distance: Number(minimumDistance.toFixed(2))
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};




module.exports = { createStore, getAllStores, updateStore, 
    deleteStore, updateStoreStatus, getNearestStore  }