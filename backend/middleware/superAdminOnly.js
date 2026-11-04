
const User = require('../model/usermodel')

const superAdminOnly = async (req, res, next) => {
    try {
        const userId = req.user?.id || req.user?._id

        if (!userId) {
            return res.status(401).json({
                message: 'User not authenticated',
                status: false
            })
        }

        const user = await User.findById(userId)
            .populate('role')

        if (!user || !user.role) {
            return res.status(403).json({
                message: 'User role not found',
                status: false
            })
        }

        const roleName = user.role.name.trim().toLowerCase()

        if (roleName !== 'super admin') {
            return res.status(403).json({
                message: 'Access denied. Only Super Admin can manage roles',
                status: false
            })
        }

        next()
    } catch (error) {
        console.log('SUPER ADMIN ERROR:', error.message)

        return res.status(500).json({
            message: 'Super Admin check failed',
            status: false
        })
    }
}

module.exports = superAdminOnly
