import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
// Icons handled by consolidated import below
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type Row,
  type SortingState,
  type VisibilityState,
  getPaginationRowModel as getTanstackPaginationRowModel,
} from "@tanstack/react-table"
import { motion, AnimatePresence } from "framer-motion"
import { 
  IconChevronDown, 
  IconChevronLeft, 
  IconChevronRight, 
  IconChevronsLeft, 
  IconChevronsRight, 
 
  IconLayoutColumns, 
  IconPlus,
  IconSearch,
  IconMaximize,
  IconX
} from "@tabler/icons-react"
import { useSettings } from "../context/SettingsContext"
import { Input } from "@renderer/components/ui/input"

import { Button } from "@renderer/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@renderer/components/ui/dropdown-menu"
import { Label } from "@renderer/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@renderer/components/ui/table"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@renderer/components/ui/tabs"

function DraggableRow<TData>({ row }: { row: Row<TData> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: (row.original as any).id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  title?: string
  onAddClick?: () => void
  addLabel?: string
}

export function DataTable<TData, TValue>({
  columns,
  data: initialData,
  title = "Data",
  onAddClick,
  addLabel = "Add Entry"
}: DataTableProps<TData, TValue>) {
  const { t } = useSettings()
  const [data, setData] = React.useState(() => initialData)
  const [isExpanded, setIsExpanded] = React.useState(false)
  const [globalFilter, setGlobalFilter] = React.useState("")
  
  React.useEffect(() => {
    setData(initialData)
  }, [initialData])

  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => (data as any)?.map(({ id }: any) => id) || [],
    [data]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getRowId: (row: any) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getTanstackPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  const TableUI = (isFullScreen = false) => (
    <div className={`flex flex-col gap-6 ${isFullScreen ? 'h-full' : ''}`}>
      <div className={`flex items-center justify-between gap-4 ${isFullScreen ? 'px-2' : 'px-4 lg:px-6'}`}>
        <div className="flex items-center gap-4 flex-1">
          {!isFullScreen && (
            <TabsList className="hidden @4xl/main:flex">
              <TabsTrigger value="all">{t('data_table.all_format', 'All {title}').replace('{title}', title)}</TabsTrigger>
            </TabsList>
          )}
          <div className="relative flex-1 max-w-sm">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder={t('data_table.search_items', 'Search items...')}
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary h-9 text-[11px] font-bold uppercase tracking-widest"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 px-3">
                <IconLayoutColumns className="size-4" />
                <span className="hidden lg:inline ml-2">{t('data_table.columns', 'Columns')}</span>
                <IconChevronDown className="size-3 ml-1 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          
          {onAddClick && (
            <Button variant="outline" size="sm" onClick={onAddClick} className="h-9 px-3">
              <IconPlus className="size-4" />
              <span className="hidden lg:inline ml-2">{addLabel}</span>
            </Button>
          )}

          {!isFullScreen && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setIsExpanded(true)}
              className="h-9 px-4 font-black uppercase text-[10px] tracking-widest bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/20"
            >
              <IconMaximize className="size-4 mr-2" />
              {t('common.view_all', 'View All')}
            </Button>
          )}
        </div>
      </div>

      <div className={`flex flex-col gap-2 ${isFullScreen ? 'flex-1 overflow-hidden px-2' : 'gap-4 px-4 lg:px-6'}`}>
        <div className={`overflow-auto rounded-xl border bg-card/50 ${isFullScreen ? 'flex-1 shadow-2xl' : ''}`}>
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-md">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan} className="text-[10px] font-black uppercase tracking-[0.2em] h-12 text-muted-foreground">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-64 text-center"
                    >
                      <div className="flex flex-col items-center justify-center gap-2 opacity-40">
                         <IconSearch className="size-8" />
                         <span className="text-[10px] font-black uppercase tracking-widest">{t('data_table.no_results', 'No results found')}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t bg-muted/20 rounded-b-xl">
          <div className="hidden flex-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 lg:flex">
            {t('data_table.records_selected', '{selected} of {total} records selected')
              .replace('{selected}', String(table.getFilteredSelectedRowModel().rows.length))
              .replace('{total}', String(table.getFilteredRowModel().rows.length))}
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {t('data_table.density', 'Density')}
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20 bg-transparent border-none text-[10px] font-black" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50, 100].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`} className="text-[10px] font-bold">
                      {t('data_table.items', '{count} Items').replace('{count}', String(pageSize))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              {t('data_table.segment', 'Segment {current} of {total}')
                .replace('{current}', String(table.getState().pagination.pageIndex + 1))
                .replace('{total}', String(table.getPageCount()))}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="ghost"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronsLeft className="size-4" />
              </Button>
              <Button
                variant="ghost"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <IconChevronLeft className="size-4" />
              </Button>
              <Button
                variant="ghost"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <IconChevronRight className="size-4" />
              </Button>
              <Button
                variant="ghost"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <IconChevronsRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <Tabs defaultValue="all" className="w-full flex-col justify-start gap-6">
        {TableUI(false)}
      </Tabs>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[1000] bg-background flex flex-col p-2 md:p-4"
          >
            <div className="flex items-center justify-between mb-4 px-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-2xl shadow-primary/30">
                  <IconMaximize className="size-6" />
                </div>
                <div>
                   <h2 className="text-3xl font-black uppercase tracking-tighter">{title}</h2>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">{t('data_table.focus_mode', 'Focus Mode Terminal')}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsExpanded(false)}
                className="h-12 w-12 rounded-2xl hover:bg-destructive/10 hover:text-destructive transition-colors group"
              >
                <IconX className="size-6 group-hover:rotate-90 transition-transform" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-hidden">
              {TableUI(true)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

