import { createClient } from '@libsql/client';

const client = createClient({
  url: 'libsql://fskedu-ai-faisukhan01.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzY2MTE4NjYsImlkIjoiMDE5ZGE2NGYtZWYwMS03MWI3LWEzNDMtZDA3MzQzYTFhZGRmIiwicmlkIjoiYTM5MmI4ZjctOTY3Mi00ZjA2LWE0YzMtYTJkYTc1ZjQ2OWM0In0.LOPrQzY-XCT-CYpWOo7PcJLSiUrjG3z2qgN8XwUbxvbKdYGETI2RdwmHn0ml4LkXf8jQkHZvC_MbCbiFQBa4Dw',
});

async function run(sql) {
  try {
    await client.execute(sql);
    console.log('✓', sql.slice(0, 70));
  } catch (e) {
    if (e.message.includes('already exists') || e.message.includes('duplicate column')) {
      console.log('⚠ already exists, skipping:', sql.slice(0, 60));
    } else {
      console.error('✗ FAILED:', e.message, '\n  SQL:', sql.slice(0, 80));
    }
  }
}

console.log('🔧 Setting up Turso database...\n');

// Drop and recreate User table cleanly
await run(`DROP TABLE IF EXISTS "Achievement"`);
await run(`DROP TABLE IF EXISTS "MoodEntry"`);
await run(`DROP TABLE IF EXISTS "SolvedProblem"`);
await run(`DROP TABLE IF EXISTS "Summary"`);
await run(`DROP TABLE IF EXISTS "StudyGoal"`);
await run(`DROP TABLE IF EXISTS "Course"`);
await run(`DROP TABLE IF EXISTS "QuizQuestion"`);
await run(`DROP TABLE IF EXISTS "Quiz"`);
await run(`DROP TABLE IF EXISTS "StudySession"`);
await run(`DROP TABLE IF EXISTS "Flashcard"`);
await run(`DROP TABLE IF EXISTS "FlashcardDeck"`);
await run(`DROP TABLE IF EXISTS "Note"`);
await run(`DROP TABLE IF EXISTS "ChatMessage"`);
await run(`DROP TABLE IF EXISTS "ChatSession"`);
await run(`DROP TABLE IF EXISTS "User"`);

// Create all tables fresh
await run(`CREATE TABLE "User" ("id" TEXT NOT NULL PRIMARY KEY,"email" TEXT NOT NULL,"name" TEXT,"password" TEXT NOT NULL DEFAULT '',"googleId" TEXT,"avatar" TEXT,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
await run(`CREATE UNIQUE INDEX "User_email_key" ON "User"("email")`);
await run(`CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId")`);

await run(`CREATE TABLE "ChatSession" ("id" TEXT NOT NULL PRIMARY KEY,"userId" TEXT NOT NULL,"title" TEXT NOT NULL DEFAULT 'New Chat',"courseId" TEXT,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "ChatSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
await run(`CREATE TABLE "ChatMessage" ("id" TEXT NOT NULL PRIMARY KEY,"sessionId" TEXT NOT NULL,"role" TEXT NOT NULL,"content" TEXT NOT NULL,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
await run(`CREATE TABLE "Note" ("id" TEXT NOT NULL PRIMARY KEY,"userId" TEXT NOT NULL,"title" TEXT NOT NULL,"content" TEXT NOT NULL,"courseId" TEXT,"color" TEXT NOT NULL DEFAULT '#ffffff',"isPinned" BOOLEAN NOT NULL DEFAULT false,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
await run(`CREATE TABLE "FlashcardDeck" ("id" TEXT NOT NULL PRIMARY KEY,"userId" TEXT NOT NULL,"title" TEXT NOT NULL,"courseId" TEXT,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "FlashcardDeck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
await run(`CREATE TABLE "Flashcard" ("id" TEXT NOT NULL PRIMARY KEY,"deckId" TEXT NOT NULL,"front" TEXT NOT NULL,"back" TEXT NOT NULL,"mastered" BOOLEAN NOT NULL DEFAULT false,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Flashcard_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "FlashcardDeck" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
await run(`CREATE TABLE "StudySession" ("id" TEXT NOT NULL PRIMARY KEY,"userId" TEXT NOT NULL,"type" TEXT NOT NULL,"duration" INTEGER NOT NULL,"courseId" TEXT,"completed" BOOLEAN NOT NULL DEFAULT false,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "StudySession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
await run(`CREATE TABLE "Quiz" ("id" TEXT NOT NULL PRIMARY KEY,"userId" TEXT NOT NULL,"title" TEXT NOT NULL,"courseId" TEXT,"score" INTEGER,"totalQuestions" INTEGER NOT NULL,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Quiz_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
await run(`CREATE TABLE "QuizQuestion" ("id" TEXT NOT NULL PRIMARY KEY,"quizId" TEXT NOT NULL,"question" TEXT NOT NULL,"options" TEXT NOT NULL,"correctAnswer" TEXT NOT NULL,"userAnswer" TEXT,"isCorrect" BOOLEAN,CONSTRAINT "QuizQuestion_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "Quiz" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
await run(`CREATE TABLE "Course" ("id" TEXT NOT NULL PRIMARY KEY,"userId" TEXT NOT NULL,"name" TEXT NOT NULL,"code" TEXT NOT NULL,"color" TEXT NOT NULL DEFAULT '#10b981',"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Course_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
await run(`CREATE TABLE "StudyGoal" ("id" TEXT NOT NULL PRIMARY KEY,"userId" TEXT NOT NULL,"title" TEXT NOT NULL,"description" TEXT,"targetMinutes" INTEGER NOT NULL,"completedMinutes" INTEGER NOT NULL DEFAULT 0,"deadline" DATETIME,"isCompleted" BOOLEAN NOT NULL DEFAULT false,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "StudyGoal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
await run(`CREATE TABLE "Summary" ("id" TEXT NOT NULL PRIMARY KEY,"userId" TEXT NOT NULL,"originalText" TEXT NOT NULL,"summary" TEXT NOT NULL,"style" TEXT NOT NULL DEFAULT 'brief',"wordCount" INTEGER NOT NULL DEFAULT 0,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Summary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
await run(`CREATE TABLE "SolvedProblem" ("id" TEXT NOT NULL PRIMARY KEY,"userId" TEXT NOT NULL,"question" TEXT NOT NULL,"solution" TEXT NOT NULL,"type" TEXT NOT NULL DEFAULT 'math',"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "SolvedProblem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
await run(`CREATE TABLE "MoodEntry" ("id" TEXT NOT NULL PRIMARY KEY,"userId" TEXT NOT NULL,"mood" TEXT NOT NULL,"note" TEXT,"studyMinutes" INTEGER NOT NULL DEFAULT 0,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "MoodEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
await run(`CREATE TABLE "Achievement" ("id" TEXT NOT NULL PRIMARY KEY,"userId" TEXT NOT NULL,"key" TEXT NOT NULL,"title" TEXT NOT NULL,"description" TEXT NOT NULL,"icon" TEXT NOT NULL DEFAULT '🏆',"category" TEXT NOT NULL DEFAULT 'general',"unlockedAt" DATETIME,"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,CONSTRAINT "Achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE)`);
await run(`CREATE UNIQUE INDEX "Achievement_userId_key_key" ON "Achievement"("userId", "key")`);

console.log('\n✅ Turso database ready!');
