"use client"

import {motion} from "framer-motion";
import { useState } from "react";

import * as d3 from 'd3';

export default function Test() {

    let dummyData = [
        [0, 10],
        [5, 50],
        [15, 75], 
        [55, 100], 
        [75, 10], 
        [100, 5],
        [120, 50]
    ]

    let xScale = d3
            .scaleLinear()
            .domain(d3.extent(dummyData.map(d => d[0])))
            .range([20, 400 - 20])

    let yScale = d3
            .scaleLinear()
            .domain(d3.extent(dummyData.map(d => d[1])))
            .range([200 - 20 , 20])

    console.log(yScale.ticks())

    let line = d3.line()
                    .x((d) => xScale(d[0]))
                    .y((d) => yScale(d[1]))
    let result = line(dummyData);
    console.log(result)

    return (
        <>
        <div className="text-blue-500">
            <svg className="bg-gray-100" viewBox={`0 0 ${400} ${200}`}>
                {yScale.ticks(7).map((max) => (
                    <>
                        <g className="text-gray-400" key={max}>
                            <text y={yScale(max)} className="text-xs" fill="currentColor">
                                {max}
                            </text>
                            <line x1={20} x2={400-20} y2={yScale(max)} y1={yScale(max)} stroke="currentColor" strokeDasharray="1, 3"/>
                        </g>
                    </>
                ))}
                <motion.path initial={{ pathLength: 0}} animate={{pathLength: 1}} transition={{duration: 1, type: "spring"}} d={result} fill="none" stroke="currentColor"/>

            </svg>
        </div>
        </>
    )
}
