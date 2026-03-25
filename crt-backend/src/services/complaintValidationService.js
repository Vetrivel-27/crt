/**
 * Complaint Validation & Auto-Correction Service
 * Compares student-provided category/urgency against AI classification results.
 * Overrides selections when AI confidence exceeds the threshold, and when
 * urgency keywords indicate the student under-reported severity.
 * Rules:
 *  - Category: override if AI differs AND confidence >= MIN_CONFIDENCE_OVERRIDE (default 0.70)
 *  - Urgency:  override ONLY if AI urgency is strictly higher severity than student's
 *              (never downgrades urgency — student saying "critical" is always respected)
 *  - Both:     originals are stored in student_selected_* columns for audit trail
 */
// Urgency severity order (higher index = more severe)
const URGENCY_LEVELS = ['low', 'medium', 'high', 'critical'];
const urgencySeverity = (level) => URGENCY_LEVELS.indexOf(level);
/**
 * Decide whether to override the student's category.
 * @param {string} studentCat   - What the student selected
 * @param {string} aiCat        - What the AI classified
 * @param {number} confidence   - AI confidence score (0–1)
 * @returns {boolean}
 */
function shouldOverrideCategory(studentCat, aiCat, confidence) {
    // Exception: If the student tagged it as Hostel, do not allow AI to move it elsewhere
    if (studentCat?.trim() === 'Hostel & Accommodation') return false;

    const threshold = parseFloat(process.env.MIN_CONFIDENCE_OVERRIDE || '0.70');
    return aiCat !== studentCat && confidence >= threshold;
}
/**
 * Decide whether to override the student's urgency.
 * Allows both upgrades and downgrades, but requires very high confidence
 * to downgrade a student-selected 'critical' urgency.
 * @param {string} studentUrgency - What the student selected
 * @param {string} aiUrgency      - What the AI detected
 * @param {number} aiConfidence   - AI confidence score
 * @returns {boolean}
 */
function shouldOverrideUrgency(studentUrgency, aiUrgency, aiConfidence) {
    if (studentUrgency === aiUrgency) return false;
    if (studentUrgency === 'critical' && aiUrgency !== 'critical') {
        const downgradeThreshold = 0.85; 
        return aiConfidence >= downgradeThreshold;
    }
    return true;
}

/**
 * Build a human-readable explanation string for the correction.
 * @param {object} changes - { category?: { from, to }, urgency?: { from, to } }
 * @param {number} confidence - AI confidence score
 * @returns {string}
 */
function generateCorrectionReason(changes, confidence) {
    const parts = [];
    if (changes.category) {
        parts.push(
            `Category adjusted from "${changes.category.from}" to "${changes.category.to}".`
        );
    }
    if (changes.urgency) {
        parts.push(
            `Urgency adjusted from "${changes.urgency.from}" to "${changes.urgency.to}" ` +
            `based on an analysis of your description.`
        );
    }

    return `Auto-correction applied: ${parts.join(' ')} Your complaint has been updated to ensure it reaches the right team quickly.`;
}

/**
 * Main orchestrator — validates and optionally corrects student input.
 *
 * @param {object} studentData   - { category: string, urgency: string }
 * @param {object} aiResult      - { category: string, urgency: string, confidence: number }
 * @returns {{
 *   finalCategory: string,
 *   finalUrgency: string,
 *   corrected: boolean,
 *   changes: object,
 *   reason: string|null
 * }}
 */
function validateAndCorrectComplaint(studentData, aiResult) {
    let finalCategory = studentData.category;
    let finalUrgency = studentData.urgency;
    const changes = {};
    // Category check
    if (shouldOverrideCategory(studentData.category, aiResult.category, aiResult.confidence)) {
        changes.category = { from: studentData.category, to: aiResult.category };
        finalCategory = aiResult.category;
    }
    // Urgency check (allowing both upgrade/downgrade with intelligence)
    if (shouldOverrideUrgency(studentData.urgency, aiResult.urgency, aiResult.confidence)) {
        changes.urgency = { from: studentData.urgency, to: aiResult.urgency };
        finalUrgency = aiResult.urgency;
    }

    const corrected = Object.keys(changes).length > 0;
    const reason = corrected ? generateCorrectionReason(changes, aiResult.confidence) : null;

    return {
        finalCategory,
        finalUrgency,
        corrected,
        changes,
        reason,
    };
}

module.exports = {
    validateAndCorrectComplaint,
};
