
const Address = require('../model/addressmodel');

const addAddress = async (req, res) => {
    try {
        const {
            type,
            name,
            phone,
            houseNumber,
            street,
            landmark,
            city,
            state,
            country,
            pincode,
            location,
            isDefault
        } = req.body;

        const userId = req.user.id;

        // Validate required fields
        if (
            !name || !phone || !houseNumber ||
            !street || !city || !state || !pincode
        ) {
            return res.status(400).json({
                message: 'Please provide all required address fields',
                status: false
            });
        }

        // Check if this is the user's first address
        const existingAddress = await Address.findOne({
            user: userId
        });

        // First address becomes default automatically
        const makeDefault = !existingAddress || isDefault === true;

        // If this address is default, unset previous default
        if (makeDefault) {
            await Address.updateMany(
                { user: userId },
                { $set: { isDefault: false } }
            );
        }

        const address = await Address.create({
            user: userId,
            type: type || 'home',
            name,
            phone,
            houseNumber,
            street,
            landmark,
            city,
            state,
            country: country || 'India',
            pincode,
            location,
            isDefault: makeDefault
        });

        return res.status(201).json({
            message: 'Address added successfully',
            status: true,
            data: address
        });

    } catch (error) {   
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
}

const getAddresses = async (req, res) => {
    try {
        const userId = req.user.id;

        const addresses = await Address.find({ user: userId })
            .sort({ isDefault: -1, createdAt: -1 });

        return res.status(200).json({
            message: 'Addresses fetched successfully',
            status: true,
            count: addresses.length,
            data: addresses
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
}


const updateAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const {
            type,
            name,
            phone,
            houseNumber,
            street,
            landmark,
            city,
            state,
            country,
            pincode,
            location,
            isDefault
        } = req.body;

        // Check address exists and belongs to logged-in user
        const address = await Address.findOne({
            _id: id,
            user: userId
        });

        if (!address) {
            return res.status(404).json({
                message: 'Address not found',
                status: false
            });
        }

        // Update only fields sent in request
        const updates = {
            type, name, phone, houseNumber, street,
            landmark, city, state, country, pincode,
            location
        };

        Object.keys(updates).forEach((key) => {
            if (updates[key] !== undefined) {
                address[key] = updates[key];
            }
        });

        // If setting this address as default, unset others
        if (isDefault === true) {
            await Address.updateMany(
                { user: userId, _id: { $ne: address._id } },
                { $set: { isDefault: false } }
            );

            address.isDefault = true;
        }

        await address.save();

        return res.status(200).json({
            message: 'Address updated successfully',
            status: true,
            data: address
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
}


const deleteAddress = async (req, res) => {
    try {
        const userId = req.user.id
        const { id } = req.params

        const address = await Address.findOne({
            _id: id,
            user: userId
        })

        if (!address) {
            return res.status(404).json({
                status: false,
                message: 'Address not found'
            })
        }

        const wasDefault = address.isDefault

        await Address.deleteOne({
            _id: id,
            user: userId
        })

        if (wasDefault) {
            const nextAddress = await Address.findOne({
                user: userId
            }).sort({ createdAt: -1 })

            if (nextAddress) {
                await Address.updateMany(
                    { user: userId },
                    { $set: { isDefault: false } }
                )

                nextAddress.isDefault = true
                await nextAddress.save()
            }
        }

        return res.status(200).json({
            status: true,
            message: 'Address deleted successfully'
        })

    } catch (error) {
        return res.status(500).json({
            status: false,
            message: error.message
        })
    }
}

const setDefaultAddress = async (req, res) => {
    try {
        const { addressId } = req.params
        const userId = req.user.id

        const address = await Address.findOne({
            _id: addressId,
            user: userId
        })

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            })
        }

        await Address.updateMany(
            { user: userId },
            { $set: { isDefault: false } }
        )

        address.isDefault = true
        await address.save()

        return res.status(200).json({
            success: true,
            message: 'Default address updated successfully',
            address
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


module.exports = { addAddress, getAddresses , updateAddress, deleteAddress, setDefaultAddress }
