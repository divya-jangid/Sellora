
const Product = require('../model/productmodel');
const cloudinary = require('../config/cloudinary');
const Category = require('../model/categorymodel');
const SubCategory = require('../model/subcategorymodel');
const ProductVariant = require('../model/productvariant')
const Inventory = require('../model/inventorymodel')
const Store = require('../model/storemodel')
const Brand = require('../model/brandmodel')

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
            productId,
            storeId,
            page = 1,
            limit = 10,
            search = '',
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query

        const isPublic = req.path === '/public'

        const filter = {}

        // PUBLIC API: STORE ID REQUIRED
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
                    message: 'Selected store not found or inactive',
                    status: false
                })
            }

            filter.status = 'active'
        }

        // CATEGORY FILTER BY ID
        if (categoryId) {

            const category = await Category.findOne({
                _id: categoryId,
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

        // CATEGORY FILTER BY SLUG
        else if (categorySlug) {

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

        // SUBCATEGORY FILTER BY ID
        if (subCategoryId) {

            const subcategory = await SubCategory.findOne({
                _id: subCategoryId,
                isDeleted: false,
                status: 'active'
            })

            if (!subcategory) {
                return res.status(404).json({
                    message: 'Subcategory not found',
                    status: false
                })
            }

            if (
                filter.category &&
                String(subcategory.category) !== String(filter.category)
            ) {
                return res.status(400).json({
                    message: 'Subcategory does not belong to this category',
                    status: false
                })
            }

            filter.subCategory = subcategory._id

            if (!filter.category) {
                filter.category = subcategory.category
            }
        }

        // SUBCATEGORY FILTER BY SLUG
        else if (subcategorySlug) {

            const subcategory = await SubCategory.findOne({
                slug: subcategorySlug,
                isDeleted: false,
                status: 'active'
            })

            if (!subcategory) {
                return res.status(404).json({
                    message: 'Subcategory not found',
                    status: false
                })
            }

            if (
                filter.category &&
                String(subcategory.category) !== String(filter.category)
            ) {
                return res.status(400).json({
                    message: 'Subcategory does not belong to this category',
                    status: false
                })
            }

            filter.subCategory = subcategory._id

            if (!filter.category) {
                filter.category = subcategory.category
            }
        }

        // SEARCH: PRODUCT, CATEGORY, SUBCATEGORY, BRAND
        if (search.trim()) {

            const escapedSearch = search.trim().replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&'
            )

            const searchRegex = new RegExp(escapedSearch, 'i')

            const matchingCategories = await Category.find({
                name: searchRegex
            }).select('_id')

            const matchingSubCategories = await SubCategory.find({
                name: searchRegex
            }).select('_id')

            const matchingBrands = await Brand.find({
                name: searchRegex
            }).select('_id')

            filter.$or = [
                { name: searchRegex },
                { description: searchRegex },
                {
                    category: {
                        $in: matchingCategories.map(item => item._id)
                    }
                },
                {
                    subCategory: {
                        $in: matchingSubCategories.map(item => item._id)
                    }
                },
                {
                    brand: {
                        $in: matchingBrands.map(item => item._id)
                    }
                }
            ]
        }

        let products
        let pagination = null

        // FIND PRODUCT BY ID
        if (productId) {

            products = await Product.findOne({
                ...filter,
                _id: productId
            })
                .populate('category', 'name slug')
                .populate('subCategory', 'name slug')
                .populate('brand', 'name')
        }

        // FIND PRODUCT BY SLUG
        else if (productSlug) {

            products = await Product.findOne({
                ...filter,
                slug: productSlug
            })
                .populate('category', 'name slug')
                .populate('subCategory', 'name slug')
                .populate('brand', 'name')
        }

        // GET ALL PRODUCTS
        else {

            const currentPage = Math.max(
                parseInt(page) || 1,
                1
            )

            const pageLimit = Math.min(
                Math.max(parseInt(limit) || 10, 1),
                100
            )

            const skip = (currentPage - 1) * pageLimit

            const sortOrder = order === 'asc' ? 1 : -1

            const allowedSortFields = [
                'name',
                'createdAt',
                'status'
            ]

            const sortField = allowedSortFields.includes(sortBy)
                ? sortBy
                : 'createdAt'

            // ADMIN API
            if (!isPublic) {

                const totalProducts = await Product.countDocuments(filter)

                const totalPages = Math.ceil(
                    totalProducts / pageLimit
                )

                products = await Product.find(filter)
                    .populate('category', 'name slug')
                    .populate('subCategory', 'name slug')
                    .populate('brand', 'name')
                    .sort({ [sortField]: sortOrder })
                    .skip(skip)
                    .limit(pageLimit)

                pagination = {
                    totalProducts,
                    totalPages,
                    currentPage,
                    limit: pageLimit,
                    hasNextPage: currentPage < totalPages,
                    hasPrevPage: currentPage > 1
                }

            } else {

                // PUBLIC API: GET ACTIVE PRODUCTS
                const allProducts = await Product.find(filter)
                    .populate('category', 'name slug')
                    .populate('subCategory', 'name slug')
                    .populate('brand', 'name')

                // STORE-WISE INVENTORY FILTER
                const productsWithVariants = await Promise.all(
                    allProducts.map(async product => {

                        const variants = await ProductVariant.find({
                            product: product._id,
                            status: 'active'
                        })

                        const availableVariants = []

                        for (const variant of variants) {

                            const inventory = await Inventory.findOne({
                                store: storeId,
                                product: product._id,
                                variant: variant._id,
                                status: 'active',
                                availableQuantity: { $gt: 0 }
                            })

                            if (inventory) {

                                availableVariants.push({
                                    ...variant.toObject(),
                                    availableQuantity: inventory.availableQuantity
                                })
                            }
                        }

                        return {
                            ...product.toObject(),
                            variants: availableVariants
                        }
                    })
                )

                // REMOVE PRODUCTS WITHOUT AVAILABLE VARIANTS
                const availableProducts = productsWithVariants.filter(
                    product => product.variants.length > 0
                )

                // SUBCATEGORY: VARIANT-LEVEL PAGINATION
                if (filter.subCategory) {

                    let allVariantCards = availableProducts.flatMap(product => {

                        return product.variants.map(variant => ({
                            product,
                            variant
                        }))
                    })

                    // VARIANT SORTING
                    allVariantCards.sort((a, b) => {

                        let result = 0

                        if (sortBy === 'price') {

                            result =
                                Number(a.variant.sellingPrice || 0) -
                                Number(b.variant.sellingPrice || 0)

                        } else if (sortBy === 'name') {

                            result = a.product.name.localeCompare(
                                b.product.name
                            )

                        } else {

                            result =
                                new Date(a.product.createdAt) -
                                new Date(b.product.createdAt)
                        }

                        return sortOrder * result
                    })

                    // TOTAL VARIANTS
                    const totalVariants = allVariantCards.length

                    const totalPages = Math.ceil(
                        totalVariants / pageLimit
                    )

                    // PAGINATE VARIANTS
                    const paginatedVariants = allVariantCards.slice(
                        skip,
                        skip + pageLimit
                    )

                    // GROUP PAGINATED VARIANTS BY PRODUCT
                    const productMap = new Map()

                    paginatedVariants.forEach(item => {

                        const productId = String(item.product._id)

                        if (!productMap.has(productId)) {

                            productMap.set(productId, {
                                ...item.product,
                                variants: []
                            })
                        }

                        productMap.get(productId).variants.push(
                            item.variant
                        )
                    })

                    products = Array.from(productMap.values())

                    pagination = {
                        totalProducts: totalVariants,
                        totalVariants,
                        totalPages,
                        currentPage,
                        limit: pageLimit,
                        hasNextPage: currentPage < totalPages,
                        hasPrevPage: currentPage > 1
                    }

                } else {

                    // CATEGORY: PRODUCT-LEVEL SORTING
                    if (sortBy === 'name') {

                        availableProducts.sort((a, b) => {
                            return sortOrder * a.name.localeCompare(b.name)
                        })

                    } else if (sortBy === 'price') {

                        availableProducts.sort((a, b) => {

                            const priceA = Math.min(
                                ...a.variants.map(v => Number(v.sellingPrice))
                            )

                            const priceB = Math.min(
                                ...b.variants.map(v => Number(v.sellingPrice))
                            )

                            return sortOrder * (priceA - priceB)
                        })

                    } else {

                        availableProducts.sort((a, b) => {

                            return sortOrder * (
                                new Date(a.createdAt) -
                                new Date(b.createdAt)
                            )
                        })
                    }

                    // CATEGORY PRODUCT PAGINATION
                    const totalProducts = availableProducts.length

                    const totalPages = Math.ceil(
                        totalProducts / pageLimit
                    )

                    products = availableProducts.slice(
                        skip,
                        skip + pageLimit
                    )

                    pagination = {
                        totalProducts,
                        totalPages,
                        currentPage,
                        limit: pageLimit,
                        hasNextPage: currentPage < totalPages,
                        hasPrevPage: currentPage > 1
                    }
                }
            }
        }

        // SINGLE PRODUCT NOT FOUND
        if ((productId || productSlug) && !products) {

            return res.status(404).json({
                message: 'Product not found',
                status: false
            })
        }

        // PUBLIC API: SINGLE PRODUCT INVENTORY
        if (isPublic && (productId || productSlug)) {

            const variants = await ProductVariant.find({
                product: products._id,
                status: 'active'
            })

            const availableVariants = []

            for (const variant of variants) {

                const inventory = await Inventory.findOne({
                    store: storeId,
                    product: products._id,
                    variant: variant._id,
                    status: 'active',
                    availableQuantity: { $gt: 0 }
                })

                if (inventory) {

                    availableVariants.push({
                        ...variant.toObject(),
                        availableQuantity: inventory.availableQuantity
                    })
                }
            }

            if (availableVariants.length === 0) {

                return res.status(404).json({
                    message: 'Product is not available in this store',
                    status: false
                })
            }

            products = {
                ...products.toObject(),
                variants: availableVariants
            }
        }

        return res.status(200).json({
            message: 'Products fetched successfully',
            status: true,
            data: products,
            ...(pagination && { pagination })
        })

    } catch (err) {

        console.log('GET ALL PRODUCTS ERROR:', err)

        return res.status(500).json({
            message: err.message,
            status: false
        })
    }
}





// GET FEATURED PRODUCTS

const getFeaturedProducts = async (req, res) => {
    try {

        // ONLY ACTIVE PRODUCTS
        const products = await Product.find({
            status: 'active'
        })
            .populate('category', 'name slug')
            .populate('subCategory', 'name slug')
            .populate('brand', 'name')

        // FETCH ACTIVE AND FEATURED VARIANTS
        const productsWithVariants = await Promise.all(
            products.map(async (product) => {

                const variants = await ProductVariant.find({
                    product: product._id,
                    status: 'active',
                    isFeatured: true
                })

                return {
                    ...product.toObject(),
                    variants
                }
            })
        )

        // HIDE PRODUCTS HAVING NO FEATURED ACTIVE VARIANTS
        const filteredProducts = productsWithVariants.filter(
            product => product.variants.length > 0
        )

        console.log(
            'FINAL FEATURED PRODUCTS:',
            filteredProducts.map(product => ({
                name: product.name,
                status: product.status,
                variants: product.variants.length
            }))
        )

        return res.status(200).json({
            message: 'Featured products fetched successfully',
            status: true,
            data: filteredProducts
        })

    } catch (err) {
        return res.status(500).json({
            message: err.message,
            status: false
        })
    }
}


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
}

// UPDATE PRODUCT STATUS

const updateProductStatus = async (req, res) => {
    try {
        const { id } = req.params

        const product = await Product.findById(id)

        if (!product) {
            return res.status(404).json({
                message: 'Product not found',
                status: false
            })
        }

        // Backend khud status toggle karega
        product.status =
            product.status === 'active' ? 'inactive' : 'active'

        await product.save()

        return res.status(200).json({
            message: 'Product status updated successfully',
            status: true,
            data: product
        })

    } catch (err) {
        return res.status(500).json({
            message: err.message,
            status: false
        })
    }
}

module.exports = {
    createProduct,
    getAllProducts,
    getFeaturedProducts,
    updateProduct,
    deleteProduct,
    updateProductStatus 
};
