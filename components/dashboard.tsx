"use client"

import { useEffect, useRef, useState } from "react";
import * as d3 from 'd3';
import { eachDayOfInterval, endOfMonth, format, getDay, getISODay, getWeekOfMonth, startOfDay } from "date-fns";

import ExpenseForm from "./newExpense";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { ArrowBigLeft, ArrowBigRight } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { Switch } from "./ui/switch";
import { UserButton } from "@clerk/nextjs";

const dateBox = {
    height: 130,
    width: 100
}

const margin = {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10 
}

const width = 720;
const height = 670;

const Dashboard = ({data, categories}) => {

    const router = useRouter();

    const [ selectedExp, setSelectedExp ] = useState(null);
    const [ colorByCat, setColorByCat ] = useState(false);
    const [ selectedMonth, setSelectedMonth ] = useState(10);
    const [ workingData, setWorkingData ] = useState(data);

    const { toast } = useToast();

    const container = useRef(); 
    const tempData = useRef();     
    const tooltip = useRef();   
    
    const simulation = d3.forceSimulation()
                            .alphaDecay(0.01)
                            .alphaMin(0.6)
                            .force('collide', d3.forceCollide(d => d.radius + 2).strength(1.2))
                            .force('x', d3.forceX(d=>d.focusX).strength(0.045))
                            .force('y', d3.forceY(d=>d.focusY).strength(0.045))
    
    const drag = d3.drag();

    // Scales and Constants
    const xScale = d3.scaleLinear().domain([0, 6]).range([margin.left + dateBox.width/2, width - margin.right - dateBox.width/2])
    const yScale = d3.scaleLinear().domain([1, 5]).range([margin.top + dateBox.height/2, height - margin.bottom - dateBox.height/2])
    const radScale = d3.scaleLinear().domain(d3.extent(workingData, d => d.amount)).range([5, 30])

    const catColorScale = d3.scaleOrdinal(d3.schemeDark2)
    
    const xTicks = xScale.invert(300)
    const yTicks = d3.ticks(margin.top + dateBox.height/2, height - margin.bottom - dateBox.height/2, 6)
    
    useEffect(() => {
            
    }, [] )

    useEffect(() => {
        setSelectedExp(null);

        setWorkingData(data.map((exp: Object) => {
            return {
                        x: width / 2,
                        y : height / 2,
                        ...exp,
                        focusX: xScale(exp.createdAt.getUTCDay()),
                        focusY: yScale(getWeekOfMonth(exp.createdAt)),
                        radius: radScale(exp.amount),
                        color: exp.category ? catColorScale(exp.category.name) : 'white',
                        createdAt: startOfDay(exp.createdAt)
                    }   
                }).filter(item => item.createdAt.getMonth() === selectedMonth - 1)
            )

        tempData.current = workingData

    }, [selectedMonth])
    
    useEffect(() => {
        
        const plot = d3.select(container.current);
        const tooltipSelection = d3.select(tooltip.current);

        tempData.current = workingData.map((exp: Object) => {
            return {
                        ...exp,
                        focusX: xScale(exp.createdAt.getUTCDay()),
                        focusY: yScale(getWeekOfMonth(exp.createdAt)),
                        radius: radScale(exp.amount),
                        color: colorByCat ? exp.category ? catColorScale(exp.category.name) : 'white' : 'white',
                        createdAt: startOfDay(exp.createdAt)
                    }   
        })

        const startDate = new Date(2023, selectedMonth - 1, 1);
        const endDate = endOfMonth(startDate);

        const monthData = eachDayOfInterval({
            start: startDate,
            end: endDate
        }).map(day => {
            return {
                date: day,
                xStart: xScale(day.getUTCDay()) - dateBox.width / 2,
                yStart: yScale(getWeekOfMonth(day)) - dateBox.height / 2
            }
        })

        const dateRollup = d3.flatRollup(tempData.current, v => d3.sum(v, d => d.amount), d => d.createdAt)
        const colorScaleInter = d3.scaleSymlog().domain(d3.extent(dateRollup, d => d[1]))
        const colorScale = d3.scaleSequential().domain([0, 1]).interpolator(d3.interpolateGnBu)

        console.log(dateRollup)
        console.log(d3.extent(dateRollup, d => d[1]))
        console.log(colorScaleInter(35))

        const rectHeightScale = d3.scaleLinear().domain([0, d3.max(dateRollup, d => d[1])]).range([dateBox.height - 1, 0])

        //Tooltip

        tooltipSelection
            .style('top', 0)
            .style('left',  0)
            .style('background', 'white')
            .style('opacity', 0.8)
            .style('position', 'absolute')
            .style('display', 'block')
            .style('border-radius', '5px')
            .style('z-index', 1)

        // RECTS

        const backrects = plot.select('.backRectsGroup').selectAll('.backs')
            .data(monthData, d => d.date.getTime())
        
        const backReset = function() {
            circles
                .attr('stroke-width', 2)
                .attr('fill', d => d.color)
            setSelectedExp(null)
        }

        backrects
            .enter()
            .append('rect')
                .attr('class', 'backs')
                .on('click', backReset)
            .merge(backrects)
                .attr('x', d => d.xStart)
                .attr('y', d => d.yStart)
                .attr('width', dateBox.width)
            .transition()
            .duration(500)
                .attr('height', dateBox.height)
                .attr('stroke', 'white')
                .attr('fill', 'lightgrey')

        backrects.exit().remove();
        
        const dateRects = plot.select('.dateRectsGroup').selectAll('.dates')
            .data(dateRollup, d => d[0])

        dateRects
            .enter()
            .append('rect')
                .attr('class', 'dates')
                .attr('height', 0 )
                .attr('y', d => yScale(getWeekOfMonth(d[0])) - (dateBox.height / 2) + rectHeightScale(d[1]))
            .merge(dateRects)
                .attr('x', d => xScale(d[0].getUTCDay()) - dateBox.width / 2 )
                .attr('width', dateBox.width)
            .transition()
                .duration((d, i) => 200 + i * 40)
                .attr('y', d => yScale(getWeekOfMonth(d[0])) - (dateBox.height / 2) + rectHeightScale(d[1]))
                .attr('height', d => dateBox.height - rectHeightScale(d[1]))  
                .attr('fill', d => colorScale(colorScaleInter(d[1])))

        dateRects
            .exit()
            .transition()
            .duration(500)
            .attr('fill', 'lightgrey')
            .attr('height', 0)
            .remove()

        // DATE LABEL 
        const datelabels = plot.select('.dateLabelsGroup').selectAll('text')
            .data(monthData, d => d.date.getTime())

        datelabels.enter()
            .append('text')
            .merge(datelabels)
                .text(d => d.date.getDate())
                .attr('x', d => d.xStart)
                .attr('y', d => d.yStart)
                .attr('fill', 'white')
                .attr('dx', 3)
                .attr('dy', dateBox.height / 10 )
            
        datelabels.exit().remove();
        
        // CIRCLES

        let circles = plot.selectAll('circle')
            .data(tempData.current, d => d.id)
            .join(
                enter => enter
                            .append('circle')
                                .attr('fill', d => d.color)
                                .attr('stroke-width', 2)
                                .attr('stroke', 'black')
                                .attr('r', d => d.radius),
                update => update
                            .transition().delay((d, i) => i * 10).duration(500)
                                .attr('r', d => d.radius)
                                .attr('fill', d => d.color),
                exit => exit.remove()
            )
            
        const onClick = (event, d) => {

            circles
                .attr('stroke-width', 2)
                .attr('fill', d => d.color)

            d3.select(event.currentTarget)
                .attr('stroke-width', 4)
                .attr('fill', d=>catColorScale(d.category.name))

            setSelectedExp(d)
            
        }

        const mouseOver = (event, d) => {

            tooltipSelection
                .style('top', `${event.pageY - 5}px`)
                .style('left', `${event.pageX + 20}px`)
                .style('display', 'block')
                .html(`Expense: ${d.title} <br> 
                       Amount: $${d.amount} <br> 
                       Date: ${d.createdAt.toLocaleString(undefined, {year: 'numeric', month: '2-digit', day: '2-digit'})} <br>
                       Category: ${d.category.name}`)
        }    

        const dragStart = (event, d) => {
            simulation.alpha(0.8).alphaTarget(0.6).restart()
            d.fx = d.x 
            d.fy = d.y  
        } 
        
        const dragDuring = (event, d)  => {
            d.fx = event.x 
            d.fy = event.y
        }
        
        const checkIntersection = (subj, dates) => {

            const x = subj.fx 
            const y = subj.fy
            subj.fx = null;
            subj.fy = null;

            dates.forEach(day => {
                if (day.xStart < x && x < day.xStart + dateBox.width &&
                    day.yStart < y && y < day.yStart + dateBox.height && 
                    subj.createdAt.getTime() !== day.date.getTime()) {
                        
                        subj.createdAt = day.date;
                        
                        tempData.current[tempData.current.findIndex(obj => obj['id'] === subj.id)] = subj

                        updateExpense({id: subj.id, date: day.date, title: subj.title});
                        setWorkingData(tempData.current);

                        // Since it's not changing between months!
                        // router.refresh();

                    } 
                }
            )
        }

        const updateExpense = async (newData) => {
            try {
                await fetch('/api/update', {method: "POST", body: JSON.stringify(newData)})
                const year = newData['date'].getFullYear();
                const month = String(newData['date'].getMonth() + 1).padStart(2, '0'); 
                const day = String(newData['date'].getDate()).padStart(2, '0');

                const formattedDate = `${year}-${month}-${day}`;

                toast({
                    title: "Expense has been updated!",
                    description: `Updated Date: ${formattedDate} For item: ${newData['title']}`,
                    variant: "default"
                })
                console.log("Expense successfullly updated!")
            } catch (error: any ){
                console.log(error)
            } finally {

            }
        }

        
        
        const dragEnd = (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            checkIntersection(d, monthData)
        }
        
        drag
            .on('start', dragStart)
            .on('drag', dragDuring)
            .on('end', dragEnd)
    

        circles
            .on('click', onClick)
            .on("mouseover", mouseOver)
            .on("mousemove", mouseOver)
            .on("mouseout", () => tooltipSelection.style('display', 'none'));            

        
        circles.call(drag)

        simulation.on('tick', () => {
                circles
                    .attr('cx', d => d.x)
                    .attr('cy', d => d.y)

            }
        )
        simulation.nodes(tempData.current).alphaMin(0.1).restart()
            
    }, [workingData]);
    
    const colorCircles = () => {
        setWorkingData(tempData.current)
        setColorByCat(!colorByCat)
    }

    const deleteExpense = async() => {
        try {
            const res = await fetch('/api/delete', {method: "DELETE", body: JSON.stringify({id: selectedExp['id']})});
            const deletedExpense = await res.json();

            setWorkingData(tempData.current.filter(item => item.id !== deletedExpense.id))

            toast({
                title: "Expense has been Deleted!",
                description: `Item ${deletedExpense['title']}`,
                variant: "destructive"
            })
        } catch (error: any ){
            console.log(error)
        } finally {
        }
    }

    return (
        <div>
            <h1 className="py-4">
            </h1>
            <UserButton/>
            <div className="flex flex-row items-start justify-around w-full">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-3/6">
                    <g ref={container}>
                        <g className = "backRectsGroup"></g>
                        <g className = "dateRectsGroup"></g>
                        <g className = "dateLabelsGroup"></g> 
                    </g>
                </svg>
                <div className="w-2/6">
                    <div className="flex-col my-4 py-2 p-8 items-center align-middle text-center w-full rounded-md shadow-md border-grey-100 border-2">
                        <ExpenseForm categories={categories} 
                                     setWorkingData={setWorkingData}
                                     currentData={tempData}/> 
                    </div>
                    {selectedExp ? 
                    <div className="flex-col my-4 py-2 items-center text-center w-full rounded-md shadow-md border-grey-100 border-2">    
                        <ul>
                            <li><strong>Expense:</strong> {selectedExp?.title}</li>
                            <li><strong>Expense Amount:</strong> ${selectedExp?.amount}</li>
                            <li><strong>Category:</strong> {selectedExp?.category.name}</li>
                            <li><strong>Expense Description:</strong> {selectedExp?.description}</li>
                            <Button className="mt-4" variant={"destructive"} onClick={() => deleteExpense()}>Delete Expense</Button>
                        </ul>
                    </div>                 
                    : ""}
                    <div className="flex-col my-4 py-2 items-center text-center w-full rounded-md shadow-md border-grey-100 border-2">    
                        <Button onClick={ () => colorCircles() } className="my-5">
                            {colorByCat ? "Turn Off Colouring" : "Color by Category"}
                        </Button>
                        <Switch className="ml-4 bg-red-500" onCheckedChange={() => colorCircles()}/>
                        <div id="monthnav">
                            {selectedMonth > 1 ? <Button onClick={() => setSelectedMonth(selectedMonth - 1)} className="h-12 w-24"><ArrowBigLeft /></Button>: null}
                            <Button className="h-12 w-24">{selectedMonth}</Button>
                            {selectedMonth <12 ? <Button onClick={() => setSelectedMonth(selectedMonth + 1)} className="h-12 w-24"><ArrowBigRight/></Button>: null}
                        </div>
                    </div>
                </div>
                
            </div>
            <div id='tooltip' className="p-3" ref={tooltip}>

            </div>
            <table>
            </table>
        </div>
    );
}
 
export default Dashboard;