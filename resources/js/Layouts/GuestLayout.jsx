import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-slate-50 pt-6 sm:justify-center sm:pt-0">
            <div>
                <Link href="/">
                    <ApplicationLogo className="h-20 w-20 fill-current text-slate-600" />
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-white border border-slate-200/80 px-6 py-4 shadow-xl sm:max-w-md sm:rounded-2xl">
                {children}
            </div>
        </div>
    );
}
