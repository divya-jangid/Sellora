const cloudinary = require('../config/cloudinary');
const Banner = require('../model/bannermodel');

// CREATE BANNER
const createBanner = async (req, res) => {
    try {
        const {
            title,
            description,
            link,
            position,
            status
        } = req.body;

        if (!title) {
            return res.status(400).json({
                message: 'Please enter banner title',
                status: false
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: 'Please select banner image',
                status: false
            });
        }

        // Upload image to Cloudinary
        const imageData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        const uploadedImage = await cloudinary.uploader.upload(
            imageData,
            { folder: 'banners' }
        );

        const banner = new Banner({
            title,
            description,
            link,
            position,
            status,
            image: uploadedImage.secure_url
        });

        await banner.save();

        return res.status(201).json({
            message: 'Banner created successfully',
            status: true,
            data: banner
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message,
            status: false
        });
    }
};


// GET ALL BANNERS
const getAllBanners = async (req, res) => {
    try {
        const banners = await Banner.find().sort({ createdAt: -1 });

        return res.status(200).json({
            message: 'Banners fetched successfully',
            status: true,
            data: banners
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};


// GET ACTIVE BANNERS (FRONTEND)

const getActiveBanners = async (req, res) => {
    try {
        const banners = await Banner.find({
            status: 'active',
            position: 'home'
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            message: 'Active banners fetched successfully',
            status: true,
            data: banners
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};


// UPDATE BANNER

const updateBanner = async (req, res) => {
    try {
        const { title, description, link, position, status } = req.body;

        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({
                message: 'Banner not found',
                status: false
            });
        }

        banner.title = title ?? banner.title;
        banner.description = description ?? banner.description;
        banner.link = link ?? banner.link;
        banner.position = position ?? banner.position;
        banner.status = status ?? banner.status;

        // Upload new image to Cloudinary
        if (req.file) {
            const imageData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

            const uploadedImage = await cloudinary.uploader.upload(
                imageData,
                { folder: 'banners' }
            );

            banner.image = uploadedImage.secure_url;
        }

        await banner.save();

        return res.status(200).json({
            message: 'Banner updated successfully',
            status: true,
            data: banner
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};


// DELETE BANNER

const deleteBanner = async (req, res) => {
    try {
        const banner = await Banner.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({
                message: 'Banner not found',
                status: false
            });
        }

        // Delete image from Cloudinary
        if (banner.image) {
            const publicId = banner.image
                .split('/')
                .slice(-2)
                .join('/')
                .split('.')[0];

            await cloudinary.uploader.destroy(publicId);
        }

        // Delete banner from MongoDB
        await Banner.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            message: 'Banner deleted successfully',
            status: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};

const updateBannerStatus = async (req, res) => {
    try {
        const { status } = req.body;

        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({
                message: 'Invalid banner status',
                status: false
            });
        }

        const banner = await Banner.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        );

        if (!banner) {
            return res.status(404).json({
                message: 'Banner not found',
                status: false
            });
        }

        return res.status(200).json({
            message: 'Banner status updated successfully',
            status: true,
            data: banner
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};



module.exports = {
    createBanner,
    getAllBanners,
    getActiveBanners,
    updateBanner,
    deleteBanner,
    updateBannerStatus 
};
 