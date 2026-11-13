
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
      <div className="flex min-h-[60vh] items-center justify-center bg-[#faf8ff]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
          <p className="text-sm font-medium text-gray-500">
            Loading your wishlist...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf8ff] px-4 py-8 sm:px-6 md:px-10 lg:py-12">

      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-purple-600">
              Your Collection
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl md:text-4xl">
              My Wishlist
              <span className="ml-2 text-purple-600">♡</span>
            </h1>

            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              Your favourite products, all in one place.
            </p>
          </div>

          {wishlistItems?.length > 0 && (
            <div className="w-fit rounded-full border border-purple-100 bg-white px-4 py-2 text-sm font-semibold text-purple-700 shadow-sm">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'Item' : 'Items'}
            </div>
          )}
        </div>

        {!wishlistItems || wishlistItems.length === 0 ? (

          /* EMPTY WISHLIST */
          <div className="rounded-2xl border border-purple-100 bg-white px-5 py-16 text-center shadow-sm sm:py-20">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-purple-50 text-5xl text-purple-400">
              ♡
            </div>

            <h2 className="mb-2 text-xl font-bold text-gray-800 sm:text-2xl">
              Your wishlist is empty
            </h2>

            <p className="mx-auto mb-7 max-w-sm text-sm leading-6 text-gray-500">
              You haven't saved any products yet. Explore our collection and add your favourite products here.
            </p>

            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-7 py-3 font-semibold text-white shadow-md shadow-purple-200 transition hover:bg-purple-700 hover:shadow-lg"
            >
              Explore Products
              <span className="ml-2">→</span>
            </Link>
          </div>

        ) : (

          /* PRODUCT GRID */
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

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
                  className="group relative overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-100/70"
                >

                  {/* PRODUCT IMAGE */}
                  <Link href={`/product/${product._id}`}>
                    <div className="relative flex h-52 items-center justify-center overflow-hidden bg-[#f8f6fc] p-5 sm:h-56">

                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name || 'Product'}
                          className="h-full w-full object-contain transition duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <span className="text-sm text-gray-400">
                          No Image Available
                        </span>
                      )}

                      <span className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl text-purple-600 shadow-sm">
                        ♡
                      </span>
                    </div>
                  </Link>

                  {/* PRODUCT DETAILS */}
                  <div className="p-4 sm:p-5">

                    <Link href={`/product/${product._id}`}>
                      <h2 className="mb-2 line-clamp-2 min-h-12 text-base font-semibold leading-6 text-gray-800 transition hover:text-purple-700 sm:text-lg">
                        {product.name}
                      </h2>
                    </Link>

                    <p className="mb-4 text-xl font-bold text-purple-700">
                      ₹{product.price}
                    </p>

                    {/* CART BUTTON / QUANTITY */}
                    {!cartItem ? (
                      <button
                        onClick={() =>
                          handleAddToCart(product._id, item._id)
                        }
                        disabled={isAdding}
                        className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isAdding ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                            Adding...
                          </>
                        ) : (
                          <>
                            <span className="text-lg">+</span>
                            Add to Cart
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="mb-3 flex w-full items-center justify-between rounded-xl bg-purple-600 p-1.5 text-white">

                        <button
                          type="button"
                          onClick={() =>
                            handleQuantityChange(cartItem, quantity - 1)
                          }
                          disabled={isUpdating}
                          className="flex h-9 w-10 items-center justify-center rounded-lg text-xl font-bold transition hover:bg-purple-700 disabled:opacity-50"
                        >
                          −
                        </button>

                        <span className="text-sm font-bold">
                          {quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            handleQuantityChange(cartItem, quantity + 1)
                          }
                          disabled={isUpdating}
                          className="flex h-9 w-10 items-center justify-center rounded-lg text-xl font-bold transition hover:bg-purple-700 disabled:opacity-50"
                        >
                          +
                        </button>
                      </div>
                    )}

                    {/* REMOVE BUTTON */}
                    <button
                      onClick={() => handleRemove(item._id)}
                      disabled={removingId === item._id}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {removingId === item._id ? (
                        'Removing...'
                      ) : (
                        <>
                          <span>♡</span>
                          Remove from Wishlist
                        </>
                      )}
                    </button>

                  </div>
                </div>
              )
            })}

          </div>
        )}

      </div>
    </div>
  )
}

export default Wishlist
