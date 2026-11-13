
const Template = require('../model/templatemodel')
const transporter = require('../utils/email')
const getEmailTemplate = require('../utils/emailTemplate');
const crypto = require('crypto')
const User = require('../model/usermodel')



// CREATE TEMPLATE
const createTemplate = async (req, res) => {
    try {
        const { name, subject, description, status } = req.body

        if (!name || !subject || !description) {
            return res.status(400).json({
                message: 'Name, subject and description are required',
                status: false
            })
        }

        const template = new Template({
            name: name.trim(),
            subject: subject.trim(),
            description,
            status: status || 'active'
        })

        await template.save()

        return res.status(201).json({
            message: 'Template created successfully',
            status: true,
            data: template
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}

// GET ALL TEMPLATES


const getTemplate = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query;

        const currentPage = Math.max(1, Number(page));
        const pageLimit = Math.max(1, Number(limit));
        const skip = (currentPage - 1) * pageLimit;

        const filter = {};

        // Search by template name and subject
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { subject: { $regex: search, $options: 'i' } }
            ];
        }

        // Allowed sorting fields
        const allowedSortFields = [
            'createdAt',
            'name'
        ];

        const sortField = allowedSortFields.includes(sortBy)
            ? sortBy
            : 'createdAt';

        const sortOrder = order === 'asc' ? 1 : -1;

        const totalTemplates = await Template.countDocuments(filter);

        const templates = await Template.find(filter)
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(pageLimit);

        const totalPages = Math.ceil(totalTemplates / pageLimit);

        return res.status(200).json({
            message: 'Templates fetched successfully',
            status: true,
            data: templates,
            pagination: {
                totalTemplates,
                totalPages,
                currentPage,
                limit: pageLimit,
                hasNextPage: currentPage < totalPages,
                hasPrevPage: currentPage > 1
            }
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};



// UPDATE TEMPLATE
const updateTemplate = async (req, res) => {
    try {
        const { id } = req.params
        const { name, subject, description, status } = req.body

        const updateData = {}

        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({
                    message: 'Template name cannot be empty',
                    status: false
                })
            }

            updateData.name = name.trim()
        }

        if (subject !== undefined) {
            if (!subject.trim()) {
                return res.status(400).json({
                    message: 'Email subject cannot be empty',
                    status: false
                })
            }

            updateData.subject = subject.trim()
        }

        if (description !== undefined) {
            if (!description.trim()) {
                return res.status(400).json({
                    message: 'Template description cannot be empty',
                    status: false
                })
            }

            updateData.description = description
        }

        if (status !== undefined) {
            if (!['active', 'inactive'].includes(status)) {
                return res.status(400).json({
                    message: 'Invalid template status',
                    status: false
                })
            }

            updateData.status = status
        }

        const template = await Template.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        )

        if (!template) {
            return res.status(404).json({
                message: 'Template not found',
                status: false
            })
        }

        return res.status(200).json({
            message: 'Template updated successfully',
            status: true,
            data: template
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}


// DELETE TEMPLATE
const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params

        const template = await Template.findByIdAndDelete(id)

        if (!template) {
            return res.status(404).json({
                message: 'Template not found',
                status: false
            })
        }

        return res.status(200).json({
            message: 'Template deleted successfully',
            status: true
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}

// SEND EMAIL TEMPLATE FUCNTION 

const sendTemplateEmail = async (req, res) => {
    try {
        const { templateId, email, emailType } = req.body

        if (!templateId || !email || !emailType) {
            return res.status(400).json({
                success: false,
                message: 'Template, email and email type are required'
            })
        }

        if (!['normal', 'set-password'].includes(emailType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email type'
            })
        }

        const template = await Template.findById(templateId)

        if (!template || template.status !== 'active') {
            return res.status(404).json({
                success: false,
                message: 'Active template not found'
            })
        }

        let emailContent = template.description
        let user = null

        // Set Password Invitation
        if (emailType === 'set-password') {
            user = await User.findOne({
                email: email.toLowerCase().trim()
            })

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found. Please create the user first.'
                })
            }

            const rawToken = crypto.randomBytes(32).toString('hex')

            const hashedToken = crypto
                .createHash('sha256')
                .update(rawToken)
                .digest('hex')

            user.passwordSetupToken = hashedToken
            user.passwordSetupExpiry = new Date(Date.now() + 15 * 60 * 1000)

            await user.save()

            const setupLink =
                `${process.env.FRONTEND_URL}/set-password/${rawToken}`

            emailContent += `
                <div style="text-align:center; margin:30px 0;">
                    <a href="${setupLink}"
                       style="background:#6c3fc5; color:#ffffff;
                       padding:14px 28px; text-decoration:none;
                       border-radius:8px; display:inline-block;">
                        Set Your Password
                    </a>
                    <p>This link will expire in 15 minutes.</p>
                </div>
            `
        }

        await transporter.sendMail({
            from: `"Sellora" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: template.subject,
            html: getEmailTemplate(template.subject, emailContent)
        })

        res.status(200).json({
            success: true,
            message: emailType === 'normal'
                ? 'Email sent successfully'
                : 'Password invitation sent successfully'
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}


module.exports = {
    createTemplate,
    getTemplate,
    updateTemplate,
    deleteTemplate,
    sendTemplateEmail

}
