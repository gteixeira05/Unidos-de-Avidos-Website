export type SessionRole = "USER" | "ADMIN";

export type SessionUser = {
  id: string;
  role: SessionRole;
  isSuperAdmin: boolean;
  email: string;
  name: string;
};
