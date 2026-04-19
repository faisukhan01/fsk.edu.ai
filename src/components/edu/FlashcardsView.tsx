'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Plus, Trash2, RotateCcw, ChevronLeft, ChevronRight, Sparkles, Loader2, Check, GripVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  mastered: boolean;
}

interface Deck {
  id: string;
  title: string;
  cards: Flashcard[];
  createdAt: string;
  updatedAt: string;
}

export function FlashcardsView() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeck, setActiveDeck] = useState<Deck | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [showNewDeck, setShowNewDeck] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState('');
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [genTopic, setGenTopic] = useState('');

  const loadDecks = () => {
    fetch('/api/flashcards').then(r => r.json()).then(data => { if (data.decks) setDecks(data.decks); }).catch(() => {});
  };

  useEffect(() => { loadDecks(); }, []);

  const createDeck = async () => {
    if (!newDeckTitle.trim()) return;
    await fetch('/api/flashcards', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create_deck', title: newDeckTitle.trim() })
    });
    setNewDeckTitle(''); setShowNewDeck(false); loadDecks();
  };

  const addCard = async () => {
    if (!activeDeck || !newFront.trim() || !newBack.trim()) return;
    await fetch('/api/flashcards', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_card', deckId: activeDeck.id, front: newFront.trim(), back: newBack.trim() })
    });
    setNewFront(''); setNewBack(''); loadDecks();
    setActiveDeck(prev => prev ? { ...prev, cards: [...prev.cards, { id: Date.now().toString(), front: newFront.trim(), back: newBack.trim(), mastered: false }] } : null);
  };

  const generateCards = async () => {
    if (!activeDeck || !genTopic.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: `Generate exactly 5 flashcards about "${genTopic}". Return ONLY valid JSON array in this format:
[{"front": "Question or term", "back": "Answer or definition"}]` }
          ]
        })
      });
      const data = await res.json();
      if (data.response) {
        const match = data.response.match(/\[[\s\S]*\]/);
        if (match) {
          const cards = JSON.parse(match[0]);
          for (const card of cards) {
            await fetch('/api/flashcards', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'add_card', deckId: activeDeck.id, front: card.front, back: card.back })
            });
          }
          loadDecks();
          setActiveDeck(prev => prev ? {
            ...prev,
            cards: [...prev.cards, ...cards.map((c: { front: string; back: string }) => ({ id: Date.now().toString() + Math.random(), front: c.front, back: c.back, mastered: false }))]
          } : null);
          setGenTopic('');
        }
      }
    } catch { /* handle */ }
    finally { setIsGenerating(false); }
  };

  const deleteDeck = async (id: string) => {
    await fetch('/api/flashcards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete_deck', deckId: id }) });
    loadDecks(); setActiveDeck(null);
  };

  const toggleMastered = async (cardId: string) => {
    await fetch('/api/flashcards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle_mastered', deckId: cardId }) });
    setActiveDeck(prev => prev ? { ...prev, cards: prev.cards.map(c => c.id === cardId ? { ...c, mastered: !c.mastered } : c) } : null);
  };

  const openDeck = (deck: Deck) => { setActiveDeck(deck); setCardIndex(0); setFlipped(false); };
  const nextCard = () => { setFlipped(false); setCardIndex(i => Math.min(i + 1, (activeDeck?.cards.length || 1) - 1)); };
  const prevCard = () => { setFlipped(false); setCardIndex(i => Math.max(i - 1, 0)); };

  if (activeDeck) {
    const card = activeDeck.cards[cardIndex];
    const masteredCount = activeDeck.cards.filter(c => c.mastered).length;
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveDeck(null)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div>
              <h2 className="font-semibold text-sm">{activeDeck.title}</h2>
              <p className="text-xs text-muted-foreground">{cardIndex + 1} of {activeDeck.cards.length} · {masteredCount} mastered</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">{Math.round((masteredCount / activeDeck.cards.length) * 100)}% mastered</Badge>
        </div>
        <div className="px-4 py-2"><div className="h-1 rounded-full bg-muted"><div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${((cardIndex + 1) / activeDeck.cards.length) * 100}%` }} /></div></div>

        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-lg w-full space-y-4">
            {activeDeck.cards.length > 0 && card ? (
              <>
                <div onClick={() => setFlipped(!flipped)} className="cursor-pointer perspective-1000">
                  <Card className={`border-0 shadow-lg transition-all duration-500 ${flipped ? 'bg-violet-50 dark:bg-violet-950/20' : 'bg-card'}`} style={{ minHeight: '220px' }}>
                    <CardContent className="p-6 md:p-8 flex flex-col items-center justify-center text-center" style={{ minHeight: '220px' }}>
                      {!flipped ? (
                        <>
                          <Badge variant="outline" className="mb-4 text-xs">FRONT</Badge>
                          <p className="text-lg font-semibold">{card.front}</p>
                        </>
                      ) : (
                        <>
                          <Badge variant="outline" className="mb-4 text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">BACK</Badge>
                          <div className="markdown-content text-sm"><p>{card.back}</p></div>
                        </>
                      )}
                      <p className="text-xs text-muted-foreground mt-4">Click to {flipped ? 'see question' : 'reveal answer'}</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={prevCard} disabled={cardIndex === 0}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant={card.mastered ? 'default' : 'outline'} className="rounded-xl gap-2" onClick={() => toggleMastered(card.id)}>
                    <Check className="w-4 h-4" /> {card.mastered ? 'Mastered ✓' : 'Mark as Mastered'}
                  </Button>
                  <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={nextCard} disabled={cardIndex === activeDeck.cards.length - 1}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                <Card className="border-0 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input value={newFront} onChange={(e) => setNewFront(e.target.value)} placeholder="Front..." className="text-sm rounded-xl" />
                      <Input value={newBack} onChange={(e) => setNewBack(e.target.value)} placeholder="Back..." className="text-sm rounded-xl" />
                      <Button onClick={addCard} disabled={!newFront.trim() || !newBack.trim()} className="shrink-0 rounded-xl bg-violet-600 hover:bg-violet-700">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Input value={genTopic} onChange={(e) => setGenTopic(e.target.value)} placeholder="Generate AI cards from topic..." className="text-sm rounded-xl flex-1" />
                      <Button onClick={generateCards} disabled={isGenerating || !genTopic.trim()} variant="outline" className="shrink-0 rounded-xl gap-1">
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium">No cards yet</p>
                  <p className="text-sm text-muted-foreground mb-3">Add cards manually or generate with AI</p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center max-w-sm mx-auto">
                    <Input value={newFront} onChange={(e) => setNewFront(e.target.value)} placeholder="Front..." className="text-sm rounded-xl" />
                    <Input value={newBack} onChange={(e) => setNewBack(e.target.value)} placeholder="Back..." className="text-sm rounded-xl" />
                    <Button onClick={addCard} disabled={!newFront.trim() || !newBack.trim()} className="rounded-xl bg-violet-600 hover:bg-violet-700 sm:self-center">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
            <BookOpen className="w-4.5 h-4.5 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">Flashcards</h2>
            <p className="text-xs text-muted-foreground">Create and study with smart flashcards</p>
          </div>
        </div>
        <Dialog open={showNewDeck} onOpenChange={setShowNewDeck}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700 rounded-xl gap-2 text-sm">
              <Plus className="w-4 h-4" /> New Deck
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Deck</DialogTitle>
            </DialogHeader>
            <Input value={newDeckTitle} onChange={(e) => setNewDeckTitle(e.target.value)} placeholder="Deck name..." className="rounded-xl" onKeyDown={(e) => e.key === 'Enter' && createDeck()} />
            <Button onClick={createDeck} disabled={!newDeckTitle.trim()} className="bg-violet-600 hover:bg-violet-700 rounded-xl">Create Deck</Button>
          </DialogContent>
        </Dialog>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {decks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-16 px-4 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center mb-4 shadow-lg">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-1.5">No Flashcard Decks Yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mb-4">Create your first deck or generate one with AI to start studying</p>
              <Button onClick={() => setShowNewDeck(true)} variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Create Flashcard Deck
              </Button>
            </motion.div>
          ) : (
            decks.map(deck => (
              <Card key={deck.id} className="border-0 shadow-sm cursor-pointer hover:bg-accent/50 transition-all group" onClick={() => openDeck(deck)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{deck.title}</p>
                      <p className="text-xs text-muted-foreground">{deck.cards.length} cards · {deck.cards.filter(c => c.mastered).length} mastered</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-50 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); deleteDeck(deck.id); }}>
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
