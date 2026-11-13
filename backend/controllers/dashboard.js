
const User = require('../model/usermodel')
const Product = require('../model/productmodel')
const Store = require('../model/storemodel')
const Order = require('../model/ordermodel')
const Inventory = require('../model/inventorymodel')

// ROLE NAME NORMALIZE
const normalizeRole = (role) => {
    return role.toLowerCase().trim().replace(/[\s_-]/g, '')
}

const getDashboardData = async (req, res) => {
    try {
        const role = normalizeRole(req.user.role)
        const userId = req.user._id

        let dashboardData = {}

        // SUPER ADMIN AND ADMIN DASHBOARD
        if (role === 'superadmin' || role === 'admin') {

            const [
                totalUsers,
                totalProducts,
                activeProducts,
                inactiveProducts,
                outOfStockProducts,
                availableProducts,
                totalStores,
                activeStores,
                totalOrders,
                pendingOrders,
                deliveredOrders,
                cancelledOrders,
                totalInventory,
                lowStockItems,
                lowStockProducts
            ] = await Promise.all([

                User.countDocuments(),

                Product.countDocuments(),
                Product.countDocuments({ status: 'active' }),
                Product.countDocuments({ status: 'inactive' }),
                Product.countDocuments({ stock: 0 }),
                Product.countDocuments({ stock: { $gt: 0 } }),

                Store.countDocuments(),
                Store.countDocuments({ status: 'active' }),

                Order.countDocuments(),

                Order.countDocuments({
                    orderStatus: {
                        $in: ['placed', 'confirmed', 'processing', 'shipped']
                    }
                }),

                Order.countDocuments({ orderStatus: 'delivered' }),
                Order.countDocuments({ orderStatus: 'cancelled' }),

                Inventory.countDocuments(),

                // LOW STOCK COUNT
                Inventory.countDocuments({
                    status: 'active',
                    $expr: {
                        $lte: ['$availableQuantity', '$reorderLevel']
                    }
                }),

                // LOW STOCK PRODUCT DETAILS
                Inventory.find({
                    status: 'active',
                    $expr: {
                        $lte: ['$availableQuantity', '$reorderLevel']
                    }
                })
                    .populate('store', 'name')
                    .populate('product', 'name')
                    .populate('variant', 'name')
            ])

            dashboardData = {
                totalUsers,
                totalProducts,
                activeProducts,
                inactiveProducts,
                outOfStockProducts,
                availableProducts,
                totalStores,
                activeStores,
                totalOrders,
                pendingOrders,
                deliveredOrders,
                cancelledOrders,
                totalInventory,
                lowStockItems,
                lowStockProducts
            }
        }

        // STORE MANAGER DASHBOARD
        else if (role === 'storemanager') {

            const store = await Store.findOne({
                manager: userId
            })

            if (!store) {
                return res.status(404).json({
                    success: false,
                    message: 'No store assigned to this manager'
                })
            }

            const [
                totalOrders,
                pendingOrders,
                deliveredOrders,
                cancelledOrders,
                totalInventory,
                lowStockItems,
                outOfStockItems,
                totalProducts,
                lowStockProducts
            ] = await Promise.all([

                Order.countDocuments({
                    store: store._id
                }),

                Order.countDocuments({
                    store: store._id,
                    orderStatus: {
                        $in: ['placed', 'confirmed', 'processing', 'shipped']
                    }
                }),

                Order.countDocuments({
                    store: store._id,
                    orderStatus: 'delivered'
                }),

                Order.countDocuments({
                    store: store._id,
                    orderStatus: 'cancelled'
                }),

                Inventory.countDocuments({
                    store: store._id
                }),

                Inventory.countDocuments({
                    store: store._id,
                    status: 'active',
                    $expr: {
                        $lte: ['$availableQuantity', '$reorderLevel']
                    }
                }),

                Inventory.countDocuments({
                    store: store._id,
                    availableQuantity: 0
                }),

                Inventory.distinct('product', {
                    store: store._id
                }),

                // STORE MANAGER LOW STOCK DETAILS
                Inventory.find({
                    store: store._id,
                    status: 'active',
                    $expr: {
                        $lte: ['$availableQuantity', '$reorderLevel']
                    }
                })
                    .populate('store', 'name')
                    .populate('product', 'name')
                    .populate('variant', 'name')
            ])

            dashboardData = {
                storeName: store.name,
                totalOrders,
                pendingOrders,
                deliveredOrders,
                cancelledOrders,
                totalInventory,
                lowStockItems,
                outOfStockItems,
                totalProducts: totalProducts.length,
                lowStockProducts
            }
        }

        // DELIVERY PARTNER DASHBOARD
        else if (role === 'deliverypartner') {

            const [
                assignedOrders,
                pendingDeliveries,
                deliveredOrders,
                cancelledOrders
            ] = await Promise.all([

                Order.countDocuments({
                    deliveryPartner: userId
                }),

                Order.countDocuments({
                    deliveryPartner: userId,
                    orderStatus: {
                        $in: ['placed', 'confirmed', 'processing', 'shipped']
                    }
                }),

                Order.countDocuments({
                    deliveryPartner: userId,
                    orderStatus: 'delivered'
                }),

                Order.countDocuments({
                    deliveryPartner: userId,
                    orderStatus: 'cancelled'
                })
            ])

            dashboardData = {
                assignedOrders,
                pendingDeliveries,
                deliveredOrders,
                cancelledOrders
            }
        }

        // UNAUTHORIZED ROLE
        else {
            return res.status(403).json({
                success: false,
                message: 'Dashboard access denied'
            })
        }

        return res.status(200).json({
            success: true,
            message: 'Dashboard data fetched successfully',
            role: req.user.role,
            data: dashboardData
        })

    } catch (error) {
        console.log('Dashboard Error:', error)

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message
        })
    }
}

module.exports = { getDashboardData }
