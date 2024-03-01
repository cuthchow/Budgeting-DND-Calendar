const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const uploadData = async (data) => {
    console.log(data)
    try {
        data.forEach(async (row) => {

            const upsertCategory = await prisma.category.upsert({
                where: {
                    name: row['category']
                },
                update: {target: 500},
                create: {
                    name: row['category'],
                    target: 500
                }
            })

            const expense = await prisma.expense.create({
                data: {
                    createdAt: row['createdAt'],
                    title: row['title'],
                    description: row['description'],
                    amount: row['amount'],
                    category: {
                        connect: {
                            name: row['category']
                        }
                    }
                }
            })
            console.log(row)
        })
    } catch (e) {
      console.error(e)
      process.exit(1)
    } finally {
      await prisma.$disconnect()
    }
}

const load = async () => {

    const staticFilePath = path.join(__dirname, '../static', 'testdata.csv');
    const data = [];

    fs.createReadStream(staticFilePath)
        .pipe(csv())
        .on('data', (row) => {
            data.push(row)
        })
        .on('end', () => {
            const filtered = data.map(d => ({createdAt: new Date(d['createdAt']),
                                             title: d['title'],
                                             description: d['description'],
                                             amount: +d['amount'],
                                             category: d['category']
                                            }))
            
            uploadData(filtered)
        })
  }

load()