
const Product = require('../model/productmodel');
const cloudinary = require('../config/cloudinary');
const Category = require('../model/categorymodel');
const SubCategory = require('../model/subcategorymodel');


// CREATE PRODUCT

const createProduct = async (req, res) => {
    try {
        const {
            name,
            category,
            subCategory,
            brand,
            description,
            stock,
            isFeatured
        } = req.body;


        if (!category) {
           return res.status(400).json({
            message: 'Please select a category',
            status: false
      });
   }

        if (!brand) {
          return res.status(400).json({
           message: 'Please select a brand',
           status: false
       });
    }

        if (!req.file) {
            return res.status(400).json({
                message: 'Please select a product image',
                status: false
            });
        }

        // Generate slug
        const baseSlug = name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        let slug = baseSlug;
        let count = 1;

        while (await Product.findOne({ slug })) {
            count++;
            slug = `${baseSlug}-${count}`;
        }

        // Upload image
        const imageData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        const uploadedImage = await cloudinary.uploader.upload(
            imageData,
            { folder: 'products' }
        );

        const product = new Product({
            name,
            slug,
            category,
            subCategory: subCategory || undefined,
            brand,
            description,
            stock,
            image: uploadedImage.secure_url,
            isFeatured: isFeatured === true || isFeatured === 'true'
        });

        await product.save();

        return res.status(201).json({
            message: 'Product created successfully',
            status: true,
            data: product
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message,
            status: false
        });
    }
};


// GET ALL PRODUCTS / PUBLIC PRODUCTS / PRODUCT BY SLUG

const getAllProducts = async (req, res) => {
    try {
        const {
            categorySlug,
            subcategorySlug,
            categoryId,
            subCategoryId,
            productSlug,
            productId
        } = req.query;

        const isPublic = req.path === '/public';

        const filter = {};

        if (isPublic) {
            filter.status = 'active';
        }

        // CATEGORY FILTER BY ID
        if (categoryId) {
            const category = await Category.findOne({
                _id: categoryId,
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

        // CATEGORY FILTER BY SLUG
        else if (categorySlug) {
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

        // SUBCATEGORY FILTER BY ID
        if (subCategoryId) {
            const subcategory = await SubCategory.findOne({
                _id: subCategoryId,
                isDeleted: false,
                status: 'active'
            });

            if (!subcategory) {
                return res.status(404).json({
                    message: 'Subcategory not found',
                    status: false
                });
            }

            // Ensure subcategory belongs to selected category
            if (
                filter.category &&
                String(subcategory.category) !== String(filter.category)
            ) {
                return res.status(400).json({
                    message: 'Subcategory does not belong to this category',
                    status: false
                });
            }

            filter.subCategory = subcategory._id;

            // If category ID was not provided, use subcategory's category
            if (!filter.category) {
                filter.category = subcategory.category;
            }
        }

        // SUBCATEGORY FILTER BY SLUG
        else if (subcategorySlug) {
            const subcategory = await SubCategory.findOne({
                slug: subcategorySlug,
                isDeleted: false,
                status: 'active'
            });

            if (!subcategory) {
                return res.status(404).json({
                    message: 'Subcategory not found',
                    status: false
                });
            }

            if (
                filter.category &&
                String(subcategory.category) !== String(filter.category)
            ) {
                return res.status(400).json({
                    message: 'Subcategory does not belong to this category',
                    status: false
                });
            }

            filter.subCategory = subcategory._id;

            if (!filter.category) {
                filter.category = subcategory.category;
            }
        }

        let products;

        // FIND PRODUCT BY ID
        if (productId) {
            products = await Product.findOne({
                ...filter,
                _id: productId
            })
                .populate('category', 'name slug')
                .populate('subCategory', 'name slug')
                .populate('brand','name')
        }

        // FIND PRODUCT BY SLUG
        else if (productSlug) {
            products = await Product.findOne({
                ...filter,
                slug: productSlug
            })
                .populate('category', 'name slug')
                .populate('subCategory', 'name slug')
                .populate('brand','name')
        }

        // GET PRODUCTS
        else {
            products = await Product.find(filter)
                .populate('category', 'name slug')
                .populate('subCategory', 'name slug')
                .populate('brand','name')
        }

        if ((productId || productSlug) && !products) {
            return res.status(404).json({
                message: 'Product not found',
                status: false
            });
        }

        return res.status(200).json({
            message: 'Products fetched successfully',
            status: true,
            data: products
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message,
            status: false
        });
    }
};




// GET FEATURED PRODUCTS

const getFeaturedProducts = async (req, res) => {
    try {
        const products = await Product.find({
            isFeatured: true,
            status: 'active'
        })
            .populate('category', 'name slug')
            .populate('subCategory', 'name slug')
            .populate('brand','name')

        return res.status(200).json({
            message: 'Featured products fetched successfully',
            status: true,
            data: products
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message,
            status: false
        });
    }
};


// UPDATE PRODUCT

const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const updateData = { ...req.body };

        if (updateData.isFeatured !== undefined) {
            updateData.isFeatured =
                updateData.isFeatured === true ||
                updateData.isFeatured === 'true';
        }

        // Generate new slug if product name changes
        if (updateData.name) {
            const baseSlug = updateData.name
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');

            let slug = baseSlug;
            let count = 1;

            while (
                await Product.findOne({
                    slug,
                    _id: { $ne: id }
                })
            ) {
                count++;
                slug = `${baseSlug}-${count}`;
            }

            updateData.slug = slug;
        }

        const product = await Product.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('category', 'name slug')
            .populate('subCategory', 'name slug')
            .populate('brand','name')

        if (!product) {
            return res.status(404).json({
                message: 'Product not found',
                status: false
            });
        }

        return res.status(200).json({
            message: 'Product updated successfully',
            status: true,
            product
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message,
            status: false
        });
    }
};


// DELETE PRODUCT

const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).json({
                message: 'Product not found',
                status: false
            });
        }

        return res.status(200).json({
            message: 'Product deleted successfully',
            status: true
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message,
            status: false
        });
    }
};


module.exports = {
    createProduct,
    getAllProducts,
    getFeaturedProducts,
    updateProduct,
    deleteProduct
};
