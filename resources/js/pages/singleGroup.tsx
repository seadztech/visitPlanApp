import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MainLayout from './Layouts/MainLayout';

import GroupInformation from '@/components/custom/GroupInformation';
import GetFeedback from '@/components/custom/GiveFeedback';
import CompetedFeedback from '@/components/custom/CompletedFeedback';

export default function singleGroup() {
    return (
        <MainLayout title="Group data entry point">
            <div className='w-[98%] mx-auto flex items-center justify-end'>
                <GroupInformation />
            </div>
            <div className="mt-2 w-full flex justify-center">
                <Tabs
                    defaultValue="get_feedback"
                    className="w-full max-w-3xl md:max-w-md"
                >
                    {/* Tabs Header */}
                    <TabsList className="flex justify-center gap-2 bg-primary p-1 rounded-lg">
                        <TabsTrigger
                            value="get_feedback"
                            className="px-4 py-2 rounded-lg font-semibold text-white hover:bg-primary/80
                                       data-[state=active]:bg:card data-[state=active]:text-black"
                        >
                            GET FEEDBACK
                        </TabsTrigger>

                        <TabsTrigger
                            value="completed"
                            className="px-4 py-2 rounded-lg font-semibold text-white hover:bg-primary/80
                                       data-[state=active]:bg:card data-[state=active]:text-black"
                        >
                            COMPLETED FEEDBACK
                        </TabsTrigger>
                    </TabsList>

                    {/* Tabs Content */}
                    <div className="mt-4">
                        <TabsContent value="get_feedback">
                            <GetFeedback />
                        </TabsContent>
                        <TabsContent value="completed">
                           <CompetedFeedback />

                        </TabsContent>
                    </div>
                </Tabs>
            </div>
        </MainLayout>
    );
}
