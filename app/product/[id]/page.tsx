"use client"

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import { useParams, useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { ShoppingCart, ArrowLeft, ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import { useCart } from '@/context/cartContext';
import { toast } from 'sonner';

const ProductPage = () => {
    const params = useParams();
    const router = useRouter();
    const id = params.id as Id<"products">;
    
    const product = useQuery(api.product.getProductById, id ? { id } : "skip");
    
    const { addToCart } = useCart();
    
    const [quantity, setQuantity] = useState(1);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    if (!product) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="relative mx-auto w-24 h-24">
                        <img 
                            src="/tyre.png" 
                            alt="Loading" 
                            className="w-full h-full animate-spin"
                            style={{ animationDuration: '1.5s' }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    const images = Array.isArray(product.imageUrl) ? product.imageUrl : [product.imageUrl];
    const totalImages = images.length;

    const hasDiscount = (product.discount || 0) > 0;
    const discountedPrice = product.cost - (product.discount || 0);
    const discountPercentage = product.cost > 0 ? Math.round((product.discount || 0) / product.cost * 100) : 0;

    const handleAddToCart = () => {
        for (let i = 0; i < quantity; i++) {
            addToCart({
                _id: product._id,
                title: product.title,
                cost: product.cost,
                imageUrl: images[0],
                category: product.category,
                discount: product.discount,
                GSTRate: product.GSTRate
            });
        }
        toast.success(`Added ${quantity} ${quantity > 1 ? 'items' : 'item'} to cart!`);
    };

    const goToPrevImage = () => {
        setCurrentImageIndex((prev) => (prev === 0 ? totalImages - 1 : prev - 1));
    };

    const goToNextImage = () => {
        setCurrentImageIndex((prev) => (prev === totalImages - 1 ? 0 : prev + 1));
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50">
            <div className="container mx-auto px-4 pt-8">
                <button
                    onClick={() => router.push('/')}
                    className="flex items-center gap-2 text-gray-600 hover:text-yellow-600 transition-colors font-semibold"
                >
                    <ArrowLeft className="w-5 h-5" />
                    Back to Shop
                </button>
            </div>

            <div className="container mx-auto px-4 py-8 lg:py-16">
                <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
                    
                    <div className={totalImages > 1 ? "space-y-4" : ""}>
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-amber-400/20 rounded-3xl blur-3xl group-hover:blur-2xl transition-all duration-500"></div>
                            <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-yellow-100">
                                <img 
                                    src={images[currentImageIndex]} 
                                    alt={`${product.title} - Image ${currentImageIndex + 1}`}
                                    className="w-full h-[400px] lg:h-[600px] object-contain"
                                />
                                
                                {hasDiscount && (
                                    <div className="absolute top-4 scale-75 md:scale-100 left-4 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
                                        <Tag className="w-4 h-4" />
                                        <span className="font-bold text-lg">{discountPercentage}% OFF</span>
                                    </div>
                                )}

                                {product.size && (
                                    <div className='absolute top-4 right-4 p-2 font-semibold bg-yellow-400 rounded-2xl scale-75 md:scale-100'>
                                        {product.size}
                                    </div>
                                )}
                                
                                {totalImages > 1 && (
                                    <>
                                        <button
                                            onClick={goToPrevImage}
                                            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 group/btn"
                                            aria-label="Previous image"
                                        >
                                            <ChevronLeft className="w-6 h-6 text-gray-700 group-hover/btn:text-yellow-600" />
                                        </button>
                                        <button
                                            onClick={goToNextImage}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 group/btn"
                                            aria-label="Next image"
                                        >
                                            <ChevronRight className="w-6 h-6 text-gray-700 group-hover/btn:text-yellow-600" />
                                        </button>
                                        
                                        <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-semibold">
                                            {currentImageIndex + 1} / {totalImages}
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {totalImages > 1 && (
                            <div className="grid grid-cols-4 gap-3">
                                {images.map((img, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentImageIndex(index)}
                                        className={`relative rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                                            currentImageIndex === index 
                                                ? 'border-yellow-500 ring-2 ring-yellow-200 shadow-lg scale-105' 
                                                : 'border-gray-200 hover:border-yellow-300 opacity-70 hover:opacity-100'
                                        }`}
                                    >
                                        <img 
                                            src={img} 
                                            alt={`${product.title} thumbnail ${index + 1}`}
                                            className="w-full h-20 object-contain"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <p className="text-yellow-600 font-semibold tracking-wider uppercase text-sm">
                                {product.category}
                            </p>
                            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                                {product.title}
                            </h1>
                        </div>

                        <div className="py-4 border-y border-yellow-100">
                            {hasDiscount ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-4">
                                        <p className="text-3xl font-bold text-gray-400 line-through">
                                            ₹ {product.cost.toLocaleString()}
                                        </p>
                                        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold">
                                            Save ₹{(product.discount || 0).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600">
                                        ₹ {discountedPrice.toLocaleString()}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        You save {discountPercentage}% on this purchase!
                                    </p>
                                </div>
                            ) : (
                                <p className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-600">
                                    ₹ {product.cost.toLocaleString()}
                                </p>
                            )}
                        </div>

                        <p className="text-gray-600 leading-relaxed text-lg">
                            {product.description}
                        </p>

                        {product.model && product.model.length > 0 && (
                            <div className="relative overflow-hidden bg-gradient-to-br from-yellow-50 via-amber-50 to-yellow-100 rounded-2xl p-6 border-2 border-yellow-300 shadow-lg hover:shadow-xl transition-all duration-300">
                                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 via-amber-400/10 to-yellow-400/10 animate-pulse"></div>
                                
                                <div className="relative">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce"></span>
                                            <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
                                            <span className="w-2 h-2 bg-yellow-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                                        </div>
                                        <h3 className="text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-700 to-amber-700">
                                            🏎️ Perfect Fit For These Models
                                        </h3>
                                    </div>
                                    <div className="flex flex-wrap gap-2.5">
                                        {product.model.map((model, index) => (
                                            <span 
                                                key={index}
                                                className="group relative px-5 py-2.5 bg-white rounded-xl text-sm font-bold text-gray-800 border-2 border-yellow-300 shadow-md hover:shadow-xl hover:scale-105 hover:-translate-y-0.5 transition-all duration-300 cursor-default"
                                                style={{
                                                    animationDelay: `${index * 0.1}s`
                                                }}
                                            >
                                                <span className="relative z-10">{model}</span>
                                                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/0 via-yellow-400/20 to-yellow-400/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-700">Quantity</label>
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-12 h-12 rounded-xl bg-yellow-50 hover:bg-yellow-100 text-gray-700 font-bold transition-colors border border-yellow-200"
                                >
                                    -
                                </button>
                                <span className="text-2xl font-semibold text-gray-900 min-w-[3rem] text-center">
                                    {quantity}
                                </span>
                                <button 
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-12 h-12 rounded-xl bg-yellow-50 hover:bg-yellow-100 text-gray-700 font-bold transition-colors border border-yellow-200"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        <button 
                            onClick={handleAddToCart}
                            className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white font-bold py-5 px-8 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-3 text-lg"
                        >
                            <ShoppingCart className="w-6 h-6" />
                            Add to Cart - ₹{(discountedPrice * quantity).toLocaleString()}
                        </button>

                        {hasDiscount && (
                            <p className="text-center text-sm text-green-600 font-semibold">
                                🎉 Total savings: ₹{((product.discount || 0) * quantity).toLocaleString()} ({discountPercentage}% off)
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductPage;