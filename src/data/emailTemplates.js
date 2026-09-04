// Re-export the shared email templates so frontend components can use the same
// single source of truth as the backend email engine.
export {
  COMPANY_PROFILE,
  STANDALONE_EMAILS,
  SEQUENCES,
  SEQUENCE_SPACING,
  UNIVERSAL_FOLLOWUPS,
  OBJECTION_RESPONSES,
  getSequence,
  getStandaloneEmail,
} from "../../base44/shared/emailTemplates";