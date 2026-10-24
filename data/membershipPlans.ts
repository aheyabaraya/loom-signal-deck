import membershipPlanCatalog from "./membershipPlans.json";

export type MembershipPlanStatus = "available" | "concept";

export type MembershipPlan = {
  key: string;
  name: string;
  status: MembershipPlanStatus;
  priceDisplay: string;
  billingEnabled: false;
  description: string;
  features: string[];
};

export const membershipCatalogVersion = membershipPlanCatalog.schemaVersion;
export const membershipPaymentsEnabled = membershipPlanCatalog.paymentsEnabled;
export const membershipPlans = membershipPlanCatalog.plans as MembershipPlan[];

export function getMembershipPlan(planKey: string) {
  return membershipPlans.find((plan) => plan.key === planKey);
}
