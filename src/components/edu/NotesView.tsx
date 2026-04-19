'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Trash2, Pin, PinOff, Search, Palette, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

const noteColors = ['#ffffff', '#fef3c7', '#d1fae5', '#dbeafe', '#fce7f3', '#e0e7ff', '#f3e8ff', '#ccfbf1'];

export function NotesView() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formColor, setFormColor] = useState('#ffffff');

  const loadNotes = () => {
    fetch('/api/notes').then(r => r.json()).then(data => { if (data.notes) setNotes(data.notes); }).catch(() => {});
  };

  useEffect(() => { loadNotes(); }, []);

  const saveNote = async () => {
    if (!formTitle.trim() && !formContent.trim()) return;
    if (isNew) {
      await fetch('/api/notes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: formTitle.trim() || 'Untitled Note', content: formContent.trim(), color: formColor }) });
    } else if (editNote) {
      await fetch('/api/notes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editNote.id, title: formTitle.trim() || 'Untitled Note', content: formContent.trim(), color: formColor }) });
    }
    closeForm(); loadNotes();
  };

  const deleteNote = async (id: string) => {
    await fetch(`/api/notes?id=${id}`, { method: 'DELETE' });
    loadNotes();
  };

  const togglePin = async (note: Note) => {
    await fetch('/api/notes', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: note.id, isPinned: !note.isPinned }) });
    loadNotes();
  };

  const openNew = () => { setIsNew(true); setEditNote(null); setFormTitle(''); setFormContent(''); setFormColor('#ffffff'); };
  const openEdit = (note: Note) => { setIsNew(false); setEditNote(note); setFormTitle(note.title); setFormContent(note.content); setFormColor(note.color); };
  const closeForm = () => { setEditNote(null); setIsNew(false); setFormTitle(''); setFormContent(''); setFormColor('#ffffff'); };

  const filtered = notes.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()));
  const pinned = filtered.filter(n => n.isPinned);
  const unpinned = filtered.filter(n => !n.isPinned);

  const formatDate = (date: string) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const formatFullDate = (date: string) => new Date(date).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  const exportAsMarkdown = () => {
    const header = `# FSK EDU AI - Study Notes\n> Exported on ${formatFullDate(new Date().toISOString())}\n\n---\n\n`;
    const body = notes.map(note => {
      return `## ${note.title}\nCreated: ${formatFullDate(note.createdAt)} | Updated: ${formatFullDate(note.updatedAt)}\nColor: ${note.color}\n\n${note.content || '*No content*'}\n\n---`;
    }).join('\n\n');
    const content = header + body + '\n';
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fsk-edu-notes-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsJSON = () => {
    const content = JSON.stringify(notes, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fsk-edu-notes-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center">
            <FileText className="w-4.5 h-4.5 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Smart Notes</h2>
            <p className="text-xs text-muted-foreground">{notes.length} notes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="rounded-xl gap-2 text-sm" disabled={notes.length === 0}>
                <Download className="w-4 h-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportAsMarkdown}>
                <FileText className="w-4 h-4 mr-2" />
                Export All Notes as Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportAsJSON}>
                <FileText className="w-4 h-4 mr-2" />
                Export All Notes as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={openNew} className="bg-sky-600 hover:bg-sky-700 rounded-xl gap-2 text-sm">
            <Plus className="w-4 h-4" /> New Note
          </Button>
        </div>
      </div>

      <div className="px-4 py-2 border-b">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search notes..." className="pl-9 rounded-xl text-sm" />
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="max-w-4xl mx-auto">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 px-4 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center mb-4 shadow-lg">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-1.5">{searchQuery ? 'No Notes Found' : 'No Notes Yet'}</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">{searchQuery ? 'Try a different search term' : 'Start capturing your thoughts and study materials with colorful notes'}</p>
              {!searchQuery && (
                <Button onClick={openNew} variant="outline" size="sm" className="gap-2">
                  <Plus className="w-4 h-4" /> Create Your First Note
                </Button>
              )}
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pinned.length > 0 && pinned.map(note => (
                <Card key={note.id} className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-all group animate-fade-in-up" style={{ backgroundColor: note.color }} onClick={() => openEdit(note)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm line-clamp-1 flex-1">{note.title}</h3>
                      <div className="flex gap-0.5 opacity-50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); togglePin(note); }}><PinOff className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                      </div>
                    </div>
                    {note.isPinned && <div className="flex items-center gap-1 mb-1"><Pin className="w-3 h-3 text-primary" /><span className="text-[10px] text-primary">Pinned</span></div>}
                    <p className="text-xs text-muted-foreground line-clamp-3">{note.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">{formatDate(note.updatedAt)}</p>
                  </CardContent>
                </Card>
              ))}
              {unpinned.map(note => (
                <Card key={note.id} className="border-0 shadow-sm cursor-pointer hover:shadow-md transition-all group animate-fade-in-up" style={{ backgroundColor: note.color }} onClick={() => openEdit(note)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-sm line-clamp-1 flex-1">{note.title}</h3>
                      <div className="flex gap-0.5 opacity-50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); togglePin(note); }}><Pin className="w-3 h-3" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-3">{note.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-2">{formatDate(note.updatedAt)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <Dialog open={editNote !== null || isNew} onOpenChange={(open) => { if (!open) closeForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isNew ? 'New Note' : 'Edit Note'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Note title..." className="rounded-xl font-medium" />
            <Textarea value={formContent} onChange={(e) => setFormContent(e.target.value)} placeholder="Write your note..." className="min-h-[200px] resize-none rounded-xl text-sm" />
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <div className="flex gap-1.5">
                {noteColors.map(c => (
                  <button key={c} onClick={() => setFormColor(c)} className={`w-6 h-6 rounded-full border-2 transition-all ${formColor === c ? 'border-primary scale-110' : 'border-transparent hover:scale-105'}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeForm} className="rounded-xl">Cancel</Button>
              <Button onClick={saveNote} className="bg-sky-600 hover:bg-sky-700 rounded-xl">Save Note</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
