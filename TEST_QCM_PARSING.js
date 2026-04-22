// Test file: Test the remedial QCM JSON parsing
// Run this in the browser console to validate the parsing logic

const testJsonExamples = [
  // Perfect JSON
  `[{"question":"What is 2+2?","choices":["3","4","5","6"],"correct":1},{"question":"What is 3+3?","choices":["5","6","7","8"],"correct":1},{"question":"What is 4+4?","choices":["7","8","9","10"],"correct":1}]`,

  // Trailing comma error
  `[{"question":"Q1?","choices":["A","B","C","D"],"correct":0,},{"question":"Q2?","choices":["A","B","C","D"],"correct":1,},{"question":"Q3?","choices":["A","B","C","D"],"correct":2,}]`,

  // Single quotes
  `[{'question':'Q1?','choices':['A','B','C','D'],'correct':0},{'question':'Q2?','choices':['A','B','C','D'],'correct':1},{'question':'Q3?','choices':['A','B','C','D'],'correct':2}]`,

  // Mixed whitespace and formatting
  `[
    {"question":"Question 1?","choices":["Option A","Option B","Option C","Option D"],"correct":0},
    {"question":"Question 2?","choices":["Option A","Option B","Option C","Option D"],"correct":1},
    {"question":"Question 3?","choices":["Option A","Option B","Option C","Option D"],"correct":2}
  ]`,
];

function parseQcmJson(rawContent) {
  let text = rawContent.trim();

  // Attempt 1: Standard JSON parse
  try {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start !== -1 && end !== -1) {
      const arrayStr = text.substring(start, end + 1);
      const parsed = JSON.parse(arrayStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validated = parsed.filter(q =>
          q && q.question && Array.isArray(q.choices) && q.choices.length >= 2 && typeof q.correct === 'number'
        ).slice(0, 5);
        if (validated.length > 0) return { success: true, questions: validated, method: "Standard parse" };
      }
    }
  } catch (e) {}

  // Attempt 2: Fix common trailing comma errors
  try {
    const start = text.indexOf('[');
    const end = text.lastIndexOf(']');
    if (start !== -1 && end !== -1) {
      let arrayStr = text.substring(start, end + 1);
      arrayStr = arrayStr.replace(/,\s*([\]}])/g, '$1');
      arrayStr = arrayStr.replace(/'/g, '"');
      const parsed = JSON.parse(arrayStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validated = parsed.filter(q =>
          q && q.question && Array.isArray(q.choices) && q.choices.length >= 2 && typeof q.correct === 'number'
        ).slice(0, 5);
        if (validated.length > 0) return { success: true, questions: validated, method: "Cleaned parse" };
      }
    }
  } catch (e) {}

  // Attempt 3: Aggressive extraction
  try {
    const fallbackQuestions = [];
    const blocks = text.match(/\{[^{}]*"question"[^{}]*\}/g);
    if (blocks) {
      for (const block of blocks) {
        try {
          let cleanBlock = block.replace(/'/g, '"');
          const q = JSON.parse(cleanBlock);
          if (q && q.question && Array.isArray(q.choices) && q.choices.length >= 2) {
            fallbackQuestions.push({
              question: q.question,
              choices: q.choices.map(c => String(c)),
              correct: typeof q.correct === 'number' ? q.correct : 0
            });
          }
        } catch(e) {}
      }
    }
    if (fallbackQuestions.length > 0) {
      return { success: true, questions: fallbackQuestions.slice(0, 5), method: "Regex extraction" };
    }
  } catch(e) {}

  return { success: false, questions: [], method: "All attempts failed" };
}

// Run tests
console.log("Testing remedial QCM JSON parsing...\n");
testJsonExamples.forEach((example, idx) => {
  const result = parseQcmJson(example);
  console.log(`Test ${idx + 1}: ${result.method}`);
  console.log(`✓ Success: ${result.success}, Questions parsed: ${result.questions.length}`);
  if (result.success) {
    result.questions.forEach((q, i) => {
      console.log(`  Q${i+1}: "${q.question.substring(0, 30)}..." (Answer: ${q.correct})`);
    });
  }
  console.log("");
});

console.log("All parsing tests completed!");
