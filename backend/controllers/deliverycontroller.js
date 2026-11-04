const DeliveryPartner = require('../model/deliverypartnermodel');
const Delivery = require('../model/deliverymodel');
const Order = require('../model/ordermodel');
const crypto = require('crypto');
const transporter = require('../utils/email')
const OrderItem = require('../model/orderitemsmodel');

// Create Delivery and Assign Partner


const assignDeliveryPartner = async (req, res) => {
    try {
        const { orderId, deliveryPartnerId, notes } = req.body;

        if (!orderId || !deliveryPartnerId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID and Delivery Partner ID are required'
            });
        }

        // Find Order and Customer Email
        const order = await Order.findById(orderId)
            .populate('user', 'firstName lastName email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (['delivered', 'cancelled'].includes(order.orderStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot assign delivery for this order'
            });
        }

        // Check customer email
        const customerEmail = order.user?.email;

        if (!customerEmail) {
            return res.status(400).json({
                success: false,
                message: 'Customer email not found'
            });
        }

        // Check existing active delivery
        const existingDelivery = await Delivery.findOne({
            order: orderId,
            deliveryStatus: {
                $in: [
                    'ASSIGNED',
                    'ACCEPTED',
                    'PICKED_UP',
                    'OUT_FOR_DELIVERY'
                ]
            }
        });

        if (existingDelivery) {
            return res.status(400).json({
                success: false,
                message: 'Delivery is already assigned to this order'
            });
        }

        // Find available Delivery Partner
        const partner = await DeliveryPartner.findOne({
            _id: deliveryPartnerId,
            status: 'ACTIVE',
            isOnline: true,
            isAvailable: true
        });

        if (!partner) {
            return res.status(404).json({
                success: false,
                message: 'Delivery partner is not available'
            });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        // Create Delivery
        const delivery = await Delivery.create({
            order: order._id,
            deliveryPartner: partner._id,
            store: order.store,
            deliveryAddress: order.address,
            deliveryOtp: otp,
            otpAttempts: 0,
            otpBlockedUntil: null,
            notes: notes || ''
        });

        // Send OTP to Customer Email
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: customerEmail,
                subject: 'Sellora - Your Delivery OTP',
                text: `Hello ${order.user.firstName},

Your order ${order.orderNumber} has been assigned to a delivery partner.

Your delivery verification OTP is: ${otp}

Please share this OTP with the delivery partner only when you receive your order.

Do not share this OTP before receiving your order.

Thank you,
Team Sellora`
            });
        } catch (emailError) {

             console.log('OTP EMAIL ERROR:', emailError)
  console.log('EMAIL ERROR MESSAGE:', emailError.message)
            // Remove delivery if email fails
            await Delivery.findByIdAndDelete(delivery._id);

            return res.status(500).json({
                success: false,
                message: 'OTP email could not be sent. Please try again.'
            });
        }

        // Update Order
        order.deliveryPartner = partner.user;
        await order.save();

        // Partner becomes unavailable
        partner.isAvailable = false;
        await partner.save();

        return res.status(201).json({
            success: true,
            message: 'Delivery partner assigned and OTP sent to customer email successfully',
            delivery: {
                _id: delivery._id,
                order: delivery.order,
                deliveryPartner: delivery.deliveryPartner,
                store: delivery.store,
                deliveryAddress: delivery.deliveryAddress,
                deliveryStatus: delivery.deliveryStatus,
                createdAt: delivery.createdAt
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



const getAvailableDeliveryPartners = async (req, res) => {
    try {
        const partners = await DeliveryPartner.find({
            status: 'ACTIVE',
            isOnline: true,
            isAvailable: true
        })
        .populate('user', 'firstName lastName email phone')
        .sort({ createdAt: -1 });

        return res.status(200).json({
            message: 'Available delivery partners fetched successfully',
            status: true,
            totalPartners: partners.length,
            partners
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Failed to fetch delivery partners',
            status: false,
            error: error.message
        });
    }
};

// Update Delivery Status
const updateDeliveryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { deliveryStatus } = req.body;

        const allowedStatus = [
            'ACCEPTED',
            'PICKED_UP',
            'OUT_FOR_DELIVERY',
            'DELIVERED',
            'FAILED',
            'CANCELLED'
        ];

        if (!allowedStatus.includes(deliveryStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid delivery status'
            });
        }

        const delivery = await Delivery.findById(id);

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }

        delivery.deliveryStatus = deliveryStatus;

        if (deliveryStatus === 'ACCEPTED' && !delivery.pickupTime) {
            delivery.pickupTime = new Date();
        }

        if (deliveryStatus === 'PICKED_UP' && !delivery.pickedUpAt) {
            delivery.pickedUpAt = new Date();
        }

        if (deliveryStatus === 'OUT_FOR_DELIVERY' && !delivery.outForDeliveryAt) {
            delivery.outForDeliveryAt = new Date();
        }

        if (deliveryStatus === 'DELIVERED') {
            delivery.deliveredAt = new Date();
        }

        await delivery.save();

        // Update Order Status
        const order = await Order.findById(delivery.order);

        if (order) {
            if (deliveryStatus === 'ACCEPTED') {
                order.orderStatus = 'processing';
                if (!order.processingAt) {
                    order.processingAt = new Date();
                }
            }

            if (deliveryStatus === 'OUT_FOR_DELIVERY') {
                order.orderStatus = 'shipped';

                if (!order.shippedAt) {
                    order.shippedAt = new Date();
                }
            }

            if (deliveryStatus === 'DELIVERED') {
                order.orderStatus = 'delivered';
                order.deliveredAt = new Date();
            }

            await order.save();
        }

        // Check Partner's Other Active Deliveries
        const activeDelivery = await Delivery.findOne({
            _id: { $ne: delivery._id },
            deliveryPartner: delivery.deliveryPartner,
            deliveryStatus: {
                $in: [
                    'ASSIGNED',
                    'ACCEPTED',
                    'PICKED_UP',
                    'OUT_FOR_DELIVERY'
                ]
            }
        });

        // Update Partner Availability
        const partner = await DeliveryPartner.findById(
            delivery.deliveryPartner
        );

        if (partner) {
            if (
                partner.status === 'ACTIVE' &&
                partner.isOnline === true &&
                !activeDelivery &&
                !['FAILED', 'CANCELLED'].includes(deliveryStatus)
            ) {
                partner.isAvailable = true;
            } else {
                partner.isAvailable = false;
            }

            await partner.save();
        }

        return res.status(200).json({
            success: true,
            message: 'Delivery status updated successfully',
            delivery,
            partnerAvailable: partner?.isAvailable
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const updateMyDeliveryStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { deliveryId, deliveryStatus } = req.body;

        const allowedStatuses = [
            'ACCEPTED',
            'PICKED_UP',
            'OUT_FOR_DELIVERY',
            'FAILED'
        ];

        if (!deliveryId || !deliveryStatus) {
            return res.status(400).json({
                success: false,
                message: 'Delivery ID and status are required'
            });
        }

        if (!allowedStatuses.includes(deliveryStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid delivery status'
            });
        }

        // Find logged-in user's Delivery Partner profile
        const partner = await DeliveryPartner.findOne({
            user: userId,
            status: 'ACTIVE'
        });

        if (!partner) {
            return res.status(404).json({
                success: false,
                message: 'Active delivery partner not found'
            });
        }

        // Partner can update only their own delivery
        const delivery = await Delivery.findOne({
            _id: deliveryId,
            deliveryPartner: partner._id
        });

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found or not assigned to you'
            });
        }

       const allowedTransitions = {
    ASSIGNED: ['ACCEPTED'],
    ACCEPTED: ['PICKED_UP'],
    PICKED_UP: ['OUT_FOR_DELIVERY'],
    OUT_FOR_DELIVERY: ['FAILED']
};
        if (!allowedTransitions[delivery.deliveryStatus]?.includes(deliveryStatus)) {
            return res.status(400).json({
                success: false,
                message: `Cannot change status from ${delivery.deliveryStatus} to ${deliveryStatus}`
            });
        }

        delivery.deliveryStatus = deliveryStatus;

        if (deliveryStatus === 'ACCEPTED') {
            delivery.pickupTime = new Date();
        }

        if (deliveryStatus === 'PICKED_UP') {
            delivery.pickedUpAt = new Date();
        }

        if (deliveryStatus === 'OUT_FOR_DELIVERY') {
            delivery.outForDeliveryAt = new Date();
        }

        if (deliveryStatus === 'DELIVERED') {
            delivery.deliveredAt = new Date();
        }

        await delivery.save();

        // Update Order
        const order = await Order.findById(delivery.order);

        if (order) {
            if (deliveryStatus === 'OUT_FOR_DELIVERY') {
                order.orderStatus = 'shipped';
            }

            if (deliveryStatus === 'DELIVERED') {
                order.orderStatus = 'delivered';
                order.deliveredAt = new Date();
            }

            if (deliveryStatus === 'FAILED') {
                order.orderStatus = 'processing';
            }

            await order.save();
        }

        // Check other active deliveries
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

        partner.isAvailable =
            partner.status === 'ACTIVE' &&
            partner.isOnline &&
            !activeDelivery;

        await partner.save();

        return res.status(200).json({
            success: true,
            message: 'Delivery status updated successfully',
            delivery,
            isAvailable: partner.isAvailable
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const getMyDeliveries = async (req, res) => {
    try {
        const userId = req.user.id;

        const partner = await DeliveryPartner.findOne({
            user: userId
        });

        if (!partner) {
            return res.status(404).json({
                success: false,
                message: 'Delivery partner not found'
            });
        }

        const deliveries = await Delivery.find({
            deliveryPartner: partner._id
        })
            .populate({
                path: 'order',
                populate: {
                    path: 'user',
                    select: 'firstName lastName email phone'
                }
            })
            .populate('store')
            .populate('deliveryAddress')
            .sort({ createdAt: -1 });

        // FETCH ORDER ITEMS
        const deliveriesWithItems = await Promise.all(
            deliveries.map(async (delivery) => {
                const order = delivery.order;

                if (!order) {
                    return {
                        ...delivery.toObject(),
                        order: null
                    };
                }

                const items = await OrderItem.find({
                    order: order._id
                })
                    .populate('product', 'name image')
                    .populate('variant');

                return {
                    ...delivery.toObject(),
                    order: {
                        ...order.toObject(),
                        items
                    }
                };
            })
        );

        return res.status(200).json({
            success: true,
            message: 'My deliveries fetched successfully',
            deliveries: deliveriesWithItems
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


const verifyDeliveryOtp = async (req, res) => {
    try {
        const { deliveryId, otp } = req.body;
        const userId = req.user.id;

        // Validate input
        if (!deliveryId || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Delivery ID and OTP are required'
            });
        }

        // Find active delivery partner
        const partner = await DeliveryPartner.findOne({
            user: userId,
            status: 'ACTIVE'
        });

        if (!partner) {
            return res.status(404).json({
                success: false,
                message: 'Active delivery partner not found'
            });
        }

        // Find delivery assigned to this partner
        const delivery = await Delivery.findOne({
            _id: deliveryId,
            deliveryPartner: partner._id
        });

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }

        // Check delivery status
        if (delivery.deliveryStatus !== 'OUT_FOR_DELIVERY') {
            return res.status(400).json({
                success: false,
                message: 'Order is not out for delivery'
            });
        }

        // Check OTP exists
        if (!delivery.deliveryOtp) {
            return res.status(400).json({
                success: false,
                message: 'Delivery OTP not generated'
            });
        }

        // Check if OTP is blocked
        if (
            delivery.otpBlockedUntil &&
            new Date() < delivery.otpBlockedUntil
        ) {
            return res.status(403).json({
                success: false,
                message: 'Too many wrong attempts. Try again after 15 minutes.'
            });
        }

        // Verify OTP
        if (delivery.deliveryOtp !== String(otp).trim()) {

            delivery.otpAttempts += 1;

            // Block after 5 wrong attempts
            if (delivery.otpAttempts >= 5) {
                delivery.otpBlockedUntil = new Date(
                    Date.now() + 15 * 60 * 1000
                );
            }

            await delivery.save();

            return res.status(400).json({
                success: false,
                message: delivery.otpAttempts >= 5
                    ? 'Too many wrong attempts. OTP blocked for 15 minutes.'
                    : 'Invalid OTP',
                attemptsLeft: Math.max(
                    0,
                    5 - delivery.otpAttempts
                )
            });
        }

        // OTP correct - mark delivery as delivered
        delivery.deliveryStatus = 'DELIVERED';
        delivery.deliveredAt = new Date();

        // Clear OTP and attempts
        delivery.deliveryOtp = null;
        delivery.otpAttempts = 0;
        delivery.otpBlockedUntil = null;

        await delivery.save();

        // Update Order
      // Update Order
const order = await Order.findById(delivery.order);

if (order) {
    order.orderStatus = 'delivered';
    order.deliveredAt = new Date();

    // COD payment update
    if (order.paymentMethod === 'COD') {
        order.paymentStatus = 'SUCCESS';
    }

    await order.save();
}

        // Check other active deliveries
        const activeDelivery = await Delivery.findOne({
            _id: { $ne: delivery._id },
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

        // Update partner availability
        partner.isAvailable =
            partner.status === 'ACTIVE' &&
            partner.isOnline === true &&
            !activeDelivery;

        await partner.save();

        return res.status(200).json({
            success: true,
            message: 'OTP verified. Order delivered successfully',
            delivery: {
                _id: delivery._id,
                deliveryStatus: delivery.deliveryStatus,
                deliveredAt: delivery.deliveredAt
            },
            orderStatus: order?.orderStatus,
            isAvailable: partner.isAvailable
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const resendDeliveryOtp = async (req, res) => {
    try {
        const { deliveryId } = req.body;

        if (!deliveryId) {
            return res.status(400).json({
                success: false,
                message: 'Delivery ID is required'
            });
        }

        const delivery = await Delivery.findById(deliveryId);

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }

        if (delivery.deliveryStatus !== 'OUT_FOR_DELIVERY') {
            return res.status(400).json({
                success: false,
                message: 'OTP can only be regenerated for out-for-delivery orders'
            });
        }

        // Generate new 6-digit OTP
        const otp = crypto.randomInt(100000, 1000000).toString();

        delivery.deliveryOtp = otp;

        // Reset wrong attempts and block
        delivery.otpAttempts = 0;
        delivery.otpBlockedUntil = null;

        await delivery.save();

        return res.status(200).json({
            success: true,
            message: 'New delivery OTP generated successfully'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    assignDeliveryPartner,
    getAvailableDeliveryPartners,
    updateDeliveryStatus ,
    updateMyDeliveryStatus  ,
    getMyDeliveries ,
    verifyDeliveryOtp ,
    resendDeliveryOtp 
};