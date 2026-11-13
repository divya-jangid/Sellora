
const mongoose = require('mongoose');
const releaseReservedInventory = require('../utils/releaseReservedInventory');
const Order = require('../model/ordermodel');
const Cart = require('../model/cartmodel');
const CartItem = require('../model/cartitemModel');
const Address = require('../model/addressmodel');
const OrderItem = require('../model/orderitemsmodel');
const Payment = require('../model/paymentmodel');
const User = require('../model/usermodel');

const Product = require('../model/productmodel');
const ProductVariant = require('../model/productvariant');
const Store = require('../model/storemodel');
const Delivery = require('../model/deliverymodel');
const Inventory = require('../model/inventorymodel');

const Coupon = require('../model/couponModel');


// ======================================
// RESERVE INVENTORY
// ======================================
const reserveInventory = async (storeId, items) => {
    const reservedItems = [];

    try {
        for (const item of items) {
            const quantity = Number(item.quantity);

            const result = await Inventory.updateOne(
                {
                    store: storeId,
                    product: item.product,
                    variant: item.variant || null,
                    status: 'active',
                    availableQuantity: { $gte: quantity }
                },
                {
                    $inc: {
                        reservedQuantity: quantity,
                        availableQuantity: -quantity
                    }
                }
            );

            if (result.modifiedCount !== 1) {
                const error = new Error(
                    `${item.productName} has insufficient available stock`
                );
                error.statusCode = 400;
                throw error;
            }

            reservedItems.push({
                product: item.product,
                variant: item.variant || null,
                quantity
            });
        }

        return reservedItems;

    } catch (error) {
        // Rollback partially reserved stock
        for (const item of reservedItems.reverse()) {
            await Inventory.updateOne(
                {
                    store: storeId,
                    product: item.product,
                    variant: item.variant
                },
                {
                    $inc: {
                        reservedQuantity: -item.quantity,
                        availableQuantity: item.quantity
                    }
                }
            );
        }

        throw error;
    }
};


// ======================================
// DEDUCT INVENTORY AFTER DELIVERY
// ======================================
const deductDeliveredInventory = async (order) => {
    const items = await OrderItem.find({
        order: order._id
    });

    const deductedItems = [];

    try {
        for (const item of items) {
            const quantity = Number(item.quantity);

            const result = await Inventory.updateOne(
                {
                    store: order.store,
                    product: item.product,
                    variant: item.variant || null,
                    quantity: { $gte: quantity },
                    reservedQuantity: { $gte: quantity }
                },
                {
                    $inc: {
                        quantity: -quantity,
                        reservedQuantity: -quantity
                    }
                }
            );

            if (result.modifiedCount !== 1) {
                throw new Error(
                    `Inventory deduction failed for ${item.productName}`
                );
            }

            deductedItems.push({
                product: item.product,
                variant: item.variant || null,
                quantity
            });
        }

    } catch (error) {
        // Restore stock if any later item fails
        for (const item of deductedItems.reverse()) {
            await Inventory.updateOne(
                {
                    store: order.store,
                    product: item.product,
                    variant: item.variant
                },
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


// ======================================
// PLACE ORDER
// ======================================
const placeOrder = async (req, res) => {
    let createdOrder = null;
    let reservedItems = [];
    let couponUpdated = false;

    try {
        const userId = req.user.id;

        const {
            addressId,
            paymentMethod = 'COD',
            buyNow = null,
            storeId
        } = req.body;

        if (!addressId || !mongoose.Types.ObjectId.isValid(addressId)) {
            return res.status(400).json({
                message: 'Valid address ID is required',
                status: false
            });
        }

        if (!storeId || !mongoose.Types.ObjectId.isValid(storeId)) {
            return res.status(400).json({
                message: 'Valid store ID is required',
                status: false
            });
        }

        if (!['COD', 'online'].includes(paymentMethod)) {
            return res.status(400).json({
                message: 'Invalid payment method',
                status: false
            });
        }

        const address = await Address.findOne({
            _id: addressId,
            user: userId
        });

        if (!address) {
            return res.status(404).json({
                message: 'Address not found',
                status: false
            });
        }

        const store = await Store.findOne({
            _id: storeId,
            status: 'active'
        });

        if (!store) {
            return res.status(404).json({
                message: 'Selected store is not available',
                status: false
            });
        }

        let orderItemsData = [];
        let subtotal = 0;
        let tax = 0;
        let discount = 0;
        let appliedCoupon = null;
        let cart = null;

        // ======================================
        // BUY NOW FLOW
        // ======================================
        if (buyNow) {
            const {
                productId,
                variantId = null,
                quantity = 1
            } = buyNow;

            if (!mongoose.Types.ObjectId.isValid(productId)) {
                return res.status(400).json({
                    message: 'Valid product ID is required',
                    status: false
                });
            }

            if (
                variantId &&
                !mongoose.Types.ObjectId.isValid(variantId)
            ) {
                return res.status(400).json({
                    message: 'Invalid variant ID',
                    status: false
                });
            }

            if (!Number.isInteger(quantity) || quantity < 1) {
                return res.status(400).json({
                    message: 'Quantity must be a positive integer',
                    status: false
                });
            }

            const product = await Product.findOne({
                _id: productId,
                status: 'active'
            });

            if (!product) {
                return res.status(404).json({
                    message: 'Product not found',
                    status: false
                });
            }

            let variant = null;
            let price = Number(product.price);

            if (variantId) {
                variant = await ProductVariant.findOne({
                    _id: variantId,
                    product: product._id,
                    status: 'active'
                });

                if (!variant) {
                    return res.status(404).json({
                        message: 'Product variant not found',
                        status: false
                    });
                }

                price = Number(variant.sellingPrice);
            }

            if (!Number.isFinite(price) || price <= 0) {
                return res.status(400).json({
                    message: 'Invalid product price',
                    status: false
                });
            }

            // Check selected store inventory
            const inventory = await Inventory.findOne({
                store: store._id,
                product: product._id,
                variant: variant ? variant._id : null,
                status: 'active',
                availableQuantity: { $gte: quantity }
            });

            if (!inventory) {
                return res.status(400).json({
                    message: 'Product is not available in selected store',
                    status: false
                });
            }

            subtotal = Number((price * quantity).toFixed(2));

            orderItemsData.push({
                product: product._id,
                variant: variant ? variant._id : null,
                productName: product.name,
                variantName: variant ? variant.name : '',
                sku: variant ? variant.sku : '',
                quantity,
                price,
                discount: 0,
                tax: 0,
                totalPrice: subtotal
            });

        } else {

            // ======================================
            // NORMAL CART FLOW
            // ======================================
            cart = await Cart.findOne({
                user: userId,
                store: store._id
            });

            if (!cart) {
                return res.status(404).json({
                    message: 'Cart not found for selected store',
                    status: false
                });
            }

            tax = Number(cart.tax || 0);

            const cartItems = await CartItem.find({
                cart: cart._id
            })
                .populate('product')
                .populate('variant');

            if (!cartItems.length) {
                return res.status(400).json({
                    message: 'Your cart is empty',
                    status: false
                });
            }

            // Validate cart items
            for (const item of cartItems) {
                if (
                    !item.product ||
                    !Number.isFinite(Number(item.price)) ||
                    Number(item.price) <= 0 ||
                    !Number.isInteger(item.quantity) ||
                    item.quantity <= 0
                ) {
                    return res.status(400).json({
                        message: 'Invalid product, price or quantity in cart',
                        status: false
                    });
                }

                if (
                    item.variant &&
                    item.variant.status !== 'active'
                ) {
                    return res.status(400).json({
                        message: `${item.product.name} variant is not available`,
                        status: false
                    });
                }

                const inventory = await Inventory.findOne({
                    store: store._id,
                    product: item.product._id,
                    variant: item.variant ? item.variant._id : null,
                    status: 'active',
                    availableQuantity: { $gte: item.quantity }
                });

                if (!inventory) {
                    return res.status(400).json({
                        message: `${item.product.name} has insufficient store stock`,
                        status: false
                    });
                }
            }

            subtotal = cartItems.reduce(
                (sum, item) =>
                    sum + Number(item.price) * item.quantity,
                0
            );

            subtotal = Number(subtotal.toFixed(2));

            // COUPON VALIDATION
            if (cart.coupon) {
                appliedCoupon = await Coupon.findById(cart.coupon);

                if (
                    !appliedCoupon ||
                    appliedCoupon.status !== 'active'
                ) {
                    return res.status(400).json({
                        message: 'Applied coupon is no longer available',
                        status: false
                    });
                }

                const now = new Date();

                if (
                    now < appliedCoupon.startDate ||
                    now > appliedCoupon.expiryDate
                ) {
                    return res.status(400).json({
                        message: 'Coupon has expired or is not active yet',
                        status: false
                    });
                }

                if (
                    appliedCoupon.usageLimit != null &&
                    appliedCoupon.usedCount >= appliedCoupon.usageLimit
                ) {
                    return res.status(400).json({
                        message: 'Coupon usage limit reached',
                        status: false
                    });
                }

                if (subtotal < appliedCoupon.minimumOrderAmount) {
                    return res.status(400).json({
                        message: `Minimum order amount is ${appliedCoupon.minimumOrderAmount}`,
                        status: false
                    });
                }

                if (appliedCoupon.discountType === 'percentage') {
                    discount =
                        subtotal * appliedCoupon.discountValue / 100;

                    if (appliedCoupon.maximumDiscount != null) {
                        discount = Math.min(
                            discount,
                            appliedCoupon.maximumDiscount
                        );
                    }

                } else if (appliedCoupon.discountType === 'fixed') {
                    discount = appliedCoupon.discountValue;
                }

                discount = Number(
                    Math.max(
                        0,
                        Math.min(discount, subtotal)
                    ).toFixed(2)
                );
            }

            orderItemsData = cartItems.map(item => ({
                product: item.product._id,
                variant: item.variant ? item.variant._id : null,
                productName: item.product.name || 'Product',
                variantName: item.variant ? item.variant.name : '',
                sku: item.variant ? item.variant.sku : '',
                quantity: item.quantity,
                price: Number(item.price),
                discount: 0,
                tax: 0,
                totalPrice: Number(
                    (Number(item.price) * item.quantity).toFixed(2)
                )
            }));
        }

        // ======================================
        // FINAL AMOUNT
        // ======================================
        const deliveryFee = subtotal >= 999 ? 0 : 30;

        if (!Number.isFinite(tax) || tax < 0) {
            return res.status(400).json({
                message: 'Invalid tax amount',
                status: false
            });
        }

        const totalAmount = Number(
            (
                subtotal -
                discount +
                deliveryFee +
                tax
            ).toFixed(2)
        );

        if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
            return res.status(400).json({
                message: 'Invalid order amount',
                status: false
            });
        }

        // ======================================
        // RESERVE STOCK BEFORE ORDER CREATION
        // ======================================
        reservedItems = await reserveInventory(
            store._id,
            orderItemsData
        );

        // ======================================
        // CREATE ORDER
        // ======================================
        const orderNumber =
            `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const order = await Order.create({
            orderNumber,
            user: userId,
            store: store._id,
            address: address._id,
            subtotal,
            discount,
            deliveryFee,
            tax,
            totalAmount,
            coupon: appliedCoupon ? appliedCoupon._id : null,
            paymentMethod,
            paymentStatus: 'PENDING',
            orderStatus: 'placed',
            placedAt: new Date()
        });

        createdOrder = order;

        // CREATE PAYMENT
        const payment = await Payment.create({
            order: order._id,
            user: userId,
            paymentGateway: paymentMethod === 'online'
                ? 'RAZORPAY'
                : 'COD',
            razorpayOrderId: null,
            transactionId: null,
            amount: totalAmount,
            currency: 'INR',
            method: paymentMethod,
            status: 'PENDING',
            gatewayResponse: null,
            paidAt: null
        });

        // CREATE ORDER ITEMS
        const finalOrderItems = orderItemsData.map(item => ({
            ...item,
            order: order._id
        }));

        await OrderItem.insertMany(finalOrderItems);

        // UPDATE COUPON COUNT
        if (appliedCoupon) {
            await appliedCoupon.updateOne({
                $inc: { usedCount: 1 }
            });

            couponUpdated = true;
        }

        // CLEAR CART ONLY FOR NORMAL CHECKOUT
        if (!buyNow && cart) {
            await CartItem.deleteMany({
                cart: cart._id
            });

            cart.subtotal = 0;
            cart.discount = 0;
            cart.deliveryFee = 0;
            cart.tax = 0;
            cart.totalAmount = 0;
            cart.coupon = null;

            await cart.save();
        }

        return res.status(201).json({
            message: 'Order placed successfully',
            status: true,
            data: order,
            items: finalOrderItems,
            payment
        });

    } catch (error) {
        console.error('PLACE ORDER ERROR:', error);

        // Rollback reserved stock
        if (reservedItems.length > 0) {
            for (const item of reservedItems.reverse()) {
                try {
                    await Inventory.updateOne(
                        {
                            store: req.body.storeId,
                            product: item.product,
                            variant: item.variant
                        },
                        {
                            $inc: {
                                reservedQuantity: -item.quantity,
                                availableQuantity: item.quantity
                            }
                        }
                    );
                } catch (rollbackError) {
                    console.error(
                        'STOCK ROLLBACK ERROR:',
                        rollbackError.message
                    );
                }
            }
        }

        if (createdOrder) {
            try {
                await Payment.deleteMany({
                    order: createdOrder._id
                });

                await OrderItem.deleteMany({
                    order: createdOrder._id
                });

                await Order.findByIdAndDelete(createdOrder._id);

            } catch (cleanupError) {
                console.error(
                    'ORDER CLEANUP ERROR:',
                    cleanupError.message
                );
            }
        }

        if (couponUpdated && createdOrder?.coupon) {
            await Coupon.updateOne(
                { _id: createdOrder.coupon },
                { $inc: { usedCount: -1 } }
            );
        }

        return res.status(error.statusCode || 500).json({
            message: error.message || 'Failed to place order',
            status: false
        });
    }
};


// ======================================
// GET ALL USER ORDERS
// ======================================
const getOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        const orders = await Order.find({ user: userId })
            .populate('store', 'name code')
            .populate('address')
            .sort({ createdAt: -1 });

        const ordersWithItems = await Promise.all(
            orders.map(async order => {
                const items = await OrderItem.find({
                    order: order._id
                }).populate('product');

                return {
                    ...order.toObject(),
                    items
                };
            })
        );

        return res.status(200).json({
            message: 'Orders fetched successfully',
            status: true,
            totalOrders: ordersWithItems.length,
            orders: ordersWithItems
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Failed to fetch orders',
            status: false,
            error: error.message
        });
    }
};


// ======================================
// GET MY ORDERS
// ======================================

const getMyOrders = async (req, res) => {
    try {
        console.log('GET MY ORDERS API CALLED');

        const userId = req.user.id;

        const orders = await Order.find({ user: userId })
            .populate('address')
            .populate('store')
            .populate('deliveryPartner', 'firstName lastName phone')
            .sort({ createdAt: -1 });

        const ordersWithDetails = await Promise.all(
            orders.map(async (order) => {

                // Get Order Items
                const items = await OrderItem.find({
                    order: order._id
                }).populate('product');

                // Get Payment
                const payment = await Payment.findOne({
                    order: order._id,
                    user: userId
                });

                // Get Latest Delivery
                const delivery = await Delivery.findOne({
                    order: order._id
                }).sort({ createdAt: -1 });

                // Get Delivery Partner
                const partner = order.deliveryPartner;

                const deliveryPartner = partner
                    ? {
                        name: `${partner.firstName || ''} ${partner.lastName || ''}`.trim(),
                        phone: partner.phone
                    }
                    : null;

                return {
                    ...order.toObject(),
                    items,
                    payment,
                    delivery,
                    deliveryPartner
                };
            })
        );

        return res.status(200).json({
            message: 'Orders fetched successfully',
            status: true,
            data: ordersWithDetails
        });

    } catch (error) {
        console.error('Get My Orders Error:', error);

        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};



// ======================================
// CANCEL ORDER
// ======================================
const cancelOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { cancellationReason } = req.body;

        const existingOrder = await Order.findOne({
            _id: id,
            user: userId
        });

        if (!existingOrder) {
            return res.status(404).json({
                message: 'Order not found',
                status: false
            });
        }

        if (!['placed', 'confirmed'].includes(existingOrder.orderStatus)) {
            return res.status(400).json({
                message: 'This order cannot be cancelled',
                status: false
            });
        }

        // Atomic status change prevents duplicate stock release
        const order = await Order.findOneAndUpdate(
            {
                _id: id,
                user: userId,
                orderStatus: { $in: ['placed', 'confirmed'] }
            },
            {
                $set: {
                    orderStatus: 'cancelled',
                    cancelledAt: new Date(),
                    cancellationReason: cancellationReason || ''
                }
            },
            { new: true }
        );

        if (!order) {
            return res.status(400).json({
                message: 'Order is already being processed or cancelled',
                status: false
            });
        }

        try {
            await releaseReservedInventory(order);
        } catch (stockError) {
            // Restore original status if stock release fails
            await Order.updateOne(
                {
                    _id: order._id,
                    orderStatus: 'cancelled'
                },
                {
                    $set: {
                        orderStatus: existingOrder.orderStatus,
                        cancelledAt: null,
                        cancellationReason: ''
                    }
                }
            );

            throw stockError;
        }

        return res.status(200).json({
            message: 'Order cancelled and reserved stock released successfully',
            status: true,
            order
        });

    } catch (error) {
        console.error('CANCEL ORDER ERROR:', error);

        return res.status(500).json({
            message: 'Failed to cancel order',
            status: false,
            error: error.message
        });
    }
};


// ======================================
// GET ORDER BY ID
// ======================================

const getOrderById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const order = await Order.findById(id)
            .populate('store', 'name code phone address')
            .populate('address')
            .populate('deliveryPartner', 'firstName lastName phone');

        if (!order) {
            return res.status(404).json({
                message: 'Order not found',
                status: false
            });
        }

        // Check Order Ownership
        if (order.user.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'You are not authorized to view this order',
                status: false
            });
        }

        // Get Order Items
        const items = await OrderItem.find({
            order: order._id
        }).populate('product');

        // Get Latest Delivery
        const delivery = await Delivery.findOne({
            order: order._id
        })
            .sort({ createdAt: -1 })
            .select(
                'deliveryStatus pickupTime pickedUpAt outForDeliveryAt deliveredAt createdAt updatedAt'
            );

        return res.status(200).json({
            message: 'Order details fetched successfully',
            status: true,
            order: {
                ...order.toObject(),
                items,
                delivery
            }
        });

    } catch (error) {
        console.error('Get Order By ID Error:', error);

        return res.status(500).json({
            message: 'Failed to fetch order details',
            status: false,
            error: error.message
        });
    }
};


// ======================================
// GET ALL ORDERS - ADMIN
// ======================================

const getAllOrders = async (req, res) => {
    try {
        const {
            search = '',
            sort = 'latest',
            page = 1,
            limit = 10
        } = req.query;

        const currentPage = Math.max(1, parseInt(page) || 1);
        const pageLimit = Math.max(1, parseInt(limit) || 10);
        const skip = (currentPage - 1) * pageLimit;

        let filter = {};

        const userRole = String(req.user.role || '')
            .toLowerCase()
            .trim();

        if (
            userRole === 'delivery partner' ||
            userRole === 'delivery agent' ||
            userRole === 'deleivery agent'
        ) {
            filter.deliveryPartner = req.user.id;
        }

        // SEARCH
        if (search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');

            const users = await User.find({
                $or: [
                    { firstName: searchRegex },
                    { lastName: searchRegex },
                    { email: searchRegex }
                ]
            }).select('_id');

            const userIds = users.map(user => user._id);

            filter.$or = [
                { orderNumber: searchRegex },
                { user: { $in: userIds } }
            ];
        }

        // SORT
        let sortOption = { createdAt: -1 };

        if (sort === 'oldest') {
            sortOption = { createdAt: 1 };
        } else if (sort === 'amountLow') {
            sortOption = { totalAmount: 1 };
        } else if (sort === 'amountHigh') {
            sortOption = { totalAmount: -1 };
        }

        // TOTAL COUNT
        const totalOrders = await Order.countDocuments(filter);

        // FETCH ORDERS
        const orders = await Order.find(filter)
            .populate('user', 'firstName lastName email phone')
            .populate('store', 'name code')
            .populate('address')
            .sort(sortOption)
            .skip(skip)
            .limit(pageLimit);

        // FETCH ORDER ITEMS
        const ordersWithItems = await Promise.all(
            orders.map(async order => {
                const items = await OrderItem.find({
                    order: order._id
                })
                    .populate('product', 'name image')
                    .populate('variant');

                return {
                    ...order.toObject(),
                    items
                };
            })
        );

        const totalPages = Math.ceil(totalOrders / pageLimit);

        return res.status(200).json({
            message: 'Orders fetched successfully',
            status: true,
            totalOrders,
            totalPages,
            currentPage,
            limit: pageLimit,
            hasNextPage: currentPage < totalPages,
            hasPrevPage: currentPage > 1,
            orders: ordersWithItems
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Failed to fetch orders',
            status: false,
            error: error.message
        });
    }
};



// ======================================
// UPDATE ORDER STATUS
// ======================================
const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderStatus } = req.body;

        const allowedStatuses = [
            'confirmed',
            'processing',
            'shipped',
            'cancelled'
        ];

        if (!allowedStatuses.includes(orderStatus)) {
            return res.status(400).json({
                message: 'Invalid order status',
                status: false
            });
        }

        const existingOrder = await Order.findById(id);

        if (!existingOrder) {
            return res.status(404).json({
                message: 'Order not found',
                status: false
            });
        }

        if (
            existingOrder.orderStatus === 'cancelled' ||
            existingOrder.orderStatus === 'delivered'
        ) {
            return res.status(400).json({
                message: 'This order status cannot be changed',
                status: false
            });
        }

        const oldStatus = existingOrder.orderStatus;
        const updateData = {
            orderStatus
        };

        if (orderStatus === 'confirmed' && !existingOrder.confirmedAt) {
            updateData.confirmedAt = new Date();
        }

        if (orderStatus === 'processing' && !existingOrder.processingAt) {
            updateData.processingAt = new Date();
        }

        if (orderStatus === 'shipped' && !existingOrder.shippedAt) {
            updateData.shippedAt = new Date();
        }

        if (orderStatus === 'delivered') {
            updateData.deliveredAt = new Date();
        }

        if (orderStatus === 'cancelled') {
            updateData.cancelledAt = new Date();
            updateData.cancellationReason =
                req.body.cancellationReason || '';
        }

        // Atomic status change
        const order = await Order.findOneAndUpdate(
            {
                _id: id,
                orderStatus: oldStatus
            },
            {
                $set: updateData
            },
            { new: true }
        );

        if (!order) {
            return res.status(400).json({
                message: 'Order status has already been changed',
                status: false
            });
        }

        try {
            if (orderStatus === 'cancelled') {
                await releaseReservedInventory(order);
            }

            if (orderStatus === 'delivered') {
                await deductDeliveredInventory(order);
            }

        } catch (stockError) {
            // Restore old status if inventory operation fails
            await Order.updateOne(
                {
                    _id: order._id,
                    orderStatus
                },
                {
                    $set: {
                        orderStatus: oldStatus,
                        confirmedAt: existingOrder.confirmedAt,
                        processingAt: existingOrder.processingAt,
                        shippedAt: existingOrder.shippedAt,
                        deliveredAt: existingOrder.deliveredAt,
                        cancelledAt: existingOrder.cancelledAt,
                        cancellationReason: existingOrder.cancellationReason
                    }
                }
            );

            throw stockError;
        }

        return res.status(200).json({
            message: 'Order status updated successfully',
            status: true,
            order
        });

    } catch (error) {
        console.error('UPDATE ORDER STATUS ERROR:', error);

        return res.status(500).json({
            message: 'Failed to update order status',
            status: false,
            error: error.message
        });
    }
};


// ======================================
// ADMIN ORDER DETAILS
// ======================================
const getAdminOrderDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findById(id)
            .populate('user', 'firstName lastName email phone')
            .populate('store', 'name code')
            .populate('address')
            .populate('coupon');

        if (!order) {
            return res.status(404).json({
                message: 'Order not found',
                status: false
            });
        }

        const items = await OrderItem.find({
            order: order._id
        })
            .populate('product', 'name image')
            .populate('variant');

        return res.status(200).json({
            message: 'Order details fetched successfully',
            status: true,
            order: {
                ...order.toObject(),
                items
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Failed to fetch order details',
            status: false,
            error: error.message
        });
    }
};


module.exports = {
    placeOrder,
    getOrders,
    getMyOrders,
    cancelOrder,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    getAdminOrderDetails

};
