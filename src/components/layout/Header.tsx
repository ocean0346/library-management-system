'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import HeaderSearch from '@/components/layout/HeaderSearch'
import { UserCircle, Settings, BookOpen, LayoutDashboard, Menu, X, LogOut, Search, Sparkles, Users, Tags, History, LibrarySquare } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import { cn } from '@/lib/utils'

export default function Header() {
    const router = useRouter()
    const pathname = usePathname()
    const { user, signOut } = useAuth()
    const [isAdmin, setIsAdmin] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    useEffect(() => {
        const checkAdmin = async () => {
            if (user) {
                const { data } = await supabase
                    .from('users')
                    .select('role')
                    .eq('user_id', user.id)
                    .single()
                
                if (data?.role === 'ADMIN' || data?.role === 'SUPER_ADMIN') {
                    setIsAdmin(true)
                }
            }
        }
        
        checkAdmin()
    }, [user])

    const handleSignOut = async () => {
        await signOut()
        router.push('/')
    }

    const navItems = [
        { href: '/', label: 'Trang Chủ', icon: BookOpen },
        { href: '/books', label: 'Thư Viện', icon: BookOpen },
    ]

    const isActivePath = (path: string) => pathname === path

    const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

    if (pathname.includes('/read')) return null

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/50 shadow-[inset_0_-1px_0_0_hsla(0,0%,100%,0.05),0_1px_3px_0_rgba(0,0,0,0.03)]">
            <div className="container h-16 flex items-center justify-between">
                {/* Logo & Navigation */}
                <div className="flex items-center gap-8">
                    <Link href="/" onClick={scrollToTop} className="flex items-center gap-3 group">
                        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[#02FF73] to-[#09ADAA] shadow-lg shadow-[#02FF73]/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(2,255,115,0.4)]">
                            <BookOpen className="w-5 h-5 text-black absolute" />
                            <Sparkles className="w-3 h-3 text-black absolute -top-1 -right-1 animate-pulse" />
                        </div>
                        <span className="font-display font-black text-xl tracking-tight hidden sm:inline bg-gradient-to-r from-[#02FF73] to-[#09ADAA] bg-clip-text text-transparent group-hover:brightness-110 transition-all">
                            ThưViện<span className="text-foreground">Online</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = isActivePath(item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={scrollToTop}
                                    className={cn(
                                        "relative px-4 py-2 text-sm font-medium transition-colors rounded-lg group",
                                        isActive
                                            ? "text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <span className="flex items-center gap-2">
                                        <Icon className="h-4 w-4" />
                                        {item.label}
                                    </span>
                                    {/* Active indicator */}
                                    <span
                                        className={cn(
                                            "absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r from-[#02FF73] to-[#09ADAA] transition-all duration-300 rounded-full",
                                            isActive ? "w-3/4" : "w-0 group-hover:w-1/2"
                                        )}
                                    />
                                </Link>
                            )
                        })}
                        {user && (
                            <>
                                <Link
                                    href="/bookshelf"
                                    onClick={scrollToTop}
                                    className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg group"
                                >
                                    <span className="flex items-center gap-2">
                                        <LibrarySquare className="h-4 w-4" />
                                        Tủ Sách
                                    </span>
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-[#02FF73] to-[#09ADAA] group-hover:w-1/2 transition-all duration-300 rounded-full" />
                                </Link>
                                {isAdmin && (
                                    <Link
                                        href="/dashboard"
                                        onClick={scrollToTop}
                                        className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg group"
                                    >
                                        <span className="flex items-center gap-2">
                                            <LayoutDashboard className="h-4 w-4" />
                                            Dashboard Admin
                                        </span>
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-[#02FF73] to-[#09ADAA] group-hover:w-1/2 transition-all duration-300 rounded-full" />
                                    </Link>
                                )}
                            </>
                        )}
                    </nav>
                </div>

                {/* Right Side */}
                <div className="flex items-center gap-3">
                    <HeaderSearch />
                    {user ? (
                        <>
                            {/* User Menu */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-2 hover:bg-accent/50"
                                    >
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#02FF73] to-[#09ADAA] flex items-center justify-center">
                                            <UserCircle className="h-5 w-5 text-black" />
                                        </div>
                                        <span className="hidden md:inline max-w-[120px] truncate font-medium">
                                            {user.user_metadata?.full_name || user.email?.split('@')[0]}
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col">
                                            <span className="font-semibold">
                                                {user.user_metadata?.full_name || 'Người Dùng'}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-normal truncate">
                                                {user.email}
                                            </span>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => router.push('/bookshelf')}
                                        className="cursor-pointer"
                                    >
                                        <LibrarySquare className="mr-2 h-4 w-4" />
                                        Tủ Sách Của Tôi
                                    </DropdownMenuItem>
                                    {isAdmin && (
                                        <DropdownMenuItem
                                            onClick={() => router.push('/dashboard')}
                                            className="cursor-pointer"
                                        >
                                            <LayoutDashboard className="mr-2 h-4 w-4" />
                                            Bảng Quản Trị
                                        </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                        onClick={() => router.push('/account/settings')}
                                        className="cursor-pointer"
                                    >
                                        <UserCircle className="mr-2 h-4 w-4" />
                                        Cài Đặt Tài Khoản
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleSignOut}
                                        className="cursor-pointer text-destructive focus:text-destructive"
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Đăng Xuất
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <div className="hidden md:flex items-center gap-3">
                            <Link href="/login">
                                <Button variant="ghost" size="sm">
                                    Đăng Nhập
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button variant="gradient" size="sm">
                                    Đăng Ký
                                </Button>
                            </Link>
                        </div>
                    )}

                    {/* Mobile Menu Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Mobile Navigation */}
            <div className={cn(
                "md:hidden border-t border-border/40 bg-background/95 backdrop-blur-xl overflow-hidden transition-all duration-300 ease-in-out",
                mobileMenuOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0 border-t-0"
            )}>
                    <nav className="container py-4 flex flex-col gap-2">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = isActivePath(item.href)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                        isActive
                                            ? "bg-accent text-foreground"
                                            : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                    {item.label}
                                </Link>
                            )
                        })}
                        {user && (
                            <Link
                                href="/bookshelf"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                            >
                                <LibrarySquare className="h-5 w-5" />
                                Tủ Sách Của Tôi
                            </Link>
                        )}
                        {user && isAdmin && (
                            <Link
                                href="/dashboard"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                            >
                                <LayoutDashboard className="h-5 w-5" />
                                Bảng Quản Trị
                            </Link>
                        )}
                        {!user && (
                            <div className="border-t border-border/40 mt-2 pt-4 flex flex-col gap-2">
                                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                                    <Button variant="outline" className="w-full justify-center">
                                        Đăng Nhập
                                    </Button>
                                </Link>
                                <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                                    <Button variant="gradient" className="w-full justify-center">
                                        Đăng Ký
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </nav>
                </div>
        </header>
    )
}
