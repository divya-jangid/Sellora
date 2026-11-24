
require('dotenv').config()

const mongoose = require('mongoose')
const Role = require('./model/rolemodel')

const seedSuperAdminRole = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL)

        console.log('MongoDB connected')

        const existingRole = await Role.findOne({
            name: 'super admin'
        })

        if (existingRole) {
            console.log('Super Admin role already exists')
            return
        }

        const role = await Role.create({
            name: 'super admin',
            permissions: [
    'dashboard_view',

    'products_view',
    'products_create',
    'products_edit',
    'products_delete',

    'categories_view',
    'categories_create',
    'categories_edit',
    'categories_delete',

    'subcategories_view',
    'subcategories_create',
    'subcategories_edit',
    'subcategories_delete',

    'brands_view',
    'brands_create',
    'brands_edit',
    'brands_delete',

    'productvariant_view',
    'productvariant_create',
    'productvariant_edit',
    'productvariant_delete',

    'store_view',
    'store_create',
    'store_edit',
    'store_delete',

    'storeinventory_view',
    'storeinventory_create',
    'storeinventory_edit',
    'storeinventory_delete',

    'users_view',
    'user_create',
    'user_edit',
    'user_delete',

    'roles_view',
    'roles_create',
    'roles_edit',
    'roles_delete',

    'template_view',
    'template_create',
    'template_edit',
    'template_delete',

    'banners_view',
    'banners_create',
    'banners_edit',
    'banners_delete'
],
            status: 'active'
        })

        console.log('Super Admin role created successfully')
        console.log(role)

    } catch (error) {
        console.log('Seed error:', error.message)
        process.exitCode = 1

    } finally {
        await mongoose.disconnect()
        console.log('MongoDB disconnected')
    }
}

seedSuperAdminRole()
