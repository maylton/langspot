import { type MaterialType } from '../types';

export const STUDENT_SUBMISSION_ACCEPT = 'application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*';

export const MATERIAL_UPLOAD_ACCEPT = 'application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/*';

export const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;

export const STUDENT_SUBMISSION_MIME_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export const MATERIAL_UPLOAD_MIME_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];

export function isStudentSubmissionFile(file: File) { return STUDENT_SUBMISSION_MIME_TYPES.includes(file.type) || file.type.startsWith('image/') || /\.(pdf|doc|docx|jpe?g|png|webp|gif)$/i.test(file.name); }

export function isMaterialUploadFile(file: File) { return MATERIAL_UPLOAD_MIME_TYPES.includes(file.type) || file.type.startsWith('image/') || /\.(pdf|docx|pptx|jpe?g|png|webp|gif)$/i.test(file.name); }

export function materialTypeFromFile(file: File): MaterialType {
  const name = file.name.toLowerCase();
  if (file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(name)) return 'Imagem';
  if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || name.endsWith('.pptx')) return 'Apresentação';
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || name.endsWith('.docx')) return 'Documento';
  return 'PDF';
}
