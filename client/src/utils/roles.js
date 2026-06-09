export const ROLES = {
  boss: 'Boss/Admin',
  manager: 'Project Manager',
  member: 'Team Member'
};

export const isBoss = (user) => user?.role === ROLES.boss;
export const isManager = (user) => user?.role === ROLES.manager;
export const isMember = (user) => user?.role === ROLES.member;
