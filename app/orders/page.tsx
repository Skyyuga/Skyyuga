"use client"

import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import React, { useState } from 'react';
import { ArrowLeft, Package, Calendar, CreditCard, Phone, Mail, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Id } from '@/convex/_generated/dataModel';

const OrderPage = () => {
    const router = useRouter();
    const { user } = useUser();
    const email = user?.primaryEmailAddress?.emailAddress;
    const AllUserOrders = useQuery(api.order.getOrdersByEmail, { email: email! });
    const DeleteAllOrders = useMutation(api.order.deleteAllOrders)
    console.log(AllUserOrders)
    const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

    if (!AllUserOrders) {
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50">

            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 left-20 w-96 h-96 bg-yellow-200/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-300/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8 lg:py-12">

                <div className="mb-8">
                    <button
                        onClick={() => router.push('/')}
                        className="flex items-center gap-2 text-gray-600 hover:text-yellow-600 transition-colors font-semibold mb-6"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Shop
                    </button>

                    
                    <div className="flex items-center gap-4 mb-2">
                        <Package className="w-10 h-10 text-yellow-600" />
                        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">My Orders</h1>
                    </div>
                    <p className="text-gray-600 text-lg ml-14">Track and manage all your orders</p>
                </div>

                {AllUserOrders.length === 0 ? (
                    <div className="backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-yellow-200/50 p-12 text-center">
                        <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Orders Yet</h2>
                        <p className="text-gray-600 mb-6">Start shopping to see your orders here!</p>
                        <button
                            onClick={() => router.push('/')}
                            className="bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white font-bold py-3 px-8 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                        >
                            Start Shopping
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">

                        <div className="hidden lg:block backdrop-blur-xl bg-white/70 rounded-3xl shadow-2xl border border-yellow-200/50 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gradient-to-r from-yellow-400 to-amber-500">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Order ID</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Items</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Total</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Payment</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-yellow-100">
                                        {AllUserOrders.map((order: any) => (
                                            <React.Fragment key={order._id}>
                                                <tr className="hover:bg-yellow-50/50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-mono font-semibold text-gray-900">
                                                            #{order._id}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <Calendar className="w-4 h-4" />
                                                            {new Date(order._creationTime).toLocaleDateString('en-IN', { 
                                                                day: '2-digit', 
                                                                month: 'short', 
                                                                year: 'numeric' 
                                                            })}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm text-gray-900 font-semibold">
                                                            {order.products.length} item(s)
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-600">
                                                            ₹{order.totalCost.toLocaleString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <CreditCard className="w-4 h-4" />
                                                            {order.paymentMethod}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-4 whitespace-nowrap ml-2">
                                                        <div className={`rounded-2xl text-center text-sm px-3 py-1 font-semibold ${
                                                            order.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                                                            order.status === "ACCEPTED" ? "bg-blue-100 text-blue-700" :
                                                            order.status === "DELIVERING" ? "bg-purple-100 text-purple-700" :
                                                            order.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                                                            "bg-red-100 text-red-700"
                                                        }`}>
                                                            {order.status}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <button
                                                            onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                                                            className="text-yellow-600 hover:text-yellow-700 font-semibold text-sm"
                                                        >
                                                            {expandedOrder === order._id ? 'Hide Details' : 'View Details'}
                                                        </button>
                                                    </td>
                                                </tr>
                                                {expandedOrder === order._id && (
                                                    <tr>
                                                        <td colSpan={7} className="px-6 py-6 bg-yellow-50/30">
                                                            <div className="space-y-4">
                                                                <div className="grid md:grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                                                            <Mail className="w-4 h-4 text-yellow-600" />
                                                                            Contact Information
                                                                        </h4>
                                                                        <p className="text-sm text-gray-600"><span className="font-semibold">Name:</span> {order.name}</p>
                                                                        <p className="text-sm text-gray-600"><span className="font-semibold">Email:</span> {order.email}</p>
                                                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                                                            <span className='font-semibold'>Phone:</span>
                                                                            {order.contactNumber}
                                                                        </p>
                                                                        <p className="text-sm text-gray-600 flex items-start gap-2">
                                                                            <span><span className="font-semibold">Address:</span> {order.address}</span>
                                                                        </p>
                                                                        <p className="text-sm text-gray-600 flex items-start gap-2">
                                                                            <span><span className="font-semibold">State:</span> {order.state}</span>
                                                                        </p>
                                                                        <p className="text-sm text-gray-600 flex items-start gap-2">
                                                                            <span><span className="font-semibold">PinCode:</span> {order.pincode}</span>
                                                                        </p>
                                                                        <p className="text-sm text-gray-600 flex items-start gap-2">
                                                                            <span><span className="font-semibold">Vehicle Number:</span> {order.vehicleNumber}</span>
                                                                        </p>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                                                            <CreditCard className="w-4 h-4 text-yellow-600" />
                                                                            Payment Details
                                                                        </h4>
                                                                        <p className="text-sm text-gray-600"><span className="font-semibold">Method:</span> {order.paymentMethod}</p>
                                                                        <p className="text-sm text-gray-600"><span className="font-semibold">Reference:</span> {order.referenceNumber}</p>
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                                                        <Package className="w-4 h-4 text-yellow-600" />
                                                                        Order Items
                                                                    </h4>
                                                                    <div className="grid gap-3">
                                                                        {order.products.map((product: any, idx: number) => (
                                                                            <ProductItem key={idx} productId={product.productId} quantity={product.quantity} />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="lg:hidden space-y-4">
                            {AllUserOrders.map((order: any) => (
                                <div key={order._id} className="backdrop-blur-xl bg-white/70 rounded-2xl shadow-xl border border-yellow-200/50 overflow-hidden">
                                    <div className="bg-gradient-to-r from-yellow-400 to-amber-500 p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <p className="text-xs font-semibold text-gray-900 uppercase mb-1">Order ID</p>
                                                <p className="font-mono font-bold text-gray-900 text-sm">#{order._id}</p>
                                            </div>
                                        </div>
                                        <div className={`inline-block rounded-2xl text-center text-xs px-3 py-1 font-semibold ${
                                            order.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                                            order.status === "ACCEPTED" ? "bg-blue-100 text-blue-700" :
                                            order.status === "DELIVERING" ? "bg-purple-100 text-purple-700" :
                                            order.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                                            "bg-red-100 text-red-700"
                                        }`}>
                                            {order.status}
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(order._creationTime).toLocaleDateString('en-IN', { 
                                                    day: '2-digit', 
                                                    month: 'short', 
                                                    year: 'numeric' 
                                                })}
                                            </div>
                                            <div className="text-sm text-gray-900 font-semibold">
                                                {order.products.length} item(s)
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between py-2 border-t border-yellow-100">
                                            <span className="text-gray-600 font-medium">Total Amount</span>
                                            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-600 to-amber-600">
                                                ₹{order.totalCost.toLocaleString()}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <CreditCard className="w-4 h-4" />
                                            <span>{order.paymentMethod}</span>
                                        </div>

                                        <button
                                            onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                                            className="w-full bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-all duration-300"
                                        >
                                            {expandedOrder === order._id ? 'Hide Details' : 'View Details'}
                                        </button>

                                        {expandedOrder === order._id && (
                                            <div className="mt-4 pt-4 border-t border-yellow-100 space-y-4">
                                                <div className="space-y-2">
                                                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                                        <Mail className="w-4 h-4 text-yellow-600" />
                                                        Contact Information
                                                    </h4>
                                                    <p className="text-sm text-gray-600"><span className="font-semibold">Name:</span> {order.name}</p>
                                                    <p className="text-sm text-gray-600"><span className="font-semibold">Email:</span> {order.email}</p>
                                                     <p className="text-sm text-gray-600"><span className="font-semibold">Phone:</span> {order.contactNumber}</p>
                                                    <p className="text-sm text-gray-600 flex items-start gap-2">
                                                        <span><span className="font-semibold">Address:</span> {order.address}</span>
                                                    </p>
                                                    <p className="text-sm text-gray-600 flex items-start gap-2">
                                                        <span><span className="font-semibold">State:</span> {order.state}</span>
                                                    </p>
                                                    <p className="text-sm text-gray-600 flex items-start gap-2">
                                                        <span><span className="font-semibold">PinCode:</span> {order.pincode}</span>
                                                    </p>
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                                        <CreditCard className="w-4 h-4 text-yellow-600" />
                                                        Payment Details
                                                    </h4>
                                                    <p className="text-sm text-gray-600"><span className="font-semibold">Method:</span> {order.paymentMethod}</p>
                                                    <p className="text-sm text-gray-600"><span className="font-semibold">Reference:</span> {order.referenceNumber}</p>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                                        <Package className="w-4 h-4 text-yellow-600" />
                                                        Order Items
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {order.products.map((product: any, idx: number) => (
                                                            <ProductItem key={idx} productId={product.productId} quantity={product.quantity} />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const ProductItem = ({ productId, quantity }: { productId: Id<"products">, quantity: number }) => {
    const product = useQuery(api.product.getProductById, { id : productId });

    if (!product) {
        return (
            <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-yellow-200">
                <div className="w-16 h-16 bg-gray-200 rounded-md animate-pulse"></div>
                <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                </div>
            </div>
        );
    }

    const firstImage = Array.isArray(product.imageUrl) ? product.imageUrl[0] : product.imageUrl;
    const truncatedTitle = product.title.length > 30 ? product.title.substring(0, 30) + '...' : product.title;
    const truncatedDescription = product.description.length > 40 ? product.description.substring(0, 40) + '...' : product.description;

    return (
        <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-yellow-200 hover:border-yellow-300 transition-colors">
            <img 
                src={firstImage} 
                alt={product.title}
                className="w-16 h-16 object-cover rounded-md flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
                <h5 className="font-semibold text-gray-900 text-sm" title={product.title}>{truncatedTitle}</h5>
                <p className="text-xs text-gray-600" title={product.description}>{truncatedDescription}</p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-medium">
                        {product.category}
                    </span>
                    <span className="text-xs text-gray-600">Qty: {quantity}</span>
                </div>
            </div>
            <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-yellow-600">₹{product.cost}</p>
                <p className="text-xs text-gray-500">Total: ₹{product.cost * quantity}</p>
            </div>
        </div>
    );
};

export default OrderPage;