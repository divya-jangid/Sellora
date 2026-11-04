const SubCategory = require('../model/subcategorymodel')
const Category = require('../model/categorymodel')
const cloudinary = require('../config/cloudinary')

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
        const { categoryId, categorySlug } = req.query;

        // Admin dashboard: active + inactive dono
        const filter = {
            isDeleted: false
        };

        if (categoryId) {
            filter.category = categoryId;
        }

        if (categorySlug) {
            const category = await Category.findOne({
                slug: categorySlug,
                isDeleted: false,
                status: 'active'
            });

            if (!category) {
                return res.status(404).json({
                    message: 'Category not found',
                    status: false
                });
            }

            filter.category = category._id;
        }

        const subcategories = await SubCategory.find(filter)
            .populate('category', 'name slug');

        return res.status(200).json({
            message: 'Subcategories fetched successfully',
            status: true,
            data: subcategories
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};


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

module.exports = { createSubCategory,  getAllSubCategories, updateSubCategory, deleteSubCategory }