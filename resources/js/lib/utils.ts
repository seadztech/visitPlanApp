import { Comment, ObjectiveWithComments } from "@/pages/SingleGroup";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseDiscussionPoints(discussionPoints: string): string[] {
  try {
    const parsed = JSON.parse(discussionPoints);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (e) {
    console.error('Failed to parse discussion points:', e);
    return [];
  }
}



export function convertObjectivesToComments(
  objectives: ObjectiveWithComments[]
): Comment[] {
  let comments: Comment[] = [];

  for (let objective of objectives) {

    for (let comment of objective.comments) {

      comments.push({
        id: comment.id,
        comment: comment.comment,
        discussion_point: comment.discussion_point,
        group_id: comment.group_id,
        issues: comment.issues,
        objective: objective,
        objective_id: objective.id,
        created_at: objective.created_at,
        updated_at: objective.updated_at


      })
    }
  }


  return comments
}
