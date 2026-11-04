const mongoose = require('mongoose');

const Order = require('../model/ordermodel');
const Cart = require('../model/cartmodel');
const CartItem = require('../model/cartitemModel');
const Address = require('../model/addressmodel');
const OrderItem = require('../model/orderitemsmodel');
const Payment = require('../model/paymentmodel');
const User = require('../model/usermodel')

const Product = require('../model/productmodel');
const ProductVariant = require('../model/productvariant');
const Store = require('../model/storemodel');
const DeliveryPartner = require('../model/deliverypartnermodel');
const Delivery = require('../model/deliverymodel');




const placeOrder = async (req, res) => {
    let createdOrder = null

    try {
        const userId = req.user.id

        const {
            addressId,
            paymentMethod = 'COD',
            buyNow = null
        } = req.body

        if (!addressId) {
            return res.status(400).json({
                message: 'Address ID is required',
                status: false
            })
        }

        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            return res.status(400).json({
                message: 'Invalid address ID',
                status: false
            })
        }

        if (!['COD', 'online'].includes(paymentMethod)) {
            return res.status(400).json({
                message: 'Invalid payment method',
                status: false
            })
        }

        const address = await Address.findOne({
            _id: addressId,
            user: userId
        })

        if (!address) {
            return res.status(404).json({
                message: 'Address not found',
                status: false
            })
        }

        let store = null
        let orderItemsData = []
        let subtotal = 0
        let tax = 0
        let appliedCoupon = null
        let discount = 0
        let cart = null

        // BUY NOW FLOW
        if (buyNow) {
            const {
                productId,
                variantId = null,
                quantity = 1
            } = buyNow

            if (
                !productId ||
                !mongoose.Types.ObjectId.isValid(productId)
            ) {
                return res.status(400).json({
                    message: 'Valid product ID is required',
                    status: false
                })
            }

            if (
                variantId &&
                !mongoose.Types.ObjectId.isValid(variantId)
            ) {
                return res.status(400).json({
                    message: 'Invalid variant ID',
                    status: false
                })
            }

            if (
                !Number.isInteger(quantity) ||
                quantity < 1
            ) {
                return res.status(400).json({
                    message: 'Quantity must be a positive integer',
                    status: false
                })
            }

            const product = await Product.findOne({
                _id: productId,
                status: 'active'
            })

            if (!product) {
                return res.status(404).json({
                    message: 'Product not found',
                    status: false
                })
            }

            let variant = null
            let price = Number(product.price)

            if (variantId) {
                variant = await ProductVariant.findOne({
                    _id: variantId,
                    product: product._id,
                    status: 'active'
                })

                if (!variant) {
                    return res.status(404).json({
                        message: 'Product variant not found',
                        status: false
                    })
                }

                price = Number(variant.sellingPrice)
            }

            // PRODUCT STOCK VALIDATION
            if (
                !Number.isFinite(Number(product.stock)) ||
                Number(product.stock) < quantity
            ) {
                return res.status(400).json({
                    message: 'Insufficient product stock',
                    status: false
                })
            }

            // PRICE VALIDATION
            if (!Number.isFinite(price) || price <= 0) {
                return res.status(400).json({
                    message: 'Invalid product price',
                    status: false
                })
            }

            store = await Store.findOne({
                status: 'active'
            })

            if (!store) {
                return res.status(404).json({
                    message: 'No active store found',
                    status: false
                })
            }

            subtotal = Number(
                (price * quantity).toFixed(2)
            )

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
            })

        } else {

            // NORMAL CART FLOW
            cart = await Cart.findOne({
                user: userId
            })

            if (!cart) {
                return res.status(404).json({
                    message: 'Cart not found',
                    status: false
                })
            }

            if (!cart.store) {
                return res.status(400).json({
                    message: 'Store not found in cart',
                    status: false
                })
            }

            store = cart.store
            tax = Number(cart.tax || 0)

            const cartItems = await CartItem.find({
                cart: cart._id
            })
                .populate('product')
                .populate('variant')

            if (!cartItems.length) {
                return res.status(400).json({
                    message: 'Your cart is empty',
                    status: false
                })
            }

            // VALIDATE CART ITEMS AND STOCK
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
                    })
                }

                // PRODUCT STOCK VALIDATION
                if (
                    !Number.isFinite(Number(item.product.stock)) ||
                    Number(item.product.stock) < item.quantity
                ) {
                    return res.status(400).json({
                        message: `${item.product.name} has insufficient stock`,
                        status: false
                    })
                }

                // VARIANT STATUS VALIDATION
                if (
                    item.variant &&
                    item.variant.status !== 'active'
                ) {
                    return res.status(400).json({
                        message: `${item.product.name} variant is not available`,
                        status: false
                    })
                }
            }

            subtotal = cartItems.reduce(
                (sum, item) =>
                    sum + Number(item.price) * item.quantity,
                0
            )

            subtotal = Number(subtotal.toFixed(2))

            // COUPON VALIDATION
            if (cart.coupon) {
                const Coupon = require('../model/couponModel')

                appliedCoupon = await Coupon.findById(cart.coupon)

                if (
                    !appliedCoupon ||
                    appliedCoupon.status !== 'active'
                ) {
                    return res.status(400).json({
                        message: 'Applied coupon is no longer available',
                        status: false
                    })
                }

                const now = new Date()

                if (
                    now < appliedCoupon.startDate ||
                    now > appliedCoupon.expiryDate
                ) {
                    return res.status(400).json({
                        message: 'Coupon has expired or is not active yet',
                        status: false
                    })
                }

                if (
                    appliedCoupon.usageLimit != null &&
                    appliedCoupon.usedCount >= appliedCoupon.usageLimit
                ) {
                    return res.status(400).json({
                        message: 'Coupon usage limit reached',
                        status: false
                    })
                }

                if (subtotal < appliedCoupon.minimumOrderAmount) {
                    return res.status(400).json({
                        message: `Minimum order amount is ${appliedCoupon.minimumOrderAmount}`,
                        status: false
                    })
                }

                if (appliedCoupon.discountType === 'percentage') {
                    discount =
                        subtotal * appliedCoupon.discountValue / 100

                    if (appliedCoupon.maximumDiscount != null) {
                        discount = Math.min(
                            discount,
                            appliedCoupon.maximumDiscount
                        )
                    }

                } else if (appliedCoupon.discountType === 'fixed') {
                    discount = appliedCoupon.discountValue
                }

                discount = Number(
                    Math.max(
                        0,
                        Math.min(discount, subtotal)
                    ).toFixed(2)
                )
            }

            // PREPARE ORDER ITEMS
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
            }))
        }

        // FINAL AMOUNT CALCULATION
        const deliveryFee = subtotal >= 999 ? 0 : 30

        if (!Number.isFinite(tax) || tax < 0) {
            return res.status(400).json({
                message: 'Invalid tax amount',
                status: false
            })
        }

        const totalAmount = Number(
            (
                subtotal -
                discount +
                deliveryFee +
                tax
            ).toFixed(2)
        )

        if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
            return res.status(400).json({
                message: 'Invalid order amount',
                status: false
            })
        }

        // CREATE ORDER
        const orderNumber =
            `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`

        const order = await Order.create({
            orderNumber,
            user: userId,
            store: store._id || store,
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
        })

        createdOrder = order

        // CREATE PAYMENT
        const payment = await Payment.create({
            order: order._id,
            user: userId,
            paymentGateway: paymentMethod === 'online' ? 'RAZORPAY' : 'COD',
            razorpayOrderId: null,
            transactionId: null,
            amount: totalAmount,
            currency: 'INR',
            method: paymentMethod,
            status: 'PENDING',
            gatewayResponse: null,
            paidAt: null
        })

        // CREATE ORDER ITEMS
        const finalOrderItems = orderItemsData.map(item => ({
            ...item,
            order: order._id
        }))

        await OrderItem.insertMany(finalOrderItems)

        // UPDATE COUPON COUNT
        if (appliedCoupon) {
            await appliedCoupon.updateOne({
                $inc: {
                    usedCount: 1
                }
            })
        }

        // CLEAR CART ONLY FOR NORMAL CART CHECKOUT
        if (!buyNow && cart) {
            await CartItem.deleteMany({
                cart: cart._id
            })

            cart.subtotal = 0
            cart.discount = 0
            cart.deliveryFee = 0
            cart.tax = 0
            cart.totalAmount = 0
            cart.coupon = null

            await cart.save()
        }

        return res.status(201).json({
            message: 'Order placed successfully',
            status: true,
            data: order,
            items: finalOrderItems,
            payment
        })

    } catch (error) {
        console.error('PLACE ORDER ERROR:', error)

        if (createdOrder) {
            try {
                await Payment.deleteMany({
                    order: createdOrder._id
                })

                await OrderItem.deleteMany({
                    order: createdOrder._id
                })

                await Order.findByIdAndDelete(
                    createdOrder._id
                )

            } catch (cleanupError) {
                console.error(
                    'ORDER CLEANUP ERROR:',
                    cleanupError.message
                )
            }
        }

        return res.status(500).json({
            message: 'Failed to place order',
            status: false,
            error: error.message
        })
    }
}


const getOrders = async (req, res) => {
    try {
        const userId = req.user.id;

        const orders = await Order.find({ user: userId })
            .populate('store', 'name code')
            .populate('address')
            .sort({ createdAt: -1 });

        const ordersWithItems = await Promise.all(
            orders.map(async (order) => {
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

const getMyOrders = async (req, res) => {

            console.log('🔥 GET MY ORDERS API CALLED');


    try {
        const userId = req.user.id;

        const orders = await Order.find({ user: userId })
            .populate('address')
            .populate('store')
            .populate('deliveryPartner', 'firstName lastName phone')
            .sort({ createdAt: -1 });

            console.log(
    'POPULATED DELIVERY PARTNER:',
    orders.map(order => order.deliveryPartner)
);



        const ordersWithDetails = await Promise.all(
            orders.map(async (order) => {

                const items = await OrderItem.find({
                    order: order._id
                }).populate('product');

                const payment = await Payment.findOne({
                    order: order._id,
                    user: userId
                });

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


const cancelOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { cancellationReason } = req.body;

        const order = await Order.findOne({
            _id: id,
            user: userId
        });

        if (!order) {
            return res.status(404).json({
                message: 'Order not found',
                status: false
            });
        }

        if (!['placed', 'confirmed'].includes(order.orderStatus)) {
            return res.status(400).json({
                message: 'This order cannot be cancelled',
                status: false
            });
        }

        order.orderStatus = 'cancelled';
        order.cancelledAt = new Date();
        order.cancellationReason = cancellationReason || '';

        await order.save();

        return res.status(200).json({
            message: 'Order cancelled successfully',
            status: true,
            order
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Failed to cancel order',
            status: false,
            error: error.message
        });
    }
}





const getOrderById = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Find order
        const order = await Order.findById(id)
            .populate('store', 'name code phone address')
            .populate('address');

        console.log("ORDER FOUND:", !!order);

        if (!order) {
            return res.status(404).json({
                message: 'Order not found',
                status: false
            });
        }
        

        console.log("ORDER USER:", order.user);
console.log("ORDER USER STRING:", order.user.toString());

console.log("LOGIN USER:", req.user);
console.log("LOGIN USER ID:", req.user.id);
console.log("LOGIN USER ID STRING:", req.user.id.toString());

        // Check order ownership
        if (order.user.toString() !== userId.toString()) {
            return res.status(403).json({
                message: 'You are not authorized to view this order',
                status: false
            });
        }

        // Get order items
        const items = await OrderItem.find({
            order: order._id
        }).populate('product');

        // Get delivery details
        const delivery = await Delivery.findOne({
            order: order._id
        }).select(
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
        return res.status(500).json({
            message: 'Failed to fetch order details',
            status: false,
            error: error.message
        });
    }
};


const getAllOrders = async (req, res) => {

    try {
        const {
            search = '',
            sort = 'latest'
        } = req.query;

        let filter = {};

        // CHECK USER ROLE
        const userRole = String(req.user.role || '')
            .toLowerCase()
            .trim();

        // DELIVERY PARTNER: ONLY ASSIGNED ORDERS
        if (
            userRole === 'delivery partner' ||
            userRole === 'delivery agent' ||
            userRole === 'deleivery agent'
        ) {
            filter.deliveryPartner = req.user.id;
        }

        // SEARCH CUSTOMER
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

        // SORTING
        let sortOption = { createdAt: -1 };

        if (sort === 'oldest') {
            sortOption = { createdAt: 1 };
        } else if (sort === 'amountLow') {
            sortOption = { totalAmount: 1 };
        } else if (sort === 'amountHigh') {
            sortOption = { totalAmount: -1 };
        }

        // FETCH ORDERS
        const orders = await Order.find(filter)
            .populate('user', 'firstName lastName email phone')
            .populate('store', 'name code')
            .populate('address')
            .sort(sortOption);

        // FETCH ORDER ITEMS
        const ordersWithItems = await Promise.all(
            orders.map(async (order) => {
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


const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { orderStatus } = req.body;

        const allowedStatuses = [
            'confirmed',
            'processing',
            'shipped',
            'delivered',
            'cancelled'
        ];

        if (!allowedStatuses.includes(orderStatus)) {
            return res.status(400).json({
                message: 'Invalid order status',
                status: false
            });
        }

        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                message: 'Order not found',
                status: false
            });
        }

        // Prevent changing completed or cancelled orders
        if (
            order.orderStatus === 'cancelled' ||
            order.orderStatus === 'delivered'
        ) {
            return res.status(400).json({
                message: 'This order status cannot be changed',
                status: false
            });
        }

        // Update Order Status
        order.orderStatus = orderStatus;

        // Save status timestamps
        if (orderStatus === 'confirmed' && !order.confirmedAt) {
            order.confirmedAt = new Date();
        }

        if (orderStatus === 'processing' && !order.processingAt) {
            order.processingAt = new Date();
        }

        if (orderStatus === 'shipped' && !order.shippedAt) {
            order.shippedAt = new Date();
        }

        if (orderStatus === 'delivered') {
            order.deliveredAt = new Date();
        }

        if (orderStatus === 'cancelled') {
            order.cancelledAt = new Date();
            order.cancellationReason =
                req.body.cancellationReason || '';
        }

        await order.save();

        return res.status(200).json({
            message: 'Order status updated successfully',
            status: true,
            order
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Failed to update order status',
            status: false,
            error: error.message
        });
    }
};


const getAdminOrderDetails = async (req, res) => {
    try {
        const { id } = req.params

        const order = await Order.findById(id)
            .populate('user', 'firstName lastName email phone')
            .populate('store', 'name code')
            .populate('address')
            .populate('coupon')

        if (!order) {
            return res.status(404).json({
                message: 'Order not found',
                status: false
            })
        }

        const items = await OrderItem.find({
            order: order._id
        })
            .populate('product', 'name image')
            .populate('variant')

        return res.status(200).json({
            message: 'Order details fetched successfully',
            status: true,
            order: {
                ...order.toObject(),
                items
            }
        })

    } catch (error) {
        return res.status(500).json({
            message: 'Failed to fetch order details',
            status: false,
            error: error.message
        })
    }
}


module.exports = { placeOrder, getOrders, getMyOrders, cancelOrder,
     getOrderById, getAllOrders, updateOrderStatus , getAdminOrderDetails }



