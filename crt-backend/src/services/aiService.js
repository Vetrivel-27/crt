const db = require('../config/database');
const Groq = require('groq-sdk');

const groqClient = process.env.GROQ_API_KEY
    ? new Groq({ apiKey: process.env.GROQ_API_KEY })
    : null;

const VALID_CATEGORIES = [
    'Academic', 'Hostel & Accommodation', 'Food & Mess', 'Library',
    'Transportation', 'Fees & Finance', 'Infrastructure',
    'Harassment & Discrimination', 'Health & Medical',
    'Sports & Extracurricular', 'General',
];
const VALID_URGENCIES = ['low', 'medium', 'high', 'critical'];

//Category Keyword Dictionary 
// Each category has a list of keywords. Words that appear in the text are
// scored (each word contributes 1 point). The highest-scoring category wins.
const CATEGORY_KEYWORDS = {
    'Hostel & Accommodation': [
        'hostel', 'room', 'accommodation', 'dorm', 'dormitory', 'warden',
        'roommate', 'bed', 'mattress', 'locker', 'corridor', 'toilet block',
        'hostel block', 'night warden', 'hostel fee',
    ],
    'Food & Mess': [
        'food', 'mess', 'canteen', 'lunch', 'dinner', 'breakfast', 'meal',
        'hygiene', 'cook', 'chef', 'menu', 'quality', 'taste', 'stale',
        'dirty plate', 'cafeteria', 'eating',
    ],
    'Academic': [
        'exam', 'grade', 'marks', 'professor', 'lecturer', 'attendance',
        'syllabus', 'assignment', 'result', 'internals', 'project', 'class',
        'teacher', 'faculty', 'timetable', 'timetable clash', 'academic',
        'curriculum', 'degree', 'certificate',
    ],
    'Library': [
        'library', 'book', 'reading room', 'librarian', 'issue', 'return',
        'overdue', 'fine', 'reference', 'periodical', 'journal', 'shelf',
        'catalogue', 'e-library',
    ],
    'Transportation': [
        'transport', 'bus', 'route', 'driver', 'vehicle', 'cab', 'auto',
        'commute', 'pickup', 'drop', 'schedule', 'late bus', 'bus pass',
        'college bus', 'shuttle',
    ],
    'Fees & Finance': [
        'fee', 'fees', 'payment', 'receipt', 'refund', 'scholarship',
        'finance', 'challan', 'dues', 'hostel fee', 'exam fee', 'tuition',
        'fine', 'penalty', 'discount',
    ],
    'Harassment & Discrimination': [
        'harassment', 'discrimination', 'ragging', 'bully', 'bullying',
        'threatened', 'abuse', 'misbehave', 'misconduct', 'unsafe',
        'intimidate', 'hostile', 'prejudice', 'sexual', 'gender',
    ],
    'Infrastructure': [
        'infrastructure', 'facility', 'broken', 'repair', 'maintenance',
        'toilet', 'fan', 'light', 'electricity', 'power cut', 'water',
        'tap', 'pipe', 'leak', 'ceiling', 'wall', 'floor', 'bench',
        'furniture', 'projector', 'wifi', 'internet', 'network', 'lab',
        'computer', 'classroom', 'mosquito', 'pest', 'insects', 'fumigation',
        'bugs', 'cleaning',
    ],
    'Health & Medical': [
        'health', 'medical', 'hospital', 'doctor', 'nurse', 'clinic',
        'sick', 'injury', 'medicine', 'ambulance', 'first aid', 'fever',
        'infection', 'hygiene', 'sanitation', 'bite', 'rash', 'allergy',
    ],
    'Sports & Extracurricular': [
        'sport', 'ground', 'field', 'gym', 'equipment', 'team', 'club',
        'event', 'tournament', 'cultural', 'fest', 'activity', 'coach',
    ],
};

//  Urgency Marker Dictionary 
// Checked in order — first match wins. Weight = specificity.
const URGENCY_MARKERS = {
    critical: [
        'emergency', 'fire', 'flood', 'medical emergency', 'violence',
        'assault', 'safety hazard', 'gas leak', 'collapse', 'critical',
        'life threatening', 'accident',
    ],
    high: [
        'urgent', 'asap', 'harassment', 'immediately', 'no water',
        'no electricity', 'power cut', 'broken', 'ragging', 'threatened',
        'failing', 'serious', 'important', 'escalate',
    ],
    low: [
        'suggestion', 'minor', 'whenever', 'improvement', 'please consider',
        'small', 'just a note', 'would be nice', 'eventually',
    ],
    // default = 'medium' if none matched
};

//  Category to Department Mapping 
const CATEGORY_TO_DEPARTMENT = {
    'Hostel & Accommodation':      'Hostel Management',
    'Food & Mess':                 'Mess Committee',
    'Academic':                    'Academic Affairs',
    'Library':                     'Library',
    'Transportation':              'Transport',
    'Fees & Finance':              'Administration',
    'Harassment & Discrimination': 'Student Welfare',
    'Infrastructure':              'Maintenance',
    'Health & Medical':            'Medical Centre',
    'Sports & Extracurricular':    'Student Welfare',
    'General':                     'Other',
};

//  Helpers 

/**
 * Score a piece of text against a keyword list.
 * Scores 1 per keyword hit (case-insensitive substring match).
 */
function scoreText(text, keywords) {
    const lower = text.toLowerCase();
    return keywords.reduce((score, kw) => {
        return score + (lower.includes(kw.toLowerCase()) ? 1 : 0);
    }, 0);
}

/**
 * Determine urgency from text using the marker dictionary.
 * Returns 'critical' | 'high' | 'medium' | 'low'.
 */
function detectUrgency(text) {
    const lower = text.toLowerCase();
    for (const [level, markers] of Object.entries(URGENCY_MARKERS)) {
        if (markers.some(m => lower.includes(m.toLowerCase()))) {
            return level;
        }
    }
    return 'medium';
}


// Format a duration (in seconds) as a human-readable string.
function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return 'N/A';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
}

/**
 * Format a date as an absolute human-readable string.
 * Used in cached AI summaries so the text never becomes stale.
 */
function formatDate(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'an unknown date';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

//  Main Service Object 
const aiService = {

    /**
     * Classify a complaint based on its text.
     * Uses weighted keyword scoring across all categories.
     * The category with the highest score wins; ties default to 'General'.
     * Urgency is detected from urgency marker keywords.
     *
     * @param {string} text - Complaint description
     * @param {object} metadata - Optional extra info (e.g. { title })
     * @returns {Promise<{ category: string, urgency: string, confidence: number }>}
     */
    async classifyComplaint(text, metadata = {}) {
        //  Try Groq (Llama 3.3) first 
        if (groqClient) {
            try {
                const prompt = `You are a complaint classifier for a college complaint management system.
                Classify the following complaint into exactly ONE of these categories:
                ${VALID_CATEGORIES.map(c => `- ${c}`).join('\n')}

                Assign urgency from: low, medium, high, critical
                Provide a confidence score (0.00 to 1.00) reflecting how certain you are.

                Rules:
                - "Academic" covers exams, grades, professors, classes, and curriculum.
                - "Hostel & Accommodation" covers rooms, roommates, wardens, blocks, and hostel facilities.
                - "Food & Mess" covers mess quality, hygiene, menu, and canteen issues.
                - "Library" covers books, librarian conduct, and study space.
                - "Transportation" covers college buses, routes, and drivers.
                - "Fees & Finance" covers payments, refunds, and scholarships.
                - "Infrastructure" covers facilities, wifi, electricity, water, broken equipment, and pest control (mosquitoes, fumigation, cleaning).
                - "Harassment & Discrimination" covers ragging, bullying, and abuse.
                - "Health & Medical" covers illness, injury, medical emergencies, and skin issues (like mosquito bites).
                - "Sports & Extracurricular" covers gym, sports grounds, and college events.
                - "General" is only for complaints that genuinely don't fit elsewhere.
                - Urgency "critical" = immediate danger, severe health risk, or massive infrastructure failure.
                - Urgency "high" = urgent impact, missing essential service, or safety concern.
                - Urgency "medium" = significant inconvenience or repair.
                - Urgency "low" = minor issue or suggestion.
                - NOTE: "Critical" medical issues include: High fever (>102°F), potential viral outbreaks (Viral Fever), chest pain, severe injury, or contagious diseases.
                - NOTE: If a complaint is about a mosquito bite, classify it as "Health & Medical" (Low/Medium). If it's about seeing many mosquitoes in a room, it's "Hostel & Accommodation" (Medium/High).

                Respond ONLY with this exact JSON:
                {"category":"...","urgency":"...","confidence":0.XX}

                Complaint Title: ${metadata.title || ''}
                Complaint Description: ${text}`;

                const chatCompletion = await groqClient.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'llama-3.3-70b-versatile',
                    response_format: { type: 'json_object' },
                    temperature: 0.1,
                });

                const raw = chatCompletion.choices[0]?.message?.content || '{}';
                const parsed = JSON.parse(raw);

                // Validate Groq returned known values
                const category = VALID_CATEGORIES.includes(parsed.category)
                    ? parsed.category : 'General';
                const urgency = VALID_URGENCIES.includes(parsed.urgency)
                    ? parsed.urgency : 'medium';
                const confidence = typeof parsed.confidence === 'number'
                    ? Math.min(0.99, Math.max(0, parsed.confidence))
                    : 0.85;

                console.log(`[Groq] Classified: category=${category}, urgency=${urgency}, confidence=${confidence}`);
                return { category, urgency, confidence };

            } catch (err) {
                console.warn('[Groq] Classification failed, falling back to rule-based:', err.message);
            }
        }

        //  Rule-based fallback 
        const combined = `${text} ${metadata.title || ''}`;

        let bestCategory = 'General';
        let bestScore = 0;
        let totalScore = 0;

        for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
            const score = scoreText(combined, keywords);
            totalScore += score;
            if (score > bestScore) {
                bestScore = score;
                bestCategory = category;
            }
        }

        const confidence = totalScore > 0
            ? Math.min(0.99, (bestScore / totalScore) * 1.5)
            : 0.5;

        const urgency = detectUrgency(combined);

        return {
            category: bestCategory,
            urgency,
            confidence: parseFloat(confidence.toFixed(2)),
        };
    },

    /**
     * Suggest routing: which department/worker should handle this complaint.
     *
     * Logic:
     *  1. Map category → department via CATEGORY_TO_DEPARTMENT.
     *  2. Look for workers in that department from the provided list.
     *  3. Among matching workers, pick the one with the FEWEST currently
     *     open/in-progress complaints (load-balanced via DB query).
     *  4. Falls back to any worker with lightest load if no department match.
     *
     * @param {object} complaint - Complaint row (must include .category)
     * @param {Array}  availableWorkers - Array of { id, name, department }
     * @returns {Promise<{ workerId: number|null, department: string, reason: string }>}
     */
    async suggestRouting(complaint, availableWorkers = []) {
        const department = CATEGORY_TO_DEPARTMENT[complaint.category]
            || 'General Administration';
        if (availableWorkers.length === 0) {
            return {
                workerId: null,
                department,
                reason: `Routed to ${department} (no workers available for auto-assignment)`,
            };
        }
        // Fetch current workload for each available worker
        let workerLoads = {};
        try {
            const ids = availableWorkers.map(w => w.id);
            const loadResult = await db.query(
                `SELECT assigned_worker_id AS id, COUNT(*) AS open_count
                 FROM complaints
                 WHERE assigned_worker_id = ANY($1::int[])
                   AND status IN ('open', 'in_progress')
                 GROUP BY assigned_worker_id`,
                [ids]
            );
            loadResult.rows.forEach(row => {
                workerLoads[row.id] = parseInt(row.open_count, 10);
            });
        } catch (err) {
            // If DB query fails, proceed with 0 load for all
            console.error('Load-balance query failed, falling back to first match:', err.message);
        }
        // Prefer workers in the matched department
        const departmentWorkers = availableWorkers.filter(
            w => w.department === department
        );
        const candidatePool = departmentWorkers.length > 0
            ? departmentWorkers
            : availableWorkers;

        // Pick the worker with the lowest current load
        const chosen = candidatePool.reduce((best, w) => {
            const load = workerLoads[w.id] || 0;
            const bestLoad = workerLoads[best.id] || 0;
            return load < bestLoad ? w : best;
        });
        const currentLoad = workerLoads[chosen.id] || 0;
        const poolNote = departmentWorkers.length > 0
            ? `from ${department}`
            : `(no ${department} worker found, using least-busy worker)`;

        return {
            workerId: chosen.id,
            department,
            reason: `Auto-assigned to ${chosen.name} ${poolNote} — current load: ${currentLoad} open complaint(s)`,
        };
    },

    /**
     * Generate a structured text summary for a complaint.
     * No NLP required — builds a factual summary from the complaint fields
     * and history entries.
     * @param {object} complaint - Complaint row
     * @param {Array}  history   - Array of complaint_history rows
     * @returns {Promise<string>}
     */
    async generateSummary(complaint, history = []) {
        const age = formatDate(complaint.created_at);
        const statusChanges = history.filter(h => h.action_type === 'status_change');
        const notes = history.filter(h => h.action_type === 'note_added');
        const lastUpdate = history.length > 0
            ? history[history.length - 1]
            : null;

        let summary = `This complaint was filed on ${age} under the "${complaint.category}" category`;
        summary += ` with ${complaint.urgency} urgency.`;

        if (complaint.assigned_worker_name || complaint.assigned_department) {
            summary += ` It is assigned to ${complaint.assigned_worker_name || 'a worker'}`
                + (complaint.assigned_department ? ` (${complaint.assigned_department})` : '') + '.';
        } else {
            summary += ' It has not been assigned to a worker yet.';
        }

        if (statusChanges.length > 0) {
            summary += ` Status has been updated ${statusChanges.length} time(s).`;
        }

        if (notes.length > 0) {
            summary += ` There ${notes.length === 1 ? 'is 1 staff note' : `are ${notes.length} staff notes`} on this complaint.`;
        }

        if (complaint.status === 'resolved' || complaint.status === 'closed') {
            summary += ' This complaint has been resolved.';
            if (complaint.resolution_message) {
                summary += ` Resolution: "${complaint.resolution_message}"`;
            }
        } else if (complaint.status === 'in_progress') {
            summary += ' Work is currently in progress.';
        } else {
            summary += ' It is currently awaiting action.';
        }

        if (lastUpdate) {
            summary += ` Last activity: "${lastUpdate.note || lastUpdate.action_type}".`;
        }

        return summary;
    },

    /**
     * Extract a standardized 1-3 word topic from a complaint.
     * Uses Groq to condense a description into a specific "Subject/Location" pivot.
     * @param {string} text - Complaint description
     * @param {string} category - Complaint category
     * @returns {Promise<string>} - e.g. "WiFi/Library", "Leak/Room 302"
     */
    async extractStandardizedTopic(text, category) {
        if (!groqClient) {
            // Fallback: Just use the category if AI is disabled
            return category;
        }
        try {
            const prompt = `You are a data analyst for a college.
                Extract a 1-3 word "Standardized Topic" from this complaint that can be used to group it with identical issues.
                Be specific about the problem and location if possible (e.g., "WiFi/Library", "Fan/Room 201", "Professor/MathDept", "Leak/Room 302").

                Rules:
                - Category: ${category}
                - Output: ONLY the 1-3 word string. No punctuation.
                - Goal: If 3 students report the exact same thing, they must result in the same output.

                Complaint: ${text}`;
            const chatCompletion = await groqClient.chat.completions.create({
                messages: [{ role: 'user', content: prompt }],
                model: 'llama-3.3-70b-versatile',
                temperature: 0.1,
            });
            const topic = chatCompletion.choices[0]?.message?.content?.trim() || 'General';
            console.log(`[Groq] Extracted Topic: "${topic}" for Category: "${category}"`);
            return topic;
        } catch (err) {
            console.warn('[Groq] Topic extraction failed:', err.message);
            return category; // Fallback to category
        }
    },

    /**
     * Generate dashboard analytics from all complaints.
     * Pure JavaScript aggregation — no ML needed.
     * Produces:
     *  - insights:        string[] — key observations
     *  - trends:          object   — breakdowns by status, category, urgency, monthly
     *  - recommendations: string[] — action suggestions based on data patterns
     * @param {Array} complaints - All complaint rows
     * @returns {Promise<{ insights: string[], trends: object, recommendations: string[] }>}
     */
    async generateAnalytics(complaints) {
        const total = complaints.length;

        if (total === 0) {
            return {
                insights: ['No complaints have been filed yet.'],
                trends: { byStatus: {}, byCategory: {}, byUrgency: {}, monthly: {} },
                recommendations: ['Encourage students to use the platform.'],
            };
        }

        //  Aggregations 
        const byStatus = {};
        const byCategory = {};
        const byUrgency = {};
        const monthly = {};   // { 'YYYY-MM': count }
        let totalResolutionSeconds = 0;
        let resolvedCount = 0;
        let overdueCount = 0;
        const now = Date.now();
        const OVERDUE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

        complaints.forEach(c => {
            // Status
            byStatus[c.status] = (byStatus[c.status] || 0) + 1;

            // Category
            byCategory[c.category] = (byCategory[c.category] || 0) + 1;

            // Urgency
            byUrgency[c.urgency] = (byUrgency[c.urgency] || 0) + 1;

            // Monthly
            const month = new Date(c.created_at).toISOString().slice(0, 7); // 'YYYY-MM'
            monthly[month] = (monthly[month] || 0) + 1;

            // Resolution time
            if (c.status === 'resolved' || c.status === 'closed') {
                const diffSec = (new Date(c.updated_at) - new Date(c.created_at)) / 1000;
                if (diffSec > 0) {
                    totalResolutionSeconds += diffSec;
                    resolvedCount++;
                }
            }

            // Overdue: open/in_progress and older than 7 days
            if (['open', 'in_progress'].includes(c.status)) {
                if (now - new Date(c.created_at) > OVERDUE_THRESHOLD_MS) {
                    overdueCount++;
                }
            }
        });

        const avgResolutionSeconds = resolvedCount > 0
            ? totalResolutionSeconds / resolvedCount
            : null;

        // Top category
        const topCategory = Object.entries(byCategory)
            .sort((a, b) => b[1] - a[1])[0];

        // Top urgency
        const criticalCount = byUrgency['critical'] || 0;
        const highCount = byUrgency['high'] || 0;

        const resolutionRate = total > 0
            ? (((byStatus['resolved'] || 0) + (byStatus['closed'] || 0)) / total * 100).toFixed(1)
            : 0;

        //  Month-over-month trend 
        const months = Object.keys(monthly).sort();
        let trendNote = '';
        if (months.length >= 2) {
            const thisMonth = monthly[months[months.length - 1]];
            const lastMonth = monthly[months[months.length - 2]];
            const delta = thisMonth - lastMonth;
            trendNote = delta > 0
                ? `Complaints increased by ${delta} compared to last month.`
                : delta < 0
                    ? `Complaints decreased by ${Math.abs(delta)} compared to last month.`
                    : 'Complaint volume is stable month-over-month.';
        }

        //  Insights 
        const insights = [
            `Total of ${total} complaint(s) tracked across the system.`,
            `Overall resolution rate: ${resolutionRate}%.`,
            topCategory
                ? `Most reported category: "${topCategory[0]}" with ${topCategory[1]} complaint(s).`
                : null,
            avgResolutionSeconds !== null
                ? `Average resolution time: ${formatDuration(avgResolutionSeconds)}.`
                : null,
            overdueCount > 0
                ? `${overdueCount} complaint(s) are overdue (open for more than 7 days).`
                : 'No overdue complaints — great work!',
            criticalCount > 0
                ? `${criticalCount} critical complaint(s) require immediate attention.`
                : null,
            trendNote || null,
        ].filter(Boolean);

        //  Recommendations 
        const recommendations = [];

        if (overdueCount > 0) {
            recommendations.push(
                `Address ${overdueCount} overdue complaint(s) urgently to improve resolution rate.`
            );
        }
        if (criticalCount > 0) {
            recommendations.push(
                `Immediately escalate ${criticalCount} critical complaint(s) to senior staff.`
            );
        }
        if (topCategory && topCategory[1] > total * 0.3) {
            recommendations.push(
                `"${topCategory[0]}" accounts for over 30% of all complaints — consider a focused review of this area.`
            );
        }
        if (parseFloat(resolutionRate) < 50) {
            recommendations.push(
                'Resolution rate is below 50%. Consider assigning more workers or reviewing the triage process.'
            );
        }
        if ((byStatus['open'] || 0) > (byStatus['in_progress'] || 0) * 2) {
            recommendations.push(
                'Many complaints are sitting in "open" without assignment. Review unassigned complaints and assign them to workers.'
            );
        }
        if (recommendations.length === 0) {
            recommendations.push('System is performing well. Keep maintaining current response times.');
        }

        return {
            insights,
            trends: { byStatus, byCategory, byUrgency, monthly },
            recommendations,
        };
    },
};

module.exports = aiService;
