
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
                'roles_create',
                'roles_view',
                'roles_edit',
                'roles_delete'
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
