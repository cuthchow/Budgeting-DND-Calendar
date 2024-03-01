import Dashboard from '@/components/dashboard'
import prisma from '@/lib/db/db'
import Image from 'next/image'

export default async function Home() {

  const expenses = await prisma.expense.findMany(({
    include: {
      category: true
    }
  }));

  const categories = await prisma.category.findMany();

  return (
    <div id='wrapper' className='p-4'>
      <div className='flex flex-row space-around'>
        <h1 className='text-4xl'>Budgetting App!</h1>
      </div>
      <Dashboard data={expenses} categories={categories}/>
    </div>
  )
}
