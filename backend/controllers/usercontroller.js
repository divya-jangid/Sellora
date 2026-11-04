const crypto = require('crypto')
const User = require('../model/usermodel')
const Role = require('../model/rolemodel')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const transporter = require('../utils/email')
const getEmailTemplate  = require('../utils/emailTemplate')
const DeliveryPartner = require('../model/deliverypartnermodel')



const userSignup = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password } = req.body

        if (!firstName || !lastName || !email || !phone || !password) {
            return res.status(400).json({
                message: 'All fields are required',
                status: false
            })
        }

        const normalizedEmail = email.toLowerCase().trim()

        const existingUser = await User.findOne({
            $or: [
                { email: normalizedEmail },
                { phone }
            ]
        })

        if (existingUser) {
            return res.status(409).json({
                message: 'Email or phone already exists',
                status: false
            })
        }

        const userRole = await Role.findOne({
            name: /^user$/i,
            status: 'active'
        })

        if (!userRole) {
            return res.status(404).json({
                message: 'User role not found',
                status: false
            })
        }

        const hashedPassword = await bcrypt.hash(password, 8)

        // Generate a 6-digit OTP
        const otp = String(
            Math.floor(100000 + Math.random() * 900000)
        )

        // OTP expires in 10 minutes
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000)

        const user = new User({
            role: userRole._id,
            firstName,
            lastName,
            email: normalizedEmail,
            phone,
            password: hashedPassword,
            isEmailVerified: false,
            emailVerificationOTP: otp,
            emailVerificationOTPExpiry: otpExpiry
        })

        await user.save()

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: normalizedEmail,
                subject: 'Verify your Sellora email',
                text: `Your Sellora verification OTP is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`
            })
        } catch (emailError) {
            await User.findByIdAndDelete(user._id)

            return res.status(500).json({
                message: 'Verification email could not be sent. Please try again.',
                status: false
            })
        }

        return res.status(201).json({
            message: 'Signup successful. Please verify your email using the OTP sent to your email address.',
            status: true,
            requiresEmailVerification: true,
            email: normalizedEmail
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}


//  VERIFY EMAIL

const verifyEmail = async (req, res) => {
    try {
        const { email, otp } = req.body

        if (!email || !otp) {
            return res.status(400).json({
                message: 'Email and OTP are required',
                status: false
            })
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        })

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                status: false
            })
        }

        if (user.isEmailVerified) {
            return res.status(200).json({
                message: 'Email is already verified',
                status: true
            })
        }

        if (
            !user.emailVerificationOTP ||
            !user.emailVerificationOTPExpiry ||
            user.emailVerificationOTPExpiry < new Date()
        ) {
            return res.status(400).json({
                message: 'OTP is invalid or expired. Please signup again.',
                status: false
            })
        }

        if (String(otp).trim() !== user.emailVerificationOTP) {
            return res.status(400).json({
                message: 'Invalid OTP',
                status: false
            })
        }

        user.isEmailVerified = true
        user.emailVerificationOTP = null
        user.emailVerificationOTPExpiry = null

        await user.save()

        return res.status(200).json({
            message: 'Email verified successfully. You can now login.',
            status: true
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}


const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({
                message: 'Email is required',
                status: false
            })
        }

        const normalizedEmail = email.toLowerCase().trim()

        const user = await User.findOne({
            email: normalizedEmail
        })

        if (!user || !user.isEmailVerified) {
            return res.status(400).json({
                message: 'Unable to process request. Check your email or verify your account.',
                status: false
            })
        }

        // Generate 6-digit password reset OTP
        const otp = await crypto.randomInt(100000, 1000000).toString()

        // OTP expires in 10 minutes
        const otpExpiry = await new Date(Date.now() + 10 * 60 * 1000)

        

        user.passwordResetOTP = otp
        user.passwordResetOTPExpiry = otpExpiry

        await user.save()

        try {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: normalizedEmail,
                subject: 'Sellora Password Reset OTP',
                text: `Your Sellora password reset OTP is ${otp}. It expires in 10 minutes. Do not share this code with anyone.`
            })
        } catch (emailError) {
            user.passwordResetOTP = null
            user.passwordResetOTPExpiry = null
            await user.save()

            return res.status(500).json({
                message: 'Reset email could not be sent. Please try again.',
                status: false
            })
        }

        return res.status(200).json({
            message: 'Password reset OTP sent to your email.',
            status: true
        })

    } catch (error) {
        return res.status(500).json({
            message: 'Something went wrong. Please try again.',
            status: false
        })
    }
}


const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                message: 'Email, OTP and new password are required',
                status: false
            })
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                message: 'Password must be at least 8 characters long',
                status: false
            })
        }

        const normalizedEmail = email.toLowerCase().trim()

        const user = await User.findOne({
            email: normalizedEmail
        })

        if (!user) {
            return res.status(400).json({
                message: 'Invalid email or OTP',
                status: false
            })
        }

        // Check OTP and expiry
        if (
            !user.passwordResetOTP ||
            !user.passwordResetOTPExpiry ||
            user.passwordResetOTPExpiry < new Date()
        ) {
            return res.status(400).json({
                message: 'OTP is invalid or expired. Please request a new OTP.',
                status: false
            })
        }

        if (String(otp).trim() !== user.passwordResetOTP) {
            return res.status(400).json({
                message: 'Invalid OTP',
                status: false
            })
        }

        // Hash the new password before saving
        user.password = await bcrypt.hash(newPassword, 8)

        // Clear OTP so it cannot be reused
        user.passwordResetOTP = null
        user.passwordResetOTPExpiry = null

        await user.save()

        return res.status(200).json({
            message: 'Password reset successful. Please login with your new password.',
            status: true
        })

    } catch (error) {
        console.error('Reset Password Error:', error.message)

        return res.status(500).json({
            message: 'Something went wrong. Please try again.',
            status: false
        })
    }
}


const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({
                message: 'Email and password are required',
                status: false
            })
        }

        const user = await User.findOne({
            email: email.toLowerCase()
        }).populate('role')

        console.log('Email:', user?.email)
        console.log('Role:', user?.role?.name)
        console.log('Status:', user?.status)

      if (!user || user.role.name.toLowerCase() !== 'user') {
    return res.status(401).json({
        message: 'Invalid email or password',
        status: false
    })
}

if (!user.isEmailVerified) {
    return res.status(403).json({
        message: 'Please verify your email before logging in',
        status: false,
        requiresEmailVerification: true
    })
}
        const isMatch = await bcrypt.compare(password, user.password)

        if (!isMatch) {
            return res.status(401).json({
                message: 'Invalid email or password',
                status: false
            })
        }

        if (user.status !== 'active') {
            return res.status(403).json({
                message: 'Account is inactive or blocked',
                status: false
            })
        }

        const token = jwt.sign(
            { id: user._id, role: user.role.name },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        )

         res.cookie('token', token, {
         httpOnly: true,
         secure: process.env.NODE_ENV === 'production',
         sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
  })

        return res.status(200).json({
            message: 'User login successful',
            status: true,
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role.name
            }
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}



const checkUser = async (req, res) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                message: "Please login first",
                status: false
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id)
            .populate("role", "name permissions")
            .select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found",
                status: false
            });
        }

        if (user.status !== "active") {
            return res.status(403).json({
                message: "Account is inactive",
                status: false
            });
        }

        return res.status(200).json({
            message: "User fetched successfully",
            status: true,
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone:user.phone,
                role: user.role._id,
                roleName: user.role.name,
                permissions: user.role.permissions || []
            }
        });

    } catch (error) {
        return res.status(401).json({
            message: "Invalid or expired token",
            status: false
        });
    }
}



const createUser = async (req, res) => {
    let user = null;
    let deliveryPartner = null;

    try {
        const {
            firstName,
            lastName,
            email,
            phone,
            role,
            vehicleType,
            vehicleNumber,
            drivingLicenseNumber
        } = req.body;

        if (!firstName || !lastName || !email || !phone || !role) {
            return res.status(400).json({
                status: false,
                message: 'All fields are required'
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Check existing user
        const existingUser = await User.findOne({
            $or: [
                { email: normalizedEmail },
                { phone }
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                status: false,
                message: 'Email or phone already exists'
            });
        }

        // Find role
        const userRole = await Role.findById(role);

        if (!userRole || userRole.status !== 'active') {
            return res.status(404).json({
                status: false,
                message: 'Active role not found'
            });
        }

        // Check whether selected role is Delivery Partner
        const isDeliveryPartner =
            userRole.name.toLowerCase().trim() === 'delivery partner';

        // Validate delivery partner fields
        if (isDeliveryPartner) {
            if (!vehicleType || !vehicleNumber || !drivingLicenseNumber) {
                return res.status(400).json({
                    status: false,
                    message: 'All delivery partner details are required'
                });
            }
        }

        // Check Super Admin
        const isSuperAdmin =
            req.user.role?.toLowerCase().trim() === 'super admin';

        // Generate temporary password
        const temporaryPassword = crypto.randomBytes(9).toString('base64url');

        const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

        // Generate password setup token
        const resetToken = crypto.randomBytes(32).toString('hex');

        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        // Create User
        user = new User({
            firstName,
            lastName,
            email: normalizedEmail,
            phone,
            role: userRole._id,
            password: hashedPassword,
            status: 'inactive',

            // Verification Status
            isEmailVerified: isSuperAdmin,
            isPhoneVerified: isSuperAdmin,
        });

        await user.save();

        // Create Delivery Partner profile only for Delivery Partner role
        if (isDeliveryPartner) {
            deliveryPartner = new DeliveryPartner({
                user: user._id,
                vehicleType,
                vehicleNumber,
                drivingLicenseNumber,
                status: 'PENDING',
                isOnline: false,
                isAvailable: false
            });

            await deliveryPartner.save();
        }

// Send Temporary Password Email
await transporter.sendMail({
    from: `"Sellora" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'Your Sellora Account Login Details',
    html: getEmailTemplate(
        'Welcome to Sellora',
        `
            <h2>Welcome to Sellora!</h2>

            <p>Hello ${firstName} ${lastName},</p>

            <p>Your Sellora account has been created successfully.</p>

            <p><strong>Email:</strong> ${user.email}</p>

            <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>

            <p>Please login using these credentials and change your password after login.</p>
        `
    )
});
        return res.status(201).json({
            status: true,
            message: isDeliveryPartner
                ? 'Delivery Partner created and invitation email sent successfully'
                : 'User created and invitation email sent successfully',

            data: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: userRole.name,
                deliveryPartnerId: deliveryPartner?._id || null
            }
        });

    } catch (error) {
        console.log('Create User Error:', error);

        // If anything fails, remove created documents
        if (deliveryPartner?._id) {
            await DeliveryPartner.findByIdAndDelete(deliveryPartner._id);
        }

        if (user?._id) {
            await User.findByIdAndDelete(user._id);
        }

        return res.status(500).json({
            status: false,
            message: 'Failed to create user',
            error: error.message
        });
    }
};




const getAllUsers = async (req, res) => {
    try {
        const superAdminRole = await Role.findOne({
            name: /^super admin$/i
        });

        const filter = {
            _id: { $ne: req.user._id }
        };

        if (superAdminRole) {
            filter.role = { $ne: superAdminRole._id };
        }

        const users = await User.find(filter)
            .select('-password')
            .populate('role');

        return res.status(200).json({
            message: 'users fetched successfully',
            status: true,
            data: users
        });
    }
    catch (err) {
        return res.status(500).json({
            message: err.message,
            status: false
        });
    }
};



const updateUser = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            firstName,
            lastName,
            email,
            phone,
            role,
            status,
            isEmailVerified,
            isPhoneVerified
        } = req.body;

        const updateData = {};

        // Basic user details
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (role !== undefined) updateData.role = role;

        // User Status
        if (status !== undefined) {
            if (!['active', 'inactive', 'blocked'].includes(status)) {
                return res.status(400).json({
                    message: 'Invalid user status',
                    status: false
                });
            }

            updateData.status = status;
        }

        // Verification Status
        const isSuperAdmin =
            req.user.role?.toLowerCase().trim() === 'super admin';

        const hasVerificationUpdate =
            isEmailVerified !== undefined ||
            isPhoneVerified !== undefined;

        if (hasVerificationUpdate && !isSuperAdmin) {
            return res.status(403).json({
                message: 'Only Super Admin can update verification status. Please contact Super Admin.',
                status: false
            });
        }

        if (isSuperAdmin) {
            if (typeof isEmailVerified === 'boolean') {
                updateData.isEmailVerified = isEmailVerified;
            }

            if (typeof isPhoneVerified === 'boolean') {
                updateData.isPhoneVerified = isPhoneVerified;
            }
        }

        const user = await User.findByIdAndUpdate(
            id,
            { $set: updateData },
            {
                new: true,
                runValidators: true
            }
        )
            .populate('role')
            .select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                status: false
            });
        }

        // Sync Delivery Partner Status
        if (status !== undefined) {
            const deliveryPartnerStatus = {
                active: 'ACTIVE',
                inactive: 'INACTIVE',
                blocked: 'BLOCKED'
            };

            const partnerUpdate = {
                status: deliveryPartnerStatus[status]
            };

            // Offline when user becomes inactive or blocked
            if (status !== 'active') {
                partnerUpdate.isOnline = false;
                partnerUpdate.isAvailable = false;
            }

            await DeliveryPartner.findOneAndUpdate(
                { user: id },
                { $set: partnerUpdate },
                { new: true }
            );
        }

        return res.status(200).json({
            message: 'User updated successfully',
            status: true,
            data: user
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message,
            status: false
        });
    }
};


const updateMyProfile = async (req, res) => {
    try {
        const userId = req.user.id
        const { firstName, lastName, phone } = req.body

        if (!firstName?.trim() || !lastName?.trim() || !phone?.trim()) {
            return res.status(400).json({
                message: 'First name, last name and phone are required',
                status: false
            })
        }

        const existingUser = await User.findOne({
            phone: phone.trim(),
            _id: { $ne: userId }
        })

        if (existingUser) {
            return res.status(409).json({
                message: 'Phone number already exists',
                status: false
            })
        }

        const user = await User.findByIdAndUpdate(
            userId,
            {
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                phone: phone.trim()
            },
            {
                new: true,
                runValidators: true
            }
        ).select('-password')

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                status: false
            })
        }

        return res.status(200).json({
            message: 'Profile updated successfully',
            status: true,
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone
            }
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}


const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                status: false
            });
        }

        return res.status(200).json({
            message: 'User deleted successfully',
            status: true
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message,
            status: false
        });
    }
};


const logout = async (req, res) => {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
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


const setPassword = async (req, res) => {
    try {
        const { token } = req.params
        const { newPassword } = req.body

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long'
            })
        }

        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex')

        const user = await User.findOne({
            passwordSetupToken: hashedToken,
            passwordSetupExpiry: { $gt: Date.now() }
        })

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired password setup link'
            })
        }

        user.password = await bcrypt.hash(newPassword, 10)
        user.passwordSetupToken = null
        user.passwordSetupExpiry = null
        user.status = 'active'
        user.isEmailVerified = true

        await user.save()

        res.status(200).json({
            success: true,
            message: 'Password set successfully. You can now login.'
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const updateUserStatus = async ( req, res ) =>{
     try{
        
     }
     catch(err){

     }
}


module.exports = {userSignup, verifyEmail, forgotPassword ,     resetPassword,
 userLogin, checkUser,  createUser , getAllUsers, updateUser, 
 deleteUser, updateMyProfile, logout , setPassword}