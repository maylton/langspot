import { ExternalLink, FileAudio, FileQuestion, FileText, FolderOpen, ImagePlus, Plus, Search, Trash2, UsersRound, Video } from 'lucide-react';
import { useState } from 'react';
import { formatDate } from '../../lib/format';
import { type Material, type MaterialType } from '../../types';

export function MaterialsPage({ materials, onNew, onDelete, onAssign }: { materials: Material[]; onNew: () => void; onDelete: (material: Material) => void; onAssign: (material: Material) => void }) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<MaterialType | 'Todos'>('Todos');
  const [levelFilter, setLevelFilter] = useState('Todos');
  const visible = materials.filter((material) => {
    const matchesQuery = `${material.title} ${material.description} ${material.skill}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (typeFilter === 'Todos' || material.type === typeFilter) && (levelFilter === 'Todos' || material.level === levelFilter);
  });

  return <div className="materials-layout">
    <section className="materials-hero"><div><p className="eyebrow">BIBLIOTECA</p><h2>Recursos para suas próximas aulas</h2><p>Organize links, atividades, áudios e referências por nível e habilidade.</p></div><div className="materials-total"><strong>{materials.length}</strong><span>materiais salvos</span></div></section>
    <section className="panel materials-toolbar"><div className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar título, habilidade..." /></div><div className="material-filters"><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as MaterialType | 'Todos')}><option>Todos</option><option>PDF</option><option>Documento</option><option>Apresentação</option><option>Imagem</option><option>Vídeo</option><option>Áudio</option><option>Link</option><option>Atividade</option></select><select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}><option>Todos</option><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option></select></div></section>
    {visible.length ? <section className="materials-grid">{visible.map((material) => <MaterialCard material={material} onDelete={onDelete} onAssign={onAssign} key={material.id} />)}</section> : <section className="panel empty-state"><FolderOpen size={42} /><h3>Nenhum material encontrado</h3><p>Ajuste os filtros ou adicione um novo recurso à biblioteca.</p><button className="secondary-button compact" onClick={onNew}><Plus size={16} />Novo material</button></section>}
  </div>;
}

function MaterialCard({ material, onDelete, onAssign }: { material: Material; onDelete: (material: Material) => void; onAssign: (material: Material) => void }) {
  const Icon = materialIcon(material.type);
  return <article className="material-card"><div className={`material-icon type-${material.type.toLowerCase().replace('í', 'i').replace('á', 'a')}`}><Icon size={23} /></div><div className="material-tags"><span>{material.type}</span><span>{material.level}</span><span>{material.skill}</span></div><h3>{material.title}</h3><p>{material.description || 'Sem descrição.'}</p><small>Adicionado em {formatDate(material.createdAt)}</small><div className="material-actions"><button onClick={() => onAssign(material)} title="Compartilhar com alunos"><UsersRound size={15} />{material.assignedStudentIds?.length ?? 0}</button><a href={material.url} target="_blank" rel="noreferrer"><ExternalLink size={15} />{material.source === 'upload' ? 'Abrir arquivo' : 'Abrir material'}</a><button onClick={() => onDelete(material)} title="Excluir material"><Trash2 size={15} /></button></div></article>;
}

function materialIcon(type: MaterialType) { if (type === 'Vídeo') return Video; if (type === 'Áudio') return FileAudio; if (type === 'Atividade') return FileQuestion; if (type === 'Link') return ExternalLink; if (type === 'Imagem') return ImagePlus; return FileText; }
