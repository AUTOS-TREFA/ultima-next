import { supabase } from '../../supabaseClient';

export interface ChangelogEntry {
  id?: string;
  version: string;
  release_date: string;
  category: 'fixed' | 'added' | 'changed' | 'technical' | 'documentation';
  title: string;
  description?: string;
  items: ChangelogItem[];
  badge_text?: string;
  badge_color?: string;
  development_hours?: number;
  files_modified?: number;
  commit_hash?: string;
  imported_from_github?: boolean;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  published: boolean;
}

export interface ChangelogItem {
  icon: string;
  title: string;
  details: string;
  commit_hash?: string;
}

export interface RoadmapItem {
  id?: string;
  title: string;
  description?: string;
  category: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  target_quarter?: string;
  target_date?: string;
  estimated_hours?: number;
  progress_percentage: number;
  assignee?: string;
  tags: string[];
  ai_suggested?: boolean;
  ai_confidence?: number;
  github_issue_number?: number;
  dependencies?: string[];
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  completed_at?: string;
  published: boolean;
}

export interface GitHubSyncLog {
  id?: string;
  sync_type: string;
  commits_processed: number;
  entries_created: number;
  entries_updated: number;
  last_commit_hash?: string;
  last_commit_date?: string;
  error_message?: string;
  status: 'pending' | 'success' | 'failed';
  synced_by?: string;
  synced_at?: string;
}

class ChangelogService {
  // ============================================
  // CHANGELOG ENTRIES CRUD
  // ============================================

  /**
   * Get all changelog entries grouped by version
   */
  async getAllChangelogs(): Promise<Record<string, ChangelogEntry[]>> {
    const { data, error } = await supabase
      .from('changelog_entries')
      .select('*')
      .eq('published', true)
      .order('release_date', { ascending: false });

    if (error) {
      console.error('Error fetching changelogs:', error);
      return {};
    }

    // Group by version
    const grouped = (data || []).reduce((acc, entry) => {
      if (!acc[entry.version]) {
        acc[entry.version] = [];
      }
      acc[entry.version].push(entry as ChangelogEntry);
      return acc;
    }, {} as Record<string, ChangelogEntry[]>);

    return grouped;
  }

  /**
   * Get changelog entries for a specific version
   */
  async getChangelogByVersion(version: string): Promise<ChangelogEntry[]> {
    const { data, error } = await supabase
      .from('changelog_entries')
      .select('*')
      .eq('version', version)
      .eq('published', true)
      .order('category');

    if (error) {
      console.error(`Error fetching changelog for v${version}:`, error);
      return [];
    }

    return (data || []) as ChangelogEntry[];
  }

  /**
   * Create a new changelog entry (admin only)
   */
  async createChangelogEntry(entry: Omit<ChangelogEntry, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: ChangelogEntry; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('changelog_entries')
        .insert({
          ...entry,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: data as ChangelogEntry };
    } catch (error: any) {
      console.error('Error creating changelog entry:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update an existing changelog entry (admin only)
   */
  async updateChangelogEntry(id: string, updates: Partial<ChangelogEntry>): Promise<{ success: boolean; data?: ChangelogEntry; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('changelog_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: data as ChangelogEntry };
    } catch (error: any) {
      console.error('Error updating changelog entry:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a changelog entry (admin only)
   */
  async deleteChangelogEntry(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('changelog_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting changelog entry:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // ROADMAP ITEMS CRUD
  // ============================================

  /**
   * Get all roadmap items grouped by category
   */
  async getAllRoadmapItems(): Promise<Record<string, RoadmapItem[]>> {
    const { data, error } = await supabase
      .from('roadmap_items')
      .select('*')
      .eq('published', true)
      .order('priority', { ascending: false })
      .order('target_date', { ascending: true });

    if (error) {
      console.error('Error fetching roadmap items:', error);
      return {};
    }

    // Group by category
    const grouped = (data || []).reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item as RoadmapItem);
      return acc;
    }, {} as Record<string, RoadmapItem[]>);

    return grouped;
  }

  /**
   * Create a new roadmap item (admin only)
   */
  async createRoadmapItem(item: Omit<RoadmapItem, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: RoadmapItem; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('roadmap_items')
        .insert({
          ...item,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: data as RoadmapItem };
    } catch (error: any) {
      console.error('Error creating roadmap item:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update an existing roadmap item (admin only)
   */
  async updateRoadmapItem(id: string, updates: Partial<RoadmapItem>): Promise<{ success: boolean; data?: RoadmapItem; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('roadmap_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: data as RoadmapItem };
    } catch (error: any) {
      console.error('Error updating roadmap item:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Delete a roadmap item (admin only)
   */
  async deleteRoadmapItem(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('roadmap_items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting roadmap item:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // GITHUB INTEGRATION
  // ============================================

  /**
   * Import changelog entries from GitHub commits
   * This will be called from an Edge Function that has access to GitHub API
   */
  async importFromGitHub(commits: any[]): Promise<{ success: boolean; imported: number; error?: string }> {
    try {
      let imported = 0;

      for (const commit of commits) {
        // Parse commit message to extract changelog info
        const { version, category, title, description } = this.parseCommitMessage(commit.message);

        if (version && category && title) {
          const entry = {
            version,
            release_date: new Date(commit.date).toISOString().split('T')[0],
            category,
            title,
            description: description || commit.message,
            items: [{
              icon: this.getCategoryIcon(category),
              title: title,
              details: description || commit.message,
              commit_hash: commit.sha
            }],
            commit_hash: commit.sha,
            imported_from_github: true,
            published: false // Require admin review before publishing
          };

          const result = await this.createChangelogEntry(entry as any);
          if (result.success) imported++;
        }
      }

      return { success: true, imported };
    } catch (error: any) {
      console.error('Error importing from GitHub:', error);
      return { success: false, imported: 0, error: error.message };
    }
  }

  /**
   * Parse commit message to extract changelog information
   * Expected format: "fix(v1.2.0): Title - Description"
   */
  private parseCommitMessage(message: string): { version?: string; category?: string; title?: string; description?: string } {
    // Match pattern: type(version): title - description
    const match = message.match(/^(fix|feat|chore|docs|refactor|perf|test)\(v?([\d.]+)\):\s*(.+?)(?:\s*-\s*(.+))?$/i);

    if (match) {
      const [, type, version, title, description] = match;
      return {
        version,
        category: this.mapCommitTypeToCategory(type),
        title: title.trim(),
        description: description?.trim()
      };
    }

    return {};
  }

  private mapCommitTypeToCategory(type: string): 'fixed' | 'added' | 'changed' | 'technical' | 'documentation' {
    const mapping: Record<string, any> = {
      'fix': 'fixed',
      'feat': 'added',
      'chore': 'changed',
      'refactor': 'changed',
      'docs': 'documentation',
      'perf': 'technical',
      'test': 'technical'
    };
    return mapping[type.toLowerCase()] || 'changed';
  }

  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'fixed': '🐛',
      'added': '✨',
      'changed': '🔧',
      'technical': '⚙️',
      'documentation': '📚'
    };
    return icons[category] || '📝';
  }

  // ============================================
  // GITHUB SYNC LOGS
  // ============================================

  /**
   * Get recent GitHub sync logs
   */
  async getGitHubSyncLogs(limit: number = 10): Promise<GitHubSyncLog[]> {
    const { data, error } = await supabase
      .from('github_sync_log')
      .select('*')
      .order('synced_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching sync logs:', error);
      return [];
    }

    return (data || []) as GitHubSyncLog[];
  }
}

export const changelogService = new ChangelogService();
