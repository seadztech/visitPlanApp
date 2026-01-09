import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MainLayout from './Layouts/MainLayout';

import GroupInformation from '@/components/custom/GroupInformation';
import GetFeedback from '@/components/custom/GiveFeedback';
import CompetedFeedback from '@/components/custom/CompletedFeedback';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Delete, Loader, Plus } from 'lucide-react';
import { convertObjectivesToComments2, parseDiscussionPoints } from '@/lib/utils';
import { Input } from '@/components/ui/input';


export type Objective = {
    id: number;
    objective: string;
    created_at: string;
    updated_at: string;
};

export type Comment = {
    id: number;
    objective_id: number;
    group_id: number;
    comment: string;
    discussion_point: DiscussionPoint;
    issues: Issue[];
    created_at?: string | null;
    updated_at?: string | null;
    objective: Objective;
};

export type Issue = {
    id?: number;
    issue: string;
    tempId?: number;
};

export type DiscussionPoint = {
    id: string; // as in your example, discussion_point id is a string
    point: string;
};
export type DiscussionPointWithComments = {
    id: string; // as in your example, discussion_point id is a string
    point: string;
    comments: Comment[];
};

export type CommentItem = {
    id: number;
    group_id: number;
    comment: string;
    discussion_point: DiscussionPoint;
    issues: Issue[];
};

export type ObjectiveWithComments = {
    id: number;
    objective: string;
    created_at: string;
    updated_at: string;
    discussion_points: DiscussionPointWithComments[];
    // comments: CommentItem[];
};


// export type ObjectiveWithComments = {
//     id: number;
//     objective: string;
//     created_at: string;
//     updated_at: string;
//     comments: CommentItem[];
// };


// const objective = {
//     "id": 1,
//     "objective": "Who BIMAS is",
//     "created_at": "2026-01-08T08:13:36.000000Z",
//     "updated_at": "2026-01-08T08:13:36.000000Z",
//     "comment": [
//         {
//             id: 1,
//             "group_id": 5,
//             "comment": "",
//             "discussion_point": {
//                 "id": "1",
//                 "point": "Share the Mission and financial Inclusion agenda.",
//             },

//             "issues": [
//                 {
//                     "id": 1,
//                     "issue": "This is a test issue",

//                 }],


//         }
//     ],
// }





// const testData: ObjectiveWithComments[] = [
//     {
//         id: 1,
//         objective: "Who BIMAS is",
//         created_at: "2026-01-08T08:13:36.000000Z",
//         updated_at: "2026-01-08T08:13:36.000000Z",
//         comments: [
//             {
//                 id: 1,
//                 group_id: 5,
//                 comment: "",
//                 discussion_point: { id: "1", point: "Share the Mission and financial Inclusion agenda. Credit provision services, difference between us and banks" },
//                 issues: []
//             },

//         ],
//     },
//     {
//         id: 2,
//         objective: "Explain CBK regulatory requirements on savings",
//         created_at: "2026-01-08T08:13:36.000000Z",
//         updated_at: "2026-01-08T08:13:36.000000Z",
//         comments: [
//             {
//                 id: 3,
//                 group_id: 5,
//                 comment: "",
//                 discussion_point: { id: "1", point: "CBK Regulation - Share the advantages" },
//                 issues: []
//             },
//             {
//                 id: 4,
//                 group_id: 5,
//                 comment: "",
//                 discussion_point: { id: "2", point: "Compliance - savings and previous discussion- Importance" },
//                 issues: []
//             },
//             {
//                 id: 5,
//                 group_id: 5,
//                 comment: "",
//                 discussion_point: { id: "3", point: "Quarterly statements to be shared to clients through email" },
//                 issues: []
//             }
//         ]
//     },
//     {
//         id: 5,
//         objective: "Explain BIMAS implementation on the same",
//         created_at: "2026-01-08T08:16:27.000000Z",
//         updated_at: "2026-01-08T08:16:27.000000Z",
//         comments: [
//             {
//                 id: 6,
//                 group_id: 5,
//                 comment: "",
//                 discussion_point: { id: "1", point: "Savings utilised to repay loans and create new funding opportunities" },
//                 issues: []
//             },
//             {
//                 id: 6,
//                 group_id: 5,
//                 comment: "",
//                 discussion_point: { id: "2", point: "Emphasize that clients to continue to repay loans even after payoffs" },
//                 issues: []
//             },
//             {
//                 id: 7,
//                 group_id: 5,
//                 comment: "",
//                 discussion_point: { id: "3", point: "Clients with savings no loan- co guarantee- Encourage discussion on how the group clears loans for defaulters" },
//                 issues: []
//             },
//             {
//                 id: 8,
//                 group_id: 5,
//                 comment: "",
//                 discussion_point: { id: "4", point: "Waiver on interest for prepayments" },
//                 issues: []
//             },
//             {
//                 id: 9,
//                 group_id: 5,
//                 comment: "",
//                 discussion_point: { id: "5", point: "Clients who paid for defaulted clients and want their savings back" },
//                 issues: []
//             },
//             {
//                 id: 10,
//                 group_id: 5,
//                 comment: "",
//                 discussion_point: { id: "6", point: "Confirm we close in 6 months" },
//                 issues: []
//             }
//         ]
//     },
//     {
//         id: 6,
//         objective: "Show impact of payoff on group status",
//         created_at: "2026-01-08T08:16:27.000000Z",
//         updated_at: "2026-01-08T08:16:27.000000Z",
//         comments: [
//             {
//                 id: 11,
//                 group_id: 5,
//                 comment: "",
//                 discussion_point: { id: "1", point: "Be clear on savings used to repay loans." },
//                 issues: []
//             },
//             {
//                 id: 12,
//                 group_id: 5,
//                 comment: "",
//                 discussion_point: { id: "2", point: "Have data per client per group" },
//                 issues: []
//             }
//         ]
//     },
//     {
//         id: 7,
//         objective: "Discuss new lending model",
//         created_at: "2026-01-08T08:16:27.000000Z",
//         updated_at: "2026-01-08T08:16:27.000000Z",
//         comments: [
//             {
//                 id: 13,
//                 group_id: 5,
//                 comment: "",
//                 discussion_point: { id: "1", point: "Group co-guarantee" },
//                 issues: []
//             },
//             {
//                 id: 14,
//                 group_id: 5,
//                 comment: "",
//                 discussion_point: { id: "2", point: "Group cohesion even without savings" },
//                 issues: []
//             },
//             {
//                 id: 15,
//                 group_id: 5,
//                 comment: "",
//                 discussion_point: { id: "3", point: "New model of loan graduation based on repayment rate" },
//                 issues: []
//             },
//             {
//                 id: 16,
//                 group_id: 5,
//                 comment: "",
//                 discussion_point: { id: "4", point: "Loan Securities, appraisals, chattels for group clients" },
//                 issues: []
//             },
//             {
//                 id: 17,
//                 group_id: 5,
//                 comment: "",
//                 discussion_point: { id: "5", point: "Diversify group activities - Merry go round and welfare activities" },
//                 issues: []
//             }
//         ]
//     },
// ];




export default function singleGroup() {
    const { props } = usePage();

    console.log("Props: ", props);

    const extractedComments = convertObjectivesToComments2(props.objectives as ObjectiveWithComments[]);

    const [comments, setComments] = useState<Comment[]>(extractedComments ?? []);

    const [loading, setLoading] = useState(false)

    // console.log("comments: ", comments[0]);
    // console.log("Test Data: ", testData[0]);

    const [currentIndex, setCurrentIndex] = useState<number | undefined>(comments.length > 0 ? 0 : undefined);

    const [currentComment, setCurrentComment] = useState<Comment | undefined>(comments.length > 0 ? comments[0] : undefined);

    async function save() {

        if (!loading) {
            setLoading(true)
        }

        if (currentIndex !== undefined) {
            console.log("save: ", currentComment);
        } else {
            console.log("No Comment is selected")
        }

        console.log("issues: ", currentComment?.issues);

        if (currentIndex === undefined || !currentComment) return;


        for (let issue of currentComment?.issues) {
            saveIssue(issue.issue, issue.id);
        }


        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            const response = await fetch(route("comments.update", currentComment.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    // Add auth token here if needed, e.g.,
                    // 'Authorization': `Bearer ${props.csrf_token}`,
                },
                body: JSON.stringify({
                    // id: currentComment.id,
                    comment: currentComment.comment,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);

            }

            const data = await response.json();
            console.log('Comment saved successfully!', data);
            setLoading(false);
            return true;
        } catch (error) {
            console.error('Failed to save comment:', error);
            setLoading(false);
            return false;
        }
    }

    function goNext() {

        console.log("next: ", currentIndex, comments.length, currentComment);

        if (currentIndex == undefined) return;

        const isSaved = save();

        if (!isSaved) {
            toast("Save failed");
            return;
        }

        if (currentIndex != undefined && currentIndex < comments.length - 1 && currentComment) {
            console.log("go next possible");

            setComments((prev) =>

                prev.map((c) =>
                    c.id === currentComment.id
                        ? currentComment
                        : c
                )
            );

            setCurrentIndex((prevValue) => {
                return (prevValue as number) + 1;
            })

            setCurrentComment(comments[currentIndex + 1]);

        }
    }

    function goBack() {
        if (currentIndex == undefined) return;
        const isSaved = save();

        if (!isSaved) {
            toast("Save failed");
            return;
        }
        if (currentIndex !== undefined && currentIndex > 0 && currentComment) {


            setComments((prev) =>

                prev.map((c) =>
                    c.id === currentComment.id
                        ? currentComment
                        : c
                )
            );



            setCurrentIndex((prevValue) => {
                return (prevValue as number) - 1;
            })

            setCurrentComment(comments[currentIndex - 1]);
        }

    }


    async function saveIssue(issue: string, issue_id?: number) {


        try {
            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');
            const response = await fetch(route("issues.store"), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    // Add auth token here if needed, e.g.,
                    // 'Authorization': `Bearer ${props.csrf_token}`,
                },
                body: JSON.stringify({
                    id: issue_id,
                    issue,
                    comment_id: currentComment?.id
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);

            }

            const data = await response.json();
            console.log('issue saved successfully!', data);
            setLoading(false);


            if (issue_id) {

                setCurrentComment((prev) => {
                    if (!prev) return prev;

                    const updatedIssues = prev.issues.map((i) =>
                        i.id === issue_id
                            ? { ...i, issue }
                            : i
                    );

                    return {
                        ...prev,
                        issues: updatedIssues,
                    };
                });


            } else {

                setCurrentComment((prev) => {
                    if (!prev) return prev;

                    const updatedIssues = prev.issues.map((c, i) =>
                        i === currentIndex
                            ? { ...c, issue: issue ?? "" }
                            : c
                    );

                    return {
                        ...prev,
                        issues: updatedIssues,
                    };
                });
            }



            return true;
        } catch (error) {
            console.error('Failed to save comment:', error);
            setLoading(false);
            return false;
        }



    }

    async function removeIssue(issue_id: number) {


        try {

            const csrfToken = document
                .querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');
            const response = await fetch(route("issues.destroy", issue_id), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    // Add auth token here if needed, e.g.,
                    // 'Authorization': `Bearer ${props.csrf_token}`,
                },
                body: JSON.stringify({
                    id: issue_id,

                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);

            }

            const data = await response.json();
            console.log('Issue removed successfully!', data);

            const confirmed = window.confirm(
                "Are you sure you want to delete this item?"
            );

            if (!confirmed) {
                return;
            }

            setCurrentComment((prev) => {
                if (!prev) return prev;

                const newIssues = prev.issues.filter(
                    (i) => i.id !== issue_id && i.tempId !== issue_id
                )

                return {
                    ...prev,
                    issues: newIssues
                }
            })
            setLoading(false);

            return true;
        } catch (error) {
            console.error('Failed to save issue:', error);
            setLoading(false);
            return false;
        }



    }


    useEffect(() => {
        console.log("current index: ", currentIndex)
        if (currentIndex !== undefined) {

            console.log("current comment", currentComment);
        } else {
            console.log("No Current Comment", currentIndex);
        }
    }, [currentIndex])


    return (
        <MainLayout title="Group data entry point" >
            <div className='w-[98%] h-[3rem] mx-auto flex items-center justify-end'>
                <GroupInformation group={props.group} />

            </div>
            <p className='border text-center text-blue-500 border-blue-100 my-2 font-bold '>{
                currentIndex != undefined ? (
                    <span>{`${currentIndex + 1} of ${comments.length}`}</span>
                ) : (
                    <span>No Comments</span>
                )
            }</p>
            <div className=" w-full flex justify-center  h-[calc(100vh-15rem)] bg-blue-50 overflow-auto">


                {
                    comments && comments.length > 0 && currentIndex !== undefined && currentComment ? (
                        <div key={currentComment.id} className='w-full'>

                            <div className=" rounded-md w-full p-2">
                                <h4 className=' text-amber-500 p-1 font-medium '>{currentComment?.objective.objective}</h4>

                                <p className='p-1 text-blue-500 text-sm'>- {currentComment?.discussion_point.point}</p>

                                <div className="border p-2 bg-background space-y-1 w-full">
                                    <h4 className='p-1'>Comment</h4>

                                    <Textarea rows={10}
                                        value={currentComment?.comment}
                                        onChange={(e) => {
                                            const newComment = e.target.value;
                                            // setComments((prev) =>
                                            //     prev.map((c, i) =>
                                            //         i === currentIndex ? { ...c, comment: newComment } : c
                                            //     )
                                            // );
                                            setCurrentComment((prev) => {
                                                if (!prev) return prev;
                                                return {
                                                    ...prev,
                                                    comment: newComment
                                                }

                                            })
                                        }}
                                        className=' text-blue-500'
                                        placeholder={currentComment?.comment}
                                    />



                                    <div className="space-y-1 border p-1">
                                        <div className="flex justify-between p-2 border bg-muted">
                                            <h4 className='p-1 font-bold'>Issues Raised</h4>
                                            <Button className='rounded-none' size={'sm'}
                                                onClick={() => {

                                                    setCurrentComment((prev) => {
                                                        if (!prev) return prev;

                                                        const issues = [
                                                            {
                                                                issue: "",
                                                                tempId: Date.now()
                                                            },
                                                            ...prev.issues
                                                        ]

                                                        return {
                                                            ...prev,
                                                            issues: issues
                                                        }
                                                    })
                                                }}
                                            ><Plus /></Button>
                                        </div>

                                        {
                                            currentComment?.issues.map((issue) => {
                                                return (
                                                    <div className="flex flex-row justify-between items-center ">

                                                        <Input
                                                            value={issue.issue}
                                                            onChange={(e) => {
                                                                const issue_message = e.target.value;

                                                                if (issue.id) {



                                                                    setCurrentComment((prev) => {

                                                                        if (!prev) return prev;

                                                                        const issues = prev.issues.map((i) =>
                                                                            i.id === issue.id
                                                                                ? { ...i, issue: issue_message }
                                                                                : i
                                                                        )
                                                                        return {
                                                                            ...prev,
                                                                            issues: issues
                                                                        }
                                                                    })


                                                                } else {

                                                                    setCurrentComment((prev) => {

                                                                        if (!prev) return prev;
                                                                        const newIssues = prev.issues.map((c, i) =>
                                                                            c.tempId === issue.tempId
                                                                                ? { ...c, issue: issue_message }
                                                                                : c
                                                                        )
                                                                        return {
                                                                            ...prev,
                                                                            issues: newIssues
                                                                        }
                                                                    })
                                                                }

                                                            }}
                                                            className=' text-blue-500 border-1 rounded-none outline-none shadow-none active:border-1 active:border-blue '
                                                            placeholder={"Enter Issue"}

                                                        />
                                                        <Button
                                                            onClick={() => {
                                                                removeIssue((issue.id || issue.tempId) as number)
                                                            }}
                                                            className='rounded-none'><Delete /></Button>

                                                    </div>
                                                )
                                            })
                                        }

                                    </div>




                                </div>



                            </div>
                        </div>
                    ) : (
                        <h4>No comments set for this group</h4>
                    )
                }


            </div>
            <div className="flex flex-row justify-between p-2 h-[3rem] border-t">
                <Button
                    onClick={goBack}
                    disabled={currentIndex == undefined || currentIndex == 0 ? true : false}>
                    {
                        loading ? (<Loader className='animate-spin' />) : "Back"
                    }
                </Button>
                <Button
                    onClick={goNext}
                    disabled={currentIndex == undefined || currentIndex == comments.length - 1}>
                    {
                        loading ? (<Loader className='animate-spin' />) : "Next"
                    }
                </Button>
            </div>

        </MainLayout>
    );
}
