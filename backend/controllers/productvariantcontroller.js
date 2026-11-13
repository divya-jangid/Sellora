
const ProductVariant = require('../model/productvariant');
const Product = require('../model/productmodel');
const cloudinary = require('../config/cloudinary');


// CREATE PRODUCT VARIANT

const createProductVariant = async (req, res) => {
    try {
        const {
            product,
            name,
            sku,
            barcode,
            unitValue,
            unit,
            mrp,
            discountPercentage,
            weight,
            dimensions
        } = req.body;

        if (
            !product ||
            !name ||
            !sku ||
            unitValue === undefined ||
            !unit ||
            mrp === undefined
        ) {
            return res.status(400).json({
                message: 'Please fill all required fields',
                status: false
            });
        }

        const mrpValue = Number(mrp);
const discountValue = Number(discountPercentage || 0);

if (!Number.isFinite(mrpValue) || mrpValue <= 0) {
    return res.status(400).json({
        message: 'Please enter a valid MRP',
        status: false
    });
}

if (
    !Number.isFinite(discountValue) ||
    discountValue < 0 ||
    discountValue > 100
) {
    return res.status(400).json({
        message: 'Discount must be between 0 and 100',
        status: false
    });
}

const calculatedSellingPrice = Number(
    (mrpValue - (mrpValue * discountValue / 100)).toFixed(2)
);

        const productExists = await Product.findById(product);

        if (!productExists) {
            return res.status(404).json({
                message: 'Product not found',
                status: false
            });
        }

        const variantExists = await ProductVariant.findOne({ sku });

        if (variantExists) {
            return res.status(409).json({
                message: 'SKU already exists',
                status: false
            });
        }

        // Upload multiple images
        const images = [];

        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                const result = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: 'product-variants' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );

                    stream.end(file.buffer);
                });

                images.push(result.secure_url);
            }
        }

        const productVariant = new ProductVariant({
            product,
            name,
            sku,
            barcode,
            unitValue,
            unit,
             mrp: mrpValue,
            sellingPrice: calculatedSellingPrice,
            discountPercentage: discountValue,
            weight,
            dimensions:
                typeof dimensions === 'string'
                    ? JSON.parse(dimensions || '{}')
                    : dimensions,
            images
        });

        await productVariant.save();

        return res.status(201).json({
            message: 'Product variant created successfully',
            status: true,
            data: productVariant
        });

    } catch (error) {
        console.error('Create variant error:', error);

        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};


// GET ALL PRODUCT VARIANTS / PUBLIC VARIANTS





const getAllProductVariants = async (req, res) => {
    try {
        let productVariants;

        // FRONTEND PUBLIC API
        if (req.path === '/public') {

            const {
                categorySlug,
                subcategorySlug = 'all'
            } = req.query;

            productVariants = await ProductVariant.find({
                status: 'active'
            })
                .populate({
                    path: 'product',
                    select: 'name slug category subCategory',
                    populate: [
                        {
                            path: 'category',
                            select: 'slug'
                        },
                        {
                            path: 'subCategory',
                            select: 'slug'
                        }
                    ]
                });

            if (categorySlug) {
                productVariants = productVariants.filter(variant =>
                    variant.product?.category?.slug === categorySlug
                );
            }

            if (subcategorySlug !== 'all') {
                productVariants = productVariants.filter(variant =>
                    variant.product?.subCategory?.slug === subcategorySlug
                );
            }

            return res.status(200).json({
                message: 'Product variants fetched successfully',
                status: true,
                data: productVariants
            });

        } else {

            // ADMIN API - SEARCH, SORT AND PAGINATION

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

            let filter = {};

            // SEARCH BY VARIANT NAME, SKU, BARCODE
            if (search) {
                const products = await Product.find({
                    name: {
                        $regex: search,
                        $options: 'i'
                    }
                }).select('_id');

                filter.$or = [
                    {
                        name: {
                            $regex: search,
                            $options: 'i'
                        }
                    },
                    {
                        sku: {
                            $regex: search,
                            $options: 'i'
                        }
                    },
                    {
                        barcode: {
                            $regex: search,
                            $options: 'i'
                        }
                    },
                    {
                        product: {
                            $in: products.map(item => item._id)
                        }
                    }
                ];
            }

            // ALLOWED SORT FIELDS
            const allowedSortFields = [
                'createdAt',
                'name',
                'sku',
                'mrp',
                'sellingPrice',
                'status'
            ];

            const sortField = allowedSortFields.includes(sortBy)
                ? sortBy
                : 'createdAt';

            const sortOrder = order === 'asc' ? 1 : -1;

            // TOTAL PRODUCT VARIANTS
            const totalVariants = await ProductVariant.countDocuments(filter);

            // GET PRODUCT VARIANTS
            productVariants = await ProductVariant.find(filter)
                .populate('product', 'name slug')
                .sort({ [sortField]: sortOrder })
                .skip(skip)
                .limit(pageLimit);

            const totalPages = Math.ceil(totalVariants / pageLimit);

            return res.status(200).json({
                message: 'Product variants fetched successfully',
                status: true,
                data: productVariants,
                pagination: {
                    totalVariants,
                    totalPages,
                    currentPage,
                    limit: pageLimit,
                    hasNextPage: currentPage < totalPages,
                    hasPrevPage: currentPage > 1
                }
            });
        }

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};



// UPDATE PRODUCT VARIANT


const updateProductVariant = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Find existing variant
        const existingVariant = await ProductVariant.findById(id);

        if (!existingVariant) {
            return res.status(404).json({
                message: 'Product variant not found',
                status: false
            });
        }

        // MRP and Discount calculation
        const mrp = Number(updateData.mrp ?? existingVariant.mrp);

        const discount = Number(
            updateData.discountPercentage ?? existingVariant.discountPercentage
        );

        // MRP validation
        if (!Number.isFinite(mrp) || mrp <= 0) {
            return res.status(400).json({
                message: 'Please enter a valid MRP',
                status: false
            });
        }

        // Discount validation
        if (
            !Number.isFinite(discount) ||
            discount < 0 ||
            discount > 100
        ) {
            return res.status(400).json({
                message: 'Discount must be between 0 and 100',
                status: false
            });
        }

        // Calculate Selling Price automatically
        updateData.mrp = mrp;
        updateData.discountPercentage = discount;

        updateData.sellingPrice = Number(
            (mrp - (mrp * discount / 100)).toFixed(2)
        );

        // Dimensions parsing
        if (updateData.dimensions) {
            updateData.dimensions =
                typeof updateData.dimensions === 'string'
                    ? JSON.parse(updateData.dimensions)
                    : updateData.dimensions;
        }

        // Product validation
        if (updateData.product) {
            const productExists = await Product.findById(updateData.product);

            if (!productExists) {
                return res.status(404).json({
                    message: 'Product not found',
                    status: false
                });
            }
        }

        // Check duplicate SKU
        if (updateData.sku) {
            const existingSKU = await ProductVariant.findOne({
                sku: updateData.sku,
                _id: { $ne: id }
            });

            if (existingSKU) {
                return res.status(409).json({
                    message: 'SKU already exists',
                    status: false
                });
            }
        }

        // Upload multiple new images
        if (req.files && req.files.length > 0) {
            const images = [];

            for (const file of req.files) {
                const result = await new Promise((resolve, reject) => {
                    const stream = cloudinary.uploader.upload_stream(
                        { folder: 'product-variants' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );

                    stream.end(file.buffer);
                });

                images.push(result.secure_url);
            }

            updateData.images = images;
        }

        // Update product variant with schema validation
        existingVariant.set(updateData);

        const productVariant = await existingVariant.save();

        await productVariant.populate('product', 'name slug');

        return res.status(200).json({
            message: 'Product variant updated successfully',
            status: true,
            data: productVariant
        });

    } catch (error) {
        console.error('Update variant error:', error);

        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
};


// DELETE PRODUCT VARIANT

const deleteProductVariant = async (req, res) => {
    try {
        const { id } = req.params;

        const productVariant = await ProductVariant.findByIdAndDelete(id);

        if (!productVariant) {
            return res.status(404).json({
                message: 'Product variant not found',
                status: false
            });
        }

        return res.status(200).json({
            message: 'Product variant deleted successfully',
            status: true
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        });
    }
}

// UPDATE PRODUCT VARIANT STATUS
const updateProductVariantStatus = async (req, res) => {
    try {
        const { id } = req.params

        const productVariant = await ProductVariant.findById(id)

        if (!productVariant) {
            return res.status(404).json({
                message: 'Product variant not found',
                status: false
            })
        }

        // Backend khud status toggle karega
        productVariant.status =
            productVariant.status === 'active' ? 'inactive' : 'active'

        await productVariant.save()

        return res.status(200).json({
            message: 'Product variant status updated successfully',
            status: true,
            data: productVariant
        })

    } catch (error) {
        return res.status(500).json({
            message: error.message,
            status: false
        })
    }
}


module.exports = {
    createProductVariant,
    getAllProductVariants,
    updateProductVariant,
    deleteProductVariant,
    updateProductVariantStatus 
};