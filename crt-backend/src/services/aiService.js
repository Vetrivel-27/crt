const axios = require('axios');
require('dotenv').config();

/**
 * AI Service for integrating with external ML/LLM APIs
 * This module provides mock implementations that can be replaced with real API calls
 */

class AIService {
    constructor() {
        this.classificationUrl = process.env.AI_CLASSIFICATION_URL;
        this.routingUrl = process.env.AI_ROUTING_URL;
        this.summarizationUrl = process.env.AI_SUMMARIZATION_URL;
        this.analyticsUrl = process.env.AI_ANALYTICS_URL;
        this.apiKey = process.env.AI_API_KEY;
        this.useMock = process.env.NODE_ENV === 'development'; // Use mock by default in dev
    }

    /**
     * Classify complaint to determine category and urgency
     * @param {string} text - Complaint description
     * @param {object} metadata - Additional metadata (title, etc.)
     * @returns {Promise<{category: string, urgency: string, confidence: number}>}
     */
    async classifyComplaint(text, metadata = {}) {
        if (this.useMock) {
            return this._mockClassification(text, metadata);
        }

        try {
            // TODO: Replace with actual AI API call
            const response = await axios.post(
                this.classificationUrl,
                {
                    text,
                    metadata,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return {
                category: response.data.category,
                urgency: response.data.urgency,
                confidence: response.data.confidence || 0.8,
            };
        } catch (error) {
            console.error('AI Classification error:', error.message);
            // Fallback to mock on error
            return this._mockClassification(text, metadata);
        }
    }

    /**
     * Suggest routing for complaint (worker/department assignment)
     * @param {object} complaint - Complaint object with category, urgency, etc.
     * @param {Array} availableWorkers - List of available workers
     * @returns {Promise<{workerId: number|null, department: string, reason: string}>}
     */
    async suggestRouting(complaint, availableWorkers = []) {
        if (this.useMock) {
            return this._mockRouting(complaint, availableWorkers);
        }

        try {
            // TODO: Replace with actual AI API call
            const response = await axios.post(
                this.routingUrl,
                {
                    complaint,
                    availableWorkers,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return {
                workerId: response.data.workerId,
                department: response.data.department,
                reason: response.data.reason,
            };
        } catch (error) {
            console.error('AI Routing error:', error.message);
            return this._mockRouting(complaint, availableWorkers);
        }
    }

    /**
     * Generate summary of complaint and its history
     * @param {object} complaint - Complaint object
     * @param {Array} history - Complaint history entries
     * @returns {Promise<string>}
     */
    async generateSummary(complaint, history = []) {
        if (this.useMock) {
            return this._mockSummary(complaint, history);
        }

        try {
            // TODO: Replace with actual AI API call
            const response = await axios.post(
                this.summarizationUrl,
                {
                    complaint,
                    history,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return response.data.summary;
        } catch (error) {
            console.error('AI Summarization error:', error.message);
            return this._mockSummary(complaint, history);
        }
    }

    /**
     * Generate analytics insights from complaint data
     * @param {Array} complaints - Array of complaint objects
     * @returns {Promise<{insights: Array, trends: object, recommendations: Array}>}
     */
    async generateAnalytics(complaints) {
        if (this.useMock) {
            return this._mockAnalytics(complaints);
        }

        try {
            // TODO: Replace with actual AI API call
            const response = await axios.post(
                this.analyticsUrl,
                {
                    complaints,
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            return {
                insights: response.data.insights,
                trends: response.data.trends,
                recommendations: response.data.recommendations,
            };
        } catch (error) {
            console.error('AI Analytics error:', error.message);
            return this._mockAnalytics(complaints);
        }
    }

    // ============ Mock Implementations ============

    _mockClassification(text, metadata) {
        // Simple keyword-based classification
        const textLower = (text + ' ' + (metadata.title || '')).toLowerCase();

        let category = 'General';
        let urgency = 'medium';

        // Category detection
        if (textLower.includes('hostel') || textLower.includes('accommodation')) {
            category = 'Hostel & Accommodation';
        } else if (textLower.includes('food') || textLower.includes('mess') || textLower.includes('canteen')) {
            category = 'Food & Mess';
        } else if (textLower.includes('academic') || textLower.includes('exam') || textLower.includes('grade')) {
            category = 'Academic';
        } else if (textLower.includes('library')) {
            category = 'Library';
        } else if (textLower.includes('transport') || textLower.includes('bus')) {
            category = 'Transportation';
        } else if (textLower.includes('fee') || textLower.includes('payment')) {
            category = 'Fees & Finance';
        } else if (textLower.includes('harassment') || textLower.includes('discrimination')) {
            category = 'Harassment & Discrimination';
        } else if (textLower.includes('infrastructure') || textLower.includes('facility')) {
            category = 'Infrastructure';
        }

        // Urgency detection
        if (textLower.includes('urgent') || textLower.includes('emergency') || textLower.includes('critical')) {
            urgency = 'critical';
        } else if (textLower.includes('important') || textLower.includes('asap') || textLower.includes('harassment')) {
            urgency = 'high';
        } else if (textLower.includes('minor') || textLower.includes('suggestion')) {
            urgency = 'low';
        }

        return Promise.resolve({
            category,
            urgency,
            confidence: 0.75,
        });
    }

    _mockRouting(complaint, availableWorkers) {
        // Simple department mapping
        const categoryToDepartment = {
            'Hostel & Accommodation': 'Hostel Management',
            'Food & Mess': 'Mess Committee',
            'Academic': 'Academic Affairs',
            'Library': 'Library Services',
            'Transportation': 'Transport Department',
            'Fees & Finance': 'Finance Office',
            'Harassment & Discrimination': 'Student Welfare',
            'Infrastructure': 'Maintenance Department',
            'General': 'General Administration',
        };

        const department = categoryToDepartment[complaint.category] || 'General Administration';

        // Try to find a worker from the same department
        let workerId = null;
        if (availableWorkers.length > 0) {
            const departmentWorker = availableWorkers.find(w => w.department === department);
            if (departmentWorker) {
                workerId = departmentWorker.id;
            } else {
                // Assign to first available worker
                workerId = availableWorkers[0].id;
            }
        }

        return Promise.resolve({
            workerId,
            department,
            reason: `Routed to ${department} based on complaint category: ${complaint.category}`,
        });
    }

    _mockSummary(complaint, history) {
        const historyCount = history.length;
        const statusChanges = history.filter(h => h.action_type === 'status_change').length;

        let summary = `Complaint "${complaint.title}" in category ${complaint.category} with ${complaint.urgency} urgency. `;

        if (historyCount > 0) {
            summary += `Has ${historyCount} history entries including ${statusChanges} status changes. `;
        }

        if (complaint.status === 'resolved') {
            summary += 'Currently resolved.';
        } else if (complaint.status === 'in_progress') {
            summary += 'Currently being worked on.';
        } else {
            summary += 'Awaiting assignment or action.';
        }

        return Promise.resolve(summary);
    }

    _mockAnalytics(complaints) {
        const total = complaints.length;
        const byStatus = complaints.reduce((acc, c) => {
            acc[c.status] = (acc[c.status] || 0) + 1;
            return acc;
        }, {});

        const byCategory = complaints.reduce((acc, c) => {
            acc[c.category] = (acc[c.category] || 0) + 1;
            return acc;
        }, {});

        const insights = [
            `Total of ${total} complaints analyzed.`,
            `Most common category: ${Object.keys(byCategory).sort((a, b) => byCategory[b] - byCategory[a])[0] || 'N/A'}`,
            `Resolution rate: ${((byStatus.resolved || 0) / total * 100).toFixed(1)}%`,
        ];

        const recommendations = [
            'Consider adding more workers to high-volume categories',
            'Implement automated routing for common complaint types',
            'Set up SLA alerts for overdue complaints',
        ];

        return Promise.resolve({
            insights,
            trends: { byStatus, byCategory },
            recommendations,
        });
    }
}

module.exports = new AIService();
