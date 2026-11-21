const mongoose = require('mongoose')
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
            productSlug,
            productId,
            storeId,
            brandId,
            page = 1,
            limit = 10,
            search = '',
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query

        const isPublic = req.path === '/public'

        const filter = {}

        let selectedCategory = null
        let selectedSubcategory = null

        // PUBLIC: VALIDATE SELECTED STORE
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

        // CATEGORY FILTER USING SLUG
        if (categorySlug) {
            selectedCategory = await Category.findOne({
                slug: categorySlug,
                isDeleted: false,
                status: 'active'
            })

            if (!selectedCategory) {
                return res.status(404).json({
                    message: 'Category not found',
                    status: false
                })
            }

            filter.category = selectedCategory._id
        }

        // SUBCATEGORY FILTER USING SLUG
        if (subcategorySlug) {
            selectedSubcategory = await SubCategory.findOne({
                slug: subcategorySlug,
                isDeleted: false,
                status: 'active'
            })

            if (!selectedSubcategory) {
                return res.status(404).json({
                    message: 'Subcategory not found',
                    status: false
                })
            }

            if (
                selectedCategory &&
                String(selectedSubcategory.category) !==
                String(selectedCategory._id)
            ) {
                return res.status(400).json({
                    message: 'Subcategory does not belong to this category',
                    status: false
                })
            }

            filter.subCategory = selectedSubcategory._id

            if (!filter.category) {
                filter.category = selectedSubcategory.category
            }
        }

        // BRAND FILTER
        if (brandId) {
            filter.brand = brandId
        }

        // SEARCH
        if (search.trim()) {
            const escapedSearch = search.trim().replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&'
            )

            const searchRegex = new RegExp(escapedSearch, 'i')

            const matchingCategories = await Category.find({
                name: searchRegex,
                isDeleted: false
            }).select('_id')

            const matchingSubCategories = await SubCategory.find({
                name: searchRegex,
                isDeleted: false
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

        // PAGINATION
        const currentPage = Math.max(parseInt(page) || 1, 1)

        const pageLimit = Math.min(
            Math.max(parseInt(limit) || 10, 1),
            100
        )

        const skip = (currentPage - 1) * pageLimit

        const sortOrder = order === 'asc' ? 1 : -1

        let products
        let pagination = null

        // SINGLE PRODUCT BY ID
        if (productId) {
            products = await Product.findOne({
                ...filter,
                _id: productId
            })
                .populate('category', 'name slug')
                .populate('subCategory', 'name slug')
                .populate('brand', 'name')
        }

        // SINGLE PRODUCT BY SLUG
        else if (productSlug) {
            products = await Product.findOne({
                ...filter,
                slug: productSlug
            })
                .populate('category', 'name slug')
                .populate('subCategory', 'name slug')
                .populate('brand', 'name')
        }

        // ALL PRODUCTS
        else {
            // ADMIN API
            if (!isPublic) {
                const allowedSortFields = [
                    'name',
                    'createdAt',
                    'status'
                ]

                const sortField = allowedSortFields.includes(sortBy)
                    ? sortBy
                    : 'createdAt'

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
                // PUBLIC: ACTIVE PRODUCTS
                const allProducts = await Product.find(filter)
                    .populate('category', 'name slug')
                    .populate('subCategory', 'name slug')
                    .populate('brand', 'name')

                const productIds = allProducts.map(
                    product => product._id
                )

                // ACTIVE VARIANTS
                const allVariants = await ProductVariant.find({
                    product: { $in: productIds },
                    status: 'active'
                })

                const variantIds = allVariants.map(
                    variant => variant._id
                )

                // IMPORTANT:
                // Fetch ALL inventory entries for selected store,
                // including zero available quantity.
                const inventories = await Inventory.find({
                    store: storeId,
                    product: { $in: productIds },
                    variant: { $in: variantIds }
                }).select('product variant availableQuantity')

                // INVENTORY MAP
                const inventoryMap = new Map()

                inventories.forEach(inventory => {
                    const key =
                        `${String(inventory.product)}_${String(inventory.variant)}`

                    inventoryMap.set(
                        key,
                        Number(inventory.availableQuantity || 0)
                    )
                })

                // ONLY PRODUCTS ASSIGNED TO SELECTED STORE
                const variantMap = new Map()

                allVariants.forEach(variant => {
                    const currentProductId = String(variant.product)

                    const key =
                        `${currentProductId}_${String(variant._id)}`

                    // No inventory entry means variant is not assigned
                    // to this store.
                    if (!inventoryMap.has(key)) {
                        return
                    }

                    const availableQuantity =
                        inventoryMap.get(key)

                    if (!variantMap.has(currentProductId)) {
                        variantMap.set(currentProductId, [])
                    }

                    variantMap.get(currentProductId).push({
                        ...variant.toObject(),
                        availableQuantity
                    })
                })

                // KEEP PRODUCTS HAVING AT LEAST ONE STORE INVENTORY ENTRY
                let productsWithVariants = allProducts
                    .map(product => ({
                        ...product.toObject(),
                        variants:
                            variantMap.get(String(product._id)) || []
                    }))
                    .filter(product => product.variants.length > 0)

             

                // SUBCATEGORY: VARIANT LEVEL PAGINATION
                if (filter.subCategory) {
                    let allVariantCards = productsWithVariants.flatMap(
                        product =>
                            product.variants.map(variant => ({
                                product,
                                variant
                            }))
                    )

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

                    const totalVariants = allVariantCards.length

                    const totalPages = Math.ceil(
                        totalVariants / pageLimit
                    )

                    const paginatedVariants = allVariantCards.slice(
                        skip,
                        skip + pageLimit
                    )

                    const productMap = new Map()

                    paginatedVariants.forEach(item => {
                        const id = String(item.product._id)

                        if (!productMap.has(id)) {
                            productMap.set(id, {
                                ...item.product,
                                variants: []
                            })
                        }

                        productMap.get(id).variants.push(item.variant)
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
                    // CATEGORY: IN STOCK FIRST, OUT OF STOCK AFTER
                    productsWithVariants.sort((a, b) => {

                        let result = 0

                        if (sortBy === 'name') {
                            result = a.name.localeCompare(b.name)
                        } else if (sortBy === 'price') {
                            const pricesA = a.variants.map(
                                v => Number(v.sellingPrice)
                            ).filter(price => price > 0)

                            const pricesB = b.variants.map(
                                v => Number(v.sellingPrice)
                            ).filter(price => price > 0)

                            const priceA = pricesA.length
                                ? Math.min(...pricesA)
                                : 0

                            const priceB = pricesB.length
                                ? Math.min(...pricesB)
                                : 0

                            result = priceA - priceB
                        } else {
                            result =
                                new Date(a.createdAt) -
                                new Date(b.createdAt)
                        }

                        return sortOrder * result
                    })

                    const totalProducts = productsWithVariants.length

                    const totalPages = Math.ceil(
                        totalProducts / pageLimit
                    )

                    products = productsWithVariants.slice(
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

        // PUBLIC: SINGLE PRODUCT STORE-WISE INVENTORY
        if (isPublic && (productId || productSlug)) {
            const variants = await ProductVariant.find({
                product: products._id,
                status: 'active'
            })

            const variantIds = variants.map(
                variant => variant._id
            )

            const inventories = await Inventory.find({
                store: storeId,
                product: products._id,
                variant: { $in: variantIds }
            }).select('variant availableQuantity')

            const inventoryMap = new Map()

            inventories.forEach(inventory => {
                inventoryMap.set(
                    String(inventory.variant),
                    Number(inventory.availableQuantity || 0)
                )
            })

            // Only variants assigned to this store
            const productVariants = variants
                .filter(variant =>
                    inventoryMap.has(String(variant._id))
                )
                .map(variant => ({
                    ...variant.toObject(),
                    availableQuantity:
                        inventoryMap.get(String(variant._id)) || 0
                }))

            products = {
                ...products.toObject(),
                variants: productVariants
            }

            // Product not assigned to selected store
            if (!productVariants.length) {
                return res.status(404).json({
                    message: 'Product is not available in selected store',
                    status: false
                })
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
        const { storeId } = req.query;

        // PAGINATION
        const pageNumber = Math.max(1, Number(req.query.page) || 1);
        const limitNumber = Math.min(
            100,
            Math.max(1, Number(req.query.limit) || 10)
        );

        if (!mongoose.Types.ObjectId.isValid(storeId || '')) {
            return res.status(400).json({
                message: 'Please select a valid store',
                status: false
            });
        }

        // CHECK ACTIVE STORE
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

        // ONLY ACTIVE FEATURED PRODUCTS
        const products = await Product.find({
            status: 'active',
            isFeatured: true
        })
            .populate('category', 'name slug')
            .populate('subCategory', 'name slug')
            .populate('brand', 'name')
            .sort({ createdAt: -1 });

        // CHECK ACTIVE VARIANTS AND STORE INVENTORY
        const productsWithVariants = await Promise.all(
            products.map(async (product) => {

                const variants = await ProductVariant.find({
                    product: product._id,
                    status: 'active'
                });

                const availableVariants = await Promise.all(
                    variants.map(async (variant) => {

                        const inventory = await Inventory.findOne({
                            store: storeId,
                            product: product._id,
                            variant: variant._id,
                            availableQuantity: { $gt: 0 }
                        });

                       
                        if (!inventory) {
                            return null;
                        }

                        return {
                            ...variant.toObject(),
                            availableQuantity: inventory.availableQuantity
                        };
                    })
                );

                return {
                    ...product.toObject(),
                    variants: availableVariants.filter(Boolean)
                };
            })
        );


        // ONLY PRODUCTS HAVING AVAILABLE VARIANTS
        const filteredProducts = productsWithVariants.filter(
            product => product.variants.length > 0
        );

        // TOTAL ELIGIBLE PRODUCTS
        const totalProducts = filteredProducts.length;

        // PAGINATION ON PRODUCTS, NOT VARIANTS
        const startIndex = (pageNumber - 1) * limitNumber;

        const paginatedProducts = filteredProducts.slice(
            startIndex,
            startIndex + limitNumber
        );

        const totalPages = Math.ceil(totalProducts / limitNumber);

        return res.status(200).json({
            message: 'Store-wise featured products fetched successfully',
            status: true,
            data: paginatedProducts,
            pagination: {
                totalProducts,
                currentPage: pageNumber,
                totalPages,
                limit: limitNumber,
                hasMore: pageNumber < totalPages
            }
        });

    } catch (err) {

        console.log('FEATURED PRODUCTS ERROR:', err);

        return res.status(500).json({
            message: err.message,
            status: false
        });
    }
};


// UPDATE PRODUCT

const updateProduct = async (req, res) => {
    try {

        console.log('REQ FILE:', req.file)
        
        const { id } = req.params;

        const updateData = { ...req.body };

        // Check product exists
        const existingProduct = await Product.findById(id);

        if (!existingProduct) {
            return res.status(404).json({
                message: 'Product not found',
                status: false
            });
        }

        // Upload new image to Cloudinary
        if (req.file) {
            const imageData = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

            const uploadedImage = await cloudinary.uploader.upload(
                imageData,
                { folder: 'products' }
            );

            updateData.image = uploadedImage.secure_url;
        }

        // Handle featured boolean
        if (updateData.isFeatured !== undefined) {
            updateData.isFeatured =
                updateData.isFeatured === true ||
                updateData.isFeatured === 'true';
        }

        // Generate new slug if name changes
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
            {
                new: true,
                runValidators: true
            }
        )
            .populate('category', 'name slug')
            .populate('subCategory', 'name slug')
            .populate('brand', 'name');

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
