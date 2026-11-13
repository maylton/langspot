import { BookOpen, ExternalLink, FileText } from 'lucide-react';
import { DbMaterial } from '../../supabase';
import { EmptyPortal } from '../components/ui';

export function StudentMaterials({ materials }: { materials: DbMaterial[] }) {
  return <div className="student-page"><section className="student-panel"><div className="student-section-heading"><div><p className="eyebrow">BIBLIOTECA</p><h2>Materiais compartilhados</h2></div><span>{materials.length} item(ns)</span></div>{materials.length ? <div className="portal-material-grid">{materials.map((material) => <article key={material.id}><FileText size={22} /><span>{material.type} · {material.level}</span><h3>{material.title}</h3><p>{material.description || `${material.skill} para seus estudos.`}</p><a href={material.url} target="_blank" rel="noreferrer">Abrir material <ExternalLink size={14} /></a></article>)}</div> : <EmptyPortal icon={BookOpen} title="Nenhum material compartilhado" text="Quando o professor enviar um recurso, ele aparecerá aqui." />}</section></div>;
}
