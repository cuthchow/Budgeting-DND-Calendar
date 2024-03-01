import prisma from "@/lib/db/db";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(request: NextRequest) {

    const req = await request.json()
    
    try {
        const deletedUser = await prisma.expense.delete({
            where: {
                id: req.id
            }
        })
        console.log(deletedUser)
        return NextResponse.json(deletedUser, { status: 200 })

    } catch {
        return new NextResponse('Uh Oh', {
            status: 501
        }) 
    }

    
}