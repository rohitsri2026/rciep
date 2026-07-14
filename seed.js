/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up existing database records to prevent duplicate keys...");
  
  // Clear tables in reverse dependency order
  await prisma.attempt.deleteMany({});
  await prisma.testQuestion.deleteMany({});
  await prisma.test.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.subject.deleteMany({});
  
  console.log("Seeding default users...");

  const adminHashed = await bcrypt.hash("admin123", 10);
  const studentHashed = await bcrypt.hash("student123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@rci.com" },
    update: { password: adminHashed, role: "ADMIN" },
    create: { name: "System Admin", email: "admin@rci.com", password: adminHashed, role: "ADMIN" },
  });
  console.log("Admin user resolved:", admin.email);

  const student = await prisma.user.upsert({
    where: { email: "student@rci.com" },
    update: { password: studentHashed, role: "STUDENT" },
    create: { name: "Demo Student", email: "student@rci.com", password: studentHashed, role: "STUDENT" },
  });
  console.log("Student user resolved:", student.email);

  console.log("Seeding Subjects and Categories...");

  // Subject 1: Quantitative Aptitude
  const subQuant = await prisma.subject.create({
    data: {
      name: "Quantitative Aptitude",
      description: "Mathematical skills and numerical logic problems",
      status: "ACTIVE",
      color: "#3b82f6", // Blue
      categories: {
        create: [
          { name: "Percentage & Profit-Loss", description: "Profit, loss, discount, and percentage questions", status: "ACTIVE" },
          { name: "Time and Work", description: "Wages, efficiency, pipes, and cisterns problems", status: "ACTIVE" },
          { name: "Algebra", description: "Linear equations, quadratic inequalities, and formulas", status: "ACTIVE" }
        ]
      }
    },
    include: { categories: true }
  });

  // Subject 2: General Intelligence & Reasoning
  const subReasoning = await prisma.subject.create({
    data: {
      name: "General Intelligence & Reasoning",
      description: "Non-verbal classification, coding, series, and logic mapping",
      status: "ACTIVE",
      color: "#6366f1", // Indigo
      categories: {
        create: [
          { name: "Coding-Decoding", description: "Letter codes, numeric translations, and patterns", status: "ACTIVE" },
          { name: "Blood Relations", description: "Ancestors, family trees, and relations logic", status: "ACTIVE" },
          { name: "Syllogism", description: "Logical deductions from statements and conclusions", status: "ACTIVE" }
        ]
      }
    },
    include: { categories: true }
  });

  // Subject 3: English Language
  const subEnglish = await prisma.subject.create({
    data: {
      name: "English Language & Comprehension",
      description: "Grammar, spotting errors, reading passages, and vocabulary",
      status: "ACTIVE",
      color: "#10b981", // Emerald
      categories: {
        create: [
          { name: "Grammar & Spotting Errors", description: "Tenses, prepositions, articles, and active/passive voices", status: "ACTIVE" },
          { name: "Synonyms & Antonyms", description: "Vocabulary tests and close meaning matches", status: "ACTIVE" }
        ]
      }
    },
    include: { categories: true }
  });

  // Subject 4: General Knowledge
  const subGK = await prisma.subject.create({
    data: {
      name: "General Knowledge",
      description: "Static GK, Indian History, Polity, and Current Affairs",
      status: "ACTIVE",
      color: "#f59e0b", // Amber
      categories: {
        create: [
          { name: "Current Affairs", description: "Global and national events of past 1 year", status: "ACTIVE" },
          { name: "Indian Polity", description: "Constitutional articles, parliament, and judiciary structure", status: "ACTIVE" }
        ]
      }
    },
    include: { categories: true }
  });

  // Subject 5: Computer Awareness
  const subComputer = await prisma.subject.create({
    data: {
      name: "Computer Awareness",
      description: "Hardware, software, networking, and IT fundamentals",
      status: "ACTIVE",
      color: "#f43f5e", // Rose
      categories: {
        create: [
          { name: "Computer Networking", description: "IP addressing, protocols, and network topologies", status: "ACTIVE" }
        ]
      }
    },
    include: { categories: true }
  });

  console.log("Subjects created. Seeding Questions...");

  const catPerc = subQuant.categories.find(c => c.name.includes("Percentage"));
  const catTime = subQuant.categories.find(c => c.name.includes("Time"));
  const catAlg = subQuant.categories.find(c => c.name.includes("Algebra"));
  const catCoding = subReasoning.categories.find(c => c.name.includes("Coding"));
  const catRelations = subReasoning.categories.find(c => c.name.includes("Blood"));
  const catSyll = subReasoning.categories.find(c => c.name.includes("Syllogism"));
  const catGrammar = subEnglish.categories.find(c => c.name.includes("Grammar"));
  const catVocab = subEnglish.categories.find(c => c.name.includes("Synonyms"));
  const catPolity = subGK.categories.find(c => c.name.includes("Polity"));
  const catCurrent = subGK.categories.find(c => c.name.includes("Current"));
  const catNet = subComputer.categories.find(c => c.name.includes("Networking"));

  // Create standard questions across all subjects
  await prisma.question.createMany({
    data: [
      {
        text: "If a merchant buys a cycle for $1200 and sells it for $1500, what is the profit percentage earned?",
        type: "MCQ",
        options: { A: "20%", B: "25%", C: "30%", D: "15%" },
        correctAnswer: "B",
        explanation: "Profit = 1500 - 1200 = 300. Profit % = (300 / 1200) * 100 = 25%.",
        points: 2,
        difficulty: "EASY",
        status: "APPROVED",
        subjectId: subQuant.id,
        categoryId: catPerc.id
      },
      {
        text: "The price of petrol increased by 25%. By how much percent must a consumer reduce consumption so that expenditures remain unchanged?",
        type: "MCQ",
        options: { A: "20%", B: "25%", C: "15%", D: "33.3%" },
        correctAnswer: "A",
        explanation: "Reduction = [25 / (100 + 25)] * 100 = 20%.",
        points: 2,
        difficulty: "MEDIUM",
        status: "APPROVED",
        subjectId: subQuant.id,
        categoryId: catPerc.id
      },
      {
        text: "A can complete a piece of work in 12 days and B can do it in 15 days. Working together, how many days will they take?",
        type: "NUMERICAL",
        correctAnswer: "6.67",
        explanation: "Rate = 1/12 + 1/15 = 3/20. Days = 20/3 = 6.67 days.",
        points: 3,
        difficulty: "MEDIUM",
        status: "APPROVED",
        subjectId: subQuant.id,
        categoryId: catTime.id
      },
      {
        text: "Solve for x in the algebraic equation: 3x - 7 = 5x + 9",
        type: "NUMERICAL",
        correctAnswer: "-8",
        explanation: "3x - 5x = 9 + 7 => -2x = 16 => x = -8.",
        points: 2,
        difficulty: "EASY",
        status: "APPROVED",
        subjectId: subQuant.id,
        categoryId: catAlg.id
      },
      {
        text: "In a certain code language, 'ROSE' is written as 'TQUG'. How is 'LILY' written?",
        type: "MCQ",
        options: { A: "NKNA", B: "NKNK", C: "NKMA", D: "NKLA" },
        correctAnswer: "A",
        explanation: "Each letter is shifted by +2. L+2=N, I+2=K, L+2=N, Y+2=A (wraps).",
        points: 1,
        difficulty: "EASY",
        status: "APPROVED",
        subjectId: subReasoning.id,
        categoryId: catCoding.id
      },
      {
        text: "Pointing to a photograph, Suresh said, 'He is the son of the only son of my mother.' How is Suresh related to the boy?",
        type: "MCQ",
        options: { A: "Father", B: "Uncle", C: "Brother", D: "Cousin" },
        correctAnswer: "A",
        explanation: "The only son of mother is Suresh himself, so the boy is Suresh's son.",
        points: 1,
        difficulty: "MEDIUM",
        status: "APPROVED",
        subjectId: subReasoning.id,
        categoryId: catRelations.id
      },
      {
        text: "Statement: All dogs are cats. Some cats are tigers. Conclusion: Some dogs are tigers. (True/False)",
        type: "TRUE_FALSE",
        correctAnswer: "false",
        explanation: "No direct intersection is guaranteed between dogs and tigers in standard syllogisms.",
        points: 2,
        difficulty: "MEDIUM",
        status: "APPROVED",
        subjectId: subReasoning.id,
        categoryId: catSyll.id
      },
      {
        text: "Identify the part of the sentence containing an error: 'Neither the teacher nor the students was present.'",
        type: "MCQ",
        options: { A: "Neither the teacher", B: "nor the students", C: "was present", D: "No error" },
        correctAnswer: "C",
        explanation: "Closer subject 'students' is plural, so it should be 'were present'.",
        points: 2,
        difficulty: "MEDIUM",
        status: "APPROVED",
        subjectId: subEnglish.id,
        categoryId: catGrammar.id
      },
      {
        text: "What is the synonym of the word 'PRAGMATIC'?",
        type: "MCQ",
        options: { A: "Practical", B: "Idealistic", C: "Dreamy", D: "Vague" },
        correctAnswer: "A",
        explanation: "Pragmatic means guided by practical considerations rather than ideals.",
        points: 1,
        difficulty: "EASY",
        subjectId: subEnglish.id,
        categoryId: catVocab.id,
        status: "APPROVED"
      },
      {
        text: "Which article of the Indian Constitution guarantees the Right to Equality?",
        type: "MCQ",
        options: { A: "Article 12", B: "Article 14", C: "Article 19", D: "Article 21" },
        correctAnswer: "B",
        explanation: "Article 14 provides equality before the law and equal protection of the laws.",
        points: 2,
        difficulty: "EASY",
        status: "APPROVED",
        subjectId: subGK.id,
        categoryId: catPolity.id
      },
      {
        text: "Who has been named the host country for the World Expo 2030?",
        type: "MCQ",
        options: { A: "Italy", B: "Saudi Arabia", C: "South Korea", D: "Japan" },
        correctAnswer: "B",
        explanation: "Riyadh, Saudi Arabia won the bid to host the World Expo 2030.",
        points: 1,
        difficulty: "MEDIUM",
        status: "APPROVED",
        subjectId: subGK.id,
        categoryId: catCurrent.id
      },
      {
        text: "Which protocol is used for securely transmitting data over a web page browser connection?",
        type: "MCQ",
        options: { A: "HTTP", B: "FTP", C: "HTTPS", D: "SMTP" },
        correctAnswer: "C",
        explanation: "HTTPS is HyperText Transfer Protocol Secure, which encrypts traffic with SSL/TLS.",
        points: 2,
        difficulty: "EASY",
        status: "APPROVED",
        subjectId: subComputer.id,
        categoryId: catNet.id
      }
    ]
  });

  console.log("Questions seeded. Creating 18 distinct mock tests...");

  // Retrieve questions for linking
  const dbQuestions = await prisma.question.findMany();
  
  // Test definitions
  const testDefinitions = [
    {
      title: "SSC CGL Full Mock Test - 12",
      description: "Full mock test for CGL exam simulation with official marks and structure.",
      duration: 60,
      totalMarks: 200,
      passMarks: 80,
      type: "MOCK_TEST",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      negativeMarking: 0.25,
      subjectId: subQuant.id,
      categoryId: catPerc.id,
      completedCount: 45
    },
    {
      title: "SBI PO Quantitative Aptitude Master",
      description: "Advanced practice set targeting high-level math and numerical shortcuts.",
      duration: 45,
      totalMarks: 35,
      passMarks: 15,
      type: "MOCK_TEST",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      negativeMarking: 0.25,
      subjectId: subQuant.id,
      categoryId: catAlg.id,
      completedCount: 28
    },
    {
      title: "RRB NTPC CBT-1 Past Paper 2022",
      description: "Official past exam paper from Railway NTPC recruitment 2022 CBT cycle.",
      duration: 90,
      totalMarks: 100,
      passMarks: 40,
      type: "PREVIOUS_YEAR_PAPER",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      negativeMarking: 0.33,
      subjectId: subQuant.id,
      categoryId: catTime.id,
      completedCount: 82
    },
    {
      title: "UP Police Constable Mock - 05",
      description: "State level Constable exam mockup with regional patterns and marks.",
      duration: 120,
      totalMarks: 300,
      passMarks: 120,
      type: "MOCK_TEST",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      negativeMarking: 0.50,
      subjectId: subReasoning.id,
      categoryId: catRelations.id,
      completedCount: 19
    },
    {
      title: "English Vocabulary Daily Booster",
      description: "Daily speed run to evaluate synonyms, antonyms, and word definitions.",
      duration: 10,
      totalMarks: 10,
      passMarks: 5,
      type: "DAILY_QUIZ",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      negativeMarking: 0.00,
      subjectId: subEnglish.id,
      categoryId: catVocab.id,
      completedCount: 110
    },
    {
      title: "Reasoning Syllogism Sectional Quiz",
      description: "Evaluate your logical deduction skills with statements and Venn diagram problems.",
      duration: 15,
      totalMarks: 20,
      passMarks: 10,
      type: "SECTIONAL_TEST",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      negativeMarking: 0.25,
      subjectId: subReasoning.id,
      categoryId: catSyll.id,
      completedCount: 37
    },
    {
      title: "Common Spotting Errors in Grammar",
      description: "Subjective evaluation on parts of speech, articles, verbs, and tenses.",
      duration: 25,
      totalMarks: 30,
      passMarks: 15,
      type: "PRACTICE_QUIZ",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      negativeMarking: 0.00,
      subjectId: subEnglish.id,
      categoryId: catGrammar.id,
      completedCount: 52
    },
    {
      title: "Indian Polity Constitutional Articles",
      description: "Focus on fundamental rights, constitutional amendments, and articles.",
      duration: 30,
      totalMarks: 40,
      passMarks: 18,
      type: "SECTIONAL_TEST",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      negativeMarking: 0.25,
      subjectId: subGK.id,
      categoryId: catPolity.id,
      completedCount: 61
    },
    {
      title: "Weekly Current Affairs Sprint",
      description: "Practice national affairs, world treaties, sports awards, and summits.",
      duration: 20,
      totalMarks: 30,
      passMarks: 12,
      type: "DAILY_QUIZ",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      negativeMarking: 0.00,
      subjectId: subGK.id,
      categoryId: catCurrent.id,
      completedCount: 95
    },
    {
      title: "Computer Network OSI Model Test",
      description: "Quick practice quiz covering physical to application layers in networking.",
      duration: 15,
      totalMarks: 15,
      passMarks: 7,
      type: "PRACTICE_QUIZ",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      negativeMarking: 0.00,
      subjectId: subComputer.id,
      categoryId: catNet.id,
      completedCount: 41
    },
    {
      title: "SSC CGL Advanced Algebra Suite",
      description: "Challenge your algebraic expressions and quadratic equations.",
      duration: 35,
      totalMarks: 50,
      passMarks: 25,
      type: "SECTIONAL_TEST",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      negativeMarking: 0.25,
      subjectId: subQuant.id,
      categoryId: catAlg.id,
      completedCount: 12
    },
    {
      title: "SBI PO Preliminary Mock Paper - 02",
      description: "Complete mock test for SBI PO prep following the latest IBPS format.",
      duration: 60,
      totalMarks: 100,
      passMarks: 45,
      type: "MOCK_TEST",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      negativeMarking: 0.25,
      subjectId: subQuant.id,
      categoryId: catPerc.id,
      completedCount: 7
    },
    {
      title: "Reasoning Coding-Decoding Speed Run",
      description: "Solve pattern shifts, alphanumeric codes, and translation keys in record time.",
      duration: 12,
      totalMarks: 15,
      passMarks: 8,
      type: "PRACTICE_QUIZ",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      negativeMarking: 0.00,
      subjectId: subReasoning.id,
      categoryId: catCoding.id,
      completedCount: 74
    },
    {
      title: "SSC CHSL English Synonyms Master",
      description: "Syllabus-focused vocabulary booster highlighting matching synonyms.",
      duration: 15,
      totalMarks: 25,
      passMarks: 12,
      type: "PRACTICE_QUIZ",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      negativeMarking: 0.00,
      subjectId: subEnglish.id,
      categoryId: catVocab.id,
      completedCount: 83
    },
    {
      title: "RRB NTPC General Awareness PYQ",
      description: "Previous Year questions collection for general knowledge and science.",
      duration: 40,
      totalMarks: 50,
      passMarks: 20,
      type: "PREVIOUS_YEAR_PAPER",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      negativeMarking: 0.33,
      subjectId: subGK.id,
      categoryId: catPolity.id,
      completedCount: 57
    },
    {
      title: "Computer Science Ports & Protocols",
      description: "Learn DNS, DHCP, FTP, HTTP ports with detailed answers.",
      duration: 20,
      totalMarks: 20,
      passMarks: 10,
      type: "PRACTICE_QUIZ",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      negativeMarking: 0.00,
      subjectId: subComputer.id,
      categoryId: catNet.id,
      completedCount: 23
    },
    {
      title: "UP Police Sub-Inspector Full Mock",
      description: "Advanced simulation mock test for UP SI exam paper.",
      duration: 120,
      totalMarks: 400,
      passMarks: 160,
      type: "MOCK_TEST",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      negativeMarking: 0.00,
      subjectId: subReasoning.id,
      categoryId: catRelations.id,
      completedCount: 15
    },
    {
      title: "Logical Reasoning Syllogism - II",
      description: "Advanced logical conclusions, possibilities, and either-or cases.",
      duration: 20,
      totalMarks: 25,
      passMarks: 12,
      type: "SECTIONAL_TEST",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      negativeMarking: 0.25,
      subjectId: subReasoning.id,
      categoryId: catSyll.id,
      completedCount: 30
    }
  ];

  for (const def of testDefinitions) {
    const { completedCount, ...testData } = def;
    
    // Create the test
    const test = await prisma.test.create({
      data: {
        ...testData,
        instructions: "Read all questions carefully. Standard test marking rules apply.",
        allowMultipleAttempts: true,
        allowResume: true,
      }
    });

    // Pick 3 random questions matching the subjectId to associate
    const matchingQuestions = dbQuestions.filter(q => q.subjectId === test.subjectId);
    const questionsToLink = matchingQuestions.length > 0 ? matchingQuestions.slice(0, 3) : dbQuestions.slice(0, 3);
    
    for (let i = 0; i < questionsToLink.length; i++) {
      await prisma.testQuestion.create({
        data: {
          testId: test.id,
          questionId: questionsToLink[i].id,
          displayOrder: i + 1,
          marks: 2,
          negativeMark: test.negativeMarking
        }
      });
    }

    // Seed mock completed attempts for this test based on 'completedCount'
    // This allows different stats for trending, recommended sections!
    if (completedCount > 0) {
      // Create a few attempts by student
      for (let attemptIdx = 0; attemptIdx < Math.min(3, completedCount); attemptIdx++) {
        await prisma.attempt.create({
          data: {
            userId: student.id,
            testId: test.id,
            score: Math.round(test.totalMarks * (0.6 + attemptIdx * 0.1)),
            status: "COMPLETED",
            correctCount: 2,
            wrongCount: 1,
            unansweredCount: 0,
            timeTaken: Math.round(test.duration * 60 * 0.8),
            isPassed: true,
            startedAt: new Date(Date.now() - (attemptIdx + 1) * 24 * 60 * 60 * 1000),
            completedAt: new Date(Date.now() - (attemptIdx + 1) * 24 * 60 * 60 * 1000)
          }
        });
      }
    }

    console.log(`Test resolving complete: "${test.title}" with attempts seeded.`);
  }

  console.log("Database seeded successfully with 5 Subjects, 11 Categories, 12 Questions, and 18 Tests!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
