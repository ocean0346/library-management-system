import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Search, Filter } from 'lucide-react'

type SearchFiltersProps = {
    searchTerm: string
    onSearchChange: (value: string) => void
    selectedCategory: string
    onCategoryChange: (value: string) => void
    categories: string[]
}

export default function SearchFilters({
                                          searchTerm,
                                          onSearchChange,
                                          selectedCategory,
                                          onCategoryChange,
                                          categories,
                                      }: SearchFiltersProps) {
    return (
        <div className="bg-background/60 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-primary/10 mb-8 mt-2 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#02FF73]/5 to-[#09ADAA]/5 opacity-50" />
            
            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1 w-full">
                    <Label htmlFor="search" className="mb-3 block text-muted-foreground font-medium">
                        Tìm Sách Nhanh
                    </Label>
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-[#02FF73]/50 to-[#09ADAA]/50 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                        <div className="relative flex items-center bg-background rounded-xl border">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                id="search"
                                type="text"
                                placeholder="Nhập tên sách, tác giả, hoặc mã ISBN..."
                                value={searchTerm}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full pl-12 h-14 bg-transparent border-none rounded-xl focus-visible:ring-1 focus-visible:ring-primary text-base"
                            />
                        </div>
                    </div>
                </div>
                
                <div className="w-full md:w-64">
                    <Label htmlFor="category" className="mb-3 block text-muted-foreground font-medium">
                        Thể Loại Sách
                    </Label>
                    <Select value={selectedCategory} onValueChange={onCategoryChange}>
                        <SelectTrigger id="category" className="h-14 rounded-xl border bg-background">
                            <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Tất cả thể loại" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-primary/20 backdrop-blur-xl bg-background/95">
                            <SelectItem value="all" className="focus:bg-primary/20 cursor-pointer rounded-md my-1">Tất cả Thể Loại</SelectItem>
                            {categories.map((category) => (
                                <SelectItem key={category} value={category} className="focus:bg-primary/20 cursor-pointer rounded-md my-1">
                                    {category}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    )
}
