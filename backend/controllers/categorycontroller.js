const Category = require('../model/categorymodel')
const cloudinary = require('../config/cloudinary');

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
        const categories = await Category.find({
            isDeleted: false
        });

        return res.status(200).json({
            message: 'Categories fetched successfully',
            status: true,
            data:categories
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


module.exports = { createCategory,getAllCategories,updateCategory,deleteCategory }