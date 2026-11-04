const User = require('../model/usermodel')
const Role = require('../model/rolemodel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const DeliveryPartner = require('../model/deliverypartnermodel')

const signup = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password} = req.body;

        const existingUser = await User.findOne({
            $or: [{ email }, { phone }]
        });

        if (existingUser) {
            return res.status(409).json({
                message: 'Email or phone already exists',
                status: false
            });
        }

        const hashPassword = await bcrypt.hash(password, 8);

        const adminRole = await Role.findOne({
            name: 'admin',
            status: 'active'
        });

        if (!adminRole) {
            return res.status(404).json({
                message: 'Admin role not found',
                status: false
            });
        }

        const admin = new User({
            role: adminRole._id,
            firstName,
            lastName,
            email,
            phone,
            password: hashPassword,
        });

        await admin.save();

        return res.status(201).json({
            message: 'Admin signup successful',
            status: true,
            user: {
                _id: admin._id,
                firstName: admin.firstName,
                lastName: admin.lastName,
                email: admin.email,
                phone: admin.phone,
                role: 'admin'
            }
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message,
            status: false
        });
    }
};

// LOGIN 

const login = async (req, res) => {
    try {
        const { email, password } = req.body

        // Find user with role and permissions
        const admin = await User.findOne({ email })
            .populate('role', 'name permissions')

        // Check user exists
        if (!admin) {
            return res.status(404).json({
                message: 'Admin not found',
                status: false
            })
        }

        // Check role
        if (admin.role?.name?.toLowerCase() === 'user') {
            return res.status(403).json({
                message: 'Permission Denied',
                status: false
            })
        }

        // Check password
        const isMatch = await bcrypt.compare(
            password,
            admin.password
        )

        if (!isMatch) {
            return res.status(401).json({
                message: 'Invalid email or password',
                status: false
            })
        }

        // Check email verification
        if (!admin.isEmailVerified) {
            return res.status(403).json({
                message: 'Please verify your email before logging in',
                status: false,
                requiresEmailVerification: true
            })
        }

        // Check account status
        if (admin.status !== 'active') {
            return res.status(403).json({
                message: 'Account is inactive',
                status: false
            })
        }

        // Check if user is Delivery Partner
        const deliveryPartner = await DeliveryPartner.findOne({
            user: admin._id
        })

        // If Delivery Partner, make online after login
        if (deliveryPartner) {

            if (deliveryPartner.status !== 'ACTIVE') {
                return res.status(403).json({
                    message: 'Your Delivery Partner account is not active',
                    status: false
                })
            }

            deliveryPartner.isOnline = true
            deliveryPartner.isAvailable = false

            await deliveryPartner.save()
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: admin._id,
                role: admin.role.name
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1d'
            }
        )

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        })

        // Login successful
        return res.status(200).json({
            message: 'Login successful',
            status: true,
            user: {
                _id: admin._id,
                firstName: admin.firstName,
                lastName: admin.lastName,
                email: admin.email,
                role: admin.role._id,
                roleName: admin.role.name,
                permissions: admin.role.permissions
            }
        })

    } catch (err) {
        console.log('Login Error:', err)

        return res.status(500).json({
            message: err.message,
            status: false
        })
    }
}



const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: false,
            sameSite: 'lax'
        });

        return res.status(200).json({
            message: 'Logout successful',
            status: true
        });

    } catch (error) {
        return res.status(500).json({
            message: 'Logout failed',
            status: false
        });
    }
};


module.exports = { signup , login, logout }