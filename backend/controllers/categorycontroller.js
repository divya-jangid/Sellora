const Category = require('../model/categorymodel')
const cloudinary = require('../config/cloudinary');
const Product = require('../model/productmodel')
const ProductVariant = require('../model/productvariant')
const Store = require('../model/storemodel')
const Inventory = require('../model/inventorymodel')

const createCategory = async (req, res) =>{

    try{

        const { name, description } = req.body

        let image = '';

    if (req.file) {
    const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'categories' },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );

        stream.end(req.file.buffer);
    });

    image = result.secure_url;
}

        // Generate slug automatically

        const slug = name .toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')  
          
        const category = new Category({
            name,
            slug,
            description,
            image
        })

        await category.save()

        return res.status(201).json({
            message:'Category created successfully',
            status:true
        })

     }

    catch(err){
        return res.status(500).json({
            message:err.message,
            status:false
        })
    }
}



const getAllCategories = async (req, res) => {
    try {
        const isPublic = req.path === '/public';

        let categories;

        if (isPublic) {
            const { storeId } = req.query;

            if (!storeId) {
                return res.status(400).json({
                    message: 'Please select your location first',
                    status: false
                });
            }

            const store = await Store.findOne({
                _id: storeId,
                status: 'active'
            });

            if (!store) {
                return res.status(404).json({
                    message: 'Store not found or inactive',
                    status: false
                });
            }

            const inventory = await Inventory.find({
                store: storeId,
                status: 'active',
                availableQuantity: { $gt: 0 },
                variant: { $ne: null }
            }).select('product variant');

            const variantIds = inventory.map(item => item.variant);

            const variants = await ProductVariant.find({
                _id: { $in: variantIds },
                status: 'active'
            }).select('product');

            const productIds = [...new Set(
                variants.map(item => String(item.product))
            )];

            const products = await Product.find({
                _id: { $in: productIds },
                status: 'active'
            }).select('category');

            const categoryIds = [...new Set(
                products.map(item => String(item.category))
            )];

            categories = await Category.find({
                _id: { $in: categoryIds },
                isDeleted: false,
                status: 'active'
            });

        } else {
            const {
                page = 1,
                limit = 10,
                search = '',
                sortBy = 'createdAt',
                order = 'desc'
            } = req.query;

            const pageNumber = Math.max(1, Number(page));
            const limitNumber = Math.max(1, Math.min(100, Number(limit)));

            const sortOrder = order === 'asc' ? 1 : -1;

            const filter = {
                isDeleted: false
            };

            if (search.trim()) {
                filter.name = {
                    $regex: search.trim(),
                    $options: 'i'
                };
            }

            const allowedSortFields = ['name', 'createdAt', 'updatedAt'];
            const sortField = allowedSortFields.includes(sortBy)
                ? sortBy
                : 'createdAt';

            const totalCategories = await Category.countDocuments(filter);

            categories = await Category.find(filter)
                .sort({ [sortField]: sortOrder })
                .skip((pageNumber - 1) * limitNumber)
                .limit(limitNumber);

            return res.status(200).json({
                message: 'Categories fetched successfully',
                status: true,
                data: categories,
                pagination: {
                    totalCategories,
                    currentPage: pageNumber,
                    totalPages: Math.ceil(totalCategories / limitNumber),
                    limit: limitNumber
                }
            });
        }

        return res.status(200).json({
            message: 'Categories fetched successfully',
            status: true,
            data: categories
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};


const updateCategory = async (req, res) => {
    try {
        const { id } = req.params
        const { name, description, status } = req.body

        const updateData = {}

        if (name !== undefined) {
            updateData.name = name

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

        // Upload new image only when user selects one
        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: 'categories' },
                    (error, result) => {
                        if (error) reject(error)
                        else resolve(result)
                    }
                )

                stream.end(req.file.buffer)
            })

            updateData.image = result.secure_url
        }

        const category = await Category.findOneAndUpdate(
            { _id: id, isDeleted: false },
            updateData,
            { new: true, runValidators: true }
        )

        if (!category) {
            return res.status(404).json({
                message: 'Category not found',
                status: false
            })
        }

        return res.status(200).json({
            message: 'Category updated successfully',
            status: true,
            data: category
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        const category = await Category.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { isDeleted: true },
            { new: true }
        );

        if (!category) {
            return res.status(404).json({
                message: 'Category not found',
                status: false
            });
        }

        return res.status(200).json({
            message: 'Category deleted successfully',
            status: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
}


// UPDATE CATEGORY STATUS
const updateCategoryStatus = async (req, res) => {
    try {
        const { id } = req.params

        const category = await Category.findOne({
            _id: id,
            isDeleted: false
        })

        if (!category) {
            return res.status(404).json({
                message: 'Category not found',
                status: false
            })
        }

        // Backend khud status toggle karega
        category.status =
            category.status === 'active' ? 'inactive' : 'active'

        await category.save()

        return res.status(200).json({
            message: 'Category status updated successfully',
            status: true,
            data: category
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}

module.exports = { createCategory,getAllCategories,updateCategory,deleteCategory, updateCategoryStatus  }