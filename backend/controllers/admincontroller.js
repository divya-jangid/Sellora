const User = require('../model/usermodel')
const Role = require('../model/rolemodel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const DeliveryPartner = require('../model/deliverypartnermodel')


const signup = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            password
        } = req.body

        // Validate required fields
        if (!firstName || !lastName || !email || !phone || !password) {
            return res.status(400).json({
                message: 'All fields are required',
                status: false
            })
        }

        // Check existing user
        const existingUser = await User.findOne({
            $or: [{ email }, { phone }]
        })

        if (existingUser) {
            return res.status(409).json({
                message: 'Email or phone already exists',
                status: false
            })
        }

        // Find or create Super Admin role
        let adminRole = await Role.findOne({
            name: 'super admin'
        })

        if (!adminRole) {
            adminRole = await Role.create({
                name: 'super admin',
                permissions: [  "users_view",
    "user_create",
    "user_edit",
    "user_delete",
    "dashboard_view",
    "products_view",
    "products_create",
    "products_edit",
    "products_delete",
    "categories_view",
    "categories_create",
    "categories_edit",
    "categories_delete",
    "subcategories_view",
    "subcategories_create",
    "subcategories_edit",
    "subcategories_delete",
    "roles_view",
    "roles_create",
    "roles_manage_permissions",
    "brands_view",
    "brands_create",
    "brands_edit",
    "brands_delete",
    "productvariant_view",
    "productvariant_create",
    "productvariant_edit",
    "productvariant_delete",
    "store_view",
    "store_create",
    "store_edit",
    "store_delete",
    "template_view",
    "template_create",
    "template_edit",
    "template_delete",
    "storeinventory_view",
    "storeinventory_create",
    "storeinventory_edit",
    "storeinventory_delete"
],
                status: 'active'
            })
        }

        // Check role status
        if (adminRole.status !== 'active') {
            return res.status(403).json({
                message: 'Super Admin role is inactive',
                status: false
            })
        }

        // Hash password
        const hashPassword = await bcrypt.hash(password, 8)

        // Create Super Admin
        const admin = new User({
            role: adminRole._id,
            firstName,
            lastName,
            email,
            phone,
            password: hashPassword,
            isEmailVerified: true,
            status: 'active'
        })

        await admin.save()

        return res.status(201).json({
            message: 'Super Admin signup successful',
            status: true,
            user: {
                _id: admin._id,
                firstName: admin.firstName,
                lastName: admin.lastName,
                email: admin.email,
                phone: admin.phone,
                role: adminRole.name
            }
        })

    } catch (err) {
        console.log('Signup Error:', err)

        return res.status(500).json({
            message: err.message,
            status: false
        })
    }
}


// LOGIN 


const login = async (req, res) => {
    try {
        const { email, password } = req.body

        const admin = await User.findOne({ email })
            .populate('role', 'name permissions')

        if (!admin) {
            return res.status(404).json({
                message: 'Admin not found',
                status: false
            })
        }

        if (admin.role?.name?.toLowerCase() === 'user') {
            return res.status(403).json({
                message: 'Permission Denied',
                status: false
            })
        }

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


        if (admin.status !== 'active') {
            return res.status(403).json({
                message: 'Account is inactive',
                status: false
            })
        }

        const deliveryPartner = await DeliveryPartner.findOne({
            user: admin._id
        })

        if (
            deliveryPartner &&
            deliveryPartner.status !== 'ACTIVE'
        ) {
            return res.status(403).json({
                message: 'Your Delivery Partner account is not active',
                status: false
            })
        }

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

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
        })

        if (deliveryPartner) {
            deliveryPartner.isOnline = true
            deliveryPartner.isAvailable = false
            await deliveryPartner.save()
        }

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
        const token = req.cookies.token;

        if (token) {
            try {
                const decoded = jwt.verify(
                    token,
                    process.env.JWT_SECRET
                );

                // Check if logged-in user is a delivery partner
                const deliveryPartner = await DeliveryPartner.findOne({
                    user: decoded.id
                });

                if (deliveryPartner) {
                    deliveryPartner.isOnline = false;
                    deliveryPartner.isAvailable = false;

                    await deliveryPartner.save();
                }

            } catch (tokenError) {
                console.log('Token verification error:', tokenError.message);
            }
        }

        // Clear login cookie
        res.clearCookie('token', {
    httpOnly: true,
    secure: true,
    sameSite: 'none'
});

        return res.status(200).json({
            message: 'Logout successful',
            status: true
        });

    } catch (error) {
        console.log('Logout Error:', error);

        return res.status(500).json({
            message: 'Logout failed',
            status: false
        });
    }
};


const getMyProfile = async (req, res) => {
    try {
        const admin = await User.findById(req.user._id)
            .populate('role', 'name permissions')
            .select('-password')

        if (!admin) {
            return res.status(404).json({
                message: 'Admin not found',
                status: false
            })
        }

        return res.status(200).json({
            message: 'Profile fetched successfully',
            status: true,
            data: admin
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}

const updateMyProfile = async (req, res) => {
    try {
        const { firstName, lastName, phone } = req.body

        const admin = await User.findById(req.user._id)

        if (!admin) {
            return res.status(404).json({
                message: 'Admin not found',
                status: false
            })
        }

        admin.firstName = firstName
        admin.lastName = lastName
        admin.phone = phone

        await admin.save()

        return res.status(200).json({
            message: 'Profile updated successfully',
            status: true
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}

const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body

        const admin = await User.findById(req.user._id)

        if (!admin) {
            return res.status(404).json({
                message: 'Admin not found',
                status: false
            })
        }

        // Check current password
        const isMatch = await bcrypt.compare(
            currentPassword,
            admin.password
        )

        if (!isMatch) {
            return res.status(400).json({
                message: 'Current password is incorrect',
                status: false
            })
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        admin.password = hashedPassword

        await admin.save()

        return res.status(200).json({
            message: 'Password changed successfully',
            status: true
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}

module.exports = { signup , login, logout, getMyProfile, updateMyProfile, changePassword }