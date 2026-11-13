const SubCategory = require('../model/subcategorymodel')
const Category = require('../model/categorymodel')
const cloudinary = require('../config/cloudinary')
const Inventory = require('../model/inventorymodel')
const ProductVariant = require('../model/productvariant')
const Product = require('../model/productmodel')
const Store = require('../model/storemodel')

// CREATE SUBCATEGORY


const createSubCategory = async (req, res) => {
    try {
        const { name, category, description } = req.body

        if (!name || !category) {
            return res.status(400).json({
                message: 'Name and category are required',
                status: false
            })
        }

        const parentCategory = await Category.findOne({
            _id: category,
            isDeleted: false
        })

        if (!parentCategory) {
            return res.status(404).json({
                message: 'Category not found',
                status: false
            })
        }

        // Upload image to Cloudinary
        let image = ''

        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'subcategories' },
                    (error, result) => {
                        if (error) reject(error)
                        else resolve(result)
                    }
                )

                stream.end(req.file.buffer)
            })

            image = result.secure_url
        }

        // Create slug
        const slug = name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')

        const subCategory = new SubCategory({
            name,
            slug,
            category,
            description,
            image
        })

        await subCategory.save()

        return res.status(201).json({
            message: 'SubCategory created successfully',
            status: true,
            data: subCategory
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}



// GET ALL SUBCATEGORIES


const getAllSubCategories = async (req, res) => {
    try {
        const isPublic = req.path === '/public'

        const {
            categoryId,
            categorySlug,
            storeId,
            page = 1,
            limit = 10,
            search = '',
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query

        const filter = {
            isDeleted: false
        }

        if (categoryId) {
            filter.category = categoryId
        }

        if (categorySlug) {
            const category = await Category.findOne({
                slug: categorySlug,
                isDeleted: false,
                status: 'active'
            })

            if (!category) {
                return res.status(404).json({
                    message: 'Category not found',
                    status: false
                })
            }

            filter.category = category._id
        }

        // PUBLIC API
        if (isPublic) {

            if (!storeId) {
                return res.status(400).json({
                    message: 'Please select your location first',
                    status: false
                })
            }

            const store = await Store.findOne({
                _id: storeId,
                status: 'active'
            })

            if (!store) {
                return res.status(404).json({
                    message: 'Store not found or inactive',
                    status: false
                })
            }

            // Active inventory with available stock
            const inventory = await Inventory.find({
                store: storeId,
                status: 'active',
                availableQuantity: { $gt: 0 },
                variant: { $ne: null }
            }).select('product variant')

            // Only active variants
            const variantIds = inventory.map(item => item.variant)

            const variants = await ProductVariant.find({
                _id: { $in: variantIds },
                status: 'active'
            }).select('product')

            // Only active products
            const productIds = [...new Set(
                variants.map(item => String(item.product))
            )]

            const productFilter = {
                _id: { $in: productIds },
                status: 'active'
            }

            if (filter.category) {
                productFilter.category = filter.category
            }

            const products = await Product.find(productFilter)
                .select('subCategory')

            // Available subcategory IDs
            const subcategoryIds = [...new Set(
                products
                    .filter(item => item.subCategory)
                    .map(item => String(item.subCategory))
            )]

            filter._id = { $in: subcategoryIds }
            filter.status = 'active'

            const subcategories = await SubCategory.find(filter)
                .populate('category', 'name slug')

            return res.status(200).json({
                message: 'Subcategories fetched successfully',
                status: true,
                data: subcategories
            })
        }

        // ADMIN SEARCH
        if (search.trim()) {
            filter.name = {
                $regex: search.trim(),
                $options: 'i'
            }
        }

        // ADMIN SORTING
        const allowedSortFields = [
            'name',
            'createdAt',
            'status'
        ]

        const sortField = allowedSortFields.includes(sortBy)
            ? sortBy
            : 'createdAt'

        const sortOrder = order === 'asc' ? 1 : -1

        // ADMIN PAGINATION
        const currentPage = Math.max(1, Number(page) || 1)
        const pageLimit = Math.max(1, Number(limit) || 10)
        const skip = (currentPage - 1) * pageLimit

        const totalSubCategories = await SubCategory.countDocuments(filter)

        const subcategories = await SubCategory.find(filter)
            .populate('category', 'name slug')
            .sort({ [sortField]: sortOrder })
            .skip(skip)
            .limit(pageLimit)

        const totalPages = Math.ceil(
            totalSubCategories / pageLimit
        )

        return res.status(200).json({
            message: 'Subcategories fetched successfully',
            status: true,
            data: subcategories,
            pagination: {
                totalSubCategories,
                totalPages,
                currentPage,
                limit: pageLimit,
                hasNextPage: currentPage < totalPages,
                hasPrevPage: currentPage > 1
            }
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}



// UPDATE SUBCATEGORY
const updateSubCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, category, description, image, status } = req.body;

        const updateData = {};

        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({
                    message: 'Name cannot be empty',
                    status: false
                });
            }

            updateData.name = name;
            updateData.slug = name
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
        }

        if (category !== undefined) {
            const parentCategory = await Category.findOne({
                _id: category,
                isDeleted: false
            });

            if (!parentCategory) {
                return res.status(404).json({
                    message: 'Category not found',
                    status: false
                });
            }

            updateData.category = category;
        }

        if (description !== undefined) {
            updateData.description = description;
        }

        if (image !== undefined) {
            updateData.image = image;
        }

        if (status !== undefined) {
            updateData.status = status;
        }

        const subCategory = await SubCategory.findOneAndUpdate(
            { _id: id, isDeleted: false },
            updateData,
            { new: true, runValidators: true }
        ).populate('category', 'name');

        if (!subCategory) {
            return res.status(404).json({
                message: 'SubCategory not found',
                status: false
            });
        }

        return res.status(200).json({
            message: 'SubCategory updated successfully',
            status: true,
            data:subCategory
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};


// DELETE SUBCATEGORY (SOFT DELETE)
const deleteSubCategory = async (req, res) => {
    try {
        const { id } = req.params

        const subCategory = await SubCategory.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { isDeleted: true },
            { new: true }
        )

        if (!subCategory) {
            return res.status(404).json({
                message: 'SubCategory not found',
                status: false
            })
        }

        return res.status(200).json({
            message: 'SubCategory deleted successfully',
            status: true
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}

// UPDATE SUBCATEGORY STATUS
const updateSubCategoryStatus = async (req, res) => {
    try {
        const { id } = req.params

        const subCategory = await SubCategory.findOne({
            _id: id,
            isDeleted: false
        })

        if (!subCategory) {
            return res.status(404).json({
                message: 'SubCategory not found',
                status: false
            })
        }

        // Backend khud status toggle karega
        subCategory.status =
            subCategory.status === 'active' ? 'inactive' : 'active'

        await subCategory.save()

        return res.status(200).json({
            message: 'SubCategory status updated successfully',
            status: true,
            data: subCategory
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}

module.exports = { createSubCategory,  getAllSubCategories, updateSubCategory, deleteSubCategory, updateSubCategoryStatus  }