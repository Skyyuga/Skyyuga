"use client";
import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import {
  Users,
  Package,
  ShoppingBag,
  Plus,
  X,
  Search,
  Pencil,
  Mail,
  Phone,
  Calendar,
  Check,
  Trash2,
  MoveLeft,
  Car,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { UploadButton } from "@/lib/uploadthing";
import { useRouter } from "next/navigation";
import { deleteUploadthingFile } from "../actions/deleteImages";

type OrderStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "DELIVERING"
  | "DELIVERED";

const AdminPage = () => {
  const { user } = useUser();
  const email = user?.emailAddresses[0]?.emailAddress!;
  const router = useRouter();

  const allUsers = useQuery(api.user.getAllUsers, { email });
  const allOrders = useQuery(api.order.getAllOrders, { email });
  const productData = useQuery(api.product.getAllProducts);
  const allProducts = productData?.products;
  const allCategories = productData?.allCategories || [];

  const createProduct = useMutation(api.product.createProducts);
  const updateOrderStatus = useMutation(api.order.updateOrderStatus);
  const updateProduct = useMutation(api.product.updateProduct);
  const deleteProduct = useMutation(api.product.deleteProduct);

  const [activeTab, setActiveTab] = useState("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [addProductModal, setAddProductModal] = useState(false);
  const [editProductModal, setEditProductModal] = useState(false);
  const [editOrderModal, setEditOrderModal] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Id<"products"> | null>(
    null
  );
  const product = useQuery(
    api.product.getProductById,
    productToDelete ? { id: productToDelete } : "skip"
  );

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newProduct, setNewProduct] = useState({
    title: "",
    description: "",
    imageUrl: [] as string[],
    cost: "",
    category: "",
    size: "",
    models: [] as string[],
    gst: "5",
    discount: "",
  });
  const [currentModel, setCurrentModel] = useState("");
  const [currentEditModel, setCurrentEditModel] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isEditUploading, setIsEditUploading] = useState(false);

  const [statusFilters, setStatusFilters] = useState<Set<OrderStatus>>(
    new Set(["PENDING", "ACCEPTED", "REJECTED", "DELIVERING", "DELIVERED"])
  );
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setShowStatusFilter(false);
      }
    };

    if (showStatusFilter) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showStatusFilter]);

  if (!allUsers || !allOrders || !allProducts) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
            Loading Admin Panel...
          </p>
        </div>
      </div>
    );
  }

  if ("error" in allUsers) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-50 flex items-center justify-center p-4">
        <div className="text-red-500 text-lg sm:text-xl text-center">
          ❌ {allUsers.error}
        </div>
      </div>
    );
  }
  if ("error" in allOrders) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-50 flex items-center justify-center p-4">
        <div className="text-red-500 text-lg sm:text-xl text-center">
          ❌ {allOrders.error}
        </div>
      </div>
    );
  }

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newProduct.imageUrl.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    const costValue = Number(newProduct.cost);
    if (!newProduct.cost || costValue < 1) {
      toast.error("Product cost must be at least ₹1");
      return;
    }

    const discountValue = Number(newProduct.discount);
    if (!newProduct.discount || discountValue < 1) {
      toast.error("Min Discount should be ₹0");
    }

    if (discountValue > costValue) {
      toast.error("Discount should be smaller than original cost");
    }

    try {
      const productData = {
        title: newProduct.title,
        description: newProduct.description,
        imageUrl: newProduct.imageUrl,
        cost: costValue,
        category: newProduct.category,
        gstRate: newProduct.gst as "5" | "18" | "40",
        discount: discountValue,
        size: newProduct.size,
        model: newProduct.models,
      };
      await createProduct(productData);
      toast.success("Product created successfully!");
      setAddProductModal(false);
      setNewProduct({
        title: "",
        description: "",
        imageUrl: [],
        cost: "",
        category: "",
        size: "",
        models: [],
        gst: "5",
        discount: "",
      });
      setCurrentModel("");
      setNewCategory("");
    } catch (err) {
      toast.error("Failed to create product.");
    }
  };

  const calculateDiscountedPrice = (cost: number, discount: number) => {
    return cost - discount;
  };

  const calculateDiscountPercentage = (cost: number, discount: number) => {
    if (cost === 0) return 0;
    return Math.round((discount / cost) * 100);
  };

  const addModel = () => {
    if (
      currentModel.trim() &&
      !newProduct.models.includes(currentModel.trim())
    ) {
      setNewProduct({
        ...newProduct,
        models: [...newProduct.models, currentModel.trim()],
      });
      setCurrentModel("");
    }
  };

  const removeModel = (modelToRemove: string) => {
    setNewProduct({
      ...newProduct,
      models: newProduct.models.filter((m) => m !== modelToRemove),
    });
  };

  const addModelEdit = () => {
    if (
      currentEditModel.trim() &&
      !selectedProduct.model?.includes(currentEditModel.trim())
    ) {
      setSelectedProduct({
        ...selectedProduct,
        model: [
          ...(selectedProduct.model || []),
          currentEditModel.trim(),
        ],
      });
      setCurrentEditModel("");
    }
  };

  const removeModelEdit = (modelToRemove: string) => {
    setSelectedProduct({
      ...selectedProduct,
      model: (selectedProduct.model || []).filter(
        (m: string) => m !== modelToRemove
      ),
    });
  };

  const removeImage = (index: number) => {
    setNewProduct({
      ...newProduct,
      imageUrl: newProduct.imageUrl.filter((_, i) => i !== index),
    });
  };

  const removeEditImage = (index: number) => {
    setSelectedProduct({
      ...selectedProduct,
      imageUrl: selectedProduct.imageUrl.filter(
        (_: string, i: number) => i !== index
      ),
    });
  };

  const handleProductUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (selectedProduct.imageUrl.length === 0) {
      toast.error("Please upload at least one image");
      return;
    }

    const costValue = Number(selectedProduct.cost);
    if (!selectedProduct.cost || costValue < 1) {
      toast.error("Product cost must be at least ₹1");
      return;
    }

    const discountValue = Number(selectedProduct.discount);
    if (!discountValue) {
      toast.error("Min discount must be ₹0");
    }
    try {
      const updateData = {
        productId: selectedProduct._id,
        title: selectedProduct.title,
        description: selectedProduct.description,
        imageUrl: selectedProduct.imageUrl,
        cost: costValue,
        gstRate: selectedProduct.GSTRate,
        discount: discountValue,
        category: selectedProduct.category,
        size: selectedProduct.size || "",
        model: selectedProduct.model || [],
      };
      await updateProduct(updateData);
      toast.success("Product updated successfully!");
      setEditProductModal(false);
      setSelectedProduct(null);
      setCurrentEditModel("");
    } catch (err) {
      toast.error("Failed to update product.");
    }
  };

  const handleOrderStatusUpdate = async (newStatus: OrderStatus) => {
    if (!selectedOrder) return;

    try {
      await updateOrderStatus({
        orderId: selectedOrder._id,
        status: newStatus,
      });
      toast.success("Order status updated successfully!");
      setEditOrderModal(false);
      setSelectedOrder(null);
    } catch (err) {
      toast.error("Failed to update order status.");
    }
  };

  const handleProductDelete = async (productId: Id<"products">) => {
    setProductToDelete(productId);
    setDeleteConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete || !product) return;
    setIsDeleting(true);
    try {
      const fileKeys =
        product.imageUrl
          ?.map((url) => url.split("/").pop())
          .filter(
            (key): key is string => typeof key === "string" && key.length > 0
          ) ?? [];

      await deleteProduct({ productId: productToDelete });

      if (fileKeys.length > 0) {
        await deleteUploadthingFile(fileKeys);
      }

      toast.success("Product deleted successfully!");
      setDeleteConfirmModal(false);
      setProductToDelete(null);
    } catch (err) {
      console.error("Error deleting product:", err);
      toast.error("Failed to delete product.");
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleStatusFilter = (status: OrderStatus) => {
    const newFilters = new Set(statusFilters);
    if (newFilters.has(status)) {
      newFilters.delete(status);
    } else {
      newFilters.add(status);
    }
    setStatusFilters(newFilters);
  };

  const tabs = [
    { id: "users", label: "Users", icon: Users, count: allUsers.length },
    {
      id: "orders",
      label: "Orders",
      icon: ShoppingBag,
      count: allOrders.length,
    },
    {
      id: "products",
      label: "Products",
      icon: Package,
      count: allProducts.length,
    },
  ];

  const orderStatuses: OrderStatus[] = [
    "PENDING",
    "ACCEPTED",
    "REJECTED",
    "DELIVERING",
    "DELIVERED",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-yellow-50 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 sm:w-96 sm:h-96 bg-yellow-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div
          className="absolute bottom-20 right-20 w-64 h-64 sm:w-96 sm:h-96 bg-yellow-300/20 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        ></div>
      </div>

      <header className="relative z-10 backdrop-blur-xl bg-white/80 border-b border-yellow-200 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-5 md:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Manage your store with ease
              </p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <div className="flex items-center space-x-2 bg-yellow-50 border-2 border-yellow-200 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 w-full sm:w-auto justify-center">
                <span className="text-gray-600 font-medium text-sm sm:text-base">
                  Welcome,
                </span>
                <span className="font-bold text-gray-900 text-sm sm:text-base">
                  {user?.firstName}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-4 md:px-6 mt-4 sm:mt-6 md:mt-8">
        <button
          className="flex bg-yellow-400 p-2 rounded-2xl transition-all duration-300 transform hover:scale-105 gap-x-3 font-semibold mb-7"
          onClick={() => router.push("/")}
        >
          <MoveLeft />
          Back
        </button>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6 md:mb-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center sm:justify-start space-x-2 sm:space-x-3 px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4 rounded-xl sm:rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 w-full sm:w-auto ${
                  activeTab === tab.id
                    ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 shadow-xl shadow-yellow-500/50"
                    : "bg-white text-gray-600 border-2 border-yellow-200 hover:border-yellow-400"
                }`}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="text-base sm:text-lg">{tab.label}</span>
                <span
                  className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-bold ${
                    activeTab === tab.id
                      ? "bg-white text-gray-900"
                      : "bg-yellow-100 text-yellow-600"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mb-4 sm:mb-6 md:mb-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 md:py-4 rounded-xl sm:rounded-2xl border-2 border-yellow-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-500/20 transition-all bg-white text-sm sm:text-base"
            />
          </div>

          {activeTab === "orders" && (
            <div className="relative w-full sm:w-auto" ref={filterRef}>
              <button
                onClick={() => setShowStatusFilter(!showStatusFilter)}
                className="flex items-center justify-center space-x-2 bg-white border-2 border-yellow-200 text-gray-900 px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4 rounded-xl sm:rounded-2xl hover:border-yellow-400 transition-all duration-300 font-bold w-full sm:w-auto text-sm sm:text-base"
              >
                <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Filter Status ({statusFilters.size})</span>
              </button>

              {showStatusFilter && (
                <div className="absolute top-full mt-2 left-0 right-0 sm:left-auto sm:right-0 sm:w-[200px] bg-white border-2 border-yellow-200 rounded-xl sm:rounded-2xl shadow-2xl p-3 sm:p-4 z-50">
                  <p className="text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3">
                    Order Status
                  </p>
                  {orderStatuses.map((status) => (
                    <label
                      key={status}
                      className="flex items-center space-x-2 sm:space-x-3 py-1.5 sm:py-2 cursor-pointer hover:bg-yellow-50 rounded-lg px-2 transition-colors group"
                    >
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={statusFilters.has(status)}
                          onChange={() => toggleStatusFilter(status)}
                          className="appearance-none w-4 h-4 sm:w-5 sm:h-5 border-2 border-yellow-300 rounded checked:bg-gradient-to-r checked:from-yellow-400 checked:to-yellow-500 checked:border-yellow-500 focus:ring-2 focus:ring-yellow-500/50 transition-all cursor-pointer"
                        />
                        {statusFilters.has(status) && (
                          <Check
                            className="w-3 h-3 sm:w-4 sm:h-4 text-gray-900 absolute top-0.5 left-0.5 pointer-events-none font-bold"
                            strokeWidth={3}
                          />
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-gray-900">
                        {status}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "products" && (
            <button
              onClick={() => setAddProductModal(true)}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 px-4 sm:px-5 md:px-6 py-3 sm:py-3.5 md:py-4 rounded-xl sm:rounded-2xl hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-yellow-500/50 transform hover:scale-105 font-bold w-full sm:w-auto text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Add Product</span>
            </button>
          )}
        </div>

        <div className="relative z-10 pb-6 sm:pb-8 md:pb-12">
          {activeTab === "users" && (
            <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {allUsers
                .filter(
                  (u) =>
                    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    u._id?.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((u) => (
                  <div
                    key={u._id}
                    className="group bg-white border-2 border-yellow-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300 transform hover:scale-105"
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Users className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-900" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg sm:text-xl text-gray-900 truncate">
                          {u.name || "—"}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500 truncate">
                          User ID: {u._id}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="text-xs sm:text-sm truncate">
                          {u.email || "—"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">
                          {u.phone || "—"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">
                          {u.vehicleNumber || "—"}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span className="text-xs sm:text-sm">
                          {new Date(u._creationTime).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              {allOrders
                .filter((o) => {
                  if (!statusFilters.has(o.status as OrderStatus)) return false;

                  return (
                    o.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    o.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    o.contactNumber
                      ?.toLowerCase()
                      .includes(searchTerm.toLowerCase()) ||
                    o._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    o.status?.toLowerCase().includes(searchTerm.toLowerCase())
                  );
                })
                .map((order) => {
                  const orderProducts = order.products.map((p) => {
                    const product = allProducts.find(
                      (prod) => prod._id === p.productId
                    );
                    return {
                      ...p,
                      productDetails: product,
                    };
                  });

                  return (
                    <div
                      key={order._id}
                      className="bg-white border-2 border-yellow-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300"
                    >
                      <div className="flex flex-col sm:flex-row items-start justify-between mb-3 sm:mb-4 gap-3 sm:gap-4">
                        <div className="w-full sm:w-auto">
                          <h3 className="font-bold text-lg sm:text-xl md:text-2xl text-gray-900 mb-1 break-all">
                            Order #{order._id}
                          </h3>
                          <p className="text-gray-600 text-sm sm:text-base">
                            {order.name || "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                          <span
                            className={`px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full text-xs sm:text-sm font-semibold sm:font-bold flex-1 sm:flex-initial text-center ${
                              order.status === "PENDING"
                                ? "bg-yellow-100 text-yellow-600"
                                : order.status === "ACCEPTED"
                                  ? "bg-blue-100 text-blue-600"
                                  : order.status === "DELIVERING"
                                    ? "bg-purple-100 text-purple-600"
                                    : order.status === "DELIVERED"
                                      ? "bg-green-100 text-green-600"
                                      : "bg-red-100 text-red-600"
                            }`}
                          >
                            {order.status || "—"}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setEditOrderModal(true);
                            }}
                            className="p-2 bg-yellow-100 hover:bg-yellow-200 rounded-full transition-colors flex-shrink-0"
                            title="Edit Status"
                          >
                            <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-900" />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-3 sm:mb-4">
                        <div className="bg-yellow-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                          <p className="text-xs text-gray-600 mb-1">Email</p>
                          <p className="font-semibold text-gray-900 text-xs sm:text-sm break-all">
                            {order.email || "—"}
                          </p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                          <p className="text-xs text-gray-600 mb-1">Contact</p>
                          <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                            {order.contactNumber || "—"}
                          </p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                          <p className="text-xs text-gray-600 mb-1">
                            Payment Method
                          </p>
                          <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                            {order.paymentMethod || "—"}
                          </p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                          <p className="text-xs text-gray-600 mb-1">
                            Reference Number
                          </p>
                          <p className="font-semibold text-gray-900 text-xs sm:text-sm break-all">
                            {order.referenceNumber || "—"}
                          </p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg sm:rounded-xl p-3 sm:p-4 sm:col-span-2 lg:col-span-2">
                          <p className="text-xs text-gray-600 mb-1">Address</p>
                          <p className="font-semibold text-gray-900 text-xs sm:text-sm">
                            {order.address || "—"}
                          </p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                          <p className="text-xs text-gray-600 mb-1">State</p>
                          <p className="font-semibold text-gray-900 text-xs sm:text-sm break-all">
                            {order.state || "—"}
                          </p>
                        </div>
                        <div className="bg-yellow-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                          <p className="text-xs text-gray-600 mb-1">PinCode</p>
                          <p className="font-semibold text-gray-900 text-xs sm:text-sm break-all">
                            {order.pincode || "—"}
                          </p>
                        </div>
                      </div>

                      <div className="border-t-2 border-yellow-100 pt-3 sm:pt-4 mb-3 sm:mb-4">
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 font-semibold">
                          Products Ordered:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          {orderProducts.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center space-x-2 sm:space-x-3 bg-yellow-50 rounded-lg sm:rounded-xl p-2 sm:p-3 border border-yellow-200"
                            >
                              {item.productDetails ? (
                                <>
                                  <img
                                    src={
                                      Array.isArray(
                                        item.productDetails.imageUrl
                                      )
                                        ? item.productDetails.imageUrl[0]
                                        : item.productDetails.imageUrl
                                    }
                                    alt={item.productDetails.title}
                                    className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 object-cover rounded-lg flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                                      {item.productDetails.title}
                                    </p>
                                    <p className="text-yellow-600 font-semibold text-xs sm:text-sm">
                                      ₹{item.productDetails.cost} ×{" "}
                                      {item.quantity}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Total: ₹
                                      {item.productDetails.cost * item.quantity}
                                    </p>
                                  </div>
                                </>
                              ) : (
                                <div className="flex-1">
                                  <p className="text-gray-600 text-xs sm:text-sm break-all">
                                    Product ID: {item.productId}
                                  </p>
                                  <p className="text-xs sm:text-sm">
                                    Quantity: {item.quantity}
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="border-t-2 border-yellow-100 pt-3 sm:pt-4 text-right">
                        <p className="text-xs sm:text-sm text-gray-600">
                          Total Cost
                        </p>
                        <p className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                          ₹{order.totalCost || "—"}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {activeTab === "products" && (
            <div className="grid gap-4 sm:gap-5 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {allProducts
                .filter(
                  (p) =>
                    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.category.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map((product) => {
                  const firstImage = Array.isArray(product.imageUrl)
                    ? product.imageUrl[0]
                    : product.imageUrl;
                  const imageCount = Array.isArray(product.imageUrl)
                    ? product.imageUrl.length
                    : 1;
                  const discountedPrice = calculateDiscountedPrice(
                    product.cost,
                    product.discount || 0
                  );
                  const discountPercentage = calculateDiscountPercentage(
                    product.cost,
                    product.discount || 0
                  );
                  const hasDiscount = (product.discount || 0) > 0;

                  return (
                    <div
                      key={product._id}
                      className="group bg-white border-2 border-yellow-200 rounded-xl sm:rounded-2xl overflow-hidden hover:border-yellow-400 hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300 transform hover:scale-105"
                    >
                      <div className="relative h-40 sm:h-44 md:h-48 overflow-hidden">
                        <img
                          src={firstImage}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4 flex flex-wrap gap-1 sm:gap-2">
                          <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                            {product.category}
                          </span>
                          {imageCount > 1 && (
                            <span className="bg-white/90 text-gray-900 text-xs font-bold px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                              {imageCount} photos
                            </span>
                          )}
                        </div>
                        <div className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 flex gap-1.5 sm:gap-2">
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setEditProductModal(true);
                            }}
                            className="p-1.5 sm:p-2 bg-white hover:bg-yellow-100 rounded-full transition-colors shadow-lg"
                            title="Edit Product"
                          >
                            <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-900" />
                          </button>
                          <button
                            onClick={() => handleProductDelete(product._id)}
                            className="p-1.5 sm:p-2 bg-white hover:bg-red-100 rounded-full transition-colors shadow-lg"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                      <div className="p-4 sm:p-5 md:p-6 space-y-2 sm:space-y-3">
                        <h4 className="font-bold text-lg sm:text-xl text-gray-900 line-clamp-1">
                          {product.title}
                        </h4>
                        <p className="text-gray-600 text-xs sm:text-sm line-clamp-2">
                          {product.description}
                        </p>
                        {product.category  && product.size && (
                          <div className="pt-2 border-t border-yellow-100">
                            <p className="text-xs text-gray-600">
                              Size:{" "}
                              <span className="font-semibold text-gray-900">
                                {product.size}
                              </span>
                            </p>
                            {product.model &&
                              product.model.length > 0 && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                                  Models:{" "}
                                  <span className="font-semibold text-gray-900">
                                    {product.model.join(", ")}
                                  </span>
                                </p>
                              )}
                          </div>
                        )}
                        <div className="pt-2 sm:pt-3 border-t border-yellow-100">
                          {hasDiscount ? (
                            <>
                              <p className="text-lg font-semibold text-gray-400 line-through">
                                ₹{product.cost}
                              </p>
                              <p className="text-3xl font-black bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                                ₹{discountedPrice}
                              </p>
                              <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                                {discountPercentage}% OFF
                              </span>
                            </>
                          ) : (
                            <p className="text-3xl font-black bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                              ₹{product.cost}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {addProductModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4 sm:p-5 md:p-6 flex-shrink-0 rounded-t-2xl sm:rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Plus className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-900" />
                  <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">
                    Add New Product
                  </h2>
                </div>
                <button
                  onClick={() => setAddProductModal(false)}
                  className="text-gray-900 hover:bg-white/20 rounded-full p-1.5 sm:p-2 transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
            <form
              onSubmit={handleProductSubmit}
              className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
                    Product Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newProduct.title}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, title: e.target.value })
                    }
                    className="w-full p-2 sm:p-2.5 border-2 border-yellow-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-400 transition-all text-sm"
                    placeholder="Enter product title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>

                  <select
                    value={isCustomCategory ? "Other" : newProduct.category}
                    onChange={(e) => {
                      if (e.target.value === "Other") {
                        setIsCustomCategory(true);
                        setNewProduct({ ...newProduct, category: "" });
                      } else {
                        setIsCustomCategory(false);
                        setNewProduct({
                          ...newProduct,
                          category: e.target.value,
                        });
                      }
                    }}
                    className="w-full p-2 sm:p-2.5 border-2 border-yellow-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-400 transition-all text-sm"
                    required
                  >
                    <option value="">Select Category</option>

                    {/* 👇 Dynamically render all categories */}
                    {allCategories.map((category) => (
                      <option
                        key={category as string}
                        value={category as string}
                      >
                        {category as string}
                      </option>
                    ))}

                    {/* 👇 Extra option to add new */}
                    <option value="Other">➕ Add New Category</option>
                  </select>

                  {/* 👇 Input shows only if "Add New" selected */}
                  {isCustomCategory && (
                    <input
                      type="text"
                      placeholder="Enter new category name"
                      value={newCategory}
                      onChange={(e) => {
                        setNewCategory(e.target.value);
                        setNewProduct({
                          ...newProduct,
                          category: e.target.value,
                        });
                      }}
                      className="w-full mt-2 p-2 sm:p-2.5 border-2 border-yellow-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-400 transition-all text-sm"
                    />
                  )}
                </div>
              </div>

              {newProduct.category && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 bg-yellow-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-yellow-200">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
                      Size <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newProduct.size}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, size: e.target.value })
                      }
                      className="w-full p-2 sm:p-2.5 border-2 border-yellow-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-400 transition-all text-sm"
                      placeholder="e.g., 195/65R15"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
                      Compatible Models <span className="text-red-500">*</span>
                    </label>
                    {newProduct.models.length > 0 && (
                      <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-1.5 sm:mb-2 p-1.5 sm:p-2 bg-white border-2 border-yellow-200 rounded-lg sm:rounded-xl max-h-16 sm:max-h-20 overflow-y-auto">
                        {newProduct.models.map((model, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 sm:gap-1.5 bg-yellow-200 text-gray-900 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs font-medium border border-yellow-300"
                          >
                            {model}
                            <button
                              type="button"
                              onClick={() => removeModel(model)}
                              className="hover:bg-yellow-300 rounded-full p-0.5 transition-colors"
                            >
                              <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-1.5 sm:gap-2">
                      <input
                        type="text"
                        value={currentModel}
                        onChange={(e) => setCurrentModel(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addModel();
                          }
                        }}
                        className="flex-1 p-2 sm:p-2.5 border-2 border-yellow-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-400 transition-all text-sm"
                        placeholder="e.g., MERC BENZ"
                      />
                      <button
                        type="button"
                        onClick={addModel}
                        className="px-2 sm:px-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg sm:rounded-xl transition-all font-bold flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm"
                      >
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Add
                      </button>
                    </div>
                    {newProduct.models.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">
                        * At least one model required
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      description: e.target.value,
                    })
                  }
                  className="w-full p-2 sm:p-2.5 border-2 border-yellow-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-400 transition-all resize-none text-sm"
                  rows={2}
                  placeholder="Enter product description"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
                  Cost (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={newProduct.cost}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    if (value >= 0) {
                      setNewProduct({ ...newProduct, cost: e.target.value });
                      // Reset discount if it exceeds new cost
                      if (
                        newProduct.discount &&
                        parseFloat(newProduct.discount) > value
                      ) {
                        setNewProduct({
                          ...newProduct,
                          cost: e.target.value,
                          discount: "",
                        });
                      }
                    }
                  }}
                  className="w-full p-2 sm:p-2.5 border-2 border-yellow-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-400 transition-all text-sm"
                  placeholder="Enter product cost"
                  required
                  min="1"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum cost: ₹1</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
                    GST <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newProduct.gst}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, gst: e.target.value })
                    }
                    className="w-full p-2 sm:p-2.5 border-2 border-yellow-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-400 transition-all text-sm"
                    required
                  >
                    <option value="5">5%</option>
                    <option value="18">18%</option>
                    <option value="40">40%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
                    Discount (₹)
                  </label>
                  <input
                    type="number"
                    value={newProduct.discount}
                    onChange={(e) => {
                      const discountValue = parseFloat(e.target.value) || 0;
                      const costValue = parseFloat(newProduct.cost) || 0;

                      // Allow only non-negative values and discount <= cost
                      if (discountValue >= 0 && discountValue <= costValue) {
                        setNewProduct({
                          ...newProduct,
                          discount: e.target.value,
                        });
                      }
                    }}
                    className="w-full p-2 sm:p-2.5 border-2 border-yellow-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-400 transition-all text-sm"
                    placeholder="Enter discount amount"
                    min="0"
                    step="0.01"
                  />
                  {newProduct.discount &&
                    parseFloat(newProduct.discount) >
                      parseFloat(newProduct.cost || "0") && (
                      <p className="text-xs text-red-500 mt-1">
                        Discount cannot exceed cost
                      </p>
                    )}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
                  Product Images <span className="text-red-500">*</span>
                </label>
                {newProduct.imageUrl.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-2 sm:mb-3">
                    {newProduct.imageUrl.map((img, index) => (
                      <div
                        key={index}
                        className="relative h-20 sm:h-24 w-full group"
                      >
                        <img
                          src={img}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg sm:rounded-xl border-2 border-yellow-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-0.5 sm:top-1 right-0.5 sm:right-1 p-0.5 sm:p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </button>
                        {index === 0 && (
                          <div className="absolute bottom-0.5 sm:bottom-1 left-0.5 sm:left-1 bg-yellow-400 text-gray-900 text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded">
                            Main
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="w-full flex justify-center items-center border-2 border-dashed border-yellow-300 rounded-lg sm:rounded-xl p-3 bg-yellow-50 hover:bg-yellow-100 transition-colors">
                  <div className="text-center">
                    <UploadButton
                      endpoint="imageUploader"
                      appearance={{
                        button:
                          "bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold px-3 sm:px-4 text-xs py-1.5 sm:py-2 rounded-lg sm:rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all ut-ready:bg-gradient-to-r ut-ready:from-yellow-400 ut-ready:to-yellow-500 ut-uploading:cursor-not-allowed ut-uploading:opacity-50",
                        container:
                          "w-full flex flex-col items-center justify-center gap-1",
                        allowedContent: "text-gray-600 text-xs",
                      }}
                      onClientUploadComplete={(res) => {
                        if (res && res[0]) {
                          setNewProduct({
                            ...newProduct,
                            imageUrl: [...newProduct.imageUrl, res[0].url],
                          });
                          toast.success("Image uploaded successfully!");
                        }
                        setIsUploading(false);
                      }}
                      onUploadBegin={() => {
                        setIsUploading(true);
                      }}
                      onUploadError={(error) => {
                        toast.error("Upload failed!");
                        setIsUploading(false);
                      }}
                    />
                    {isUploading && (
                      <p className="text-xs text-yellow-600 font-medium mt-2">
                        Uploading...
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {newProduct.imageUrl.length === 0
                        ? "Upload at least 1 image"
                        : "Upload more images"}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  isUploading ||
                  newProduct.imageUrl.length === 0 ||
                  !newProduct.cost ||
                  Number(newProduct.cost) < 1 ||
                  newProduct.models.length === 0
                }
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-yellow-500/50 font-bold text-sm sm:text-base transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? "Uploading Image..." : "Create Product"}
              </button>
            </form>
          </div>
        </div>
      )}

      {editProductModal && selectedProduct && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-fade-in">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4 sm:p-5 md:p-6 flex-shrink-0 rounded-t-2xl sm:rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Pencil className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-900" />
                  <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900">
                    Edit Product
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setEditProductModal(false);
                    setSelectedProduct(null);
                    setCurrentEditModel("");
                  }}
                  className="text-gray-900 hover:bg-white/20 rounded-full p-1.5 sm:p-2 transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>
            <form
              onSubmit={handleProductUpdate}
              className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4 overflow-y-auto flex-1"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
                    Product Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={selectedProduct.title}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        title: e.target.value,
                      })
                    }
                    className="w-full p-2 sm:p-2.5 border-2 border-yellow-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-400 transition-all text-sm"
                    placeholder="Enter product title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>

                  <select
                    value={selectedProduct.category}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        category: e.target.value,
                      })
                    }
                    className="w-full p-2 sm:p-2.5 border-2 border-yellow-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-400 transition-all text-sm"
                    required
                  >
                    <option value="">Select Category</option>

                    {/* 👇 Dynamically render all categories */}
                    {allCategories?.map((category) => (
                      <option
                        key={category as string}
                        value={category as string}
                      >
                        {category as string}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedProduct.category  && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 bg-yellow-50 p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-yellow-200">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
                      Size <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={selectedProduct.size || ""}
                      onChange={(e) =>
                        setSelectedProduct({
                          ...selectedProduct,
                          size: e.target.value,
                        })
                      }
                      className="w-full p-2 sm:p-2.5 border-2 border-yellow-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-400 transition-all text-sm"
                      placeholder="e.g., 195/65R15"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
                      Compatible Models <span className="text-red-500">*</span>
                    </label>

                    {selectedProduct.model &&
                      selectedProduct.model.length > 0 && (
                        <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-1.5 sm:mb-2 p-1.5 sm:p-2 bg-white border-2 border-yellow-200 rounded-lg sm:rounded-xl max-h-16 sm:max-h-20 overflow-y-auto">
                          {selectedProduct.model.map(
                            (model: string, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 sm:gap-1.5 bg-yellow-200 text-gray-900 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-xs font-medium border border-yellow-300"
                              >
                                {model}
                                <button
                                  type="button"
                                  onClick={() => removeModelEdit(model)}
                                  className="hover:bg-yellow-300 rounded-full p-0.5 transition-colors"
                                >
                                  <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                </button>
                              </span>
                            )
                          )}
                        </div>
                      )}
                    <div className="flex gap-1.5 sm:gap-2">
                      <input
                        type="text"
                        value={currentEditModel}
                        onChange={(e) => setCurrentEditModel(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addModelEdit();
                          }
                        }}
                        className="flex-1 p-2 sm:p-2.5 border-2 border-yellow-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-400 transition-all text-sm"
                        placeholder="e.g., MERC BENZ"
                      />
                      <button
                        type="button"
                        onClick={addModelEdit}
                        className="px-2 sm:px-3 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg sm:rounded-xl transition-all font-bold flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm"
                      >
                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        Add
                      </button>
                    </div>
                    {(!selectedProduct.model ||
                      selectedProduct.model.length === 0) && (
                      <p className="text-xs text-red-500 mt-1">
                        * At least one model required
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={selectedProduct.description}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      description: e.target.value,
                    })
                  }
                  className="w-full p-2 sm:p-2.5 border-2 border-yellow-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-400 transition-all resize-none text-sm"
                  rows={2}
                  placeholder="Enter product description"
                  required
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
                  Cost (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={selectedProduct.cost}
                  onChange={(e) =>
                    setSelectedProduct({
                      ...selectedProduct,
                      cost: e.target.value,
                    })
                  }
                  className="w-full p-2 sm:p-2.5 border-2 border-yellow-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-400 transition-all text-sm"
                  placeholder="Enter product cost"
                  required
                  min="1"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum cost: ₹1</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
                    GST <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedProduct.GSTRate || "18"}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        GSTRate: e.target.value,
                      })
                    }
                    className="w-full p-2 sm:p-2.5 border-2 border-yellow-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-400 transition-all text-sm"
                    required
                  >
                    <option value="5">5%</option>
                    <option value="18">18%</option>
                    <option value="40">40%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
                    Discount (₹)
                  </label>
                  <input
                    type="number"
                    value={selectedProduct.discount || 0}
                    onChange={(e) =>
                      setSelectedProduct({
                        ...selectedProduct,
                        discount: e.target.value,
                      })
                    }
                    className="w-full p-2 sm:p-2.5 border-2 border-yellow-200 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-yellow-500/20 focus:border-yellow-400 transition-all text-sm"
                    placeholder="Enter discount amount"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5 sm:mb-2">
                  Product Images <span className="text-red-500">*</span>
                </label>

                {selectedProduct.imageUrl &&
                  selectedProduct.imageUrl.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-2 sm:mb-3">
                      {selectedProduct.imageUrl.map(
                        (img: string, index: number) => (
                          <div
                            key={index}
                            className="relative h-20 sm:h-24 w-full group"
                          >
                            <img
                              src={img}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-full object-cover rounded-lg sm:rounded-xl border-2 border-yellow-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeEditImage(index)}
                              className="absolute top-0.5 sm:top-1 right-0.5 sm:right-1 p-0.5 sm:p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </button>
                            {index === 0 && (
                              <div className="absolute bottom-0.5 sm:bottom-1 left-0.5 sm:left-1 bg-yellow-400 text-gray-900 text-xs font-bold px-1.5 sm:px-2 py-0.5 rounded">
                                Main
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  )}

                <div className="w-full flex justify-center items-center border-2 border-dashed border-yellow-300 rounded-lg sm:rounded-xl p-3 bg-yellow-50 hover:bg-yellow-100 transition-colors">
                  <div className="text-center">
                    <UploadButton
                      endpoint="imageUploader"
                      appearance={{
                        button:
                          "bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold px-3 sm:px-4 text-xs py-1.5 sm:py-2 rounded-lg sm:rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all ut-ready:bg-gradient-to-r ut-ready:from-yellow-400 ut-ready:to-yellow-500 ut-uploading:cursor-not-allowed ut-uploading:opacity-50",
                        container:
                          "w-full flex flex-col items-center justify-center gap-1",
                        allowedContent: "text-gray-600 text-xs",
                      }}
                      onClientUploadComplete={(res) => {
                        if (res && res[0]) {
                          const currentImages = Array.isArray(
                            selectedProduct.imageUrl
                          )
                            ? selectedProduct.imageUrl
                            : [selectedProduct.imageUrl];
                          setSelectedProduct({
                            ...selectedProduct,
                            imageUrl: [...currentImages, res[0].url],
                          });
                          toast.success("Image uploaded successfully!");
                        }
                        setIsEditUploading(false);
                      }}
                      onUploadBegin={() => {
                        setIsEditUploading(true);
                      }}
                      onUploadError={(error) => {
                        toast.error("Upload failed!");
                        setIsEditUploading(false);
                      }}
                    />
                    {isEditUploading && (
                      <p className="text-xs text-yellow-600 font-medium mt-2">
                        Uploading...
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Upload more images
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={
                  isEditUploading ||
                  !selectedProduct.imageUrl ||
                  selectedProduct.imageUrl.length === 0 ||
                  !selectedProduct.cost ||
                  Number(selectedProduct.cost) < 1 ||
                  !selectedProduct.model ||
                  selectedProduct.model.length === 0
                }
                className="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 py-2.5 sm:py-3 rounded-lg sm:rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-yellow-500/50 font-bold text-sm sm:text-base transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEditUploading ? "Uploading Image..." : "Update Product"}
              </button>
            </form>
          </div>
        </div>
      )}

      {editOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md mx-auto overflow-hidden animate-fade-in">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4 sm:p-5 md:p-6 rounded-t-2xl sm:rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Pencil className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-900" />
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                    Update Status
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setEditOrderModal(false);
                    setSelectedOrder(null);
                  }}
                  className="text-gray-900 hover:bg-white/20 rounded-full p-1.5 sm:p-2 transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 md:p-6 space-y-3 sm:space-y-4">
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                  Order ID
                </p>
                <p className="font-bold text-gray-900 text-sm sm:text-base break-all">
                  {selectedOrder._id}
                </p>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                  Customer
                </p>
                <p className="font-bold text-gray-900 text-sm sm:text-base">
                  {selectedOrder.name}
                </p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3">
                  Select New Status <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2 sm:space-y-3">
                  {orderStatuses.map((status) => (
                    <button
                      key={status}
                      onClick={() => handleOrderStatusUpdate(status)}
                      className={`w-full p-3 sm:p-4 rounded-lg sm:rounded-xl font-bold transition-all duration-300 transform hover:scale-105 text-sm sm:text-base ${
                        selectedOrder.status === status
                          ? "bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 shadow-lg"
                          : "bg-white border-2 border-yellow-200 text-gray-700 hover:border-yellow-400"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{status}</span>
                        {selectedOrder.status === status && (
                          <span className="bg-white text-gray-900 px-2 py-0.5 sm:py-1 rounded-full text-xs">
                            Current
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirmModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md mx-auto overflow-hidden animate-fade-in">
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-4 sm:p-5 md:p-6 rounded-t-2xl sm:rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <Trash2 className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-900" />
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                    Delete Product
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setDeleteConfirmModal(false);
                    setProductToDelete(null);
                  }}
                  disabled={isDeleting}
                  className="text-gray-900 hover:bg-white/20 rounded-full p-1.5 sm:p-2 transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
              <div className="text-center space-y-2 sm:space-y-3">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-yellow-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                  Are you absolutely sure?
                </h3>
                <p className="text-gray-600 text-sm sm:text-base px-2">
                  This action cannot be undone. This will permanently delete the
                  product from your store.
                </p>
              </div>

              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg sm:rounded-xl p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-800 font-medium">
                  ⚠️ Warning: All product data will be lost permanently
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setDeleteConfirmModal(false);
                    setProductToDelete(null);
                  }}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-yellow-200 text-gray-700 rounded-lg sm:rounded-xl hover:border-yellow-400 hover:bg-yellow-50 transition-all duration-300 font-bold text-sm sm:text-base order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-lg sm:rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-yellow-500/50 font-bold text-sm sm:text-base transform hover:scale-105 order-1 sm:order-2"
                >
                  {isDeleting ? "Deleting" : "Delete Product"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
