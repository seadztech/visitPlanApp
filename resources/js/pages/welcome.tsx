import { Head } from '@inertiajs/react';

export default function Welcome() {
    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
           
           <div className='text-3xl text-secondary bg-primary'>
            This is the main page of the Visits plan application
           </div>
        </>
    );
}
