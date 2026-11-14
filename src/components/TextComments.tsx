import { type ReactNode } from 'react';
import { type Id, type TextComment } from '../types';

export function AnnotatedSubmissionText({ text, comments = [], activeId, onActivate }: { text: string; comments?: TextComment[]; activeId?: Id | null; onActivate?: (id: Id) => void }) {
  const sorted = comments.filter((comment) => comment.start >= 0 && comment.end > comment.start && comment.end <= text.length).sort((a, b) => a.start - b.start);
  const nodes: ReactNode[] = [];
  let cursor = 0;
  sorted.forEach((comment, index) => {
    if (comment.start < cursor) return;
    if (comment.start > cursor) nodes.push(<span key={`text-${index}`}>{text.slice(cursor, comment.start)}</span>);
    nodes.push(<mark key={comment.id} className={activeId === comment.id ? 'active' : ''} title={comment.comment} onClick={() => onActivate?.(comment.id)}>{text.slice(comment.start, comment.end)}</mark>);
    cursor = comment.end;
  });
  if (cursor < text.length) nodes.push(<span key="tail">{text.slice(cursor)}</span>);
  return <div className="annotated-submission-text">{nodes.length ? nodes : text}</div>;
}

export function TextCommentsList({ comments, activeId, onActivate }: { comments?: TextComment[]; activeId?: Id | null; onActivate?: (id: Id) => void }) {
  if (!comments?.length) return null;
  return <div className="text-comments-list"><strong>Comentários por trecho</strong>{comments.map((comment, index) => <article key={comment.id} className={activeId === comment.id ? 'active' : ''} onClick={() => onActivate?.(comment.id)}><span>{index + 1}</span><div><q>{comment.text}</q><p>{comment.comment}</p></div></article>)}</div>;
}
