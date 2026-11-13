import { BookOpen, X } from 'lucide-react';

export function Modal({ title, onClose, children, className = '' }: { title: string; onClose: () => void; children: React.ReactNode; className?: string }) { return <div className="modal-backdrop" onMouseDown={onClose}><section className={`modal ${className}`.trim()} onMouseDown={(e) => e.stopPropagation()}><div className="modal-header"><h2>{title}</h2><button className="icon-button" onClick={onClose}><X size={18} /></button></div>{children}</section></div>; }

export function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) { return <label>{label}<input {...props} /></label>; }

export function SelectField({ name, label, options }: { name: string; label: string; options: string[] }) { return <label>{label}<select name={name}>{options.map((option) => <option key={option}>{option}</option>)}</select></label>; }

export function PlaceholderPage({ title }: { title: string }) { return <section className="panel empty-state placeholder"><BookOpen size={44} /><h2>{title}</h2><p>Este módulo já está reservado na navegação e será implementado nas próximas etapas.</p></section>; }

export function StatCard({ label, value, note }: { label: string; value: string; note: string }) { return <article className="stat-card"><span>{label}</span><strong>{value}</strong><small>{note}</small></article>; }

export function Timeline({ time, name, topic }: { time: string; name: string; topic: string }) { return <div className="timeline-item"><div className="timeline-time">{time}</div><div className="timeline-dot" /><div><strong>{name}</strong><span>{topic}</span></div></div>; }

export function Progress({ value }: { value: number }) { return <div className="progress-wrap"><div className="progress-meta"><span>Progresso</span><strong>{value}%</strong></div><div className="progress-track"><div style={{ width: `${value}%` }} /></div></div>; }

export function Detail({ label, value }: { label: string; value: string }) { return <div className="detail"><span>{label}</span><strong>{value}</strong></div>; }
