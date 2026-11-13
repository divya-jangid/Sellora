const Brand = require('../model/brandmodel');
const cloudinary = require('../config/cloudinary');



// CREATE BRAND

const createBrand = async (req, res) => {
    try {
        const { name, description, status } = req.body;

        if (!name) {
            return res.status(400).json({
                message: 'Brand name is required',
                status: false
            });
        }

        const slug = name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        let logo = '';

        // Upload logo to Cloudinary
        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'brands' },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                );

                stream.end(req.file.buffer);
            });

            logo = result.secure_url;
        }

        const brand = new Brand({
            name: name.trim(),
            slug,
            logo,
            description,
            status: status || 'active'
        });

        await brand.save();

        return res.status(201).json({
            message: 'Brand created successfully',
            status: true,
            data: brand
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};


// GET ALL BRANDS
const getAllBrands = async (req, res) => {
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

        // Search filter
        const filter = {};

        if (search) {
            filter.name = {
                $regex: search,
                $options: 'i'
            };
        }

        // Allowed sorting fields
        const allowedSortFields = ['name', 'createdAt', 'status'];

        const sortField = allowedSortFields.includes(sortBy)
            ? sortBy
            : 'createdAt';

        const sortOrder = order === 'asc' ? 1 : -1;

        // Total brands
        const totalBrands = await Brand.countDocuments(filter);

        // Get brands
        const brands = await Brand.find(filter)
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(pageLimit);

        const totalPages = Math.ceil(totalBrands / pageLimit);

        return res.status(200).json({
            message: 'Brands fetched successfully',
            status: true,
            data: brands,
            pagination: {
                totalBrands,
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

// UPDATE BRAND

const updateBrand = async (req, res) => {
    try {
        const { id } = req.params
        const { name, description, status } = req.body

        const updateData = {}

        if (name !== undefined) {
            updateData.name = name.trim()

            updateData.slug = name
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '')
        }

        if (description !== undefined) {
            updateData.description = description
        }

        if (status !== undefined) {
            updateData.status = status
        }

        // Upload new logo only if a file was selected
        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'brands' },
                    (error, result) => {
                        if (error) reject(error)
                        else resolve(result)
                    }
                )

                stream.end(req.file.buffer)
            })

            updateData.logo = result.secure_url
        }

        const brand = await Brand.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )

        if (!brand) {
            return res.status(404).json({
                message: 'Brand not found',
                status: false
            })
        }

        return res.status(200).json({
            message: 'Brand updated successfully',
            status: true,
            data: brand
        })

    } catch (error) {
        console.log('UPDATE BRAND ERROR:', error)

        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}


// DELETE BRAND
const deleteBrand = async (req, res) => {
    try {
        const { id } = req.params;

        const brand = await Brand.findByIdAndDelete(id);

        if (!brand) {
            return res.status(404).json({
                message: 'Brand not found',
                status: false
            });
        }

        return res.status(200).json({
            message: 'Brand deleted successfully',
            status: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
}

// UPDATE BRAND STATUS
const updateBrandStatus = async (req, res) => {
    try {
        const { id } = req.params

        const brand = await Brand.findById(id)

        if (!brand) {
            return res.status(404).json({
                message: 'Brand not found',
                status: false
            })
        }

        // Backend khud status toggle karega
        brand.status =
            brand.status === 'active' ? 'inactive' : 'active'

        await brand.save()

        return res.status(200).json({
            message: 'Brand status updated successfully',
            status: true,
            data: brand
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}


module.exports = { createBrand, getAllBrands, updateBrand, deleteBrand, updateBrandStatus };