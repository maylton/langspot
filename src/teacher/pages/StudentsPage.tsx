import { Search, UsersRound } from 'lucide-react';
import { type Id, type ScheduledLesson, type Student } from '../../types';
import { StudentList } from '../components/StudentList';

export function StudentsPage({ students, schedule, query, setQuery, onOpen }: { students: Student[]; schedule: ScheduledLesson[]; query: string; setQuery: (value: string) => void; onOpen: (id: Id) => void }) {
  return <section className="panel"><div className="panel-heading"><div><p className="eyebrow">GESTÃO</p><h3>Todos os alunos</h3></div><div className="search-box"><Search size={17} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nome, nível ou objetivo" /></div></div>{students.length ? <StudentList students={students} schedule={schedule} onOpen={onOpen} /> : <div className="empty-state"><UsersRound size={38} /><h3>Nenhum aluno encontrado</h3><p>Tente outra busca ou cadastre um novo aluno.</p></div>}</section>;
}
