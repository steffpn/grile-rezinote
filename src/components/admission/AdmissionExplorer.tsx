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
  data: {
    umf: string | null
    year: number
    thresholdScore: number
    availableSpots: number
  }[]
}

interface AdmissionExplorerProps {
  specialtyData: SpecialtyChartData[]
  availableYears: number[]
  availableUmfs: string[]
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
  availableUmfs,
}: AdmissionExplorerProps) {
  // All specialties selected by default
  const [selectedSpecialties, setSelectedSpecialties] = useState<Set<string>>(
    new Set(specialtyData.map((s) => s.id))
  )
  // All UMFs selected by default — user can deselect to narrow the chart.
  const [selectedUmfs, setSelectedUmfs] = useState<Set<string>>(
    new Set(availableUmfs),
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
          if (d.umf && !selectedUmfs.has(d.umf)) return false
          return true
        }),
      }))
  }, [specialtyData, selectedSpecialties, selectedUmfs, yearFrom, yearTo])

  // Build chart series: one line per (specialty, UMF) combo.
  const chartSeries = useMemo(() => {
    const series: { key: string; specialtyName: string; umf: string }[] = []
    for (const s of filteredData) {
      const umfsInData = new Set<string>()
      for (const d of s.data) if (d.umf) umfsInData.add(d.umf)
      for (const u of umfsInData) {
        series.push({
          key: `${s.name} · ${u}`,
          specialtyName: s.name,
          umf: u,
        })
      }
    }
    return series
  }, [filteredData])

  const chartData = useMemo(() => {
    const yearMap = new Map<number, Record<string, number>>()
    for (const specialty of filteredData) {
      for (const point of specialty.data) {
        if (!point.umf) continue
        if (!yearMap.has(point.year)) {
          yearMap.set(point.year, { year: point.year })
        }
        const key = `${specialty.name} · ${point.umf}`
        yearMap.get(point.year)![key] = point.thresholdScore
      }
    }
    return Array.from(yearMap.values()).sort(
      (a, b) => (a.year as number) - (b.year as number)
    )
  }, [filteredData])

  // Flat table data for summary (one row per specialty/UMF/year).
  const tableData = useMemo(() => {
    const rows: {
      specialty: string
      umf: string
      year: number
      thresholdScore: number
    }[] = []
    for (const s of filteredData) {
      for (const d of s.data) {
        rows.push({
          specialty: s.name,
          umf: d.umf ?? "—",
          year: d.year,
          thresholdScore: d.thresholdScore,
        })
      }
    }
    return rows.sort((a, b) => {
      if (a.specialty !== b.specialty)
        return a.specialty.localeCompare(b.specialty, "ro")
      if (a.umf !== b.umf) return a.umf.localeCompare(b.umf, "ro")
      return a.year - b.year
    })
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

  function toggleUmf(name: string) {
    setSelectedUmfs((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
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
              {specialtyData.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`spec-${s.id}`}
                    checked={selectedSpecialties.has(s.id)}
                    onCheckedChange={() => toggleSpecialty(s.id)}
                  />
                  <Label
                    htmlFor={`spec-${s.id}`}
                    className="cursor-pointer text-sm"
                  >
                    {s.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* UMF checkboxes */}
          <div>
            <Label className="mb-2 block text-sm font-medium">UMF-uri</Label>
            <div className="flex flex-wrap gap-4">
              {availableUmfs.map((u) => (
                <div key={u} className="flex items-center gap-2">
                  <Checkbox
                    id={`umf-${u}`}
                    checked={selectedUmfs.has(u)}
                    onCheckedChange={() => toggleUmf(u)}
                  />
                  <Label
                    htmlFor={`umf-${u}`}
                    className="cursor-pointer text-sm"
                  >
                    {u}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Year range */}
          <div className="grid grid-cols-2 gap-4 sm:flex">
            <div className="sm:w-40">
              <Label className="mb-1 block text-sm">De la an</Label>
              <Select value={yearFrom} onValueChange={setYearFrom}>
                <SelectTrigger className="min-h-[44px]">
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
            <div className="sm:w-40">
              <Label className="mb-1 block text-sm">Pana la an</Label>
              <Select value={yearTo} onValueChange={setYearTo}>
                <SelectTrigger className="min-h-[44px]">
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
            <p className="text-xs text-muted-foreground">
              O linie per (specialitate, UMF). Bifeaza UMF-uri suplimentare in
              filtru pentru comparatii.
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={420}>
              <LineChart
                data={chartData}
                margin={{ top: 12, right: 24, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis domain={[500, 950]} />
                <Tooltip
                  wrapperStyle={{ outline: "none" }}
                  contentStyle={{
                    background: "var(--popover, #0f172a)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                    fontSize: 11,
                    padding: "8px 10px",
                  }}
                  itemStyle={{ padding: "1px 0", lineHeight: 1.3 }}
                />
                <Legend
                  verticalAlign="bottom"
                  wrapperStyle={{ paddingTop: 12, fontSize: 11 }}
                  iconSize={10}
                />
                {chartSeries.map((s, idx) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.key}
                    stroke={CHART_COLORS[idx % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
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
            <div className="max-h-96 overflow-x-auto overflow-y-auto rounded-md border">
              <Table className="min-w-[560px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Specialitate</TableHead>
                    <TableHead>UMF</TableHead>
                    <TableHead className="w-20">An</TableHead>
                    <TableHead className="w-28">Prag</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableData.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {row.specialty}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.umf}
                      </TableCell>
                      <TableCell>{row.year}</TableCell>
                      <TableCell className="tabular-nums">
                        {row.thresholdScore}
                      </TableCell>
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
