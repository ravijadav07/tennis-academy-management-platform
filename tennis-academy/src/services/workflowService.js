/**
 * Workflow state service — workflow automation tracking.
 * Table: workflow_state
 * Columns: id, entity, action, status, data (jsonb), created_at, updated_at
 */
import { BaseService } from './BaseService.js';

class WorkflowService extends BaseService {
  constructor() {
    super('workflow_state');
  }

  /**
   * List workflow states with optional filters.
   */
  async list({ entity, action, status, page = 1, pageSize = 50 } = {}) {
    const filters = {};
    if (action) filters.action = action;
    if (status) filters.status = status;
    return super.list({ entity, filters, page, pageSize, orderBy: 'created_at', ascending: false });
  }

  /**
   * Create or update workflow state.
   */
  async upsert(state) {
    return super.upsert(state);
  }

  /**
   * Delete workflow state.
   */
  async delete(id) {
    return super.delete(id);
  }
}

export const workflowService = new WorkflowService();