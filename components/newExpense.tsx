"use client"

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Category } from "@prisma/client"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { format, startOfDay } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "./ui/calendar";

const ExpenseForm = ({categories, setWorkingData, currentData}) => {


    const formSchema = z.object({
        createdAt: z.date(),
        title: z.string({
            required_error: "title must be included"
        }).min(1, {message: 'need 1'}),
        description: z.string().optional(), 
        amount: z.coerce.number().min(0.01),
        category: z.string().optional()
    })

    const router = useRouter();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            amount: 0,
            category: ""
        }
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {

        const response = await fetch('/api/create', {method: "POST", body: JSON.stringify(values)})
        const data = await response.json()

        const newData = {
            ...data.data,
            x: 900,
            y: 100,
            createdAt: startOfDay(new Date(data.data.createdAt))
        }

        setWorkingData([...currentData.current, newData])
    }

    return (  
        <Form {...form} >
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-2">
            <FormField
                control={form.control}
                name="createdAt"
                render={({ field }) => (
                    <FormItem className="flex flex-col items-start">
                    <FormLabel className="text-md">Date of Expense</FormLabel>
                    <Popover>
                        <PopoverTrigger asChild>
                        <FormControl>
                            <Button
                            variant={"outline"}
                            className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                            )}
                            >
                            {field.value ? (
                                format(field.value, "PPP")
                            ) : (
                                <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                    control={form.control}
                    name="title"
                    render={({field}) => (
                        <FormItem className="my-1 flex flex-col items-start">
                            <FormLabel className="text-md my-1">Expense Title</FormLabel>
                            <FormControl>
                                <Input placeholder="Expense title" {...field}/>
                            </FormControl>
                            <FormMessage className=""/>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="description"
                    render={({field}) => (
                        <FormItem className="my-1 flex flex-col items-start">
                            <FormLabel className="text-md my-1">Description</FormLabel>
                            <FormControl>
                                <Input placeholder="Expense description" {...field} />
                            </FormControl>
                            <FormMessage className=""/>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="amount"
                    render={({field}) => (
                        <FormItem className="my-1 flex flex-col items-start">
                            <FormLabel className="text-md text-left mt-4">Expense Amount</FormLabel>
                            <FormControl>
                                <Input placeholder="$ Amount" {...field} />
                            </FormControl>
                            <FormDescription></FormDescription>
                            <FormMessage className=""/>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                        <FormItem className="my-1 flex flex-col items-start">
                        <FormLabel className="text-md my-1">Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a expense category" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {categories.map((category: Category) => (
                                    <SelectItem key={category.name} value={category.name}>{category.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormDescription>
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type='submit'>Submit</Button>
            </form>
        </Form>
    );
}


 
export default ExpenseForm;