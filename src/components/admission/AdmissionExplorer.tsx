"use client"

import { useState, useMemo } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface SpecialtyChartData {
  id: string
  name: string
  data: { year: number; thresholdScore: number; availableSpots: number }[]
}

interface AdmissionExplorerProps {
  specialtyData: SpecialtyChartData[]
  availableYears: number[]
}

// Color palette for chart lines
const CHART_COLORS = [
  "#0ea5e9", // sky-500
  "#f43f5e", // rose-500
  "#22c55e", // green-500
  "#f59e0b", // amber-500
  "#8b5cf6", // violet-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
  "#f97316", // orange-500
  "#6366f1", // indigo-500
  "#84cc16", // lime-500
]

export function AdmissionExplorer({
  specialtyData,
  availableYears,
}: AdmissionExplorerProps) {
  // All specialties selected by default
  const [selectedSpecialties, setSelectedSpecialties] = useState<Set<string>>(
    new Set(specialtyData.map((s) => s.id))
  )
  const [yearFrom, setYearFrom] = useState<string>("all")
  const [yearTo, setYearTo] = useState<string>("all")

  // Filter data based on selections
  const filteredData = useMemo(() => {
    return specialtyData
      .filter((s) => selectedSpecialties.has(s.id))
      .map((s) => ({
        ...s,
        data: s.data.filter((d) => {
          if (yearFrom !== "all" && d.year < parseInt(yearFrom)) return false
          if (yearTo !== "all" && d.year > parseInt(yearTo)) return false
          return true
        }),
      }))
  }, [specialtyData, selectedSpecialties, yearFrom, yearTo])

  // Build chart data: array of { year, [specialty_name]: threshold }
  const chartData = useMemo(() => {
    const yearMap = new Map<
      number,
      Record<string, number>
    >()

    for (const specialty of filteredData) {
      for (const point of specialty.data) {
        if (!yearMap.has(point.year)) {
          yearMap.set(point.year, { year: point.year })
        }
        yearMap.get(point.year)![specialty.name] = point.thresholdScore
      }
    }

    return Array.from(yearMap.values()).sort(
      (a, b) => (a.year as number) - (b.year as number)
    )
  }, [filteredData])

  // Flat table data for summary
  const tableData = useMemo(() => {
    const rows: {
      specialty: string
      year: number
      thresholdScore: number
      availableSpots: number
    }[] = []
    for (const s of filteredData) {
      for (const d of s.data) {
        rows.push({
          specialty: s.name,
          year: d.year,
          thresholdScore: d.thresholdScore,
          availableSpots: d.availableSpots,
        })
      }
    }
    return rows.sort((a, b) =>
      a.specialty === b.specialty
        ? a.year - b.year
        : a.specialty.localeCompare(b.specialty, "ro")
    )
  }, [filteredData])

  function toggleSpecialty(id: string) {
    setSelectedSpecialties((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (specialtyData.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          Nu exista date istorice de admitere inca.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtreaza date</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Specialty checkboxes */}
          <div>
            <Label className="mb-2 block text-sm font-medium">
              Specialitati
            </Label>
            <div className="flex flex-wrap gap-4">
              {specialtyData.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`spec-${s.id}`}
                    checked={selectedSpecialties.has(s.id)}
                    onCheckedChange={() => toggleSpecialty(s.id)}
                  />
                  <Label
                    htmlFor={`spec-${s.id}`}
                    className="cursor-pointer text-sm"
                    style={{ color: CHART_COLORS[idx % CHART_COLORS.length] }}
                  >
                    {s.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Year range */}
          <div className="flex gap-4">
            <div className="w-40">
              <Label className="mb-1 block text-sm">De la an</Label>
              <Select value={yearFrom} onValueChange={setYearFrom}>
                <SelectTrigger>
                  <SelectValue placeholder="Toti anii" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toti anii</SelectItem>
                  {availableYears.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label className="mb-1 block text-sm">Pana la an</Label>
              <Select value={yearTo} onValueChange={setYearTo}>
                <SelectTrigger>
                  <SelectValue placeholder="Toti anii" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toti anii</SelectItem>
                  {availableYears.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Tendinta praguri admitere
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis domain={[0, 950]} />
                <Tooltip />
                <Legend />
                {filteredData.map((s, idx) => (
                  <Line
                    key={s.id}
                    type="monotone"
                    dataKey={s.name}
                    stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Summary table */}
      {tableData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Date detaliate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Specialitate</TableHead>
                    <TableHead className="w-24">An</TableHead>
                    <TableHead className="w-32">Prag admitere</TableHead>
                    <TableHead className="w-32">Locuri disponibile</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {row.specialty}
                      </TableCell>
                      <TableCell>{row.year}</TableCell>
                      <TableCell>{row.thresholdScore}</TableCell>
                      <TableCell>{row.availableSpots}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
