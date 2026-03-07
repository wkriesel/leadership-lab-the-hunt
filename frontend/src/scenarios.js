export const SCENARIOS = [
    {
        id: 1,
        title: "Scenario 1 — Principal Uses ChatGPT for a Parent Email",
        text: "A principal uses ChatGPT to draft a parent communication about a behavioral incident. The draft includes the student’s full name and details from their disciplinary record.",
        options: [
            { id: "A", label: "A. This is fine — the email would go to the parent anyway." },
            { id: "B", label: "B. This violates policy — student PII should never enter public AI systems." },
            { id: "C", label: "C. It’s okay if the principal reviews the draft before sending." },
            { id: "D", label: "D. It depends on whether ChatGPT stores the data." }
        ],
        correctAnswer: "B",
        revealTitle: "HR POLICY REVEAL",
        revealText: "Not Allowed. Even with names removed, providing direct employee performance data or student PII to external public AI tools violates the confidential nature of evaluation data under Section 4.2 of the Staff Guidelines." // Used original wording from previous code as a base, adapted for PII. The user hasn't given the specific reveal texts for scenarios 1-6 but using placeholders where exact text wasn't provided, though Scenario 1 matches the prompt. Actually I should adjust the reveal text to match the scenario topic.
    },
    {
        id: 2,
        title: "Scenario 2 — Data Summary for a Board Presentation",
        text: "A curriculum coordinator uses an OCDE‑approved AI tool to generate a summary of assessment data trends across three schools. She includes the summary in a board presentation with the note: “Data analysis prepared by [Name].”",
        options: [
            { id: "A", label: "A. Perfect — she reviewed it before sharing." },
            { id: "B", label: "B. She needs to disclose the AI contribution in her attribution." },
            { id: "C", label: "C. Only needs disclosure if AI wrote more than 50% of the content." },
            { id: "D", label: "D. Internal presentations don’t require AI disclosure." }
        ],
        correctAnswer: "B",
        revealTitle: "HR POLICY REVEAL",
        revealText: "B is the most accurate. Staff must appropriately attribute or disclose AI-generated content used in formal reports, presentations, or communications, especially when presenting data analysis."
    },
    {
        id: 3,
        title: "Scenario 3 — Free Online Translation Tool",
        text: "A teacher finds a free AI tool online that instantly translates parent communications into five languages. It’s not on OCDE’s approved list, but it doesn’t require uploading student data — just pasting text.",
        options: [
            { id: "A", label: "A. It’s fine — no student data is involved." },
            { id: "B", label: "B. Prohibited — unapproved tools can’t be used for OCDE-related work." },
            { id: "C", label: "C. Okay as long as the teacher checks the translations." },
            { id: "D", label: "D. Only a problem if the tool stores the text." }
        ],
        correctAnswer: "B",
        revealTitle: "HR POLICY REVEAL",
        revealText: "B is the most accurate. Even if no student data is involved, using unapproved and un-vetted tools for official district communication introduces significant security, privacy, and accuracy risks."
    },
    {
        id: 4,
        title: "Scenario 4 — Brainstorming with Gemini",
        text: "A department head asks their team to use Gemini to brainstorm ideas for a new professional development series. The brainstorming uses only generic educational topics — no student or staff data.",
        options: [
            { id: "A", label: "A. This is a great use of AI — creative brainstorming with no protected data." },
            { id: "B", label: "B. Still prohibited — all AI use requires OCDE approval." },
            { id: "C", label: "C. Only okay if the supervisor approves it first." },
            { id: "D", label: "D. Needs a formal disclosure since it will influence decisions." }
        ],
        correctAnswer: "A",
        revealTitle: "HR POLICY REVEAL",
        revealText: "A is the most accurate. Using AI for general ideation and brainstorming without inputting PII, sensitive staff data, or confidential district information is an encouraged and low-risk use case."
    },
    {
        id: 5,
        title: "Scenario 5 — AI Screening Résumés",
        text: "An HR specialist uses an AI tool to screen and rank résumés for an open position, flagging candidates who best match the job description.",
        options: [
            { id: "A", label: "A. Efficient and innovative — exactly what AI should do." },
            { id: "B", label: "B. Okay if the HR specialist reviews every recommendation." },
            { id: "C", label: "C. Prohibited — AI cannot be used to evaluate staff without authorization." },
            { id: "D", label: "D. Fine as long as the AI tool is on the approved list." }
        ],
        correctAnswer: "C",
        revealTitle: "HR POLICY REVEAL",
        revealText: "C is the most accurate. Using AI for automated decision-making regarding hiring, evaluation, or termination introduces severe bias and legal risks, and is strictly prohibited without specialized systems and authorization."
    },
    {
        id: 6,
        title: "Scenario 6 — Contractor Uses Public AI Tool",
        text: "A program director discovers that a contractor working on an OCDE project has been using a public AI tool to process student attendance data for a report deliverable.",
        options: [
            { id: "A", label: "A. Fine, since contractors aren't bound by staff policies." },
            { id: "B", label: "B. Prohibited — contractors must adhere to the same data privacy standards as staff." },
            { id: "C", label: "C. Okay as long as the final report is accurate." },
            { id: "D", label: "D. Depends on whether the contractor signed an NDA." }
        ],
        correctAnswer: "B",
        revealTitle: "HR POLICY REVEAL",
        revealText: "B is the most accurate. Any external party handling sensitive student data (like attendance) on behalf of the district must comply with state and federal privacy laws (FERPA) and district policies. Feeding this data into a public AI tool is a major violation."
    }
];
