import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { GSTValidator } from "./schema";

export const getProductById = query({
    args : {
        id : v.id("products")
    },
    handler : async(ctx, args) => {
        return ctx.db.get(args.id)
    }
})

export const getAllProducts = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();

    const categorySet = new Set();
    for (const product of products) {
      if (product.category) {
        categorySet.add(product.category);
      }
    }

    const allCategories = Array.from(categorySet);

    return { products, allCategories };
  },
});

export const createProducts = mutation({
    args : {
        title : v.string(),
        description : v.string(),
        imageUrl : v.array(v.string()),
        cost : v.number(),
        category : v.string(),
        size : v.string(),
        model : v.array(v.string()),
        gstRate : GSTValidator,
        discount : v.number()
    },
    handler : async(ctx, args) => {
        const product = await ctx.db.insert("products", {
            title : args.title,
            description : args.description,
            imageUrl : args.imageUrl,
            cost : args.cost,
            category : args.category,
            model : args.model,
            size : args.size,
            GSTRate : args.gstRate,
            discount : args.discount
        })

        return product;
    }
})

export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.array(v.string())),
    cost: v.optional(v.number()),
    category: v.optional(v.string()),
    model: v.optional(v.array(v.string())),
    size: v.optional(v.string()),
    gstRate : v.optional(GSTValidator),
    discount : v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) throw new Error("Product not found");

    await ctx.db.patch(args.productId, {
      title: args.title ?? product.title,
      description: args.description ?? product.description,
      imageUrl: args.imageUrl ?? product.imageUrl,
      cost: args.cost ?? product.cost,
      category: args.category ?? product.category,
      model: args.model ?? product.model,
      size: args.size ?? product.size,
      GSTRate: args.gstRate ?? product.GSTRate,
      discount: args.discount ?? product.discount
    });
  },
});

export const deleteProduct = mutation({
    args : {
        productId : v.id("products")
    },
    handler : async(ctx, args) => {
        await ctx.db.delete(args.productId)
    }
})

export const getAllProductsSizeModel = query({
    args : {
        model : v.optional(v.string()),
        size : v.optional(v.string())
    },
    handler : async(ctx, args) => {
        let allProducts = await ctx.db
            .query("products")
            .collect()
    
        if(args.model != null && args.model != undefined){
            allProducts = allProducts.filter((t) => t.model?.includes(args.model!))
        }

        if(args.size != null && args.size != undefined){
            allProducts = allProducts.filter((t) => t.size === args.size)
        }

        const uniqueSizes = [...new Set(allProducts.map((t) => t.size).filter(Boolean))];

        const uniqueModels = [...new Set(allProducts.flatMap((t) => t.model ?? []))];

        return { products : allProducts, uniqueSizes, uniqueModels}
    }
})
