import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { orderStatusValidator, paymentValidator } from "./schema";

export const createOrder = mutation({
    args : {
        products : v.array(
            v.object({
                productId : v.id("products"),
                quantity : v.number()
            })
        ),
        totalCost : v.number(),
        paymentMethod : paymentValidator,
        referenceNumber : v.number(),
        name : v.string(),
        email : v.string(),
        address : v.string(),
        userId : v.id("users"),
        contactNumber : v.string(),
        vehicleNumber : v.optional(v.string()),
        state: v.string(),
        pincode: v.string()
    },
    handler : async(ctx, args) => {
        const order = await ctx.db.insert("orders", {
            products : args.products,
            totalCost : args.totalCost,
            paymentMethod : args.paymentMethod,
            referenceNumber : args.referenceNumber,
            name : args.name,
            address : args.address,
            userId : args.userId,
            status : "PENDING",
            vehicleNumber : args.vehicleNumber,
            email : args.email,
            contactNumber : args.contactNumber,
            pincode : args.pincode,
            state : args.state
        })

        return order
    }
})

export const getOrdersByEmail = query({
    args : {
        email : v.string()
    },
    handler : async(ctx, args) => {
        const orders = await ctx.db
            .query("orders")
            .filter((q) => q.eq(q.field("email"), args.email))
            .collect();
        return orders || []
    }
})

export const deleteAllOrders = mutation({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").collect();

    for (const order of orders) {
      await ctx.db.delete(order._id);
    }

    return { deletedCount: orders.length };
  },
});

export const getAllOrders = query({
  args: {
    email: v.string()
  },
  handler: async (ctx, args) => {
    const validAdmins = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim());

    if (!validAdmins || validAdmins.length === 0) {
      return { error: "Admin list not configured" };
    }

    if (!validAdmins.includes(args.email)) {
      return { error: "Access denied" };
    }

    const orders = await ctx.db.query("orders").order("desc").collect();
    return orders;
  }
});



export const updateOrderStatus = mutation({
    args: {
        orderId : v.id("orders"),
        status : orderStatusValidator,
    },
    handler : async(ctx, args) => {
        const order = await ctx.db.patch(args.orderId, {
            status : args.status
        })

        return order
    }
})