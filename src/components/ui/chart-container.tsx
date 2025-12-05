import * as React from "react"
import { ResponsiveContainer } from 'recharts'

interface ChartContainerProps {
  children: React.ReactNode
  height?: number
  className?: string
}

/**
 * ChartContainer - A wrapper component for recharts that ensures proper rendering
 *
 * This component solves the common issue where ResponsiveContainer doesn't render
 * because its parent lacks explicit dimensions. It provides a container with
 * explicit height and width for recharts to calculate dimensions properly.
 */
export function ChartContainer({
  children,
  height = 300,
  className = ""
}: ChartContainerProps) {
  return (
    <div
      className={className}
      style={{ width: '100%', height, minHeight: height }}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  )
}
