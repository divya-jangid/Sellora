const DeliveryPartner = require('../model/deliverypartnermodel')
const Delivery = require('../model/deliverymodel');

// Get All Delivery Partners

const getAllDeliveryPartners = async (req, res) => {
    try {
        const deliveryPartners = await DeliveryPartner.find({
            status: 'ACTIVE',
            isOnline: true,
            isAvailable: true
        })
            .populate('user', 'firstName lastName email phone status')
            .sort({ createdAt: -1 })

        return res.status(200).json({
            success: true,
            message: 'Available delivery partners fetched successfully',
            deliveryPartners
        })

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


// Update Delivery Partner Status
const updateDeliveryPartnerStatus = async (req, res) => {

    console.log('STATUS UPDATE API HIT');

console.log('PARTNER ID:', id);
console.log('NEW STATUS:', status);

    try {
        const { id } = req.params;
        const { status } = req.body;

        const allowedStatus = ['ACTIVE', 'INACTIVE', 'BLOCKED'];

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const deliveryPartner = await DeliveryPartner.findById(id);

        if (!deliveryPartner) {
            return res.status(404).json({
                success: false,
                message: 'Delivery partner not found'
            });
        }

        deliveryPartner.status = status;

        if (status !== 'ACTIVE') {
            deliveryPartner.isOnline = false;
            deliveryPartner.isAvailable = false;

            // Find partner's active deliveries

            console.log('FINDING ACTIVE DELIVERIES FOR:', deliveryPartner._id);

            const activeDeliveries = await Delivery.find({
                deliveryPartner: deliveryPartner._id,
                deliveryStatus: {
                    $in: [
                        'ASSIGNED',
                        'ACCEPTED',
                        'PICKED_UP',
                        'OUT_FOR_DELIVERY'
                    ]
                }
            });

            // Cancel active deliveries
            for (const delivery of activeDeliveries) {
                delivery.deliveryStatus = 'CANCELLED';
                delivery.deliveryOtp = null;
                delivery.otpAttempts = 0;
                delivery.otpBlockedUntil = null;
                delivery.notes =
                    'REASSIGNMENT_REQUIRED';

                await delivery.save();
            }
        }

        await deliveryPartner.save();

        return res.status(200).json({
            success: true,
            message: status === 'INACTIVE'
                ? 'Partner deactivated and active deliveries cancelled. Reassignment required.'
                : 'Delivery partner status updated successfully',
            deliveryPartner
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getPendingReassignment = async (req, res) => {
    try {
        const deliveries = await Delivery.find({
            deliveryStatus: 'CANCELLED',
            notes: 'REASSIGNMENT_REQUIRED'
        })
            .populate('order')
            .populate('deliveryPartner')
            .populate('store')
            .sort({ updatedAt: -1 });

        return res.status(200).json({
            success: true,
            count: deliveries.length,
            deliveries
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delivery Partner Online / Offline
const updateOnlineStatus = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { isOnline } = req.body;

        if (typeof isOnline !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isOnline must be true or false'
            });
        }

        const deliveryPartner = await DeliveryPartner.findOne({
            user: userId
        }).populate('user', 'status');

        if (!deliveryPartner) {
            return res.status(404).json({
                success: false,
                message: 'Delivery partner not found'
            });
        }

        if (
            deliveryPartner.status !== 'ACTIVE' ||
            deliveryPartner.user?.status !== 'active'
        ) {
            return res.status(403).json({
                success: false,
                message: 'Your account is not active. Contact admin.'
            });
        }

        deliveryPartner.isOnline = isOnline;

        // Login par availability manually OFF rahegi
        if (isOnline === true) {
            deliveryPartner.isAvailable = false;
        }

        // Logout par dono OFF
        if (isOnline === false) {
            deliveryPartner.isAvailable = false;
        }

        await deliveryPartner.save();

        return res.status(200).json({
            success: true,
            message: isOnline
                ? 'You are now online'
                : 'You are now offline',
            deliveryPartner
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const updateAvailability = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { isAvailable } = req.body;

        if (typeof isAvailable !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isAvailable must be true or false'
            });
        }

        const partner = await DeliveryPartner.findOne({
            user: userId
        }).populate('user', 'status');

        if (!partner) {
            return res.status(404).json({
                success: false,
                message: 'Delivery partner not found'
            });
        }

        if (
            partner.status !== 'ACTIVE' ||
            partner.user?.status !== 'active'
        ) {
            return res.status(403).json({
                success: false,
                message: 'Your account is not active'
            });
        }

        // Partner must be online to become available
        if (isAvailable && !partner.isOnline) {
            return res.status(400).json({
                success: false,
                message: 'Please login first'
            });
        }

        // Check active delivery
        if (isAvailable) {
            const activeDelivery = await Delivery.findOne({
                deliveryPartner: partner._id,
                deliveryStatus: {
                    $in: [
                        'ASSIGNED',
                        'ACCEPTED',
                        'PICKED_UP',
                        'OUT_FOR_DELIVERY'
                    ]
                }
            });

            if (activeDelivery) {
                return res.status(400).json({
                    success: false,
                    message: 'You already have an active delivery'
                });
            }
        }

        partner.isAvailable = isAvailable;

        await partner.save();

        return res.status(200).json({
            success: true,
            message: isAvailable
                ? 'You are now available for new orders'
                : 'You are now unavailable',
            isOnline: partner.isOnline,
            isAvailable: partner.isAvailable
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Get My Availability
const getMyAvailability = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;

        const partner = await DeliveryPartner.findOne({
            user: userId
        });

        if (!partner) {
            return res.status(404).json({
                success: false,
                message: 'Delivery partner not found'
            });
        }

        return res.status(200).json({
            success: true,
            isOnline: partner.isOnline,
            isAvailable: partner.isAvailable
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


module.exports = {
    getAllDeliveryPartners,
    updateDeliveryPartnerStatus,
    getPendingReassignment,
    updateOnlineStatus ,
    updateAvailability ,
    getMyAvailability 
}