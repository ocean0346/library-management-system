'use client'
import { useState, useEffect } from 'react'
import { Bar, BarChart, CartesianGrid, XAxis, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase-client'
import { format, subDays, subMonths, startOfMonth, endOfMonth, getDaysInMonth, parse } from 'date-fns'
import { Loader2, ArrowLeft } from 'lucide-react'
const chartConfig = {
    views: {
        label: "Lượt truy cập",
        color: "hsl(var(--primary))",
    },
} satisfies ChartConfig
export function ViewsChart() {
    const [timeframe, setTimeframe] = useState<'30days' | '12months' | 'years' | 'specific_month'>('30days')
    const [targetMonth, setTargetMonth] = useState<Date | null>(null)
    const [data, setData] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    useEffect(() => {
        const fetchChartData = async () => {
            setIsLoading(true)
            try {
                let startDate = new Date()
                let endDate = new Date()
                if (timeframe === '30days') {
                    startDate = subDays(new Date(), 30)
                } else if (timeframe === '12months') {
                    startDate = subMonths(new Date(), 12)
                } else if (timeframe === 'specific_month' && targetMonth) {
                    startDate = startOfMonth(targetMonth)
                    endDate = endOfMonth(targetMonth)
                } else {
                    startDate = new Date('2000-01-01') 
                }
                let query = supabase
                    .from('access_logs')
                    .select('access_date')
                    .gte('access_date', startDate.toISOString())
                    .order('access_date', { ascending: true })
                if (timeframe === 'specific_month') {
                    query = query.lte('access_date', endDate.toISOString())
                }
                const { data: rawLogs } = await query
                const viewCounts: Record<string, number> = {}
                if (rawLogs) {
                    rawLogs.forEach(log => {
                        if (log.access_date) {
                            let dateStr = ''
                            const d = new Date(log.access_date)
                            if (timeframe === '30days') {
                                dateStr = format(d, 'MMM dd')
                            } else if (timeframe === '12months') {
                                dateStr = format(d, 'MMM yyyy')
                            } else if (timeframe === 'specific_month') {
                                dateStr = format(d, 'dd/MM')
                            } else {
                                dateStr = format(d, 'yyyy')
                            }
                            viewCounts[dateStr] = (viewCounts[dateStr] || 0) + 1
                        }
                    })
                }
                const finalChartData = []
                if (timeframe === '30days') {
                    for (let i = 29; i >= 0; i--) {
                        const d = subDays(new Date(), i)
                        const dateStr = format(d, 'MMM dd')
                        finalChartData.push({ date: dateStr, views: viewCounts[dateStr] || 0, rawDate: d })
                    }
                } else if (timeframe === '12months') {
                    for (let i = 11; i >= 0; i--) {
                        const d = subMonths(new Date(), i)
                        const dateStr = format(d, 'MMM yyyy')
                        finalChartData.push({ date: dateStr, views: viewCounts[dateStr] || 0, rawDate: d })
                    }
                } else if (timeframe === 'specific_month' && targetMonth) {
                    const daysInMonth = getDaysInMonth(targetMonth)
                    for (let i = 1; i <= daysInMonth; i++) {
                        const d = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), i)
                        const dateStr = format(d, 'dd/MM')
                        finalChartData.push({ date: dateStr, views: viewCounts[dateStr] || 0, rawDate: d })
                    }
                } else {
                    const years = Object.keys(viewCounts).sort()
                    if (years.length === 0) years.push(format(new Date(), 'yyyy'))
                    years.forEach(year => {
                        finalChartData.push({ date: year, views: viewCounts[year] || 0, rawDate: new Date(`${year}-01-01`) })
                    })
                }
                setData(finalChartData)
            } catch (error) {
                console.error("Error fetching chart data:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchChartData()
    }, [timeframe, targetMonth])
    const handleBarClick = (entry: any) => {
        if (timeframe === '12months') {
            setTargetMonth(entry.payload.rawDate)
            setTimeframe('specific_month')
        }
    }
    return (
        <Card className="col-span-1 lg:col-span-2 relative min-h-[400px]">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4">
                <div className="flex items-center gap-4">
                    {timeframe === 'specific_month' && (
                        <Button 
                            variant="outline" 
                            size="icon" 
                            onClick={() => {
                                setTimeframe('12months')
                                setTargetMonth(null)
                            }}
                            className="shrink-0 h-8 w-8"
                            title="Quay lại biểu đồ 12 tháng"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    )}
                    <div>
                        <CardTitle>Biểu đồ truy cập</CardTitle>
                        <CardDescription>
                            {timeframe === '30days' && 'Tổng lượt truy cập 30 ngày qua'}
                            {timeframe === '12months' && 'Tổng lượt truy cập 12 tháng qua (Nhấn vào cột để xem chi tiết)'}
                            {timeframe === 'years' && 'Tổng lượt truy cập theo các năm'}
                            {timeframe === 'specific_month' && targetMonth && `Lượt truy cập từng ngày trong ${format(targetMonth, "'Tháng' MM/yyyy")}`}
                        </CardDescription>
                    </div>
                </div>
                {timeframe !== 'specific_month' && (
                    <Select value={timeframe} onValueChange={(val: any) => setTimeframe(val)}>
                        <SelectTrigger className="w-[180px] shrink-0">
                            <SelectValue placeholder="Chọn thời gian" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="30days">30 Ngày Gần Đây</SelectItem>
                            <SelectItem value="12months">12 Tháng Qua</SelectItem>
                            <SelectItem value="years">Theo Từng Năm</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 backdrop-blur-sm rounded-lg">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : null}
                <div className="h-[300px] w-full mt-4">
                    <ChartContainer config={chartConfig} className="min-h-[200px] w-full h-full">
                        <BarChart accessibilityLayer data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid vertical={false} opacity={0.3} />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tick={{ fill: 'currentColor', opacity: 0.7 }}
                                fontSize={12}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="dashed" />}
                            />
                            <Bar
                                dataKey="views"
                                fill="var(--color-views)"
                                radius={[4, 4, 0, 0]}
                                barSize={timeframe === '30days' || timeframe === 'specific_month' ? 20 : 40}
                                onClick={handleBarClick}
                                cursor={timeframe === '12months' ? 'pointer' : 'default'}
                            >
                                {data.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        className={timeframe === '12months' ? 'hover:brightness-110 hover:opacity-80 transition-all duration-200' : ''} 
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                </div>
            </CardContent>
        </Card>
    )
}
