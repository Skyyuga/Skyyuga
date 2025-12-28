import { api } from "@/convex/_generated/api";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req : NextRequest){
    try {
        const body = await req.json()
        const { products, totalCost, paymentMethod, referenceNumber,name, address, email, contactNumber, state, pincode, vehicleNumber } = body;
        const user = await fetchQuery(api.user.getUserByEmail, {email : email})

        const order = await fetchMutation(api.order.createOrder, {
            products,
            totalCost,
            paymentMethod,
            referenceNumber,
            name,
            address,
            email,
            userId : user?._id!,
            contactNumber,
            pincode,
            vehicleNumber,
            state
        })

        return NextResponse.json(
            {
                success : true,
                message : order
            },
            {
                status : 201
            }
        )
    } catch (error) {
        console.log(error)
        return NextResponse.json(
            {
                success : false,
                message : "Error Creating Order"
            },
            {
                status : 400
            }
        )
    }
}