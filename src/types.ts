export interface Alarm {
  id: string;
  time: string;
  date: string;
  label: string;
  active: boolean;
  createdBy: string;
  createdAt: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  groupId: string | null;
  groupName?: string | null;
  fcmToken?: string;
}

export interface Group {
  id: string;
  name: string;
  members: string[];
  owner: string;
}
