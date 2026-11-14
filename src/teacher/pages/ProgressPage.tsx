import { Award, ChartNoAxesCombined, ChevronRight, Target, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { initials } from '../../lib/format';
import { skillAverage, skills } from '../../lib/skills';
import { type Id, type Skill, type Student } from '../../types';

export function ProgressPage({ students, onOpenStudent }: { students: Student[]; onOpenStudent: (id: Id) => void }) {
  const [levelFilter, setLevelFilter] = useState('Todos');
  const visible = students.filter((student) => levelFilter === 'Todos' || student.level === levelFilter);
  const average = visible.length ? Math.round(visible.reduce((sum, student) => sum + student.progress, 0) / visible.length) : 0;
  const strongest = visible.length ? skills.map((skill) => ({ skill, value: skillAverage(visible, skill) })).sort((a, b) => b.value - a.value)[0] : undefined;
  const attention = visible.length ? skills.map((skill) => ({ skill, value: skillAverage(visible, skill) })).sort((a, b) => a.value - b.value)[0] : undefined;
  const topStudent = [...visible].sort((a, b) => b.progress - a.progress)[0];

  return <div className="progress-page">
    <section className="progress-hero"><div><p className="eyebrow">ACOMPANHAMENTO</p><h2>Panorama de desenvolvimento</h2><p>Compare habilidades e identifique onde cada aluno precisa de mais atenção.</p></div><div className="progress-score"><strong>{average}%</strong><span>média da turma</span></div></section>
    <section className="progress-stats"><ProgressInsight icon={Award} label="Maior destaque" value={topStudent?.name ?? '—'} note={topStudent ? `${topStudent.progress}% de progresso geral` : 'Nenhum aluno'} /><ProgressInsight icon={TrendingUp} label="Habilidade mais forte" value={strongest?.skill ?? '—'} note={strongest ? `${strongest.value}% de média` : 'Sem dados'} /><ProgressInsight icon={Target} label="Ponto de atenção" value={attention?.skill ?? '—'} note={attention ? `${attention.value}% de média` : 'Sem dados'} /></section>
    <section className="progress-grid">
      <article className="panel skill-overview"><div className="panel-heading"><div><p className="eyebrow">MÉDIA DA TURMA</p><h3>Desempenho por habilidade</h3></div><select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)}><option>Todos</option><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option><option>C2</option></select></div><div className="skill-chart">{skills.map((skill) => <SkillBar skill={skill} value={skillAverage(visible, skill)} key={skill} />)}</div></article>
      <article className="panel level-overview"><div className="panel-heading"><div><p className="eyebrow">DISTRIBUIÇÃO</p><h3>Alunos por nível</h3></div></div><div className="level-list">{['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => { const count = students.filter((student) => student.level === level).length; return <div className="level-row" key={level}><strong>{level}</strong><div><span style={{ width: `${students.length ? (count / students.length) * 100 : 0}%` }} /></div><em>{count}</em></div>; })}</div></article>
    </section>
    <section className="panel student-progress-panel"><div className="panel-heading"><div><p className="eyebrow">INDIVIDUAL</p><h3>Progresso dos alunos</h3></div><span className="results-count">{visible.length} aluno(s)</span></div>{visible.length ? <div className="progress-student-grid">{[...visible].sort((a, b) => b.progress - a.progress).map((student) => <ProgressStudentCard student={student} onOpen={onOpenStudent} key={student.id} />)}</div> : <div className="empty-state small"><ChartNoAxesCombined size={34} /><h3>Nenhum aluno neste nível</h3><p>Selecione outro nível para comparar.</p></div>}</section>
  </div>;
}

function ProgressInsight({ icon: Icon, label, value, note }: { icon: typeof Award; label: string; value: string; note: string }) {
  return <article><div><Icon size={20} /></div><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

export function SkillBar({ skill, value }: { skill: Skill; value: number }) {
  return <div className="skill-bar"><div><strong>{skill}</strong><span>{value}%</span></div><div className="skill-bar-track"><span style={{ width: `${value}%` }} /></div></div>;
}

function ProgressStudentCard({ student, onOpen }: { student: Student; onOpen: (id: Id) => void }) {
  const strongest = skills.reduce((best, skill) => student.skills[skill] > student.skills[best] ? skill : best, skills[0]);
  return <article className="progress-student-card"><div className="progress-student-heading"><div className="avatar">{initials(student.name)}</div><div><strong>{student.name}</strong><span>{student.level} · {student.goal}</span></div><b>{student.progress}%</b></div><div className="student-progress-track"><span style={{ width: `${student.progress}%` }} /></div><div className="progress-student-meta"><span>Destaque: <strong>{strongest}</strong></span><span>{student.lessons.length} aula(s)</span></div><button onClick={() => onOpen(student.id)}>Ver perfil <ChevronRight size={15} /></button></article>;
}
