
const DeliveryPartner = require('../model/deliverypartnermodel');
const Delivery = require('../model/deliverymodel');
const Order = require('../model/ordermodel');
const crypto = require('crypto');
const transporter = require('../utils/email');
const OrderItem = require('../model/orderitemsmodel');
const Inventory = require('../model/inventorymodel');


// Deduct Inventory After Successful Delivery
const deductDeliveredInventory = async (order) => {
    const orderItems = await OrderItem.find({
        order: order._id
    });

    if (!orderItems.length) {
        throw new Error('Order items not found');
    }

    if (!order.store) {
        throw new Error('Order store not found');
    }

    const deductedItems = [];

    try {
        for (const item of orderItems) {

            const inventory = await Inventory.findOneAndUpdate(
                {
                    store: order.store,
                    product: item.product,
                    variant: item.variant || null,
                    status: 'active',
                    quantity: { $gte: item.quantity },
                    reservedQuantity: { $gte: item.quantity }
                },
                {
                    $inc: {
                        quantity: -item.quantity,
                        reservedQuantity: -item.quantity
                    }
                },
                { new: true }
            );

            if (!inventory) {
                throw new Error(
                    `Inventory deduction failed for product ${item.product}`
                );
            }

            deductedItems.push({
                inventoryId: inventory._id,
                quantity: item.quantity
            });
        }

    } catch (error) {

        // Rollback previously deducted inventory
        for (const item of deductedItems) {
            await Inventory.findByIdAndUpdate(
                item.inventoryId,
                {
                    $inc: {
                        quantity: item.quantity,
                        reservedQuantity: item.quantity
                    }
                }
            );
        }

        throw error;
    }
};


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

        // Generate secure 6 digit OTP
        const otp = crypto.randomInt(100000, 1000000).toString();

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

            console.log('OTP EMAIL ERROR:', emailError.message);

            await Delivery.findByIdAndDelete(delivery._id);

            return res.status(500).json({
                success: false,
                message: 'OTP email could not be sent. Please try again.'
            });
        }

        // Update Order
        order.deliveryPartner = partner.user;
        await order.save();

        // Mark previous delivery as reassigned
await Delivery.updateMany(
    {
        order: orderId,
        deliveryStatus: 'CANCELLED',
        notes: 'REASSIGNMENT_REQUIRED'
    },
    {
        $set: {
            notes: 'REASSIGNED'
        }
    }
);

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


// Get Available Delivery Partners
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


// Admin Update Delivery Status
const updateDeliveryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { deliveryStatus } = req.body;

        // Admin cannot directly mark delivery as DELIVERED.
        // OTP verification is required for delivery completion.
        const allowedStatus = [
            'ACCEPTED',
            'PICKED_UP',
            'OUT_FOR_DELIVERY',
            'FAILED',
            'CANCELLED'
        ];

        if (!allowedStatus.includes(deliveryStatus)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid delivery status. Delivery completion requires OTP verification.'
            });
        }

        const delivery = await Delivery.findById(id);

        if (!delivery) {
            return res.status(404).json({
                success: false,
                message: 'Delivery not found'
            });
        }

        const order = await Order.findById(delivery.order);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const allowedTransitions = {
            ASSIGNED: ['ACCEPTED', 'CANCELLED'],
            ACCEPTED: ['PICKED_UP', 'CANCELLED'],
            PICKED_UP: ['OUT_FOR_DELIVERY', 'CANCELLED'],
            OUT_FOR_DELIVERY: ['FAILED', 'CANCELLED'],
            FAILED: [],
            CANCELLED: []
        };

        if (
            !allowedTransitions[delivery.deliveryStatus]?.includes(deliveryStatus)
        ) {
            return res.status(400).json({
                success: false,
                message: `Cannot change status from ${delivery.deliveryStatus} to ${deliveryStatus}`
            });
        }

        // Update Delivery Status
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

        await delivery.save();

        // Update Order Status
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

        if (deliveryStatus === 'FAILED' || deliveryStatus === 'CANCELLED') {
            order.orderStatus = 'processing';
        }

        await order.save();

        // Check Other Active Deliveries
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
            partner.isAvailable =
                partner.status === 'ACTIVE' &&
                partner.isOnline === true &&
                !activeDelivery;

            await partner.save();
        }

        return res.status(200).json({
            success: true,
            message: 'Delivery status updated successfully',
            delivery,
            orderStatus: order.orderStatus,
            partnerAvailable: partner?.isAvailable
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Delivery Partner Update Own Delivery Status
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

        // Find delivery assigned to this partner
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

        // Allowed status transitions
        const allowedTransitions = {
            ASSIGNED: ['ACCEPTED'],
            ACCEPTED: ['PICKED_UP'],
            PICKED_UP: ['OUT_FOR_DELIVERY'],
            OUT_FOR_DELIVERY: ['FAILED']
        };

        if (
            !allowedTransitions[delivery.deliveryStatus]?.includes(deliveryStatus)
        ) {
            return res.status(400).json({
                success: false,
                message: `Cannot change status from ${delivery.deliveryStatus} to ${deliveryStatus}`
            });
        }

        // Find Order before updating delivery
        const order = await Order.findById(delivery.order);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Update Delivery Status
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

        await delivery.save();

        // Update Order Status
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

        if (deliveryStatus === 'FAILED') {
            order.orderStatus = 'processing';
        }

        await order.save();

        // Check Other Active Deliveries
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

        // Update Partner Availability
        partner.isAvailable =
            partner.status === 'ACTIVE' &&
            partner.isOnline === true &&
            !activeDelivery;

        await partner.save();

        return res.status(200).json({
            success: true,
            message: 'Delivery status updated successfully',
            delivery,
            orderStatus: order.orderStatus,
            isAvailable: partner.isAvailable
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Get My Deliveries
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

        // Fetch Order Items
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



const getMyEarnings = async (req, res) => {
    try {
        const userId = req.user.id;

        const {
            startDate,
            endDate,
            sortBy = 'newest',
            page = 1,
            limit = 10
        } = req.query;

        // VALIDATE SORTING
        if (!['newest', 'oldest'].includes(sortBy)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid sorting option'
            });
        }

        // VALIDATE DATES
        const isValidDate = (date) => {
            if (!date) return true;

            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                return false;
            }

            const parsed = new Date(`${date}T00:00:00Z`);

            return (
                !Number.isNaN(parsed.getTime()) &&
                parsed.toISOString().slice(0, 10) === date
            );
        };

        if (!isValidDate(startDate) || !isValidDate(endDate)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid date format. Use YYYY-MM-DD'
            });
        }

        if (startDate && endDate && startDate > endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date cannot be after end date'
            });
        }

        // BACKEND PAGINATION
        const currentPage = Math.max(parseInt(page) || 1, 1);
        const perPage = Math.min(
            Math.max(parseInt(limit) || 10, 1),
            50
        );

        const skip = (currentPage - 1) * perPage;

        // INDIA DATE FORMAT
        const getIndiaDate = (date) => {
            return new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Kolkata',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            }).format(date);
        };

        const today = getIndiaDate(new Date());

        // GET ALL DELIVERED ORDERS FOR SUMMARY
        const baseQuery = {
            deliveryPartner: userId,
            orderStatus: 'delivered'
        };

        const allOrders = await Order.find(baseQuery)
            .select(
                'orderNumber totalAmount deliveryEarning deliveredAt'
            );

        // CURRENT WEEK MONDAY TO SUNDAY
        const todayDate = new Date(`${today}T00:00:00Z`);
        const day = todayDate.getUTCDay();

        const weekStart = new Date(todayDate);

        weekStart.setUTCDate(
            todayDate.getUTCDate() - (day === 0 ? 6 : day - 1)
        );

        const weekStartDate = weekStart.toISOString().slice(0, 10);

        const monthStartDate = today.slice(0, 7);

        let todayEarning = 0;
        let weeklyEarning = 0;
        let monthlyEarning = 0;
        let totalEarnings = 0;

        // CALCULATE SUMMARY
        allOrders.forEach((order) => {
            const earning = Number(order.deliveryEarning) || 0;

            const deliveredDate = order.deliveredAt
                ? getIndiaDate(order.deliveredAt)
                : '';

            totalEarnings += earning;

            if (deliveredDate === today) {
                todayEarning += earning;
            }

            if (
                deliveredDate >= weekStartDate &&
                deliveredDate <= today
            ) {
                weeklyEarning += earning;
            }

            if (deliveredDate.startsWith(monthStartDate)) {
                monthlyEarning += earning;
            }
        });

        // LAST 7 DAYS GRAPH DATA
        const chartData = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date(todayDate);

            date.setUTCDate(date.getUTCDate() - i);

            const dateKey = date.toISOString().slice(0, 10);

            const amount = allOrders.reduce((total, order) => {
                if (
                    order.deliveredAt &&
                    getIndiaDate(order.deliveredAt) === dateKey
                ) {
                    return total + (Number(order.deliveryEarning) || 0);
                }

                return total;
            }, 0);

            chartData.push({
                date: dateKey,
                earning: amount
            });
        }

        // HISTORY FILTER QUERY
        const historyQuery = { ...baseQuery };

        // INDIA DATE RANGE
        if (startDate || endDate) {
            historyQuery.deliveredAt = {};

            if (startDate) {
                historyQuery.deliveredAt.$gte = new Date(
                    `${startDate}T00:00:00+05:30`
                );
            }

            if (endDate) {
                historyQuery.deliveredAt.$lte = new Date(
                    `${endDate}T23:59:59.999+05:30`
                );
            }
        }

        // BACKEND SORTING
        const sortOrder = sortBy === 'oldest' ? 1 : -1;

        // TOTAL FILTERED RECORDS
        const totalRecords = await Order.countDocuments(historyQuery);

        // PAGINATED HISTORY
        const orders = await Order.find(historyQuery)
            .select(
                'orderNumber totalAmount deliveryEarning deliveredAt'
            )
            .sort({ deliveredAt: sortOrder })
            .skip(skip)
            .limit(perPage);

        const earningsHistory = orders.map((order) => ({
            orderId: order._id,
            orderNumber: order.orderNumber,
            orderAmount: order.totalAmount,
            earning: Number(order.deliveryEarning) || 0,
            deliveredAt: order.deliveredAt
        }));

        return res.status(200).json({
            success: true,

            earnings: {
                todayEarning,
                weeklyEarning,
                monthlyEarning,
                totalEarnings,
                totalDeliveries: allOrders.length
            },

            chartData,

            earningsHistory,

            pagination: {
                currentPage,
                limit: perPage,
                totalRecords,
                totalPages: Math.ceil(totalRecords / perPage)
            }
        });

    } catch (error) {
        console.error('GET MY EARNINGS ERROR:', error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Verify Delivery OTP


const verifyDeliveryOtp = async (req, res) => {
    let lockedDelivery = null;
    let inventoryDeducted = false;
    let partnerEarningUpdated = false;
    let deliveryEarning = 0;

    try {
        const { deliveryId, otp } = req.body;
        const userId = req.user.id;

        if (!deliveryId || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Delivery ID and OTP are required'
            });
        }

        // FIND ACTIVE DELIVERY PARTNER
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

        // FIND DELIVERY ASSIGNED TO THIS PARTNER
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

        if (delivery.deliveryStatus !== 'OUT_FOR_DELIVERY') {
            return res.status(400).json({
                success: false,
                message: 'Order is not out for delivery'
            });
        }

        if (!delivery.deliveryOtp) {
            return res.status(400).json({
                success: false,
                message: 'Delivery OTP not generated'
            });
        }

        // CHECK OTP BLOCK
        if (
            delivery.otpBlockedUntil &&
            new Date() < delivery.otpBlockedUntil
        ) {
            return res.status(403).json({
                success: false,
                message: 'Too many wrong attempts. Try again after 15 minutes.'
            });
        }

        // VERIFY OTP
        const enteredOtp = String(otp).trim();

        if (delivery.deliveryOtp !== enteredOtp) {
            delivery.otpAttempts += 1;

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
                attemptsLeft: Math.max(0, 5 - delivery.otpAttempts)
            });
        }

        // FIND ORDER
        const order = await Order.findById(delivery.order);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.orderStatus === 'delivered') {
            return res.status(400).json({
                success: false,
                message: 'Order is already delivered'
            });
        }

        // CHECK ORDER IS ASSIGNED TO THIS PARTNER
        if (
            !order.deliveryPartner ||
            order.deliveryPartner.toString() !== partner.user.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: 'This order is not assigned to you'
            });
        }

        // CALCULATE 3% EARNING FROM ORDER TOTAL
        deliveryEarning = Number(
            ((Number(order.totalAmount) || 0) * 0.03).toFixed(2)
        );

        // SAVE OLD OTP DETAILS FOR ROLLBACK
        const oldOtp = delivery.deliveryOtp;
        const oldOtpAttempts = delivery.otpAttempts;
        const oldOtpBlockedUntil = delivery.otpBlockedUntil;

        // ATOMIC DELIVERY LOCK
        lockedDelivery = await Delivery.findOneAndUpdate(
            {
                _id: delivery._id,
                deliveryPartner: partner._id,
                deliveryStatus: 'OUT_FOR_DELIVERY',
                deliveryOtp: enteredOtp
            },
            {
                $set: {
                    deliveryStatus: 'DELIVERED',
                    deliveredAt: new Date(),
                    deliveryOtp: null,
                    otpAttempts: 0,
                    otpBlockedUntil: null
                }
            },
            { new: true }
        );

        if (!lockedDelivery) {
            return res.status(409).json({
                success: false,
                message: 'Delivery is already being processed or OTP is invalid'
            });
        }

        try {
            // DEDUCT INVENTORY ONLY ONCE
            await deductDeliveredInventory(order);
            inventoryDeducted = true;

            // UPDATE ORDER
            order.orderStatus = 'delivered';
            order.deliveredAt = lockedDelivery.deliveredAt;
            order.deliveryEarning = deliveryEarning;
            order.earningStatus = 'PENDING';
            order.earningPaidAt = null;

            if (order.paymentMethod === 'COD') {
                order.paymentStatus = 'SUCCESS';
            }

            await order.save();

            // UPDATE PARTNER TOTAL EARNINGS AND DELIVERIES
            const updatedPartner = await DeliveryPartner.findByIdAndUpdate(
                partner._id,
                {
                    $inc: {
                        totalEarnings: deliveryEarning,
                        totalDeliveries: 1
                    }
                },
                { new: true }
            );

            if (!updatedPartner) {
                throw new Error('Delivery partner earning update failed');
            }

            partnerEarningUpdated = true;

            partner.totalEarnings = updatedPartner.totalEarnings;
            partner.totalDeliveries = updatedPartner.totalDeliveries;

        } catch (processError) {

            // ROLLBACK PARTNER EARNING IF UPDATED
            if (partnerEarningUpdated) {
                await DeliveryPartner.updateOne(
                    { _id: partner._id },
                    {
                        $inc: {
                            totalEarnings: -deliveryEarning,
                            totalDeliveries: -1
                        }
                    }
                );
            }

            // ROLLBACK INVENTORY
            if (inventoryDeducted) {
                const items = await OrderItem.find({
                    order: order._id
                });

                for (const item of items) {
                    await Inventory.updateOne(
                        {
                            store: order.store,
                            product: item.product,
                            variant: item.variant || null
                        },
                        {
                            $inc: {
                                quantity: item.quantity,
                                reservedQuantity: item.quantity
                            }
                        }
                    );
                }
            }

            // ROLLBACK ORDER
            order.orderStatus = 'shipped';
            order.deliveredAt = null;
            order.deliveryEarning = 0;
            order.earningStatus = 'PENDING';
            order.earningPaidAt = null;

            if (order.paymentMethod === 'COD') {
                order.paymentStatus = 'PENDING';
            }

            await order.save();

            // RESTORE DELIVERY STATUS AND OTP
            await Delivery.updateOne(
                {
                    _id: lockedDelivery._id,
                    deliveryStatus: 'DELIVERED'
                },
                {
                    $set: {
                        deliveryStatus: 'OUT_FOR_DELIVERY',
                        deliveredAt: null,
                        deliveryOtp: oldOtp,
                        otpAttempts: oldOtpAttempts,
                        otpBlockedUntil: oldOtpBlockedUntil
                    }
                }
            );

            throw processError;
        }

        // CHECK OTHER ACTIVE DELIVERIES
        const activeDelivery = await Delivery.findOne({
            _id: { $ne: lockedDelivery._id },
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

        // UPDATE PARTNER AVAILABILITY
        partner.isAvailable =
            partner.status === 'ACTIVE' &&
            partner.isOnline === true &&
            !activeDelivery;

        await partner.save();

        return res.status(200).json({
            success: true,
            message: 'OTP verified. Order delivered successfully',

            delivery: {
                _id: lockedDelivery._id,
                deliveryStatus: lockedDelivery.deliveryStatus,
                deliveredAt: lockedDelivery.deliveredAt
            },

            orderStatus: order.orderStatus,
            deliveryEarning,
            totalEarnings: partner.totalEarnings,
            totalDeliveries: partner.totalDeliveries,
            earningStatus: order.earningStatus,
            isAvailable: partner.isAvailable
        });

    } catch (error) {
        console.error('VERIFY DELIVERY OTP ERROR:', error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};



// Resend Delivery OTP
const resendDeliveryOtp = async (req, res) => {
    try {
        const { deliveryId } = req.body;
        const userId = req.user.id;

        if (!deliveryId) {
            return res.status(400).json({
                success: false,
                message: 'Delivery ID is required'
            });
        }

        // Find Active Delivery Partner
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

        // Find Delivery Assigned to This Partner
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

        if (delivery.deliveryStatus !== 'OUT_FOR_DELIVERY') {
            return res.status(400).json({
                success: false,
                message: 'OTP can only be regenerated for out-for-delivery orders'
            });
        }

        // Find Customer Email
        const order = await Order.findById(delivery.order)
            .populate('user', 'firstName email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (!order.user?.email) {
            return res.status(400).json({
                success: false,
                message: 'Customer email not found'
            });
        }

        // Generate New OTP
        const otp = crypto.randomInt(100000, 1000000).toString();

        // Send New OTP to Customer
        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: order.user.email,
                subject: 'Sellora - Your New Delivery OTP',
                text: `Hello ${order.user.firstName},

Your new delivery verification OTP for order ${order.orderNumber} is: ${otp}

Please share this OTP with the delivery partner only when you receive your order.

Do not share this OTP before receiving your order.

Thank you,
Team Sellora`
            });

        } catch (emailError) {
            console.log('RESEND OTP EMAIL ERROR:', emailError.message);

            return res.status(500).json({
                success: false,
                message: 'OTP email could not be sent. Please try again.'
            });
        }

        // Save New OTP and Reset Attempts
        delivery.deliveryOtp = otp;
        delivery.otpAttempts = 0;
        delivery.otpBlockedUntil = null;

        await delivery.save();

        return res.status(200).json({
            success: true,
            message: 'New delivery OTP sent successfully to customer email'
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
    updateDeliveryStatus,
    updateMyDeliveryStatus,
    getMyDeliveries,
    getMyEarnings,
    verifyDeliveryOtp,
    resendDeliveryOtp
};
