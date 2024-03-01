import prisma from "@/lib/db/db";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {

    const req = await request.json()
    
    try {
        const updatedExpense = await prisma.expense.update({
            where: {
                id: req.id
            },
            data: {
                createdAt: req.date
            }
        })
        console.log(updatedExpense)
        return new NextResponse('Hello, Next.js!', {
            status: 200
          }) 
    } catch {
        return new NextResponse('Uh Oh', {
            status: 501
        }) 
    }

    
}