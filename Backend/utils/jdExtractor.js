import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { GoogleGenerativeAI } from '@google/generative-ai';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';

// Lazy initialization - will be created when first needed
let genAI = null;

function getGeminiAI() {
    if (genAI === null) {
        if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
            try {
                genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            } catch (error) {
                genAI = false;
            }
        } else {
            genAI = false;
        }
    }
    return genAI === false ? null : genAI;
}

/**
 * Extract text from PDF files
 */
async function extractFromPDF(filePath) {
    try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    } catch (error) {
        throw new Error('Failed to extract text from PDF. Error: ' + error.message);
    }
}

/**
 * Extract text from DOC/DOCX files
 */
async function extractFromDoc(filePath) {
    try {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    } catch (error) {
        throw new Error('Failed to extract text from DOC file. Make sure mammoth is installed.');
    }
}

/**
 * Extract text from TXT files
 */
async function extractFromTxt(filePath) {
    try {
        const text = fs.readFileSync(filePath, 'utf-8');
        return text;
    } catch (error) {
        throw new Error('Failed to read text file. Error: ' + error.message);
    }
}



/**
 * Parse JD using Gemini AI for structured output (ONLY METHOD)
 */
async function parseJobDetailsWithAI(text) {
    const ai = getGeminiAI();
    
    if (!ai) {
        throw new Error('Gemini AI is required for JD extraction. Please configure GEMINI_API_KEY in your .env file.');
    }
    
    try {
        const model = ai.getGenerativeModel({ 
            model: "gemini-2.5-flash"
        });

        const prompt = `You are an expert HR document parser. Analyze the following job description and extract structured information accurately.

JOB DESCRIPTION TEXT:
${text}

Extract and structure this job description into the following JSON format with these EXACT field names:

{
  "title": "string",
  "rolesAndResponsibilities": ["string"],
  "eligibility": ["string"],
  "requiredSkills": ["string"],
  "preferredSkills": ["string"],
  "experience": "string",
  "location": "string",
  "employmentType": "string",
  "salary": "string",
  "benefits": ["string"],
  "additionalInfo": "string"
}

DETAILED EXTRACTION RULES:

1. "title": Extract the job position/role name ONLY
   - Example: "Senior Software Engineer", "Marketing Manager", "Data Scientist"
   - DO NOT include: Job IDs, reference numbers, company names

2. "location": Extract work location
   - Example: "Bangalore, India", "Remote", "New York, USA", "Hybrid - Mumbai"
   - If multiple locations, list them all

3. "employmentType": Extract job type - use EXACTLY one of these:
   - "Full-time" OR "Part-time" OR "Contract" OR "Internship" OR "Temporary"
   - If not mentioned, use empty string ""

4. "experience": Extract experience requirement as a SHORT summary
   - Example: "2-4 years", "5+ years", "Fresher", "0-2 years", "3-5 years"
   - Keep it brief, just the years range

5. "salary": Extract compensation information
   - Example: "₹10-15 LPA", "$80,000-$100,000", "₹25,000/month stipend", "Competitive"
   - If not mentioned, use empty string ""

6. "eligibility": Extract ONLY education qualifications and experience requirements as SEPARATE items
   - THIS FIELD IS FOR FORMAL QUALIFICATIONS ONLY
   - MUST include education: "B.Tech in Computer Science", "M.Tech in Data Science", "Bachelor's degree in Engineering", "MBA", "Master's degree in related field"
   - MUST include experience: "Minimum 3 years of experience in software development", "2+ years working with Python", "5+ years in product management"
   - MUST include certifications: "AWS Certified Solutions Architect", "PMP certification", "Google Cloud Professional"
   - DO NOT include: Soft skills, personality traits, work style preferences, attitudes, or behavioral characteristics
   - DO NOT include: "Self-driven", "Critical thinker", "Problem solver", "Detail-oriented", "Fast learner", "Bias for action", "Customer-centric"
   - These soft skills should go in "rolesAndResponsibilities" or be ignored
   - Example CORRECT eligibility: ["Bachelor's degree in Computer Science or related field", "Minimum 3 years of professional software development experience", "Experience with React and Node.js required", "AWS certification preferred"]
   - Example WRONG eligibility: ["Self-driven hustler", "Critical thinker", "Problem solver"] - These are NOT eligibility criteria!

7. "requiredSkills": Extract MUST-HAVE technical and professional skills
   - Example: ["Python", "React.js", "Node.js", "MongoDB", "REST APIs", "Git"]
   - List each skill separately
   - Include programming languages, frameworks, tools, methodologies
   - DO NOT include soft skills here

8. "preferredSkills": Extract NICE-TO-HAVE or GOOD-TO-HAVE skills
   - Example: ["AWS", "Docker", "Kubernetes", "GraphQL", "TypeScript"]
   - Skills that are beneficial but not mandatory
   - Often mentioned as "preferred", "nice to have", "plus", "bonus"

9. "rolesAndResponsibilities": Extract job duties, responsibilities, and desired qualities
   - Example: ["Design and develop scalable web applications", "Lead a team of 5 developers", "Conduct code reviews and mentor junior developers", "Collaborate with product team on requirements"]
   - Each responsibility should be a clear, complete sentence
   - Focus on what the person will DO in this role
   - Can also include desired work qualities like: "Work independently with minimal supervision", "Demonstrate strong problem-solving skills", "Show attention to detail"
   - Soft skills and personality traits from the JD can go here if they describe how the person should work

10. "benefits": Extract perks, benefits, and compensation extras
    - Example: ["Health insurance", "Flexible working hours", "Work from home options", "Learning and development budget", "Performance bonuses", "Stock options"]
    - Include: Insurance, leaves, flexibility, learning opportunities, bonuses, etc.

11. "additionalInfo": Extract ONLY truly additional information
    - Include: Application deadlines, special instructions, company culture notes, unique requirements
    - Example: "Application deadline: March 31st, 2025", "Must be available to start immediately", "Opportunity to work on cutting-edge AI projects"
    - DO NOT include: Job IDs, reference numbers, information already in other fields
    - If nothing additional, use empty string ""

IMPORTANT NOTES:
- If any field has no information, use empty string "" for strings or empty array [] for arrays
- Be thorough and extract ALL relevant information from the job description
- Maintain accuracy - don't make up information that isn't in the text
- Return ONLY valid JSON, no markdown formatting, no extra text
- Ensure all arrays contain strings, not objects

CRITICAL: "eligibility" field is ONLY for formal qualifications (degrees, years of experience, certifications). 
Soft skills like "self-driven", "critical thinker", "problem solver", "detail-oriented" are NOT eligibility criteria and should NOT be in the eligibility array.

Return the structured JSON now:`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiText = response.text();
        
        // Extract JSON from response
        const jsonMatch = aiText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Invalid AI response format');
        }
        
        const structured = JSON.parse(jsonMatch[0]);
        
        // Create formatted description
        const formattedDescription = formatStructuredJD(structured);
        
        return {
            title: structured.title || 'Job Position',
            description: formattedDescription,
            structuredJD: {
                rolesAndResponsibilities: structured.rolesAndResponsibilities || [],
                eligibility: structured.eligibility || [],
                requiredSkills: structured.requiredSkills || [],
                preferredSkills: structured.preferredSkills || [],
                experience: structured.experience || '',
                location: structured.location || '',
                employmentType: structured.employmentType || '',
                salary: structured.salary || '',
                benefits: structured.benefits || [],
                additionalInfo: structured.additionalInfo || ''
            }
        };
    } catch (error) {
        throw new Error('Failed to parse JD with Gemini AI: ' + error.message);
    }
}

/**
 * Format structured JD into readable description
 */
function formatStructuredJD(structured) {
    let formatted = '';
    
    if (structured.experience) {
        formatted += `Experience Required: ${structured.experience}\n`;
    }
    
    if (structured.location) {
        formatted += `Location: ${structured.location}\n`;
    }
    
    if (structured.employmentType) {
        formatted += `Employment Type: ${structured.employmentType}\n`;
    }
    
    if (structured.salary) {
        formatted += `Salary: ${structured.salary}\n`;
    }
    
    formatted += '\n';
    
    if (structured.eligibility && structured.eligibility.length > 0) {
        formatted += 'Eligibility Criteria:\n';
        structured.eligibility.forEach((item, idx) => {
            formatted += `${idx + 1}. ${item}\n`;
        });
        formatted += '\n';
    }
    
    if (structured.rolesAndResponsibilities && structured.rolesAndResponsibilities.length > 0) {
        formatted += 'Roles and Responsibilities:\n';
        structured.rolesAndResponsibilities.forEach((item, idx) => {
            formatted += `${idx + 1}. ${item}\n`;
        });
        formatted += '\n';
    }
    
    if (structured.requiredSkills && structured.requiredSkills.length > 0) {
        formatted += 'Required Skills:\n';
        formatted += '• ' + structured.requiredSkills.join('\n• ') + '\n\n';
    }
    
    if (structured.preferredSkills && structured.preferredSkills.length > 0) {
        formatted += 'Preferred Skills:\n';
        formatted += '• ' + structured.preferredSkills.join('\n• ') + '\n\n';
    }
    
    if (structured.benefits && structured.benefits.length > 0) {
        formatted += 'Benefits:\n';
        formatted += '• ' + structured.benefits.join('\n• ') + '\n\n';
    }
    
    if (structured.additionalInfo) {
        formatted += 'Additional Information:\n';
        formatted += structured.additionalInfo + '\n';
    }
    
    return formatted.trim();
}

/**
 * Main function to extract job details from uploaded file
 */
export async function extractJobFromFile(filePath, mimetype) {
    try {
        let extractedText = '';

        if (mimetype === 'application/pdf') {
            extractedText = await extractFromPDF(filePath);
        } else if (
            mimetype === 'application/msword' ||
            mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
            extractedText = await extractFromDoc(filePath);
        } else if (mimetype === 'text/plain') {
            extractedText = await extractFromTxt(filePath);
        } else {
            throw new Error('Unsupported file type. Please upload PDF, Word (.doc, .docx), or Text (.txt) files.');
        }

        // Check if Gemini API key is configured (lazy check)
        const ai = getGeminiAI();
        
        if (!ai) {
            throw new Error('Gemini AI is required for JD extraction. Please configure GEMINI_API_KEY in your .env file.');
        }
        
        return await parseJobDetailsWithAI(extractedText);
    } catch (error) {
        throw error;
    }
}
