
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/context/CartContext'
import toast from 'react-hot-toast'

function Wishlist() {
  const {
    wishlistItems,
    loadingWishlist,
    removeFromWishlist,
    cartItems,
    addToCart,
    updateCartItem,
    removeCartItem
  } = useCart()

  const [removingId, setRemovingId] = useState(null)
  const [addingId, setAddingId] = useState(null)
  const [updatingId, setUpdatingId] = useState(null)

  // REMOVE FROM WISHLIST
  const handleRemove = async (wishlistItemId) => {
    try {
      setRemovingId(wishlistItemId)

      await removeFromWishlist(wishlistItemId)

      toast.success('Product removed from wishlist')
    } catch (error) {
      console.log('Remove wishlist error:', error)
      toast.error('Failed to remove product')
    } finally {
      setRemovingId(null)
    }
  }

  // FIND PRODUCT IN CART
  const getCartItem = (productId) => {
    return cartItems.find((cartItem) => {
      const id =
        typeof cartItem.product === 'object'
          ? cartItem.product?._id
          : cartItem.product

      return String(id) === String(productId)
    })
  }

  // ADD TO CART AND REMOVE FROM WISHLIST
  const handleAddToCart = async (productId, wishlistItemId) => {
    try {
      setAddingId(productId)

      await addToCart(productId, 1)

      toast.success('Product added to cart successfully!')

      await removeFromWishlist(wishlistItemId)

    } catch (error) {
      console.log('Add to cart error:', error)
      toast.error('Failed to add product to cart')
    } finally {
      setAddingId(null)
    }
  }

  // UPDATE CART QUANTITY
  const handleQuantityChange = async (cartItem, newQuantity) => {
    try {
      setUpdatingId(cartItem._id)

      if (newQuantity <= 0) {
        await removeCartItem(cartItem._id)
        toast.success('Product removed from cart')
      } else {
        await updateCartItem(cartItem._id, newQuantity)
        toast.success('Cart quantity updated')
      }
    } catch (error) {
      console.log('Update cart quantity error:', error)
      toast.error('Failed to update cart')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loadingWishlist) {
    return (
      <div className="p-8 text-center">
        Loading wishlist...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-purple-50 px-4 py-8 md:px-10">
      <h1 className="mb-2 text-3xl font-bold text-purple-900">
        My Wishlist ♡
      </h1>

      <p className="mb-8 text-gray-600">
        Your favourite products in one place.
      </p>

      {!wishlistItems || wishlistItems.length === 0 ? (
        <div className="rounded-xl bg-white p-10 text-center shadow-sm">
          <p className="mb-4 text-lg text-gray-600">
            Your wishlist is empty.
          </p>

          <Link
            href="/"
            className="inline-block rounded-lg bg-purple-600 px-6 py-3 text-white hover:bg-purple-700"
          >
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {wishlistItems.map((item) => {
            const product =
              typeof item.product === 'object'
                ? item.product
                : null

            if (!product) return null

            const cartItem = getCartItem(product._id)
            const quantity = Number(cartItem?.quantity || 0)
            const isAdding = addingId === product._id
            const isUpdating = updatingId === cartItem?._id

            return (
              <div
                key={item._id}
                className="overflow-hidden rounded-xl bg-white shadow-sm transition hover:shadow-md"
              >
                <Link href={`/product/${product._id}`}>
                  <div className="flex h-48 items-center justify-center bg-gray-50 p-4">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name || 'Product'}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-gray-400">
                        No Image
                      </span>
                    )}
                  </div>
                </Link>

                <div className="p-4">
                  <Link href={`/product/${product._id}`}>
                    <h2 className="mb-2 text-lg font-semibold text-gray-800">
                      {product.name}
                    </h2>
                  </Link>

                  <p className="mb-4 font-bold text-purple-700">
                    ₹{product.price}
                  </p>

                  {!cartItem ? (
                    <button
                      onClick={() =>
                        handleAddToCart(product._id, item._id)
                      }
                      disabled={isAdding}
                      className="mb-3 w-full rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
                    >
                      {isAdding ? 'Adding...' : 'Add to Cart'}
                    </button>
                  ) : (
                    <div className="mb-3 flex w-full items-center justify-between rounded-lg bg-purple-600 p-1 text-white">
                      <button
                        type="button"
                        onClick={() =>
                          handleQuantityChange(cartItem, quantity - 1)
                        }
                        disabled={isUpdating}
                        className="h-9 w-10 rounded-md text-xl font-bold hover:bg-purple-700 disabled:opacity-50"
                      >
                        −
                      </button>

                      <span className="font-bold">
                        {quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          handleQuantityChange(cartItem, quantity + 1)
                        }
                        disabled={isUpdating}
                        className="h-9 w-10 rounded-md text-xl font-bold hover:bg-purple-700 disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => handleRemove(item._id)}
                    disabled={removingId === item._id}
                    className="w-full rounded-lg border border-red-300 px-4 py-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    {removingId === item._id
                      ? 'Removing...'
                      : 'Remove ♡'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Wishlist
