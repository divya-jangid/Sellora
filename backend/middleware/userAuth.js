
const jwt = require('jsonwebtoken')
const User = require('../model/usermodel')

const userAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token

        if (!token) {
            return res.status(401).json({
                message: 'Please login first',
                status: false
            })
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        )

        const user = await User.findById(decoded.id)
            .populate('role', 'name')

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

        req.user = {
            id: user._id,
            role: user.role?.name?.toLowerCase().trim()
        }

        next()

    } catch (error) {
        return res.status(401).json({
            message: 'Invalid or expired token',
            status: false
        })
    }
}

module.exports = userAuth
