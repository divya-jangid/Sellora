
const Store = require('../model/storemodel');
const User = require('../model/usermodel');


// VALIDATE STORE LOCATION
const validateStoreLocation = (location) => {
    if (
        !location ||
        location.latitude === undefined ||
        location.latitude === null ||
        location.latitude === '' ||
        location.longitude === undefined ||
        location.longitude === null ||
        location.longitude === ''
    ) {
        return {
            valid: false,
            message: 'Please select a valid address with latitude and longitude'
        };
    }

    const latitude = Number(location.latitude);
    const longitude = Number(location.longitude);

    if (
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90
    ) {
        return {
            valid: false,
            message: 'Latitude must be between -90 and 90'
        };
    }

    if (
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
    ) {
        return {
            valid: false,
            message: 'Longitude must be between -180 and 180'
        };
    }

    return {
        valid: true,
        location: {
            latitude,
            longitude
        }
    };
};


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

        // REQUIRED FIELDS VALIDATION
        if (
            !name ||
            !code ||
            !manager ||
            !phone ||
            !address ||
            serviceRadius === undefined ||
            serviceRadius === ''
        ) {
            return res.status(400).json({
                message: 'Please fill all required fields',
                status: false
            });
        }

        // VALIDATE LOCATION
        const locationResult = validateStoreLocation(location);

        if (!locationResult.valid) {
            return res.status(400).json({
                message: locationResult.message,
                status: false
            });
        }

        // VALIDATE SERVICE RADIUS
        const radius = Number(serviceRadius);

        if (!Number.isFinite(radius) || radius < 0) {
            return res.status(400).json({
                message: 'Please enter a valid service radius',
                status: false
            });
        }

        // CHECK MANAGER EXISTS
        const managerExists = await User.findById(manager);

        if (!managerExists) {
            return res.status(404).json({
                message: 'Manager not found',
                status: false
            });
        }

        // CHECK DUPLICATE STORE CODE
        const existingStore = await Store.findOne({ code });

        if (existingStore) {
            return res.status(409).json({
                message: 'Store code already exists',
                status: false
            });
        }

        // CREATE STORE
        const store = new Store({
            name,
            code,
            manager,
            phone,
            address,

            // GEOJSON LOCATION
            location: {
                type: 'Point',
                coordinates: [
                    Number(locationResult.location.longitude),
                    Number(locationResult.location.latitude)
                ]
            },

            serviceRadius: radius
        });

        await store.save();

        return res.status(201).json({
            message: 'Store created successfully',
            status: true,
            data: store
        });

    } catch (error) {
        console.log('CREATE STORE ERROR:', error);

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
       // SEARCH BY STORE NAME AND ADDRESS
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
            address: {
                $regex: search,
                $options: 'i'
            }
        },
        {
            code: {
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

        const {
            name,
            code,
            manager,
            phone,
            address,
            location,
            serviceRadius
        } = req.body;

        const updateData = {};

        // UPDATE BASIC DETAILS
        if (name !== undefined) updateData.name = name;
        if (code !== undefined) updateData.code = code;
        if (manager !== undefined) updateData.manager = manager;
        if (phone !== undefined) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;

        // VALIDATE AND UPDATE LOCATION
        if (location !== undefined) {
            const locationResult = validateStoreLocation(location);

            if (!locationResult.valid) {
                return res.status(400).json({
                    message: locationResult.message,
                    status: false
                });
            }

            // NORMAL LOCATION
            updateData.location = locationResult.location;

            // GEOJSON LOCATION FOR $geoNear
            updateData.geoLocation = {
                type: 'Point',
                coordinates: [
                    locationResult.location.longitude,
                    locationResult.location.latitude
                ]
            };
        }

        // VALIDATE SERVICE RADIUS
        if (serviceRadius !== undefined) {
            const radius = Number(serviceRadius);

            if (
                serviceRadius === '' ||
                !Number.isFinite(radius) ||
                radius < 0
            ) {
                return res.status(400).json({
                    message: 'Please enter a valid service radius',
                    status: false
                });
            }

            updateData.serviceRadius = radius;
        }

        // CHECK MANAGER EXISTS
        if (manager) {
            const managerExists = await User.findById(manager);

            if (!managerExists) {
                return res.status(404).json({
                    message: 'Manager not found',
                    status: false
                });
            }
        }

        // UPDATE STORE
        const store = await Store.findByIdAndUpdate(
            id,
            { $set: updateData },
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


// UPDATE STORE STATUS
const updateStoreStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const store = await Store.findById(id);

        if (!store) {
            return res.status(404).json({
                message: 'Store not found',
                status: false
            });
        }

        // BACKEND STATUS TOGGLE
        store.status =
            store.status === 'active' ? 'inactive' : 'active';

        await store.save();

        return res.status(200).json({
            message: 'Store status updated successfully',
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



// FIND NEAREST ACTIVE STORE
const getNearestStore = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        const customerLat = Number(latitude);
        const customerLng = Number(longitude);

        // VALIDATE CUSTOMER COORDINATES
        if (
            latitude === undefined ||
            longitude === undefined ||
            latitude === null ||
            longitude === null ||
            latitude === '' ||
            longitude === '' ||
            !Number.isFinite(customerLat) ||
            !Number.isFinite(customerLng) ||
            customerLat < -90 ||
            customerLat > 90 ||
            customerLng < -180 ||
            customerLng > 180
        ) {
            return res.status(400).json({
                message: 'Valid latitude and longitude are required',
                status: false
            });
        }

        // FIND NEAREST ACTIVE STORE USING GEO NEAR
        const nearestStore = await Store.aggregate([
            {
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [customerLng, customerLat]
                    },
                    key: 'location',
                    distanceField: 'distance',
                    spherical: true,
                    query: {
                        status: 'active'
                    }
                }
            },

            // CONVERT DISTANCE FROM METERS TO KM
            {
                $addFields: {
                    distanceInKm: {
                        $divide: ['$distance', 1000]
                    }
                }
            },

            // CHECK STORE SERVICE RADIUS
            {
                $match: {
                    $expr: {
                        $lte: [
                            '$distanceInKm',
                            '$serviceRadius'
                        ]
                    }
                }
            },

            // GET ONLY NEAREST STORE
            {
                $limit: 1
            }
        ]);

        // STORE NOT FOUND
        if (!nearestStore.length) {
            return res.status(404).json({
                message: 'Sorry, service is not available in your area',
                status: false
            });
        }

        const store = nearestStore[0];

        return res.status(200).json({
            message: 'Nearest store found successfully',
            status: true,
            data: {
                store: {
                    ...store,
                    distance: Number(store.distanceInKm.toFixed(2))
                }
            }
        });

    } catch (error) {
        console.log('GET NEAREST STORE ERROR:', error);

        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};


module.exports = {
    createStore,
    getAllStores,
    updateStore,
    deleteStore,
    updateStoreStatus,
    getNearestStore
};
