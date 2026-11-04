
const jwt = require('jsonwebtoken')
const User = require('../model/usermodel')

const adminAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token

        if (!token) {
            return res.status(401).json({
                message: 'Please login first',
                status: false
            })
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await User.findById(decoded.id)
            .populate('role', 'name permissions')

        if (!user) {
            return res.status(401).json({
                message: 'User not found',
                status: false
            })
        }

        if (user.status !== 'active') {
            return res.status(403).json({
                message: 'Your account is inactive or blocked',
                status: false
            })
        }

        if (!user.role || !user.role.name) {
            return res.status(403).json({
                message: 'Role not assigned',
                status: false
            })
        }

        const roleName = user.role.name.toLowerCase().trim()

        const allowedRoles = [
            'super admin',
            'admin',
            'delivery partner',
            'store manager'
        ]

        if (!allowedRoles.includes(roleName)) {
            return res.status(403).json({
                message: 'Access denied. Admin access required.',
                status: false
            })
        }

        req.user = {
            _id: user._id,
            role: roleName,
            permissions: user.role.permissions || []
        }

        next()

    } catch (error) {
        return res.status(401).json({
            message: 'Invalid or expired token',
            status: false
        })
    }
}

module.exports = adminAuth
