import { ExternalLink, FileText, Plus, Trash2, UsersRound } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Field, Modal } from '../../components/ui';
import { initials } from '../../lib/format';
import { skills } from '../../lib/skills';
import { MATERIAL_UPLOAD_ACCEPT, MAX_UPLOAD_SIZE, isMaterialUploadFile, materialTypeFromFile } from '../../lib/uploads';
import { type Id, type Material, type MaterialInput, type MaterialType, type Skill, type Student } from '../../types';

export function MaterialModal({ onClose, onSave }: { onClose: () => void; onSave: (material: MaterialInput) => void | Promise<void> }) {
  const [mode, setMode] = useState<'link' | 'upload'>('link');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (mode === 'upload' && !file) { setError('Selecione um arquivo.'); return; }
    if (file && (!isMaterialUploadFile(file) || file.size > MAX_UPLOAD_SIZE)) { setError('Escolha um PDF, DOCX, PPTX ou imagem de até 10 MB.'); return; }
    const form = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await onSave({ title: String(form.get('title')), type: mode === 'upload' && file ? materialTypeFromFile(file) : String(form.get('type')) as MaterialType, level: String(form.get('level')), skill: String(form.get('skill')) as Skill, url: mode === 'link' ? String(form.get('url')) : '', description: String(form.get('description')), source: mode, file: file ?? undefined });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível salvar o material.');
      setBusy(false);
    }
  };
  return <Modal title="Adicionar material" onClose={onClose}><form className="form-grid" onSubmit={submit}><div className="material-source-tabs full-field"><button type="button" className={mode === 'link' ? 'active' : ''} onClick={() => { setMode('link'); setFile(null); }}><ExternalLink size={16} />Adicionar link</button><button type="button" className={mode === 'upload' ? 'active' : ''} onClick={() => setMode('upload')}><FileText size={16} />Enviar arquivo</button></div><Field name="title" label="Título" placeholder="Ex.: Past Simple Review" required /><label>Tipo<select name="type" disabled={mode === 'upload'} defaultValue={mode === 'upload' ? 'PDF' : 'Link'}><option>PDF</option><option>Documento</option><option>Apresentação</option><option>Imagem</option><option>Vídeo</option><option>Áudio</option><option>Link</option><option>Atividade</option></select></label><label>Nível<select name="level"><option>Todos</option><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option></select></label><label>Habilidade<select name="skill">{skills.map((skill) => <option key={skill}>{skill}</option>)}</select></label>{mode === 'link' ? <Field name="url" label="Link do material" type="url" placeholder="https://..." required /> : <label className="full-field pdf-upload-field"><span>Arquivo</span><input type="file" accept={MATERIAL_UPLOAD_ACCEPT} onChange={(event) => setFile(event.target.files?.[0] ?? null)} required />{file && <small>{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</small>}<em>PDF, DOCX, PPTX ou imagem, com tamanho máximo de 10 MB.</em></label>}<label className="full-field">Descrição<textarea name="description" rows={4} placeholder="Como este material pode ser utilizado na aula?" /></label>{error && <div className="auth-message full-field">{error}</div>}<div className="form-actions"><button type="button" className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button" type="submit" disabled={busy}><Plus size={17} />{busy ? 'Enviando...' : mode === 'upload' ? 'Enviar arquivo' : 'Adicionar material'}</button></div></form></Modal>;
}

export function AssignMaterialModal({ material, students, onClose, onSave }: { material: Material; students: Student[]; onClose: () => void; onSave: (studentIds: Id[]) => void }) {
  const [selected, setSelected] = useState<Id[]>(material.assignedStudentIds ?? []);
  const toggle = (id: Id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  return <Modal title="Compartilhar material" onClose={onClose}><div className="assignment-copy"><strong>{material.title}</strong><p>Selecione os alunos que poderão acessar este material no portal.</p></div><div className="assignment-student-list">{students.length ? students.map((student) => <label key={student.id}><input type="checkbox" checked={selected.includes(student.id)} onChange={() => toggle(student.id)} /><span className="avatar">{initials(student.name)}</span><div><strong>{student.name}</strong><small>{student.level} · {student.goal}</small></div></label>) : <div className="empty-state small"><UsersRound size={30} /><h3>Nenhum aluno cadastrado</h3></div>}</div><div className="form-actions"><button className="cancel-button" onClick={onClose}>Cancelar</button><button className="primary-button" onClick={() => onSave(selected)}><UsersRound size={16} />Compartilhar com {selected.length}</button></div></Modal>;
}

export function DeleteMaterialModal({ material, onClose, onConfirm }: { material: Material; onClose: () => void; onConfirm: () => void }) {
  return <Modal title="Excluir material" onClose={onClose}><div className="delete-warning"><div className="delete-warning-icon"><Trash2 size={22} /></div><div><strong>Excluir “{material.title}”?</strong><p>O material será removido da sua biblioteca. O conteúdo original no link externo não será alterado.</p></div></div><div className="form-actions"><button className="cancel-button" onClick={onClose}>Manter material</button><button className="danger-button" onClick={onConfirm}><Trash2 size={16} />Excluir material</button></div></Modal>;
}
