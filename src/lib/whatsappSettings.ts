import { AppSetting } from "@/models/AppSetting";

/**
 * Server-only helper to read the 'includeYearInWhatsApp' app setting from MongoDB.
 * Defaults to false if not set.
 */
export async function getIncludeYearPreference(): Promise<boolean> {
  try {
    const setting = await AppSetting.findOne({ key: "includeYearInWhatsApp" }).lean();
    return Boolean(setting?.value);
  } catch (e) {
    return false;
  }
}
