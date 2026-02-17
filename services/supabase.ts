
import { UserRole, UserProfile } from '../types';

class MockSupabaseClient {
  private user: UserProfile | null = null;

  async signInWithGoogle() {
    console.log("Simulating OAuth redirect for DeutschLern...");
    
    // We provide a rich initial profile for the demonstration
    this.user = {
      id: 'demo-user-id',
      email: 'hans.mueller@deutschlern.de',
      full_name: 'Hans Müller',
      role: UserRole.TEACHER,
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hans&backgroundColor=b6e3f4'
    };
    return { user: this.user, error: null };
  }

  async signOut() {
    this.user = null;
    return { error: null };
  }

  async getUser() {
    return { data: { user: this.user }, error: null };
  }

  async updateProfile(updates: Partial<UserProfile>) {
    if (!this.user) return { error: new Error("Not authenticated") };
    
    this.user = {
      ...this.user,
      ...updates
    };
    
    console.log("Profile updated in Supabase:", this.user);
    return { data: this.user, error: null };
  }

  setRole(role: UserRole) {
    if (this.user) {
      this.user.role = role;
      // Change avatar based on role for visual feedback during demo if no custom avatar is set
      // Only auto-change if it looks like a dicebear default we set earlier
      if (this.user.avatar_url?.includes('dicebear.com')) {
        const seed = role === UserRole.ADMIN ? 'Admin' : role === UserRole.TEACHER ? 'Hans' : 'StudentHans';
        const color = role === UserRole.ADMIN ? 'ffdfbf' : role === UserRole.TEACHER ? 'b6e3f4' : 'c0aede';
        this.user.avatar_url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=${color}`;
      }
    }
  }
}

export const supabase = new MockSupabaseClient();
