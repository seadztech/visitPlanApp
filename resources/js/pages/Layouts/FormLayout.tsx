import { Head } from '@inertiajs/react';
import { Calendar, MapPin, Users } from 'lucide-react';

type Props = {
    title: string;
    cardTitle?: string;
    children: React.ReactNode;
};

export default function FormLayout({ title, cardTitle ,children }: Props) {
    return (
        <div>
            <Head>
                <title>{title}</title>
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>

            <div className="w-full">
               
                 {children}
            </div>
           
        </div>
    );
}
