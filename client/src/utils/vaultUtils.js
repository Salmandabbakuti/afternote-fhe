import dayjs from "dayjs";

export const VAULT_STATUS = {
  ALL: "all",
  ACTIVE: "active",
  WARNING: "warning",
  OVERDUE: "overdue",
  PERSONAL: "personal",
  RELEASED: "released",
  RECEIVED: "received"
};

export const VAULT_STATUS_OPTIONS = [
  { id: VAULT_STATUS.ALL, name: "All" },
  { id: VAULT_STATUS.ACTIVE, name: "Active" },
  { id: VAULT_STATUS.WARNING, name: "Warning" },
  { id: VAULT_STATUS.OVERDUE, name: "Overdue" },
  { id: VAULT_STATUS.RELEASED, name: "Released" },
  { id: VAULT_STATUS.PERSONAL, name: "Personal" },
  { id: VAULT_STATUS.RECEIVED, name: "Received" }
];

const statusMap = {
  [VAULT_STATUS.ACTIVE]: { color: "green", label: "Active" },
  [VAULT_STATUS.WARNING]: { color: "orange", label: "Warning" },
  [VAULT_STATUS.OVERDUE]: { color: "red", label: "Overdue" },
  [VAULT_STATUS.PERSONAL]: { color: "cyan", label: "Personal" },
  [VAULT_STATUS.RELEASED]: { color: "blue", label: "Released" }
};

export const getVaultStatusBadge = (status) => {
  return statusMap[status] || { color: "default", label: "Unknown" };
};

export const getVaultStatus = (vault = {}) => {
  const { isReleased, beneficiaries = [], releaseAt = 0 } = vault;
  if (isReleased) return VAULT_STATUS.RELEASED;
  if (beneficiaries.length === 0) return VAULT_STATUS.PERSONAL;

  const releaseDeadline = dayjs.unix(releaseAt);
  const now = dayjs();
  if (releaseDeadline.isBefore(now)) return VAULT_STATUS.OVERDUE;
  if (releaseDeadline.isAfter(now.add(3, "day"))) return VAULT_STATUS.ACTIVE;
  return VAULT_STATUS.WARNING;
};

export const getVaultMetadata = (vault) => {
  const status = getVaultStatus(vault);
  const vaultBadge = getVaultStatusBadge(status);

  return {
    status,
    ...vaultBadge
  };
};

export const buildVaultStatusWhere = (filterId = VAULT_STATUS.ALL, owner) => {
  const now = dayjs();
  const baseWhere = { owner: owner.toLowerCase(), beneficiaries_not: [] };
  const currentUnix = now.unix();
  const warningUnix = now.add(3, "day").unix();

  switch (filterId) {
    case VAULT_STATUS.RELEASED:
      return {
        ...baseWhere,
        isReleased: true
      };
    case VAULT_STATUS.OVERDUE:
      return {
        ...baseWhere,
        isReleased: false,
        releaseAt_lte: currentUnix
      };
    case VAULT_STATUS.WARNING:
      return {
        ...baseWhere,
        isReleased: false,
        releaseAt_gt: currentUnix,
        releaseAt_lte: warningUnix
      };
    case VAULT_STATUS.ACTIVE:
      return {
        ...baseWhere,
        isReleased: false,
        releaseAt_gt: warningUnix
      };
    case VAULT_STATUS.PERSONAL:
      return {
        ...baseWhere,
        beneficiaries_not: undefined, // reset to default to respect filter
        beneficiaries: []
      };
    case VAULT_STATUS.RECEIVED:
      return {
        isReleased: true,
        beneficiaries_contains: [owner.toLowerCase()]
      };
    case VAULT_STATUS.ALL:
    default:
      return {
        ...baseWhere,
        beneficiaries_not: undefined // reset to default to respect filter
      };
  }
};
