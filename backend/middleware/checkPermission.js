
const checkPermission = (permission) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    message: 'User not authenticated',
                    status: false
                })
            }

            const roleName = req.user.role?.toLowerCase().trim()

            // Super Admin has all permissions
            if (roleName === 'super admin') {
                return next()
            }

            const permissions = req.user.permissions || []

            if (!permissions.includes(permission)) {
                return res.status(403).json({
                    message: `Access denied. Permission required: ${permission}`,
                    status: false
                })
            }

            next()

        } catch (error) {
            console.log('PERMISSION ERROR:', error.message)

            return res.status(500).json({
                message: 'Permission check failed',
                status: false
            })
        }
    }
}

module.exports = checkPermission
