import fs from 'fs';
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

// Resume text cache to avoid re-extracting
const resumeCache = new Map();

/**
 * Extract text from resume file with caching
 */
async function extractResumeText(filePath, mimetype) {
    // Check cache first
    const cacheKey = `${filePath}-${mimetype}`;
    if (resumeCache.has(cacheKey)) {
        return resumeCache.get(cacheKey);
    }

    try {
        let text = '';
        if (mimetype === 'application/pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdfParse(dataBuffer);
            text = data.text;
        } else if (
            mimetype === 'application/msword' ||
            mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ) {
            const result = await mammoth.extractRawText({ path: filePath });
            text = result.value;
        } else {
            throw new Error('Unsupported file type');
        }

        // Cache the extracted text
        resumeCache.set(cacheKey, text);
        
        // Clear cache after 1 hour to prevent memory issues
        setTimeout(() => resumeCache.delete(cacheKey), 3600000);
        
        return text;
    } catch (error) {
        throw new Error('Failed to extract text from resume');
    }
}



/**
 * Calculate ATS score using Google Gemini AI with enhanced matching
 */
async function calculateATSScoreWithAI(resumeText, jobData) {
    const ai = getGeminiAI();
    
    if (!ai) {
        throw new Error('Gemini AI not available. Please configure GEMINI_API_KEY in your .env file.');
    }
    
    try {
        const model = ai.getGenerativeModel({ 
            model: "gemini-2.5-flash"
        });

        // Build structured job description
        const structuredJD = jobData.structuredJD || {};
        const jobDescription = `
JOB TITLE: ${jobData.title}

DESCRIPTION:
${jobData.description}

${structuredJD.requiredSkills?.length ? `REQUIRED SKILLS:
${structuredJD.requiredSkills.join(', ')}` : ''}

${structuredJD.preferredSkills?.length ? `PREFERRED SKILLS:
${structuredJD.preferredSkills.join(', ')}` : ''}

${structuredJD.experience ? `EXPERIENCE REQUIRED:
${structuredJD.experience}` : ''}

${structuredJD.eligibility?.length ? `ELIGIBILITY:
${structuredJD.eligibility.join('\n')}` : ''}

${structuredJD.rolesAndResponsibilities?.length ? `ROLES & RESPONSIBILITIES:
${structuredJD.rolesAndResponsibilities.join('\n')}` : ''}

${structuredJD.location ? `LOCATION: ${structuredJD.location}` : ''}
${structuredJD.employmentType ? `EMPLOYMENT TYPE: ${structuredJD.employmentType}` : ''}
        `.trim();

        const prompt = `You are an expert ATS (Applicant Tracking System) analyzer. Analyze the following resume against the job description and provide a detailed assessment.

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeText}

IMPORTANT INSTRUCTIONS:
1. **Skill Synonym Matching**: Recognize skill variations and synonyms:
   - React = ReactJS = React.js = React Native
   - JavaScript = JS = ECMAScript = ES6 = ES2015+
   - Node.js = NodeJS = Node = Express.js
   - Python = Python3 = Py
   - Database = DB = SQL = MySQL = PostgreSQL
   - Docker = Containerization = Container
   - Kubernetes = K8s = Container Orchestration
   - CI/CD = Continuous Integration = Jenkins = GitHub Actions
   - AWS = Amazon Web Services = Cloud = EC2 = S3
   - Git = Version Control = GitHub = GitLab

2. **Experience Level Understanding**:
   - "Senior" = 5+ years
   - "Lead" = 7+ years
   - "Junior" = 0-2 years
   - "Mid-level" = 3-5 years

3. **Holistic Evaluation**: Consider ALL aspects of the candidate:
   - Technical skills match with job requirements
   - Experience level and years of experience
   - Educational qualifications and certifications
   - Soft skills and cultural fit indicators
   - Resume quality, clarity, and professionalism
   - Project experience and achievements
   - Domain knowledge and industry experience

4. **Smart Recommendations**: Provide actionable next steps for HR

5. **Scoring Criteria**:
   - Technical skills match (40%)
   - Experience level match (25%)
   - Education and qualifications (15%)
   - Soft skills and cultural fit indicators (10%)
   - Overall resume quality and presentation (10%)

Please analyze and provide a response in the following JSON format:
{
  "score": <number between 0-100>,
  "analysis": "<brief 2-3 sentence analysis of the match>",
  "matchedSkills": ["skill1", "skill2", ...],
  "missingSkills": ["skill1", "skill2", ...],
  "strengths": ["strength1", "strength2", ...],
  "recommendations": "<specific recommendation: 'Strong candidate - Schedule interview immediately' OR 'Good fit - Consider for interview' OR 'Moderate match - Review carefully' OR 'Not suitable for this role'>",
  "interviewFocus": ["topic1", "topic2", ...],
  "trainingNeeds": ["skill1", "skill2", ...]
}

Be objective and provide actionable insights. Return ONLY the JSON object, no additional text.`;

        const startTime = Date.now();
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Invalid AI response format');
        }
        
        const aiAnalysis = JSON.parse(jsonMatch[0]);
        
        const finalResult = {
            score: Math.min(Math.max(Math.round(aiAnalysis.score), 0), 100),
            analysis: aiAnalysis.analysis || 'Analysis completed.',
            matchedSkills: (aiAnalysis.matchedSkills || []).slice(0, 20),
            missingSkills: (aiAnalysis.missingSkills || []).slice(0, 20),
            strengths: aiAnalysis.strengths || [],
            recommendations: aiAnalysis.recommendations || '',
            interviewFocus: aiAnalysis.interviewFocus || [],
            trainingNeeds: aiAnalysis.trainingNeeds || [],
            calculatedAt: new Date()
        };
        
        return finalResult;
    } catch (error) {
        throw new Error('Failed to calculate ATS score with Gemini AI: ' + error.message);
    }
}



/**
 * Calculate ATS score by comparing resume with job description
 * Uses Google Gemini AI for intelligent analysis with structured JD data
 */
export async function calculateATSScore(resumePath, resumeMimetype, jobData) {
    try {
        // Extract text from resume
        const resumeText = await extractResumeText(resumePath, resumeMimetype);
        
        // Check if Gemini API key is configured (lazy check)
        const ai = getGeminiAI();
        
        if (!ai) {
            throw new Error('Gemini AI is required for ATS scoring. Please configure GEMINI_API_KEY in your .env file.');
        }
        
        return await calculateATSScoreWithAI(resumeText, jobData);
    } catch (error) {
        throw new Error('Failed to calculate ATS score: ' + error.message);
    }
}

/**
 * Calculate ATS scores for multiple applications with parallel processing
 */
export async function calculateBulkATSScores(applications, jobData) {
    // Process in batches of 5 to avoid overwhelming the API
    const batchSize = 5;
    const results = [];
    
    for (let i = 0; i < applications.length; i += batchSize) {
        const batch = applications.slice(i, i + batchSize);
        
        // Process batch in parallel
        const batchPromises = batch.map(async (application) => {
            try {
                const atsScore = await calculateATSScore(
                    application.resume.path,
                    application.resume.mimetype,
                    jobData
                );
                return {
                    applicationId: application._id,
                    atsScore,
                    success: true
                };
            } catch (error) {
                return {
                    applicationId: application._id,
                    error: error.message,
                    success: false
                };
            }
        });
        
        // Wait for batch to complete
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
    }
    
    return results;
}
