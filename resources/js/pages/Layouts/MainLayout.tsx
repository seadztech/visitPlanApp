import { Head, Link } from '@inertiajs/react';
import {
    Calendar,
    MapPin,
    Home,
    ArrowLeft,
    Menu,
    X,
    LucideIcon,
    Building2Icon
} from 'lucide-react';
import { useState } from 'react';

type Props = {
    title: string;
    children: React.ReactNode;
};

type NavItem = {
    label: string;
    icon: LucideIcon;
    href?: string;
    action?: () => void;
};

export default function MainLayout({ title, children }: Props) {
    const [open, setOpen] = useState(false);

    const navItems: NavItem[] = [
        {
            label: 'Outposts',
            icon: Building2Icon,
            href: route('home'),
        },
        {
            label: 'Back',
            icon: ArrowLeft,
            action: () => window.history.back(),
        },
    ];

    const renderNavItems = (onClick?: () => void, iconSize = 5) =>
        navItems.map(({ label, icon: Icon, href, action }) => {
            const baseClasses =
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/20 transition';

            if (href) {
                return (
                    <Link
                        key={label}
                        href={href}
                        onClick={onClick}
                        className={baseClasses}
                    >
                        <Icon className={`h-${iconSize} w-${iconSize}`} />
                        {label}
                    </Link>
                );
            }

            return (
                <button
                    key={label}
                    onClick={() => {
                        action?.();
                        onClick?.();
                    }}
                    className={`w-full ${baseClasses}`}
                >
                    <Icon className={`h-${iconSize} w-${iconSize}`} />
                    {label}
                </button>
            );
        });

    return (
        <div className="min-h-screen bg-gray-50">
            <Head>
                <title>{title}</title>
            </Head>

            {/* ================= MOBILE SHEET ================= */}
            <div className="md:hidden">
                {open && (
                    <div
                        className="fixed inset-0 z-40 bg-black/40"
                        onClick={() => setOpen(false)}
                    />
                )}

                <aside
                    className={`fixed inset-y-0 left-0 z-50 w-64 bg-primary text-white transform transition-transform duration-300
                    ${open ? 'translate-x-0' : '-translate-x-full'}`}
                >
                    <div className="flex items-center justify-between px-4 py-4 border-b border-white/20">
                        <div>
                            <h1 className="text-sm font-bold">
                                Bimas Visits Plan App
                            </h1>
                            <div className="mt-2 h-1 w-20 rounded-full bg-gradient-to-r from-amber-300 to-orange-400"></div>
                        </div>
                        <button onClick={() => setOpen(false)}>
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <nav className="px-4 py-4 space-y-2">
                        {renderNavItems(() => setOpen(false), 5)}
                    </nav>
                </aside>
            </div>

            {/* ================= NAVBAR ================= */}
            <header className="bg-primary text-white shadow">
                <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
                    {/* Left */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setOpen(true)}
                            className="md:hidden rounded-lg bg-white/10 p-2 hover:bg-white/20"
                        >
                            <Menu className="h-6 w-6" />
                        </button>

                        <div className="flex items-center gap-3">
                            <div className="rounded-xl border border-white/30 bg-white/20 p-2">
                                <div className="relative">
                                    <MapPin className="h-7 w-7" />
                                    <div className="absolute -right-1 -bottom-1 rounded-full bg-amber-400 p-1">
                                        <Calendar className="h-3 w-3 text-blue-700" />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h1 className="text-lg font-bold">
                                    Bimas Visits Plan App
                                </h1>
                                <div className="mt-1 h-1 w-16 rounded-full bg-gradient-to-r from-amber-300 to-orange-400"></div>
                            </div>
                        </div>
                    </div>

                    {/* Right */}
                    <nav className="hidden md:flex items-center gap-3">
                        {renderNavItems(undefined, 4)}
                    </nav>
                </div>
            </header>

            {/* ================= CONTENT ================= */}
            <main>
                {children}
            </main>
        </div>
    );
}
