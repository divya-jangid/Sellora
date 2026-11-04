const crypto = require('crypto');
const Payment = require('../model/paymentmodel')
const razorpay = require('../config/razorpay');
const Order = require('../model/ordermodel')


const createPayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.user.id;

        if (!orderId) {
            return res.status(400).json({
                message: 'Order ID is required',
                status: false
            });
        }

        const Order = require('../model/ordermodel');

        const order = await Order.findOne({
            _id: orderId,
            user: userId
        });

        if (!order) {
            return res.status(404).json({
                message: 'Order not found',
                status: false
            });
        }

        const payment = await Payment.create({
            order: order._id,
            user: userId,
            paymentGateway: 'COD',
            transactionId: null,
            razorpayOrderId: null,
            amount: order.totalAmount,
            currency: 'INR',
            method: 'COD',
            status: 'PENDING',
            gatewayResponse: null,
            paidAt: null
        });

        return res.status(201).json({
            message: 'Payment record created successfully',
            status: true,
            payment
        });

    } catch (error) {
         console.log('Create Payment Error:', error);

        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};

const getPayments = async (req, res) => {
    try {
        const userId = req.user.id;

        const payments = await Payment.find({
            user: userId
        })
            .populate('order')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: 'Payments fetched successfully',
            status: true,
            data: payments
        });

    } catch (error) {
        console.log('Get Payments Error:', error);

        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
}


const createRazorpayOrder = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.user.id;

        if (!orderId) {
            return res.status(400).json({
                message: 'Order ID is required',
                status: false
            });
        }

        const order = await Order.findOne({
            _id: orderId,
            user: userId
        });

        if (!order) {
            return res.status(404).json({
                message: 'Order not found',
                status: false
            });
        }

        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(order.totalAmount * 100),
            currency: 'INR',
            receipt: order.orderNumber
        });

        const payment = await Payment.findOne({
    order: order._id,
    user: userId
});

if (!payment) {
    return res.status(404).json({
        message: 'Payment record not found',
        status: false
    });
}

payment.paymentGateway = 'RAZORPAY';
payment.method = 'online';
payment.razorpayOrderId = razorpayOrder.id;

await payment.save();

        return res.status(201).json({
            message: 'Razorpay order created successfully',
            status: true,
            data: {
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                key: process.env.RAZORPAY_TEST_API
            }
        });

    } catch (error) {
        console.error('Razorpay Order Error:', error);

        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};


const verifyRazorpayPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        console.log('Verify body:', req.body);
        console.log('Verify user:', req.user?._id);

        const userId = req.user.id;
        
        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                message: 'Payment details are required',
                status: false
            });
        }

        const payment = await Payment.findOne({
            razorpayOrderId: razorpay_order_id,
            user: userId
        });

        if (!payment) {
            return res.status(404).json({
                message: 'Payment record not found',
                status: false
            });
        }

        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET_API)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature !== razorpay_signature) {
            payment.status = 'FAILED';
            await payment.save();

            return res.status(400).json({
                message: 'Invalid payment signature',
                status: false
            });
        }

        payment.status = 'SUCCESS';
        payment.transactionId = razorpay_payment_id;
        payment.paymentGateway = 'RAZORPAY';
        payment.gatewayResponse = {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        };
        payment.paidAt = new Date();

        await payment.save();

        const order = await Order.findById(payment.order);

        if (order) {
            order.paymentStatus = 'SUCCESS';
            await order.save();
        }

        return res.status(200).json({
            message: 'Payment verified successfully',
            status: true,
            data: payment
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};


module.exports = { createRazorpayOrder, verifyRazorpayPayment ,createPayment, getPayments };
