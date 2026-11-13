require('dotenv').config()
const express = require('express')
const connectDB = require('./db/db')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const path = require('path')

const app = express()
app.use(express.json())
app.use(cookieParser())

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use(cors({
    origin: [
        'http://localhost:3000',
        'http://localhost:5173'
    ],
    credentials: true
}))

connectDB()

const adminRoute = require('./routes/adminRoute')
const userRoute = require('./routes/userRoute')
const roleRoute = require('./routes/roleRoute')
const productRoute = require('./routes/productRoute')
const categoryRoute = require('./routes/categoryRoute')
const subcategoryRoute = require('./routes/subcategoryRoute')
const brandRoute = require('./routes/brandRoute')
const productVariant = require('./routes/productvariantRoute')
const storeRoute = require('./routes/storeRoute')
const templateRoute = require('./routes/templateRoute')
const cartRoute = require('./routes/cartRoute')
const addressRoute = require('./routes/addressRoute')
const orderRoute = require('./routes/orderRoute')
const couponRoute = require('./routes/couponRoute')
const inventoryRoute = require('./routes/inventoryRoute')
const paymentRoute = require('./routes/paymentRoute')
const cartItemRoute = require('./routes/cartitemRoute')
const wishlistRoute = require('./routes/wishlistRoute')
const wishlistItemRoute = require('./routes/wishlistitemRoute')
const dashboardRoutes = require('./routes/dashboardRoute')
const deliveryPartnerRoute = require('./routes/deliverypartnerRoute')
const deliveryRoute = require('./routes/deliveryRoute')
const bannerRoute = require('./routes/bannerRoute');




app.use('/dashboard', dashboardRoutes)
app.use('/admin',adminRoute)
app.use('/user',userRoute)
app.use('/role',roleRoute)
app.use('/product',productRoute)
app.use('/category',categoryRoute)
app.use('/subcategory',subcategoryRoute)
app.use('/brand',brandRoute)    
app.use('/productvariant',productVariant)
app.use('/store',storeRoute)
app.use('/template',templateRoute)
app.use('/cart',cartRoute)
app.use('/address', addressRoute)
app.use('/order',orderRoute)
app.use('/coupon', couponRoute)
app.use('/inventory',inventoryRoute)
app.use('/payment',paymentRoute)
app.use('/cartitem',cartItemRoute)
app.use('/wishlist',wishlistRoute)
app.use('/wishlist-item',wishlistItemRoute)
app.use('/deliverypartner',deliveryPartnerRoute)
app.use('/delivery', deliveryRoute)
app.use('/banner', bannerRoute);



const port = process.env.PORT

app.listen(port, () => {
    console.log('server running on',port)
})