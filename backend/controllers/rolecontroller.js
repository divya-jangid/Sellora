const Role = require('../model/rolemodel')
const User = require('../model/usermodel')

const createRole = async ( req, res ) =>{
    try{
      const { name , permissions} = req.body
      
      console.log('bodyyy',req.body)

      if(!name){
        return res.status(400).json({
            message:'role is required',
            status:false
        })
      }
    const savedRole = await Role.create({
        name,
       permissions
    })

    return res.status(201).json({
        message:'role created successfully',
        status:true,
        data:savedRole
    })

    }
    catch(err){ 
      return res.status(500).json({
        message:err.message,
        status:false
      })
    }
}


const getRole = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)

        const excludeRoles = []

        // Always hide Super Admin role
        const superAdminRole = await Role.findOne({
            name: /^super admin$/i
        })

        if (superAdminRole) {
            excludeRoles.push(superAdminRole._id)
        }

        // Hide currently logged-in user's role
        if (user?.role) {
            excludeRoles.push(user.role)
        }

        const roles = await Role.find({
            _id: { $nin: excludeRoles }
        })

        res.status(200).json({
            status: true,
            data: roles
        })

    } catch (error) {
        res.status(500).json({
            status: false,
            message: error.message
        })
    }
}

const updateRole = async (req, res) => {
    try {
        const { id } = req.params
        const { name, permissions } = req.body

        const role = await Role.findByIdAndUpdate(
            id,
            {
                name,
                permissions
            },
            {
                new: true,
                runValidators: true
            }
        )

        if (!role) {
            return res.status(404).json({
                message: 'Role not found',
                status: false
            })
        }

        return res.status(200).json({
            message: 'Role updated successfully',
            status: true,
            data: role
        })

    } catch (err) {
        return res.status(500).json({
            message: err.message,
            status: false
        })
    }
}

const deleteRole = async (req, res) => {
    try {
        const { id } = req.params

        // Check role exists or not
        const role = await Role.findById(id)

        if (!role) {
            return res.status(404).json({
                message: 'Role not found',
                status: false
            })
        }

        // Prevent deleting Super Admin role
        if (role.name.toLowerCase() === 'super admin') {
            return res.status(403).json({
                message: 'Super Admin role cannot be deleted',
                status: false
            })
        }

        // Delete role
        await Role.findByIdAndDelete(id)

        return res.status(200).json({
            message: 'Role deleted successfully',
            status: true
        })

    } catch (error) {
        return res.status(500).json({
            message: 'Error deleting role',
            error: error.message,
            status: false
        })
    }
}


module.exports = { createRole, getRole, updateRole,deleteRole }