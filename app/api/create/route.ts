import prisma from "@/lib/db/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {

    const req = await request.json()
    
    try {
        const newExpense = {
            ...req, 
            category: {
                connect: {
                    name: req.category
                }
            }
        }

        const createdExpense = await prisma.expense.create({
            data: newExpense,
            include: {
                category: true
            }
        }, )

        return Response.json({data: createdExpense}, {status: 201});
    } catch {
        return new NextResponse('Failed to create new expense', {
            status: 501
        }) 
    }

    
}