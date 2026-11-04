
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { useCart } from '@/context/CartContext'

export default function SubcategoryPage() {
  const { subcategoryId } = useParams()
  const router = useRouter()

  const [products, setProducts] = useState([])
  const [subcategory, setSubcategory] = useState(null)
  const [productsWithVariants, setProductsWithVariants] = useState([])
  const [productPrices, setProductPrices] = useState({})
  const [loading, setLoading] = useState(true)
  const [addingProduct, setAddingProduct] = useState(null)
  const [updatingItem, setUpdatingItem] = useState(null)
  const [wishlistLoading, setWishlistLoading] = useState(null)

  const {
    cartItems = [],
    addToCart: addCartItem,
    updateCartItem,
    removeCartItem,
    wishlistItems = [],
    addToWishlist,
    removeFromWishlist
  } = useCart()

  // PRODUCT DETAIL URL
  const getProductUrl = (item) => {
    return `/product/${item._id}`
  }

  // GET SUBCATEGORY, PRODUCTS AND VARIANTS
  useEffect(() => {
    const getProducts = async () => {
      try {
        setLoading(true)

        const subcategoryRes = await axios.get(
          'http://localhost:8000/subcategory/get-all',
          { withCredentials: true }
        )

        const allSubcategories =
          subcategoryRes.data?.data ||
          subcategoryRes.data?.subcategories ||
          []

        const selectedSubcategory = allSubcategories.find(
          (item) => String(item._id) === String(subcategoryId)
        )

        setSubcategory(selectedSubcategory || null)

        if (!selectedSubcategory) {
          setProducts([])
          setProductsWithVariants([])
          setProductPrices({})
          return
        }

        // GET PRODUCTS
        const productRes = await axios.get(
          'http://localhost:8000/product/public',
          { withCredentials: true }
        )

        const allProducts =
          productRes.data?.products ||
          productRes.data?.data?.products ||
          productRes.data?.data ||
          []

        const filteredProducts = Array.isArray(allProducts)
          ? allProducts.filter(
              (item) =>
                String(item.subCategory?._id || item.subCategory) ===
                String(subcategoryId)
            )
          : []

        setProducts(filteredProducts)

        // GET ALL ACTIVE PUBLIC VARIANTS
        const variantRes = await axios.get(
          'http://localhost:8000/productvariant/public'
        )

        const allVariants = Array.isArray(variantRes.data?.data)
          ? variantRes.data.data
          : []

        // FIND PRODUCTS WHICH HAVE VARIANTS
        const variantProductIds = [
          ...new Set(
            allVariants
              .map((variant) =>
                String(variant.product?._id || variant.product)
              )
              .filter((id) => id && id !== 'undefined')
          )
        ]

        setProductsWithVariants(variantProductIds)

        // GET LOWEST SELLING PRICE FOR EACH PRODUCT
        const prices = {}

        allVariants.forEach((variant) => {
          const productId = String(
            variant.product?._id || variant.product
          )

          const sellingPrice = Number(variant.sellingPrice)

          if (!productId || !Number.isFinite(sellingPrice)) return

          if (
            prices[productId] === undefined ||
            sellingPrice < prices[productId]
          ) {
            prices[productId] = sellingPrice
          }
        })

        setProductPrices(prices)

      } catch (error) {
        console.log(
          'SUBCATEGORY PRODUCTS ERROR:',
          error.response?.data || error.message
        )

        setProducts([])
        setProductsWithVariants([])
        setProductPrices({})
      } finally {
        setLoading(false)
      }
    }

    if (subcategoryId) {
      getProducts()
    } else {
      setLoading(false)
    }
  }, [subcategoryId])

  // FIND CART ITEM WITHOUT VARIANT
  const getCartItem = (productId) => {
    return cartItems.find((cartItem) => {
      const id =
        typeof cartItem.product === 'object'
          ? cartItem.product?._id
          : cartItem.product

      const variantId =
        typeof cartItem.variant === 'object'
          ? cartItem.variant?._id
          : cartItem.variant

      return (
        String(id) === String(productId) &&
        !variantId
      )
    })
  }

  // FIND PRODUCT IN WISHLIST
  const getWishlistItem = (productId) => {
    return wishlistItems.find((item) => {
      const id =
        typeof item.product === 'object'
          ? item.product?._id
          : item.product

      return String(id) === String(productId)
    })
  }

  // ADD PRODUCT WITHOUT VARIANT TO CART
  const addToCart = async (productId) => {
    try {
      setAddingProduct(productId)
      await addCartItem(productId, 1, null)
    } catch (error) {
      console.log(
        'ADD TO CART ERROR:',
        error.response?.data || error.message
      )
    } finally {
      setAddingProduct(null)
    }
  }

  // UPDATE QUANTITY OR REMOVE CART ITEM
  const updateQuantity = async (cartItem, newQuantity) => {
    if (!cartItem?._id) return

    try {
      setUpdatingItem(cartItem._id)

      if (newQuantity <= 0) {
        await removeCartItem(cartItem._id)
      } else {
        await updateCartItem(cartItem._id, newQuantity)
      }
    } catch (error) {
      console.log(
        'UPDATE CART ERROR:',
        error.response?.data || error.message
      )
    } finally {
      setUpdatingItem(null)
    }
  }

  // ADD / REMOVE WISHLIST
  const toggleWishlist = async (productId) => {
    try {
      setWishlistLoading(productId)

      const wishlistItem = getWishlistItem(productId)

      if (wishlistItem) {
        await removeFromWishlist(wishlistItem._id)
      } else {
        await addToWishlist(productId)
      }
    } catch (error) {
      console.log(
        'WISHLIST ERROR:',
        error.response?.data || error.message
      )
    } finally {
      setWishlistLoading(null)
    }
  }

  // LOADING
  if (loading) {
    return (
      <p className="p-8 text-center">
        Loading products...
      </p>
    )
  }

  // SUBCATEGORY NOT FOUND
  if (!subcategory) {
    return (
      <p className="p-8 text-center">
        Subcategory not found.
      </p>
    )
  }

  return (
    <main className="min-h-screen bg-purple-50 px-4 py-8 md:px-10">
      <div className="mx-auto max-w-7xl">

        <button
          onClick={() => router.back()}
          className="mb-6 rounded-lg bg-white px-4 py-2 text-sm text-purple-700 shadow-sm"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold text-gray-900">
          {subcategory.name}
        </h1>

        <p className="mt-2 text-gray-600">
          Products in this subcategory
        </p>

        {products.length === 0 ? (
          <p className="mt-8 rounded-xl bg-white p-6 text-gray-600">
            No products available in this subcategory.
          </p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">

            {products.map((item) => {
              const hasVariants = productsWithVariants.includes(
                String(item._id)
              )

              const cartItem = hasVariants
                ? null
                : getCartItem(item._id)

              const quantity = Number(cartItem?.quantity || 0)

              const isAdding = addingProduct === item._id
              const isUpdating = updatingItem === cartItem?._id

              const wishlistItem = getWishlistItem(item._id)
              const isWishlisted = Boolean(wishlistItem)

              const displayPrice = hasVariants
                ? productPrices[String(item._id)]
                : item.price

              return (
                <div
                  key={item._id}
                  className="rounded-2xl border border-purple-100 bg-white p-4 shadow-sm transition hover:shadow-md"
                >
                  {/* PRODUCT IMAGE */}
                  <div className="relative">

                    <Link href={getProductUrl(item)}>
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-36 w-full rounded-xl bg-purple-50 object-contain p-2"
                        />
                      ) : (
                        <div className="flex h-36 items-center justify-center rounded-xl bg-purple-50 text-sm text-gray-400">
                          No image
                        </div>
                      )}
                    </Link>

                    {/* WISHLIST */}
                    <button
                      type="button"
                      onClick={() => toggleWishlist(item._id)}
                      disabled={wishlistLoading === item._id}
                      aria-label={
                        isWishlisted
                          ? 'Remove from wishlist'
                          : 'Add to wishlist'
                      }
                      className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-2xl shadow-md transition hover:scale-110 disabled:opacity-50"
                    >
                      <span
                        className={
                          isWishlisted
                            ? 'text-pink-600'
                            : 'text-gray-500'
                        }
                      >
                        {isWishlisted ? '♥' : '♡'}
                      </span>
                    </button>
                  </div>

                  {/* PRODUCT DETAILS */}
                  <Link href={getProductUrl(item)}>
                    <h2 className="mt-3 font-semibold text-gray-800">
                      {item.name}
                    </h2>

                    <p className="mt-2 font-bold text-purple-700">
                      {displayPrice !== undefined
                        ? `₹${displayPrice}`
                        : 'Price unavailable'}
                    </p>
                  </Link>

                  <p className="mt-1 text-sm text-gray-500">
                    {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </p>

                  {/* CART BUTTONS */}
                  <div className="mt-3">

                    {hasVariants ? (
                      <button
                        type="button"
                        onClick={() =>
                          router.push(getProductUrl(item))
                        }
                        className="w-full rounded-lg border border-purple-600 px-2 py-2 text-sm font-bold text-purple-700 transition hover:bg-purple-600 hover:text-white"
                      >
                        CHOOSE VARIANT
                      </button>
                    ) : quantity === 0 ? (
                      <button
                        type="button"
                        disabled={isAdding || item.stock <= 0}
                        onClick={() => addToCart(item._id)}
                        className="w-full rounded-lg border border-purple-600 px-2 py-2 text-sm font-bold text-purple-700 transition hover:bg-purple-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isAdding
                          ? 'ADDING...'
                          : item.stock <= 0
                            ? 'OUT OF STOCK'
                            : 'ADD TO CART'}
                      </button>
                    ) : (
                      <div className="flex w-full items-center justify-between rounded-lg bg-purple-600 p-1 text-white">

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            updateQuantity(cartItem, quantity - 1)
                          }
                          className="h-8 w-8 rounded-md text-xl font-bold hover:bg-purple-700 disabled:opacity-50"
                        >
                          −
                        </button>

                        <span className="min-w-6 text-center font-bold">
                          {quantity}
                        </span>

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            updateQuantity(cartItem, quantity + 1)
                          }
                          className="h-8 w-8 rounded-md text-xl font-bold hover:bg-purple-700 disabled:opacity-50"
                        >
                          +
                        </button>

                      </div>
                    )}

                  </div>
                </div>
              )
            })}

          </div>
        )}

      </div>
    </main>
  )
}
